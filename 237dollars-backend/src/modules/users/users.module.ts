import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TelegramUnlockController } from './telegram-unlock.controller';
import { User } from '../../database/entities/user.entity';
import { ReadingProgress } from '../../database/entities/reading-progress.entity';
import { UserPoints } from '../../database/entities/user-points.entity';
import { PasswordService } from '../../common/utils/password.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, ReadingProgress, UserPoints])],
  controllers: [UsersController, TelegramUnlockController],
  providers: [UsersService, PasswordService],
  exports: [UsersService],
})
export class UsersModule {}
