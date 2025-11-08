import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateCodeDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}
