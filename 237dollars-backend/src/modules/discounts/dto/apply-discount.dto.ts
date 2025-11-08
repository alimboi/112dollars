import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class ApplyDiscountDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsString()
  reason?: string;
}
