import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsInt, IsBoolean } from 'class-validator';
import { CreateBlogGalleryDto } from './create-blog-gallery.dto';

export class UpdateBlogGalleryDto extends PartialType(CreateBlogGalleryDto) {
  // PartialType already makes all properties from CreateBlogGalleryDto optional
  // We only need to add properties that don't exist in CreateBlogGalleryDto

  @IsOptional()
  @IsInt()
  mainImageIndex?: number; // Index of the main media item to display

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean; // Gallery publish status
}
