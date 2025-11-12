import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogImageGallery } from '../../database/entities/blog-image-gallery.entity';
import { BlogGalleryImage } from '../../database/entities/blog-gallery-image.entity';
import { CreateBlogGalleryDto } from './dto/create-blog-gallery.dto';
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
    const { title, description, images } = createGalleryDto;

    if (!images || images.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    // Create the gallery
    const gallery = this.galleryRepository.create({
      title,
      description,
      createdBy: userId,
      mainImageIndex: 0, // First image is main by default
      isPublished: false,
    });

    const savedGallery = await this.galleryRepository.save(gallery);

    // Create images
    const galleryImages = images.map((imageUrl, index) =>
      this.imageRepository.create({
        galleryId: savedGallery.id,
        imageUrl,
        order: index,
      }),
    );

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
    const { title, description, images, mainImageIndex } = updateGalleryDto;

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

    // Update images if provided
    if (images && images.length > 0) {
      // Delete old images
      await this.imageRepository.delete({ galleryId: id });

      // Create new images
      const galleryImages = images.map((imageUrl, index) =>
        this.imageRepository.create({
          galleryId: id,
          imageUrl,
          order: index,
        }),
      );
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
