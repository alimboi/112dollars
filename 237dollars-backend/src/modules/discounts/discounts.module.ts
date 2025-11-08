import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { DiscountEligibility } from '../../database/entities/discount-eligibility.entity';
import { DiscountApplication } from '../../database/entities/discount-application.entity';
import { EmailService } from '../../common/utils/email.service';
import { TelegramService } from '../../common/utils/telegram.service';

@Module({
  imports: [TypeOrmModule.forFeature([DiscountEligibility, DiscountApplication])],
  controllers: [DiscountsController],
  providers: [DiscountsService, EmailService, TelegramService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
