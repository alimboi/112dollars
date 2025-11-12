import { IsString, IsArray, IsOptional, MinLength, MaxLength, IsEnum, IsInt, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { GALLERY_VALIDATION } from '../constants/gallery-validation.constants';

export enum GalleryMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  YOUTUBE = 'YOUTUBE',
  INSTAGRAM = 'INSTAGRAM',
  TELEGRAM = 'TELEGRAM',
}

export class GalleryMediaItemDto {
  @IsEnum(GalleryMediaType)
  mediaType: GalleryMediaType;

  @IsString()
  mediaUrl: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsInt()
  @IsOptional()
  order?: number;
}

export class CreateBlogGalleryDto {
  @IsString()
  @IsOptional()
  @MinLength(GALLERY_VALIDATION.title.minLength, {
    message: GALLERY_VALIDATION.title.errorMessages.minLength,
  })
  @MaxLength(GALLERY_VALIDATION.title.maxLength, {
    message: GALLERY_VALIDATION.title.errorMessages.maxLength,
  })
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(GALLERY_VALIDATION.description.minLength, {
    message: GALLERY_VALIDATION.description.errorMessages.minLength,
  })
  @MaxLength(GALLERY_VALIDATION.description.maxLength, {
    message: GALLERY_VALIDATION.description.errorMessages.maxLength,
  })
  description?: string;

  // Support both old format (array of strings) and new format (array of media objects)
  @IsArray()
  @IsOptional()
  images?: string[] | GalleryMediaItemDto[]; // Array of image/video URLs or media objects

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GalleryMediaItemDto)
  @IsOptional()
  mediaItems?: GalleryMediaItemDto[]; // New structured format for media items
}
