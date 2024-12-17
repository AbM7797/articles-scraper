import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Article } from './article.entity';
import { ArticlesService } from './articles.service';

@Module({
  imports: [SequelizeModule.forFeature([Article])],
  providers: [ArticlesService],
  controllers: [ArticlesController],
})
export class ArticlesModule {}
