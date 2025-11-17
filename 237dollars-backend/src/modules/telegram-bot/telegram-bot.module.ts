import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramBotService } from './telegram-bot.service';
import { User } from '../../database/entities/user.entity';
import { Major } from '../../database/entities/major.entity';
import { Topic } from '../../database/entities/topic.entity';
import { Reference } from '../../database/entities/reference.entity';
import { BlogImageGallery } from '../../database/entities/blog-image-gallery.entity';
import { BlogGalleryImage } from '../../database/entities/blog-gallery-image.entity';
import { ReferencesService } from '../references/references.service';
import { BlogGalleryService } from '../blog/blog-gallery.service';
import { ContentBlock } from '../../database/entities/content-block.entity';
import { UploadService } from '../upload/upload.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Major,
      Topic,
      Reference,
      ContentBlock,
      BlogImageGallery,
      BlogGalleryImage,
    ]),
  ],
  providers: [TelegramBotService, ReferencesService, BlogGalleryService, UploadService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
