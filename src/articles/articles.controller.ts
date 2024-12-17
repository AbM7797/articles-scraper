import {
  Controller,
  Post,
  Get,
  HttpCode,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { Article } from './article.entity';

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
  async getArticles(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe)
    pageSize?: number,
    @Query('days') days?: number,
    @Query('sortBy') sortBy?: keyof Article,
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    return this.articlesService.findArticlesPaginated(
      page,
      pageSize,
      days,
      sortBy,
      order,
    );
  }
}
