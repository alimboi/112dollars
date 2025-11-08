import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Major } from './major.entity';
import { Reference } from './reference.entity';
import { UserPoints } from './user-points.entity';
import { DiscountEligibility } from './discount-eligibility.entity';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'major_id' })
  majorId: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'display_order', nullable: true })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Major, (major) => major.topics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'major_id' })
  major: Major;

  @OneToMany(() => Reference, (reference) => reference.topic)
  references: Reference[];

  @OneToMany(() => UserPoints, (points) => points.topic)
  userPoints: UserPoints[];

  @OneToMany(() => DiscountEligibility, (discount) => discount.topic)
  discountEligibility: DiscountEligibility[];
}
