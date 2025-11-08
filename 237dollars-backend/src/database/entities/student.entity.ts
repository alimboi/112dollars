import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Enrollment } from './enrollment.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'phone_home', nullable: true })
  phoneHome: string;

  @Column({ name: 'phone_personal' })
  phonePersonal: string;

  @Column()
  email: string;

  @Column({ name: 'telegram_contact', nullable: true })
  telegramContact: string;

  @Column({ name: 'social_media', nullable: true })
  socialMedia: string;

  @Column({ name: 'student_id', unique: true, nullable: true })
  studentId: string;

  @Column({ name: 'contract_id', nullable: true })
  contractId: string;

  @Column({ name: 'course_name', nullable: true })
  courseName: string;

  @Column({ name: 'student_picture_url', nullable: true })
  studentPictureUrl: string;

  @Column({ name: 'id_card_picture_url', nullable: true })
  idCardPictureUrl: string;

  @Column({ name: 'real_test_passed', default: false })
  realTestPassed: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];
}
