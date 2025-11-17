import { IsOptional, IsString, IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '../../../types/user-role.enum';

export class UpdateAdminDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  telegramUsername?: string;
}
