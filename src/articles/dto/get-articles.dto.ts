import { IsInt, IsOptional, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Article } from '../article.entity';

export class GetArticlesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  days?: number;

  @IsOptional()
  @IsString()
  sortBy?: keyof Article;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'Order must be ASC or DESC' })
  order?: 'ASC' | 'DESC';
}
