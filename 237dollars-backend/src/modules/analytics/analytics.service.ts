import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Student } from '../../database/entities/student.entity';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Reference } from '../../database/entities/reference.entity';
import { Quiz } from '../../database/entities/quiz.entity';
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity';
import { ReadingProgress } from '../../database/entities/reading-progress.entity';
import { UserPoints } from '../../database/entities/user-points.entity';
import { BlogPost } from '../../database/entities/blog-post.entity';
import { ContactMessage } from '../../database/entities/contact-message.entity';
import { UserRole } from '../../types/user-role.enum';
import { EnrollmentStatus } from '../../types/enrollment-status.enum';
import { ContactStatus } from '../../types/contact-status.enum';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Reference)
    private referenceRepository: Repository<Reference>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(QuizAttempt)
    private quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(ReadingProgress)
    private progressRepository: Repository<ReadingProgress>,
    @InjectRepository(UserPoints)
    private pointsRepository: Repository<UserPoints>,
    @InjectRepository(BlogPost)
    private blogRepository: Repository<BlogPost>,
    @InjectRepository(ContactMessage)
    private contactRepository: Repository<ContactMessage>,
  ) {}

  async getDashboard(): Promise<any> {
    const [
      totalUsers,
      activeUsers,
      totalStudents,
      totalEnrollments,
      pendingEnrollments,
      approvedEnrollments,
      totalReferences,
      totalQuizzes,
      totalAttempts,
      totalBlogPosts,
      unreadMessages,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.studentRepository.count(),
      this.enrollmentRepository.count(),
      this.enrollmentRepository.count({
        where: { status: EnrollmentStatus.PENDING },
      }),
      this.enrollmentRepository.count({
        where: { status: EnrollmentStatus.APPROVED },
      }),
      this.referenceRepository.count(),
      this.quizRepository.count(),
      this.quizAttemptRepository.count(),
      this.blogRepository.count(),
      this.contactRepository.count({ where: { status: ContactStatus.NEW } }),
    ]);

    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole,
      },
      students: {
        total: totalStudents,
      },
      enrollments: {
        total: totalEnrollments,
        pending: pendingEnrollments,
        approved: approvedEnrollments,
      },
      content: {
        references: totalReferences,
        quizzes: totalQuizzes,
        blogPosts: totalBlogPosts,
      },
      engagement: {
        quizAttempts: totalAttempts,
      },
      messages: {
        unread: unreadMessages,
      },
    };
  }

  async getStudentAnalytics(): Promise<any> {
    const totalStudents = await this.studentRepository.count();

    const enrollmentsByStatus = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('enrollment.status')
      .getRawMany();

    const topStudentsByPoints = await this.pointsRepository
      .createQueryBuilder('points')
      .select('points.userId', 'userId')
      .addSelect('SUM(points.points)', 'totalPoints')
      .leftJoinAndSelect('points.user', 'user')
      .groupBy('points.userId')
      .addGroupBy('user.id')
      .orderBy('totalPoints', 'DESC')
      .limit(10)
      .getRawMany();

    const studentsPassedTest = await this.userRepository.count({
      where: { role: UserRole.ENROLLED_STUDENT, realTestPassed: true },
    });

    return {
      total: totalStudents,
      enrollmentsByStatus,
      topByPoints: topStudentsByPoints,
      passedTest: studentsPassedTest,
    };
  }

  async getContentAnalytics(): Promise<any> {
    const totalReferences = await this.referenceRepository.count();
    const totalQuizzes = await this.quizRepository.count();

    const mostReadReferences = await this.progressRepository
      .createQueryBuilder('progress')
      .select('progress.referenceId', 'referenceId')
      .addSelect('COUNT(DISTINCT progress.userId)', 'readers')
      .leftJoinAndSelect('progress.reference', 'reference')
      .groupBy('progress.referenceId')
      .addGroupBy('reference.id')
      .orderBy('readers', 'DESC')
      .limit(10)
      .getRawMany();

    const quizPerformance = await this.quizAttemptRepository
      .createQueryBuilder('attempt')
      .select('attempt.quizId', 'quizId')
      .addSelect('AVG(attempt.scorePercentage)', 'avgScore')
      .addSelect('COUNT(*)', 'attempts')
      .leftJoinAndSelect('attempt.quiz', 'quiz')
      .groupBy('attempt.quizId')
      .addGroupBy('quiz.id')
      .orderBy('attempts', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      references: {
        total: totalReferences,
        mostRead: mostReadReferences,
      },
      quizzes: {
        total: totalQuizzes,
        performance: quizPerformance,
      },
    };
  }

  async exportData(dataType: string): Promise<any> {
    switch (dataType) {
      case 'users':
        return await this.userRepository.find({
          select: ['id', 'email', 'role', 'isActive', 'createdAt'],
        });
      case 'students':
        return await this.studentRepository.find();
      case 'enrollments':
        return await this.enrollmentRepository.find({
          relations: ['student'],
        });
      case 'quiz-attempts':
        return await this.quizAttemptRepository.find({
          relations: ['quiz', 'user'],
        });
      default:
        return { error: 'Invalid data type' };
    }
  }
}
