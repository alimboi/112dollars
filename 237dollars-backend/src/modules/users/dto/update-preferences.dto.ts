import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { Language } from '../../../types/language.enum';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;
}
