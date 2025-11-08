import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingProgress } from '../../database/entities/reading-progress.entity';

@Injectable()
export class ReadingProgressService {
  constructor(
    @InjectRepository(ReadingProgress)
    private progressRepository: Repository<ReadingProgress>,
  ) {}

  async startReading(userId: number, referenceId: number) {
    const existing = await this.progressRepository.findOne({
      where: { userId, referenceId },
    });

    if (existing) return existing;

    const progress = this.progressRepository.create({ userId, referenceId });
    return await this.progressRepository.save(progress);
  }

  async updateProgress(userId: number, referenceId: number, percentageRead: number, readingTime: number) {
    let progress = await this.progressRepository.findOne({
      where: { userId, referenceId },
    });

    if (!progress) {
      progress = await this.startReading(userId, referenceId);
    }

    progress.percentageRead = percentageRead;
    progress.readingTimeSeconds = readingTime;

    // Validate scroll speed (simple check)
    progress.scrollSpeedValid = readingTime > 10; // at least 10 seconds

    return await this.progressRepository.save(progress);
  }

  async completeReading(userId: number, referenceId: number) {
    const progress = await this.progressRepository.findOne({
      where: { userId, referenceId },
    });

    if (progress && progress.scrollSpeedValid && !progress.pointsAwarded) {
      progress.percentageRead = 100;
      progress.completedAt = new Date();
      progress.pointsAwarded = true;
      return await this.progressRepository.save(progress);
    }

    return progress;
  }

  async getUserProgress(userId: number) {
    return await this.progressRepository.find({ where: { userId } });
  }
}
