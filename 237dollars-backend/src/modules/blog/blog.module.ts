import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogImageService } from './blog-image.service';
import { BlogPost } from '../../database/entities/blog-post.entity';
import { BlogImage } from '../../database/entities/blog-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost, BlogImage])],
  controllers: [BlogController],
  providers: [BlogService, BlogImageService],
  exports: [BlogService, BlogImageService],
})
export class BlogModule {}

