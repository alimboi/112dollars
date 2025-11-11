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
import { BlogImage } from './blog-image.entity';
import { AdminActivityLog } from './admin-activity-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ name: 'google_id', nullable: true, unique: true })
  googleId: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'profile_picture', nullable: true })
  profilePicture: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.FREE_USER, // Default to free user
  })
  role: UserRole;

  @Column({ name: 'enrolled_major_id', nullable: true })
  enrolledMajorId: number; // Which major they paid for (null for free users)

  @Column({ name: 'telegram_unlocked_majors', type: 'jsonb', default: '[]' })
  telegramUnlockedMajors: number[]; // Majors unlocked by Telegram (array of major IDs)

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

  @Column({ name: 'real_test_passed', default: false })
  realTestPassed: boolean;

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

  @OneToMany(() => BlogImage, (image) => image.creator)
  blogImages: BlogImage[];

  @OneToMany(() => AdminActivityLog, (log) => log.admin)
  activityLogs: AdminActivityLog[];
}
