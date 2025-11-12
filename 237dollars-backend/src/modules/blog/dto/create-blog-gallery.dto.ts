import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateBlogGalleryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[]; // Array of image URLs
}
