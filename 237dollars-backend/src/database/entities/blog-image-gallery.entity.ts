import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ForeignKey,
} from 'typeorm';
import { User } from './user.entity';
import { BlogGalleryImage } from './blog-gallery-image.entity';

@Entity('blog_image_galleries')
export class BlogImageGallery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'main_image_index', default: 0 })
  mainImageIndex: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.blogImageGalleries, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => BlogGalleryImage, (image) => image.gallery, {
    cascade: true,
    eager: true,
  })
  images: BlogGalleryImage[];
}
