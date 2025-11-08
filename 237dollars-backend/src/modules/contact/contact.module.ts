import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactMessage } from '../../database/entities/contact-message.entity';
import { EmailService } from '../../common/utils/email.service';
import { TelegramService } from '../../common/utils/telegram.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactMessage])],
  controllers: [ContactController],
  providers: [ContactService, EmailService, TelegramService],
  exports: [ContactService],
})
export class ContactModule {}
