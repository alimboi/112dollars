import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsInt, IsArray, IsUrl, IsString, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { CreateBlogGalleryDto } from './create-blog-gallery.dto';
import { GALLERY_VALIDATION } from '../constants/gallery-validation.constants';

export class UpdateBlogGalleryDto extends PartialType(CreateBlogGalleryDto) {
  @IsOptional()
  @IsString()
  @MinLength(GALLERY_VALIDATION.title.minLength, {
    message: GALLERY_VALIDATION.title.errorMessages.minLength,
  })
  @MaxLength(GALLERY_VALIDATION.title.maxLength, {
    message: GALLERY_VALIDATION.title.errorMessages.maxLength,
  })
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(GALLERY_VALIDATION.description.minLength, {
    message: GALLERY_VALIDATION.description.errorMessages.minLength,
  })
  @MaxLength(GALLERY_VALIDATION.description.maxLength, {
    message: GALLERY_VALIDATION.description.errorMessages.maxLength,
  })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsInt()
  mainImageIndex?: number; // Index of the main image to display

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean; // Gallery publish status
}
