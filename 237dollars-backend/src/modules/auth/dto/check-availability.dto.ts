import { IsString, IsOptional } from 'class-validator';

export class CheckAvailabilityDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
