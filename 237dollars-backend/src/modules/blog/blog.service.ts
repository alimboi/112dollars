import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from '../../database/entities/blog-post.entity';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private blogRepository: Repository<BlogPost>,
  ) {}

  async create(createBlogPostDto: CreateBlogPostDto, authorId: number) {
    const post = this.blogRepository.create({
      ...createBlogPostDto,
      authorId,
    });
    return await this.blogRepository.save(post);
  }

  async findAll(page: number = 1, limit: number = 10, published?: boolean) {
    const query = this.blogRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select([
        'post',
        'author.id',
        'author.email',
      ]);

    if (published !== undefined) {
      query.where('post.isPublished = :published', { published });
    }

    const [posts, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('post.createdAt', 'DESC')
      .getManyAndCount();

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const post = await this.blogRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    return post;
  }

  async update(id: number, updateBlogPostDto: UpdateBlogPostDto) {
    const post = await this.findOne(id);
    Object.assign(post, updateBlogPostDto);
    return await this.blogRepository.save(post);
  }

  async publish(id: number) {
    const post = await this.findOne(id);
    post.isPublished = true;
    post.publishedAt = new Date();
    return await this.blogRepository.save(post);
  }

  async unpublish(id: number) {
    const post = await this.findOne(id);
    post.isPublished = false;
    return await this.blogRepository.save(post);
  }

  async remove(id: number) {
    const post = await this.findOne(id);
    await this.blogRepository.remove(post);
    return { message: 'Blog post deleted' };
  }
}
