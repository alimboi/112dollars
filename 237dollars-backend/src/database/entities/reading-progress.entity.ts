import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Reference } from './reference.entity';

@Entity('reading_progress')
export class ReadingProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'reference_id' })
  referenceId: number;

  @Column({
    name: 'percentage_read',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  percentageRead: number;

  @Column({ name: 'scroll_speed_valid', default: false })
  scrollSpeedValid: boolean;

  @Column({ name: 'reading_time_seconds', default: 0 })
  readingTimeSeconds: number;

  @Column({ name: 'points_awarded', default: false })
  pointsAwarded: boolean;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.readingProgress, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Reference, (reference) => reference.readingProgress, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reference_id' })
  reference: Reference;
}
