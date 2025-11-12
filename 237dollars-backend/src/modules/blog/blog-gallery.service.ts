import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogImageGallery } from '../../database/entities/blog-image-gallery.entity';
import { BlogGalleryImage, GalleryMediaType } from '../../database/entities/blog-gallery-image.entity';
import { CreateBlogGalleryDto, GalleryMediaItemDto } from './dto/create-blog-gallery.dto';
import { UpdateBlogGalleryDto } from './dto/update-blog-gallery.dto';

@Injectable()
export class BlogGalleryService {
  constructor(
    @InjectRepository(BlogImageGallery)
    private galleryRepository: Repository<BlogImageGallery>,
    @InjectRepository(BlogGalleryImage)
    private imageRepository: Repository<BlogGalleryImage>,
  ) {}

  async create(createGalleryDto: CreateBlogGalleryDto, userId: number) {
    const { title, description, images, mediaItems } = createGalleryDto;

    // Use mediaItems if provided, otherwise fallback to images (old format)
    const items = mediaItems || images;

    if (!items || items.length === 0) {
      throw new BadRequestException('At least one media item is required');
    }

    // Create the gallery
    const gallery = this.galleryRepository.create({
      title,
      description,
      createdBy: userId,
      mainImageIndex: 0, // First item is main by default
      isPublished: false,
    });

    const savedGallery = await this.galleryRepository.save(gallery);

    // Create media items
    const galleryImages = items.map((item, index) => {
      if (typeof item === 'string') {
        // Old format: just a URL string
        return this.imageRepository.create({
          galleryId: savedGallery.id,
          imageUrl: item,
          mediaUrl: item,
          mediaType: GalleryMediaType.IMAGE,
          order: index,
        });
      } else {
        // New format: media object
        const mediaItem = item as GalleryMediaItemDto;
        return this.imageRepository.create({
          galleryId: savedGallery.id,
          imageUrl: mediaItem.mediaUrl, // For backward compatibility
          mediaUrl: mediaItem.mediaUrl,
          mediaType: mediaItem.mediaType,
          title: mediaItem.title,
          description: mediaItem.description,
          thumbnail: mediaItem.thumbnail,
          duration: mediaItem.duration,
          order: mediaItem.order !== undefined ? mediaItem.order : index,
        });
      }
    });

    await this.imageRepository.save(galleryImages);

    // Reload gallery with images
    return this.galleryRepository.findOne({
      where: { id: savedGallery.id },
      relations: ['images'],
    });
  }

  async findAll(page: number = 1, limit: number = 12, published?: boolean) {
    const query = this.galleryRepository.createQueryBuilder('gallery');

    if (published !== undefined) {
      query.where('gallery.isPublished = :published', { published });
    }

    const [galleries, total] = await query
      .leftJoinAndSelect('gallery.images', 'images')
      .orderBy('gallery.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      galleries,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number) {
    const gallery = await this.galleryRepository.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!gallery) {
      throw new NotFoundException(`Gallery with ID ${id} not found`);
    }

    // Sort images by order
    if (gallery.images) {
      gallery.images.sort((a, b) => a.order - b.order);
    }

    return gallery;
  }

  async update(id: number, updateGalleryDto: UpdateBlogGalleryDto) {
    const { title, description, images, mediaItems, mainImageIndex } = updateGalleryDto;

    const gallery = await this.findOne(id);

    if (title) gallery.title = title;
    if (description) gallery.description = description;
    if (mainImageIndex !== undefined) {
      if (mainImageIndex < 0 || mainImageIndex >= (gallery.images?.length || 0)) {
        throw new BadRequestException('Invalid mainImageIndex');
      }
      gallery.mainImageIndex = mainImageIndex;
    }

    await this.galleryRepository.save(gallery);

    // Update media items if provided
    const items = mediaItems || images;
    if (items && items.length > 0) {
      // Delete old images
      await this.imageRepository.delete({ galleryId: id });

      // Create new media items
      const galleryImages = items.map((item, index) => {
        if (typeof item === 'string') {
          // Old format: just a URL string
          return this.imageRepository.create({
            galleryId: id,
            imageUrl: item,
            mediaUrl: item,
            mediaType: GalleryMediaType.IMAGE,
            order: index,
          });
        } else {
          // New format: media object
          const mediaItem = item as GalleryMediaItemDto;
          return this.imageRepository.create({
            galleryId: id,
            imageUrl: mediaItem.mediaUrl, // For backward compatibility
            mediaUrl: mediaItem.mediaUrl,
            mediaType: mediaItem.mediaType,
            title: mediaItem.title,
            description: mediaItem.description,
            thumbnail: mediaItem.thumbnail,
            duration: mediaItem.duration,
            order: mediaItem.order !== undefined ? mediaItem.order : index,
          });
        }
      });
      await this.imageRepository.save(galleryImages);
    }

    // Reload gallery with images
    return this.findOne(id);
  }

  async remove(id: number) {
    const gallery = await this.findOne(id);
    await this.galleryRepository.remove(gallery);
    return { message: 'Gallery deleted successfully' };
  }

  async publish(id: number) {
    const gallery = await this.findOne(id);
    gallery.isPublished = true;
    await this.galleryRepository.save(gallery);
    return gallery;
  }

  async unpublish(id: number) {
    const gallery = await this.findOne(id);
    gallery.isPublished = false;
    await this.galleryRepository.save(gallery);
    return gallery;
  }
}
