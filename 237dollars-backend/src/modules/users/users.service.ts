import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getUserProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'role',
        'language',
        'darkMode',
        'isActive',
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
}
