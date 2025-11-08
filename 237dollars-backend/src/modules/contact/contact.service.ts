import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from '../../database/entities/contact-message.entity';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { EmailService } from '../../common/utils/email.service';
import { TelegramService } from '../../common/utils/telegram.service';
import { ContactStatus } from '../../types/contact-status.enum';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private contactRepository: Repository<ContactMessage>,
    private emailService: EmailService,
    private telegramService: TelegramService,
  ) {}

  async create(createContactMessageDto: CreateContactMessageDto) {
    const message = this.contactRepository.create(createContactMessageDto);
    const saved = await this.contactRepository.save(message);

    // Send confirmation to user
    await this.emailService.sendContactConfirmation(
      createContactMessageDto.email,
      createContactMessageDto.name,
    );

    // Notify admin
    await this.emailService.sendAdminNotification(
      'admin@237dollars.com',
      'New Contact Message',
      `From: ${createContactMessageDto.name} (${createContactMessageDto.email})`,
    );

    await this.telegramService.sendContactNotification(
      createContactMessageDto.name,
      createContactMessageDto.email,
      createContactMessageDto.subject || 'No subject',
    );

    return saved;
  }

  async findAll(page: number = 1, limit: number = 10, status?: ContactStatus) {
    const query = this.contactRepository.createQueryBuilder('message');

    if (status) {
      query.where('message.status = :status', { status });
    }

    const [messages, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('message.createdAt', 'DESC')
      .getManyAndCount();

    return {
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const message = await this.contactRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  async markAsRead(id: number) {
    const message = await this.findOne(id);
    message.status = ContactStatus.READ;
    return await this.contactRepository.save(message);
  }

  async markAsResponded(id: number) {
    const message = await this.findOne(id);
    message.status = ContactStatus.RESPONDED;
    return await this.contactRepository.save(message);
  }

  async remove(id: number) {
    const message = await this.findOne(id);
    await this.contactRepository.remove(message);
    return { message: 'Contact message deleted' };
  }
}
