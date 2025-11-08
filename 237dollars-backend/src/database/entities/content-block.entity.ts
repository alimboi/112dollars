import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Reference } from './reference.entity';
import { ContentBlockType } from '../../types/content-block-type.enum';

@Entity('content_blocks')
export class ContentBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reference_id' })
  referenceId: number;

  @Column({ name: 'block_order' })
  blockOrder: number;

  @Column({
    name: 'block_type',
    type: 'enum',
    enum: ContentBlockType,
  })
  blockType: ContentBlockType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'json', nullable: true })
  styling: any;

  @Column({ name: 'block_data', type: 'json', nullable: true })
  blockData: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Reference, (reference) => reference.contentBlocks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reference_id' })
  reference: Reference;
}
