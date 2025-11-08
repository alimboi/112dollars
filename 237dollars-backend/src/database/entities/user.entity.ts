import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../types/user-role.enum';
import { Language } from '../../types/language.enum';
import { Student } from './student.entity';
import { QuizAttempt } from './quiz-attempt.entity';
import { UserPoints } from './user-points.entity';
import { ReadingProgress } from './reading-progress.entity';
import { DiscountEligibility } from './discount-eligibility.entity';
import { DiscountApplication } from './discount-application.entity';
import { BlogPost } from './blog-post.entity';
import { AdminActivityLog } from './admin-activity-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.EN,
  })
  language: Language;

  @Column({ name: 'dark_mode', default: true })
  darkMode: boolean;

  // Relations
  @OneToOne(() => Student, (student) => student.user)
  student: Student;

  @OneToMany(() => QuizAttempt, (attempt) => attempt.user)
  quizAttempts: QuizAttempt[];

  @OneToMany(() => UserPoints, (points) => points.user)
  points: UserPoints[];

  @OneToMany(() => ReadingProgress, (progress) => progress.user)
  readingProgress: ReadingProgress[];

  @OneToMany(() => DiscountEligibility, (discount) => discount.user)
  discountEligibility: DiscountEligibility[];

  @OneToMany(() => DiscountApplication, (application) => application.user)
  discountApplications: DiscountApplication[];

  @OneToMany(() => BlogPost, (post) => post.author)
  blogPosts: BlogPost[];

  @OneToMany(() => AdminActivityLog, (log) => log.admin)
  activityLogs: AdminActivityLog[];
}
