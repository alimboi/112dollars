import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Quiz } from './quiz.entity';

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'quiz_id' })
  quizId: number;

  @Column({ name: 'score_percentage', type: 'decimal', precision: 5, scale: 2 })
  scorePercentage: number;

  @Column({ name: 'time_taken_seconds' })
  timeTakenSeconds: number;

  @Column({ type: 'json' })
  answers: any;

  @Column({ name: 'is_passed' })
  isPassed: boolean;

  @CreateDateColumn({ name: 'attempted_at' })
  attemptedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.quizAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;
}
