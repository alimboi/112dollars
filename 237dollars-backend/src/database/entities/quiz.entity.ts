import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Reference } from './reference.entity';
import { QuizQuestion } from './quiz-question.entity';
import { QuizAttempt } from './quiz-attempt.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reference_id' })
  referenceId: number;

  @Column({ name: 'total_questions', default: 10 })
  totalQuestions: number;

  @Column({ name: 'time_limit_minutes', default: 10 })
  timeLimitMinutes: number;

  @Column({ name: 'pass_score_percentage', default: 70 })
  passScorePercentage: number;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToOne(() => Reference, (reference) => reference.quiz, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reference_id' })
  reference: Reference;

  @OneToMany(() => QuizQuestion, (question) => question.quiz)
  questions: QuizQuestion[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];
}
