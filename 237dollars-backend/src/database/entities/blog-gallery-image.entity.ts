import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { BlogImageGallery } from './blog-image-gallery.entity';

export enum GalleryMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  YOUTUBE = 'YOUTUBE',
  INSTAGRAM = 'INSTAGRAM',
  TELEGRAM = 'TELEGRAM',
}

@Entity('blog_gallery_images')
export class BlogGalleryImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'gallery_id' })
  galleryId: number;

  @Column({ type: 'text', name: 'image_url' })
  imageUrl: string; // Kept for backward compatibility, same as mediaUrl

  @Column({ type: 'enum', enum: GalleryMediaType, default: GalleryMediaType.IMAGE, name: 'media_type' })
  mediaType: GalleryMediaType;

  @Column({ type: 'text', name: 'media_url', nullable: true })
  mediaUrl: string; // URL or embed link for the media

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  thumbnail: string; // Thumbnail URL for videos

  @Column({ type: 'int', nullable: true })
  duration: number; // Duration in seconds for videos

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => BlogImageGallery, (gallery) => gallery.images, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'gallery_id' })
  gallery: BlogImageGallery;
}
