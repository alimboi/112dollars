import { IsNotEmpty, IsString, IsEmail, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { UserRole } from '../../../types/user-role.enum';

export class CreateAdminDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;

  @IsNotEmpty()
  @IsEnum(UserRole, { message: 'Invalid role' })
  role: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Telegram username must not exceed 50 characters' })
  telegramUsername?: string;
}
