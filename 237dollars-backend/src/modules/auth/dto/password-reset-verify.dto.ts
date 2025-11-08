import { IsEmail, IsString, MinLength, Matches, Length } from 'class-validator';

export class PasswordResetVerifyDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Reset code must be 6 digits' })
  code: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  newPassword: string;
}
