import { IsString, IsArray, IsUrl, IsOptional, MinLength, MaxLength } from 'class-validator';
import { GALLERY_VALIDATION } from '../constants/gallery-validation.constants';

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

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[]; // Array of image URLs
}
