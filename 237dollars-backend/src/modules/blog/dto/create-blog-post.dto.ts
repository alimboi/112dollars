import { IsString, IsOptional, IsObject, MaxLength, MinLength, IsUrl } from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @IsObject()
  content: any;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Featured image must be a valid URL' })
  @MaxLength(500, { message: 'Image URL must not exceed 500 characters' })
  featuredImageUrl?: string;

  @IsOptional()
  @IsObject()
  socialMediaLinks?: any;
}
