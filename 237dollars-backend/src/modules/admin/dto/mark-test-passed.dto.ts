import { IsNotEmpty, IsNumber } from 'class-validator';

export class MarkTestPassedDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
