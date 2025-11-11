import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogImageService } from './blog-image.service';
import { BlogPost } from '../../database/entities/blog-post.entity';
import { BlogImage } from '../../database/entities/blog-image.entity';
import { BlogImageGallery } from '../../database/entities/blog-image-gallery.entity';
import { BlogGalleryImage } from '../../database/entities/blog-gallery-image.entity';
import { BlogGalleryService } from './blog-gallery.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost, BlogImage, BlogImageGallery, BlogGalleryImage])],
  controllers: [BlogController],
  providers: [BlogService, BlogImageService, BlogGalleryService],
  exports: [BlogService, BlogImageService, BlogGalleryService],
})
export class BlogModule {}

