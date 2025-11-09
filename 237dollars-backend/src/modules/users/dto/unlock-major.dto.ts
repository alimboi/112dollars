import { IsNumber, IsString, IsArray } from 'class-validator';

export class UnlockMajorDto {
  @IsNumber()
  majorId: number;

  @IsString()
  telegramProof: string; // Telegram group invite link or proof

  @IsArray()
  @IsString({ each: true })
  invitedUsers: string[]; // List of 5 users added (Telegram usernames)
}
