import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ErrorMessages } from '../../common/constants/error-messages';
import { PasswordService } from '../../common/utils/password.service';
import { ReadingProgress } from '../../database/entities/reading-progress.entity';
import { UserPoints } from '../../database/entities/user-points.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ReadingProgress)
    private readingProgressRepository: Repository<ReadingProgress>,
    @InjectRepository(UserPoints)
    private userPointsRepository: Repository<UserPoints>,
    private passwordService: PasswordService,
  ) {}

  async getUserProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'username',
        'firstName',
        'lastName',
        'role',
        'language',
        'darkMode',
        'isActive',
        'emailVerified',
        'createdAt',
        'lastLogin',
      ],
    });

    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    return user;
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    // Check if username is being updated and if it's already taken
    if (updateProfileDto.username && updateProfileDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateProfileDto.username },
      });

      if (existingUser) {
        throw new ConflictException('Username is already taken');
      }
    }

    Object.assign(user, updateProfileDto);
    await this.userRepository.save(user);

    // Return without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updatePreferences(
    userId: number,
    updatePreferencesDto: UpdatePreferencesDto,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    if (updatePreferencesDto.language !== undefined) {
      user.language = updatePreferencesDto.language;
    }

    if (updatePreferencesDto.darkMode !== undefined) {
      user.darkMode = updatePreferencesDto.darkMode;
    }

    await this.userRepository.save(user);

    // Return without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteUser(userId: number, requestingUserId: number) {
    // Users can only delete their own account
    if (userId !== requestingUserId) {
      throw new ForbiddenException(ErrorMessages.FORBIDDEN);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    // Soft delete (mark as inactive)
    user.isActive = false;
    await this.userRepository.save(user);

    return { message: 'Account deactivated successfully' };
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      select: [
        'id',
        'email',
        'role',
        'isActive',
        'createdAt',
        'lastLogin',
      ],
      order: { createdAt: 'DESC' },
    });

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    // Verify passwords match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    // Verify new password is different from current
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Verify current password is correct
    const isPasswordValid = await this.passwordService.comparePassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password strength
    if (!this.passwordService.validatePasswordStrength(changePasswordDto.newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase, lowercase, and number',
      );
    }

    // Hash and save new password
    user.password = await this.passwordService.hashPassword(changePasswordDto.newPassword);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async getUserStats(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    // Get reading progress stats
    const completedReferences = await this.readingProgressRepository.count({
      where: {
        userId,
        completedAt: Not(IsNull()),
      },
    });

    // Get total reading time in seconds
    const readingProgressRecords = await this.readingProgressRepository.find({
      where: { userId },
      select: ['readingTimeSeconds'],
    });

    const totalReadingTimeSeconds = readingProgressRecords.reduce(
      (sum, record) => sum + (record.readingTimeSeconds || 0),
      0,
    );

    const totalReadingTimeHours = Math.floor(totalReadingTimeSeconds / 3600);
    const totalReadingTimeMinutes = Math.floor((totalReadingTimeSeconds % 3600) / 60);

    // Get total points
    const userPointsRecords = await this.userPointsRepository.find({
      where: { userId },
    });

    const totalPoints = userPointsRecords.reduce(
      (sum, record) => sum + (record.totalPoints || 0),
      0,
    );

    const totalReadingPoints = userPointsRecords.reduce(
      (sum, record) => sum + (record.readingPoints || 0),
      0,
    );

    // Calculate current streak (simplified - based on consecutive days of activity)
    const recentProgress = await this.readingProgressRepository.find({
      where: { userId },
      order: { startedAt: 'DESC' },
      take: 30, // Look at last 30 days
    });

    let currentStreak = 0;
    if (recentProgress.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const uniqueDays = new Set<string>();
      recentProgress.forEach((progress) => {
        const progressDate = new Date(progress.startedAt);
        progressDate.setHours(0, 0, 0, 0);
        uniqueDays.add(progressDate.toISOString().split('T')[0]);
      });

      const sortedDays = Array.from(uniqueDays).sort().reverse();

      // Check if there's activity today or yesterday
      const lastActivityDate = new Date(sortedDays[0]);
      const daysSinceLastActivity = Math.floor(
        (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastActivity <= 1) {
        currentStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
          const prevDate = new Date(sortedDays[i - 1]);
          const currDate = new Date(sortedDays[i]);
          const dayDiff = Math.floor(
            (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (dayDiff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      referencesRead: completedReferences,
      totalReadingTime: {
        hours: totalReadingTimeHours,
        minutes: totalReadingTimeMinutes,
        seconds: totalReadingTimeSeconds,
        formatted: `${totalReadingTimeHours}h ${totalReadingTimeMinutes}m`,
      },
      totalPoints,
      totalReadingPoints,
      currentStreak,
      accountAge: Math.floor(
        (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      ),
    };
  }
}
