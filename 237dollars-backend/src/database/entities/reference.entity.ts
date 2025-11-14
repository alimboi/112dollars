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
import { Topic } from './topic.entity';
import { User } from './user.entity';
import { ContentBlock } from './content-block.entity';
import { ReadingProgress } from './reading-progress.entity';

@Entity('references')
export class Reference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'topic_id' })
  topicId: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  content: any;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @Column({ name: 'total_words', nullable: true })
  totalWords: number;

  @Column({ name: 'reading_time_minutes', nullable: true })
  readingTimeMinutes: number;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ name: 'is_free', default: true })
  isFree: boolean;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Topic, (topic) => topic.references, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @ManyToOne(() => User, (user) => user.blogPosts)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => ContentBlock, (block) => block.reference)
  contentBlocks: ContentBlock[];

  @OneToMany(() => ReadingProgress, (progress) => progress.reference)
  readingProgress: ReadingProgress[];
}
