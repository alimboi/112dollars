import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferencesController } from './references.controller';
import { ReferencesService } from './references.service';
import { ContentAccessGuard } from './guards/content-access.guard';
import { Reference } from '../../database/entities/reference.entity';
import { Major } from '../../database/entities/major.entity';
import { Topic } from '../../database/entities/topic.entity';
import { ContentBlock } from '../../database/entities/content-block.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reference, Major, Topic, ContentBlock, User])],
  controllers: [ReferencesController],
  providers: [ReferencesService, ContentAccessGuard],
  exports: [ReferencesService],
})
export class ReferencesModule {}
