import { IsString, IsNotEmpty } from 'class-validator';

export class PasswordResetRequestDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // Can be email or username
}
