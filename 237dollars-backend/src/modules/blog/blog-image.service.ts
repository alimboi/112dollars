import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogImage } from '../../database/entities/blog-image.entity';
import { CreateBlogImageDto } from './dto/create-blog-image.dto';
import { UpdateBlogImageDto } from './dto/update-blog-image.dto';

@Injectable()
export class BlogImageService {
  constructor(
    @InjectRepository(BlogImage)
    private blogImageRepository: Repository<BlogImage>,
  ) {}

  async create(createBlogImageDto: CreateBlogImageDto, createdBy: number) {
    const image = this.blogImageRepository.create({
      ...createBlogImageDto,
      createdBy,
    });
    return await this.blogImageRepository.save(image);
  }

  async findAll(page: number = 1, limit: number = 12, published?: boolean) {
    const query = this.blogImageRepository.createQueryBuilder('image')
      .leftJoinAndSelect('image.creator', 'creator')
      .select([
        'image',
        'creator.id',
        'creator.email',
      ]);

    if (published !== undefined) {
      query.where('image.isPublished = :published', { published });
    }

    const [images, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('image.createdAt', 'DESC')
      .getManyAndCount();

    return {
      images,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const image = await this.blogImageRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!image) {
      throw new NotFoundException('Blog image not found');
    }

    return image;
  }

  async update(id: number, updateBlogImageDto: UpdateBlogImageDto) {
    const image = await this.findOne(id);
    Object.assign(image, updateBlogImageDto);
    return await this.blogImageRepository.save(image);
  }

  async publish(id: number) {
    const image = await this.findOne(id);
    image.isPublished = true;
    return await this.blogImageRepository.save(image);
  }

  async unpublish(id: number) {
    const image = await this.findOne(id);
    image.isPublished = false;
    return await this.blogImageRepository.save(image);
  }

  async remove(id: number) {
    const image = await this.findOne(id);
    await this.blogImageRepository.remove(image);
    return { message: 'Blog image deleted' };
  }
}
