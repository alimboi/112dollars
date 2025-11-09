import {
  Controller,
  Post,
  Body,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UnlockMajorDto } from './dto/unlock-major.dto';
import { Logger } from '@nestjs/common';

@Controller('users/telegram-unlock')
export class TelegramUnlockController {
  private readonly logger = new Logger(TelegramUnlockController.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Post()
  async unlockMajor(@Body() dto: UnlockMajorDto, @Request() req) {
    const userId = req.user.sub;

    // Validation: Check if 5 users provided
    if (dto.invitedUsers.length < 5) {
      throw new BadRequestException('You must add 5 users to unlock this major');
    }

    // Get user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if already unlocked
    const unlockedMajors = user.telegramUnlockedMajors || [];
    if (unlockedMajors.includes(dto.majorId)) {
      throw new BadRequestException('This major is already unlocked');
    }

    // TODO: In production, verify Telegram group membership via Telegram Bot API
    // For now, we'll trust the frontend verification
    this.logger.log(`User ${userId} unlocking major ${dto.majorId} with proof: ${dto.telegramProof}`);

    // Add major to unlocked list
    user.telegramUnlockedMajors = [...unlockedMajors, dto.majorId];
    await this.userRepository.save(user);

    this.logger.log(`User ${userId} successfully unlocked major ${dto.majorId}`);

    return {
      message: 'Major unlocked successfully! You now have full access.',
      unlockedMajor: dto.majorId,
      totalUnlocked: user.telegramUnlockedMajors.length,
    };
  }

  @Post('check-status')
  async checkUnlockStatus(@Body() body: { majorId: number }, @Request() req) {
    const userId = req.user.sub;
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isUnlocked = user.telegramUnlockedMajors?.includes(body.majorId) || false;
    const isEnrolled = user.enrolledMajorId === body.majorId;

    return {
      hasFullAccess: isUnlocked || isEnrolled,
      isEnrolled,
      isUnlockedViaTelegram: isUnlocked,
      accessType: isEnrolled ? 'enrolled' : isUnlocked ? 'telegram' : 'preview',
      accessPercentage: isEnrolled || isUnlocked ? 100 : 8,
    };
  }
}
