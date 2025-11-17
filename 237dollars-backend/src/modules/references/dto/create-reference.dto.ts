import { IsString, IsNumber, IsOptional, IsObject, IsBoolean, MaxLength, MinLength, Min, Max } from 'class-validator';

export class CreateReferenceDto {
  @IsNumber()
  @Min(1)
  topicId: number;

  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(500, { message: 'Title must not exceed 500 characters' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description?: string;

  @IsObject()
  content: any;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  totalWords?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  readingTimeMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
