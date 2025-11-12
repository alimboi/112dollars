import { IsString, IsNotEmpty, Length, IsUrl } from 'class-validator';

export class CreateBlogImageDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  imageUrl: string;
}
