import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BlogImageGallery } from './blog-image-gallery.entity';

@Entity('blog_gallery_images')
export class BlogGalleryImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'gallery_id' })
  galleryId: number;

  @Column({ type: 'text', name: 'image_url' })
  imageUrl: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  // Relations
  @ManyToOne(() => BlogImageGallery, (gallery) => gallery.images, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'gallery_id' })
  gallery: BlogImageGallery;
}
