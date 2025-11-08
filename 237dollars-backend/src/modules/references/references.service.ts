import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reference } from '../../database/entities/reference.entity';
import { Major } from '../../database/entities/major.entity';
import { Topic } from '../../database/entities/topic.entity';
import { ContentBlock } from '../../database/entities/content-block.entity';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class ReferencesService {
  constructor(
    @InjectRepository(Reference)
    private referenceRepository: Repository<Reference>,
    @InjectRepository(Major)
    private majorRepository: Repository<Major>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(ContentBlock)
    private contentBlockRepository: Repository<ContentBlock>,
  ) {}

  // Majors
  async getAllMajors() {
    return await this.majorRepository.find({
      order: { displayOrder: 'ASC' },
    });
  }

  // Topics
  async getTopicsByMajor(majorId: number) {
    const major = await this.majorRepository.findOne({ where: { id: majorId } });
    if (!major) {
      throw new NotFoundException(ErrorMessages.MAJOR_NOT_FOUND);
    }

    return await this.topicRepository.find({
      where: { majorId },
      order: { displayOrder: 'ASC' },
    });
  }

  // References
  async create(createReferenceDto: CreateReferenceDto, createdBy: number) {
    // Calculate reading time if totalWords provided
    if (createReferenceDto.totalWords) {
      createReferenceDto.readingTimeMinutes = Math.ceil(createReferenceDto.totalWords / 225);
    }

    const reference = this.referenceRepository.create({
      ...createReferenceDto,
      createdBy,
    });

    return await this.referenceRepository.save(reference);
  }

  async findByTopic(topicId: number, page: number = 1, limit: number = 10) {
    const [references, total] = await this.referenceRepository.findAndCount({
      where: { topicId, isPublished: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      references,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, userId?: number) {
    const reference = await this.referenceRepository.findOne({
      where: { id },
      relations: ['topic', 'topic.major', 'contentBlocks'],
    });

    if (!reference) {
      throw new NotFoundException(ErrorMessages.REFERENCE_NOT_FOUND);
    }

    // Check access for free users (8% limit logic would go here)
    // For now, return full reference
    return reference;
  }

  async update(id: number, updateReferenceDto: UpdateReferenceDto) {
    const reference = await this.findOne(id);

    // Recalculate reading time if totalWords changed
    if (updateReferenceDto.totalWords) {
      updateReferenceDto.readingTimeMinutes = Math.ceil(updateReferenceDto.totalWords / 225);
    }

    Object.assign(reference, updateReferenceDto);
    return await this.referenceRepository.save(reference);
  }

  async publish(id: number) {
    const reference = await this.findOne(id);
    reference.isPublished = true;
    return await this.referenceRepository.save(reference);
  }

  async unpublish(id: number) {
    const reference = await this.findOne(id);
    reference.isPublished = false;
    return await this.referenceRepository.save(reference);
  }

  async remove(id: number) {
    const reference = await this.findOne(id);
    await this.referenceRepository.remove(reference);
    return { message: 'Reference deleted' };
  }

  // Content Blocks
  async addContentBlock(referenceId: number, blockData: any) {
    const reference = await this.findOne(referenceId);

    const block = this.contentBlockRepository.create({
      referenceId,
      ...blockData,
    });

    return await this.contentBlockRepository.save(block);
  }

  async updateContentBlock(blockId: number, blockData: any) {
    const block = await this.contentBlockRepository.findOne({ where: { id: blockId } });
    if (!block) {
      throw new NotFoundException(ErrorMessages.CONTENT_BLOCK_NOT_FOUND);
    }

    Object.assign(block, blockData);
    return await this.contentBlockRepository.save(block);
  }

  async deleteContentBlock(blockId: number) {
    const block = await this.contentBlockRepository.findOne({ where: { id: blockId } });
    if (!block) {
      throw new NotFoundException(ErrorMessages.CONTENT_BLOCK_NOT_FOUND);
    }

    await this.contentBlockRepository.remove(block);
    return { message: 'Content block deleted' };
  }

  async reorderContentBlocks(referenceId: number, newOrder: number[]) {
    const blocks = await this.contentBlockRepository.find({
      where: { referenceId },
    });

    for (let i = 0; i < newOrder.length; i++) {
      const block = blocks.find(b => b.id === newOrder[i]);
      if (block) {
        block.blockOrder = i;
        await this.contentBlockRepository.save(block);
      }
    }

    return { message: 'Content blocks reordered' };
  }

  calculateReadingTime(content: string): number {
    const words = content.split(/\s+/).length;
    return Math.ceil(words / 225); // 225 words per minute average
  }
}
