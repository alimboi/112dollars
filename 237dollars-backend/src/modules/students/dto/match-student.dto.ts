import { IsString, IsEmail, IsOptional } from 'class-validator';

export class MatchStudentDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  studentId?: string;
}
