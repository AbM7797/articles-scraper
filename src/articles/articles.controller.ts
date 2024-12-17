import { Controller, Post, Get, HttpCode, Query } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { GetArticlesDto } from './dto/get-articles.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post('/scrape')
  @HttpCode(200)
  async scrapeArticles(@Query('day') day?: string) {
    // Transmettre le paramètre "day" (facultatif) au service
    return this.articlesService.scrapeHackerNews(day);
  }

  @Get()
  async getArticles(@Query() query: GetArticlesDto) {
    const { page, pageSize, days, sortBy, order } = query;

    return this.articlesService.findArticlesPaginated(
      page,
      pageSize,
      days,
      sortBy,
      order,
    );
  }
}
