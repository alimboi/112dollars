import { IsString, IsArray, IsOptional, MinLength, MaxLength, IsEnum, IsInt, ValidateNested, IsNumber, ValidateIf } from 'class-validator';
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
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Support both old format (array of strings) and new format (array of media objects)
  @IsOptional()
  @IsArray()
  images?: string[]; // Array of image/video URLs (old format, kept for backwards compatibility)

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GalleryMediaItemDto)
  mediaItems?: GalleryMediaItemDto[]; // New structured format for media items
}
