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
import { UserPoints } from './user-points.entity';
import { ReadingProgress } from './reading-progress.entity';
import { DiscountEligibility } from './discount-eligibility.entity';
import { DiscountApplication } from './discount-application.entity';
import { BlogPost } from './blog-post.entity';
import { BlogImage } from './blog-image.entity';
import { BlogImageGallery } from './blog-image-gallery.entity';
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

  @Column({ unique: true, length: 50, nullable: true })
  username: string;

  @Column({ name: 'telegram_username', nullable: true })
  telegramUsername: string;

  @Column({ name: 'telegram_phone', length: 20, nullable: true })
  telegramPhone: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verification_code', length: 6, nullable: true })
  emailVerificationCode: string;

  @Column({ name: 'email_verification_expiry', type: 'timestamp', nullable: true })
  emailVerificationExpiry: Date;

  @Column({ name: 'verification_attempts', default: 0 })
  verificationAttempts: number;

  @Column({ name: 'last_verification_request', type: 'timestamp', nullable: true })
  lastVerificationRequest: Date;

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

  @OneToMany(() => BlogImageGallery, (gallery) => gallery.creator)
  blogImageGalleries: BlogImageGallery[];

  @OneToMany(() => AdminActivityLog, (log) => log.admin)
  activityLogs: AdminActivityLog[];
}
