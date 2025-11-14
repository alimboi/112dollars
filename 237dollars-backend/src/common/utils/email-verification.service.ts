import { Injectable, BadRequestException, TooManyRequestsException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { EmailService } from './email.service';

@Injectable()
export class EmailVerificationService {
  // Constants
  private readonly VERIFICATION_CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = 5;
  private readonly MAX_VERIFICATION_ATTEMPTS = 3;
  private readonly MAX_RESEND_ATTEMPTS_PER_HOUR = 5;
  private readonly RESEND_COOLDOWN_SECONDS = 60;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  /**
   * Generate a random 6-digit verification code
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Check rate limiting
    await this.checkRateLimits(user);

    // Generate code
    const code = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);

    // Update user with verification code
    user.emailVerificationCode = code;
    user.emailVerificationExpiry = expiresAt;
    user.verificationAttempts = 0; // Reset attempts when new code is sent
    user.lastVerificationRequest = new Date();

    await this.userRepository.save(user);

    // Send email
    await this.emailService.sendVerificationCodeEmail(email, code, user.firstName);
  }

  /**
   * Verify email with code
   */
  async verifyEmail(email: string, code: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpiry) {
      throw new BadRequestException('No verification code found. Please request a new one');
    }

    // Check if code expired
    if (new Date() > user.emailVerificationExpiry) {
      throw new BadRequestException('Verification code expired. Please request a new one');
    }

    // Check attempts
    if (user.verificationAttempts >= this.MAX_VERIFICATION_ATTEMPTS) {
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Please request a new code',
      );
    }

    // Verify code
    if (user.emailVerificationCode !== code) {
      user.verificationAttempts += 1;
      await this.userRepository.save(user);

      const remainingAttempts = this.MAX_VERIFICATION_ATTEMPTS - user.verificationAttempts;
      throw new BadRequestException(
        `Invalid verification code. ${remainingAttempts} attempt(s) remaining`,
      );
    }

    // Success - mark email as verified
    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpiry = null;
    user.verificationAttempts = 0;
    user.isActive = true; // Activate account

    await this.userRepository.save(user);
  }

  /**
   * Check rate limits for resending verification code
   */
  private async checkRateLimits(user: User): Promise<void> {
    const now = new Date();

    // Check cooldown period (60 seconds between requests)
    if (user.lastVerificationRequest) {
      const timeSinceLastRequest = (now.getTime() - user.lastVerificationRequest.getTime()) / 1000;

      if (timeSinceLastRequest < this.RESEND_COOLDOWN_SECONDS) {
        const remainingSeconds = Math.ceil(this.RESEND_COOLDOWN_SECONDS - timeSinceLastRequest);
        throw new TooManyRequestsException(
          `Please wait ${remainingSeconds} seconds before requesting a new code`,
        );
      }
    }

    // Check hourly limit (5 requests per hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Count how many times verification was requested in the last hour
    // This is simplified - in production, you might want to track this in a separate table
    if (user.lastVerificationRequest && user.lastVerificationRequest > oneHourAgo) {
      // For simplicity, we'll trust the attempts counter
      // In production, implement proper request counting
      const hourlyAttempts = user.verificationAttempts || 0;

      if (hourlyAttempts >= this.MAX_RESEND_ATTEMPTS_PER_HOUR) {
        throw new TooManyRequestsException(
          'Maximum verification requests exceeded. Please try again later',
        );
      }
    }
  }

  /**
   * Check if user's email is verified
   */
  async isEmailVerified(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['emailVerified'],
    });

    return user?.emailVerified || false;
  }

  /**
   * Get verification status for user
   */
  async getVerificationStatus(email: string): Promise<{
    verified: boolean;
    canResend: boolean;
    expiresAt: Date | null;
    attemptsRemaining: number;
  }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const now = new Date();
    let canResend = true;

    if (user.lastVerificationRequest) {
      const timeSinceLastRequest = (now.getTime() - user.lastVerificationRequest.getTime()) / 1000;
      canResend = timeSinceLastRequest >= this.RESEND_COOLDOWN_SECONDS;
    }

    return {
      verified: user.emailVerified,
      canResend,
      expiresAt: user.emailVerificationExpiry,
      attemptsRemaining: Math.max(0, this.MAX_VERIFICATION_ATTEMPTS - user.verificationAttempts),
    };
  }
}
