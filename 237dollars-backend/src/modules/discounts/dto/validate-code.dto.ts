import { IsNotEmpty, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class ValidateCodeDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Code must be at least 3 characters' })
  @MaxLength(50, { message: 'Code must not exceed 50 characters' })
  @Matches(/^[A-Z0-9_-]+$/, { message: 'Code can only contain uppercase letters, numbers, underscores, and hyphens' })
  code: string;
}
