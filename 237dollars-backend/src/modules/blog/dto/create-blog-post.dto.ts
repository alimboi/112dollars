import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  title: string;

  @IsObject()
  content: any;

  @IsOptional()
  @IsString()
  featuredImageUrl?: string;

  @IsOptional()
  @IsObject()
  socialMediaLinks?: any;
}
