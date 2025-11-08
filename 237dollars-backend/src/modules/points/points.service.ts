import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPoints } from '../../database/entities/user-points.entity';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(UserPoints)
    private pointsRepository: Repository<UserPoints>,
  ) {}

  async addReadingPoints(
    userId: number,
    topicId: number,
    points: number,
  ): Promise<UserPoints> {
    let userPoints = await this.pointsRepository.findOne({
      where: { userId, topicId },
    });

    if (!userPoints) {
      userPoints = this.pointsRepository.create({
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

    return await this.pointsRepository.save(userPoints);
  }

  async addQuizPoints(
    userId: number,
    topicId: number,
    points: number,
  ): Promise<UserPoints> {
    let userPoints = await this.pointsRepository.findOne({
      where: { userId, topicId },
    });

    if (!userPoints) {
      userPoints = this.pointsRepository.create({
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

    return await this.pointsRepository.save(userPoints);
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
