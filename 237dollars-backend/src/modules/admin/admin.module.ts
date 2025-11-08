import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../../database/entities/user.entity';
import { AdminActivityLog } from '../../database/entities/admin-activity-log.entity';
import { PasswordService } from '../../common/utils/password.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, AdminActivityLog])],
  controllers: [AdminController],
  providers: [AdminService, PasswordService],
  exports: [AdminService],
})
export class AdminModule {}
