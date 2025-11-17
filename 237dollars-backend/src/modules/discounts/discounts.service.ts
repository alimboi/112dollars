import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DiscountEligibility } from '../../database/entities/discount-eligibility.entity';
import { DiscountApplication } from '../../database/entities/discount-application.entity';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { ValidateCodeDto } from './dto/validate-code.dto';
import { ApplicationStatus } from '../../types/application-status.enum';
import { EmailService } from '../../common/utils/email.service';
import { TelegramService } from '../../common/utils/telegram.service';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(DiscountEligibility)
    private eligibilityRepository: Repository<DiscountEligibility>,
    @InjectRepository(DiscountApplication)
    private applicationRepository: Repository<DiscountApplication>,
    private emailService: EmailService,
    private telegramService: TelegramService,
    private dataSource: DataSource,
  ) {}

  /**
   * SECURITY FIX #25: Use transaction to prevent duplicate discount applications
   * Two simultaneous requests could both check, not find, and both create applications
   */
  async applyForDiscount(
    userId: number,
    applyDto: ApplyDiscountDto,
  ): Promise<DiscountApplication> {
    // Use transaction to ensure atomic check-and-create
    const saved = await this.dataSource.transaction(async (manager) => {
      // Check if user already has a pending or approved application
      const existingApplication = await manager.findOne(DiscountApplication, {
        where: [
          { userId, status: ApplicationStatus.PENDING },
          { userId, status: ApplicationStatus.APPROVED },
        ],
        lock: { mode: 'pessimistic_write' }, // Lock to prevent concurrent inserts
      });

      if (existingApplication) {
        throw new ConflictException(
          'You already have a pending or approved discount application',
        );
      }

      const application = manager.create(DiscountApplication, {
        userId,
        fullName: applyDto.fullName,
        email: applyDto.email,
        phone: applyDto.phone,
        reason: applyDto.reason,
        status: ApplicationStatus.PENDING,
      });

      return await manager.save(application);
    });

    // Send notifications
    await this.emailService.sendEmail(
      applyDto.email,
      'Discount Application Received',
      `Dear ${applyDto.fullName},\n\nWe have received your discount application. Our team will review it and get back to you soon.\n\nBest regards,\n237Dollars Team`,
    );

    await this.telegramService.sendMessage(
      `🎟️ New Discount Application\n\nName: ${applyDto.fullName}\nEmail: ${applyDto.email}\nPhone: ${applyDto.phone}\nReason: ${applyDto.reason || 'Not provided'}`,
    );

    return saved;
  }

  async getApplications(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ applications: DiscountApplication[]; total: number }> {
    const [applications, total] = await this.applicationRepository.findAndCount(
      {
        skip: (page - 1) * limit,
        take: limit,
        order: { appliedAt: 'DESC' },
      },
    );

    return { applications, total };
  }

  /**
   * SECURITY FIX #26: Use transaction to prevent double approval
   * Two admins could simultaneously approve the same application
   */
  async approveApplication(applicationId: number): Promise<DiscountApplication> {
    const updated = await this.dataSource.transaction(async (manager) => {
      // Lock the application row for update
      const application = await manager.findOne(DiscountApplication, {
        where: { id: applicationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.status !== ApplicationStatus.PENDING) {
        throw new BadRequestException('Application is not pending');
      }

      // Generate discount code
      const discountCode = this.generateDiscountCode();

      // Create eligibility record
      const eligibility = manager.create(DiscountEligibility, {
        userId: application.userId,
        discountCode,
        discountPercentage: 50, // Default 50% discount
        isUsed: false,
      });

      await manager.save(eligibility);

      // Update application
      application.status = ApplicationStatus.APPROVED;
      application.discountCode = discountCode;
      application.reviewedAt = new Date();

      return await manager.save(application);
    });

    const application = updated;

    // Send approval email
    await this.emailService.sendEmail(
      application.email,
      'Discount Application Approved!',
      `Dear ${application.fullName},\n\nCongratulations! Your discount application has been approved.\n\nYour discount code: ${discountCode}\nDiscount: 50%\n\nPlease use this code during enrollment.\n\nBest regards,\n237Dollars Team`,
    );

    return updated;
  }

  async rejectApplication(applicationId: number): Promise<DiscountApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Application is not pending');
    }

    application.status = ApplicationStatus.REJECTED;
    application.reviewedAt = new Date();

    const updated = await this.applicationRepository.save(application);

    // Send rejection email
    await this.emailService.sendEmail(
      application.email,
      'Discount Application Status',
      `Dear ${application.fullName},\n\nThank you for your interest in our discount program. Unfortunately, we are unable to approve your application at this time.\n\nBest regards,\n237Dollars Team`,
    );

    return updated;
  }

  async validateCode(
    validateDto: ValidateCodeDto,
  ): Promise<{ valid: boolean; discount?: number }> {
    const eligibility = await this.eligibilityRepository.findOne({
      where: { discountCode: validateDto.code, isUsed: false },
    });

    if (!eligibility) {
      return { valid: false };
    }

    return {
      valid: true,
      discount: eligibility.discountPercentage,
    };
  }

  async markCodeAsUsed(code: string): Promise<void> {
    // Use transaction with pessimistic write lock to prevent race conditions
    await this.dataSource.transaction(async (manager) => {
      const eligibility = await manager.findOne(DiscountEligibility, {
        where: { discountCode: code, isUsed: false },
        lock: { mode: 'pessimistic_write' },
      });

      if (!eligibility) {
        throw new BadRequestException('Discount code already used or invalid');
      }

      eligibility.isUsed = true;
      eligibility.usedAt = new Date();
      await manager.save(eligibility);
    });
  }

  private generateDiscountCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '237D-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
