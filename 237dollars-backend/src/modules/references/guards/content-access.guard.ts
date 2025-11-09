import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { Reference } from '../../../database/entities/reference.entity';
import { UserRole } from '../../../types/user-role.enum';

@Injectable()
export class ContentAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Reference)
    private referenceRepository: Repository<Reference>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const referenceId = request.params.id || request.params.referenceId;

    if (!user || !referenceId) {
      throw new ForbiddenException('Access denied');
    }

    // Admins and content managers have full access
    if ([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.CONTENT_MANAGER
    ].includes(user.role)) {
      request.fullAccess = true;
      return true;
    }

    // Get the reference with topic and major
    const reference = await this.referenceRepository.findOne({
      where: { id: referenceId },
      relations: ['topic', 'topic.major'],
    });

    if (!reference) {
      throw new ForbiddenException('Reference not found');
    }

    const majorId = reference.topic.major.id;

    // Get full user data
    const fullUser = await this.userRepository.findOne({
      where: { id: user.sub },
    });

    // ENROLLED_STUDENT: Full access to enrolled major
    if (fullUser.role === UserRole.ENROLLED_STUDENT) {
      if (fullUser.enrolledMajorId === majorId) {
        request.fullAccess = true;
        return true;
      }

      // Check if unlocked via Telegram
      if (fullUser.telegramUnlockedMajors?.includes(majorId)) {
        request.fullAccess = true;
        return true;
      }

      // Otherwise, only 8% access
      request.fullAccess = false;
      request.contentLimit = 0.08; // 8%
      return true;
    }

    // FREE_USER: Check Telegram unlocks, otherwise 8%
    if (fullUser.role === UserRole.FREE_USER) {
      if (fullUser.telegramUnlockedMajors?.includes(majorId)) {
        request.fullAccess = true;
        return true;
      }

      // 8% preview access
      request.fullAccess = false;
      request.contentLimit = 0.08;
      return true;
    }

    throw new ForbiddenException('Access denied');
  }
}
