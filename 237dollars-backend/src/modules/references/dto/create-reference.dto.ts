import { IsString, IsNumber, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class CreateReferenceDto {
  @IsNumber()
  topicId: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  content: any;

  @IsOptional()
  @IsNumber()
  totalWords?: number;

  @IsOptional()
  @IsNumber()
  readingTimeMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
