import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phoneHome?: string;

  @IsString()
  phonePersonal: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telegramContact?: string;

  @IsOptional()
  @IsString()
  socialMedia?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  contractId?: string;

  @IsOptional()
  @IsString()
  courseName?: string;

  @IsOptional()
  @IsBoolean()
  realTestPassed?: boolean;
}
