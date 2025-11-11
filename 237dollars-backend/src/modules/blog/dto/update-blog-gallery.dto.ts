import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsInt, IsArray, IsUrl, IsString, MinLength, MaxLength } from 'class-validator';
import { CreateBlogGalleryDto } from './create-blog-gallery.dto';

export class UpdateBlogGalleryDto extends PartialType(CreateBlogGalleryDto) {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsInt()
  mainImageIndex?: number; // Index of the main image to display
}
