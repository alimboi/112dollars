import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TelegramUnlockController } from './telegram-unlock.controller';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController, TelegramUnlockController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
