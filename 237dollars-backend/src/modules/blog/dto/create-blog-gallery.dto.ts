import { IsString, IsArray, IsUrl, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateBlogGalleryDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  description?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[]; // Array of image URLs
}
