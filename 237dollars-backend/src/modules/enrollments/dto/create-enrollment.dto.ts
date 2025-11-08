import { IsString, IsEmail } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  courseInterested: string;
}
