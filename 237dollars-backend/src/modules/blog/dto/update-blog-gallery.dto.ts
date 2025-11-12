import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsInt, IsArray, IsString, MinLength, MaxLength, IsBoolean, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBlogGalleryDto, GalleryMediaItemDto } from './create-blog-gallery.dto';
import { GALLERY_VALIDATION } from '../constants/gallery-validation.constants';

export class UpdateBlogGalleryDto extends PartialType(CreateBlogGalleryDto) {
  @IsOptional()
  @ValidateIf((o) => o.title && o.title.trim().length > 0)
  @IsString()
  @MinLength(GALLERY_VALIDATION.title.minLength, {
    message: GALLERY_VALIDATION.title.errorMessages.minLength,
  })
  @MaxLength(GALLERY_VALIDATION.title.maxLength, {
    message: GALLERY_VALIDATION.title.errorMessages.maxLength,
  })
  title?: string;

  @IsOptional()
  @ValidateIf((o) => o.description && o.description.trim().length > 0)
  @IsString()
  @MinLength(GALLERY_VALIDATION.description.minLength, {
    message: GALLERY_VALIDATION.description.errorMessages.minLength,
  })
  @MaxLength(GALLERY_VALIDATION.description.maxLength, {
    message: GALLERY_VALIDATION.description.errorMessages.maxLength,
  })
  description?: string;

  // Support both old format (array of strings) and new format (array of media objects)
  @IsOptional()
  @ValidateIf((o) => !o.mediaItems) // Only validate images if mediaItems is not provided
  @IsArray()
  images?: string[] | GalleryMediaItemDto[]; // Array of image/video URLs or media objects

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GalleryMediaItemDto)
  mediaItems?: GalleryMediaItemDto[]; // New structured format for media items

  @IsOptional()
  @IsInt()
  mainImageIndex?: number; // Index of the main media item to display

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean; // Gallery publish status
}
