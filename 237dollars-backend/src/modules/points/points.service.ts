import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserPoints } from '../../database/entities/user-points.entity';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(UserPoints)
    private pointsRepository: Repository<UserPoints>,
    private dataSource: DataSource,
  ) {}

  async addReadingPoints(
    userId: number,
    topicId: number,
    points: number,
  ): Promise<UserPoints> {
    // SECURITY: Use transaction with pessimistic locking to prevent race conditions
    return await this.dataSource.transaction(async (manager) => {
      let userPoints = await manager.findOne(UserPoints, {
        where: { userId, topicId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!userPoints) {
        userPoints = manager.create(UserPoints, {
          userId,
          topicId,
          readingPoints: points,
          quizPoints: 0,
          totalPoints: points,
          topicsCompleted: 0,
        });
      } else {
        userPoints.readingPoints += points;
        userPoints.totalPoints = userPoints.readingPoints + userPoints.quizPoints;
      }

      return await manager.save(userPoints);
    });
  }

  async addQuizPoints(
    userId: number,
    topicId: number,
    points: number,
  ): Promise<UserPoints> {
    // SECURITY: Use transaction with pessimistic locking to prevent race conditions
    return await this.dataSource.transaction(async (manager) => {
      let userPoints = await manager.findOne(UserPoints, {
        where: { userId, topicId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!userPoints) {
        userPoints = manager.create(UserPoints, {
          userId,
          topicId,
          readingPoints: 0,
          quizPoints: points,
          totalPoints: points,
          topicsCompleted: 0,
        });
      } else {
        userPoints.quizPoints += points;
        userPoints.totalPoints = userPoints.readingPoints + userPoints.quizPoints;
      }

      return await manager.save(userPoints);
    });
  }

  async getUserPoints(userId: number): Promise<UserPoints[]> {
    return await this.pointsRepository.find({
      where: { userId },
      relations: ['topic'],
      order: { totalPoints: 'DESC' },
    });
  }

  async getTotalPoints(userId: number): Promise<number> {
    const result = await this.pointsRepository
      .createQueryBuilder('points')
      .select('SUM(points.totalPoints)', 'total')
      .where('points.userId = :userId', { userId })
      .getRawOne();

    return parseInt(result?.total || '0', 10);
  }

  async markTopicCompleted(userId: number, topicId: number): Promise<UserPoints> {
    const userPoints = await this.pointsRepository.findOne({
      where: { userId, topicId },
    });

    if (!userPoints) {
      throw new NotFoundException('User points not found for this topic');
    }

    userPoints.topicsCompleted = 1;
    return await this.pointsRepository.save(userPoints);
  }

  async getPointsBreakdown(userId: number): Promise<{
    total: number;
    reading: number;
    quiz: number;
    topicsCompleted: number;
  }> {
    const points = await this.getUserPoints(userId);

    const total = points.reduce((sum, p) => sum + p.totalPoints, 0);
    const reading = points.reduce((sum, p) => sum + p.readingPoints, 0);
    const quiz = points.reduce((sum, p) => sum + p.quizPoints, 0);
    const topicsCompleted = points.reduce((sum, p) => sum + p.topicsCompleted, 0);

    return {
      total,
      reading,
      quiz,
      topicsCompleted,
    };
  }
}
