import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReadingProgress } from '../../database/entities/reading-progress.entity';

@Injectable()
export class ReadingProgressService {
  constructor(
    @InjectRepository(ReadingProgress)
    private progressRepository: Repository<ReadingProgress>,
    private dataSource: DataSource,
  ) {}

  /**
   * SECURITY FIX #20: Use upsert to prevent race condition
   * Two simultaneous requests could both check, not find, and both try to create
   */
  async startReading(userId: number, referenceId: number) {
    // Use INSERT ... ON CONFLICT DO NOTHING to handle race conditions
    const result = await this.progressRepository
      .createQueryBuilder()
      .insert()
      .into(ReadingProgress)
      .values({ userId, referenceId })
      .orIgnore() // PostgreSQL: ON CONFLICT DO NOTHING
      .execute();

    // Fetch and return the record (either newly created or existing)
    return await this.progressRepository.findOne({
      where: { userId, referenceId },
    });
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

  /**
   * SECURITY FIX #24: Use pessimistic locking to prevent double point awarding
   * Two simultaneous requests could both see pointsAwarded=false and both award points
   */
  async completeReading(userId: number, referenceId: number) {
    // Use transaction with row-level locking to prevent race condition
    return await this.dataSource.transaction(async (manager) => {
      // Lock the row for update (SELECT ... FOR UPDATE)
      const progress = await manager.findOne(ReadingProgress, {
        where: { userId, referenceId },
        lock: { mode: 'pessimistic_write' }, // Row-level lock
      });

      if (!progress) {
        return null;
      }

      // Check conditions and update atomically within the lock
      if (progress.scrollSpeedValid && !progress.pointsAwarded) {
        progress.percentageRead = 100;
        progress.completedAt = new Date();
        progress.pointsAwarded = true;
        return await manager.save(ReadingProgress, progress);
      }

      return progress;
    });
  }

  async getUserProgress(userId: number) {
    return await this.progressRepository.find({ where: { userId } });
  }
}
