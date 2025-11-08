import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingProgressController } from './reading-progress.controller';
import { ReadingProgressService } from './reading-progress.service';
import { ReadingProgress } from '../../database/entities/reading-progress.entity';
import { Reference } from '../../database/entities/reference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReadingProgress, Reference])],
  controllers: [ReadingProgressController],
  providers: [ReadingProgressService],
  exports: [ReadingProgressService],
})
export class ReadingProgressModule {}
