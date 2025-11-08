import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { QuizAnswer } from '../../types/quiz-answer.enum';

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'quiz_id' })
  quizId: number;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ name: 'option_a', type: 'text' })
  optionA: string;

  @Column({ name: 'option_b', type: 'text' })
  optionB: string;

  @Column({ name: 'option_c', type: 'text' })
  optionC: string;

  @Column({ name: 'option_d', type: 'text' })
  optionD: string;

  @Column({
    name: 'correct_answer',
    type: 'enum',
    enum: QuizAnswer,
  })
  correctAnswer: QuizAnswer;

  @Column({ name: 'question_order' })
  questionOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;
}
