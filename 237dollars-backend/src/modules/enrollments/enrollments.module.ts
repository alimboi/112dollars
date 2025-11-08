import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Student } from '../../database/entities/student.entity';
import { EmailService } from '../../common/utils/email.service';
import { TelegramService } from '../../common/utils/telegram.service';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, Student])],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, EmailService, TelegramService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
