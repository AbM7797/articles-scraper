import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Article } from './article.entity';
import { FindAndCountOptions, Op } from 'sequelize';

export interface PaginatedResult {
  data: Article[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel(Article)
    private articleModel: typeof Article,
  ) {}

  async scrapeHackerNews(dateFilter?: string): Promise<Article[]> {
    const today = new Date(); // Today's date as a Date object
    let dateToUse = today; // Default to today's date
    // If a date filter is provided, validate and convert it
    if (dateFilter) {
      const inputDate = new Date(dateFilter);
      const now = new Date(today.toISOString().split('T')[0]); // Today's date, stripped of time

      if (!isNaN(inputDate.getTime()) && inputDate <= now) {
        dateToUse = inputDate; // Use the valid date filter
      } else {
        console.warn(
          `Invalid or future date (${dateFilter}). Defaulting to today's date.`,
        );
      }
    }

    console.log(
      `Scraping articles for date: ${dateToUse.toISOString().split('T')[0]}`,
    );

    let page = 1;
    const articles: Partial<Article>[] = [];

    while (true) {
      const url = `https://news.ycombinator.com/front?day=${dateToUse.toISOString().split('T')[0]}&p=${page}`;
      console.log(`Scraping page: ${url}`);
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avx-webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: 10000, // Timeout of 10 seconds
        });

        if (!response.data) {
          throw new Error('No data received from Hacker News');
        }

        const $ = cheerio.load(response.data);
        let hasArticles = false;
        $('tr.athing').each((i, elem) => {
          const titleLine = $(elem).find('.titleline');

          const titleElem = titleLine.find('a').first();
          const title = titleElem.text().trim();
          const url = titleElem.attr('href');
          const sourceElem = $(elem).find('.sitestr');
          const source = sourceElem.length
            ? sourceElem.text().trim()
            : 'Hacker News';

          const fullUrl = url?.startsWith('http')
            ? url
            : `https://news.ycombinator.com/${url}`;
          if (fullUrl) {
            articles.push({
              title,
              url: fullUrl,
              source,
              publication_date: dateToUse, // Use the validated dateToUse as a Date
            });
            hasArticles = true;
          }
        });

        if (!hasArticles) {
          console.log(
            `No more articles found for ${dateToUse.toISOString().split('T')[0]} on page ${page}`,
          );
          break;
        }

        page++;
      } catch (error) {
        console.error('Error during scraping:', error.message);
        throw new Error(`Failed to scrape Hacker News: ${error.message}`);
      }
    }
    const savedArticles = await this.articleModel.bulkCreate(articles, {
      ignoreDuplicates: true,
    });

    return savedArticles;
  }

  async findArticlesPaginated(
    page: number = 1,
    pageSize: number = 10,
    days?: number,
    sortBy: keyof Article = 'publication_date',
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<PaginatedResult> {
    // Validate input
    const validSortFields: (keyof Article)[] = [
      'id',
      'title',
      'url',
      'publication_date',
      'source',
      'createdAt',
      'updatedAt',
    ];

    if (!validSortFields.includes(sortBy)) {
      throw new BadRequestException(
        `Invalid sort field. Must be one of: ${validSortFields.join(', ')}`,
      );
    }

    // Ensure page and pageSize are positive
    page = Math.max(1, page);
    pageSize = Math.min(Math.max(1, pageSize), 100); // Limit page size between 1 and 100

    // Build where clause for date filtering
    const whereClause: any = {};
    if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);
      whereClause.publication_date = {
        [Op.gte]: daysAgo,
      };
    }

    // Prepare find options
    const findOptions: FindAndCountOptions = {
      where: whereClause,
      order: [[sortBy, order]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };

    // Perform query
    const { count, rows } =
      await this.articleModel.findAndCountAll(findOptions);

    // Calculate pagination details
    const totalPages = Math.ceil(count / pageSize);

    return {
      data: rows,
      total: count,
      page,
      pageSize,
      hasNextPage: page < totalPages,
    };
  }
}
