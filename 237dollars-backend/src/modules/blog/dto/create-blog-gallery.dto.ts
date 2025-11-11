import { IsString, IsArray, IsUrl, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateBlogGalleryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsNotEmpty()
  images: string[]; // Array of image URLs
}
