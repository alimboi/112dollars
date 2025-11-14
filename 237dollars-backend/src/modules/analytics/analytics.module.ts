import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User } from '../../database/entities/user.entity';
import { Student } from '../../database/entities/student.entity';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Reference } from '../../database/entities/reference.entity';
import { ReadingProgress } from '../../database/entities/reading-progress.entity';
import { UserPoints } from '../../database/entities/user-points.entity';
import { BlogPost } from '../../database/entities/blog-post.entity';
import { ContactMessage } from '../../database/entities/contact-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Student,
      Enrollment,
      Reference,
      ReadingProgress,
      UserPoints,
      BlogPost,
      ContactMessage,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
