import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const gmailEmail = this.configService.get<string>('GMAIL_EMAIL');
    const gmailPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');

    if (gmailEmail && gmailPassword) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailEmail,
          pass: gmailPassword,
        },
      });
      this.logger.log('Email service configured');
    } else {
      this.logger.warn('Email service not configured');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.debug(`Email would be sent to: ${to}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('GMAIL_EMAIL'),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }

  async sendVerificationCodeEmail(email: string, code: string, firstName: string = ''): Promise<boolean> {
    const subject = '237dollars - Verify Your Email';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to 237dollars${firstName ? `, ${firstName}` : ''}!</h2>
        <p style="font-size: 16px; color: #555;">Thank you for registering. Please verify your email address using the code below:</p>
        <div style="background: #007bff; color: white; padding: 25px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 30px 0;">
          ${code}
        </div>
        <p style="color: #666;">This code will expire in <strong>5 minutes</strong>.</p>
        <p style="color: #666;">If you didn't create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">237dollars Educational Platform</p>
      </div>
    `;
    return await this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
    const subject = '237dollars - Password Reset Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Use the code below:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">237dollars Educational Platform</p>
      </div>
    `;
    return await this.sendEmail(email, subject, html);
  }

  async sendEnrollmentApprovalEmail(email: string, studentName: string): Promise<boolean> {
    const subject = '237dollars - Enrollment Approved';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations ${studentName}!</h2>
        <p>Your enrollment has been approved.</p>
        <p>Please visit our office to sign the contract and complete the enrollment process.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">237dollars Educational Platform</p>
      </div>
    `;
    return await this.sendEmail(email, subject, html);
  }

  async sendAccountCreationLink(email: string, link: string): Promise<boolean> {
    const subject = '237dollars - Create Your Account';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to 237dollars!</h2>
        <p>Your enrollment is complete. Create your account now:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Create Account
          </a>
        </div>
        <p>This link will expire in 7 days.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">237dollars Educational Platform</p>
      </div>
    `;
    return await this.sendEmail(email, subject, html);
  }

  async sendDiscountCodeEmail(email: string, code: string, discountPercentage: number): Promise<boolean> {
    const subject = '237dollars - Your Discount Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations! 🎉</h2>
        <p>Your discount application has been approved.</p>
        <p>Your ${discountPercentage}% discount code:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold;">
          ${code}
        </div>
        <p>This code is valid for 1 month.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">237dollars Educational Platform</p>
      </div>
    `;
    return await this.sendEmail(email, subject, html);
  }

  async sendContactConfirmation(email: string, name: string): Promise<boolean> {
    const subject = '237dollars - We Received Your Message';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you ${name}!</h2>
        <p>We received your message and will get back to you soon.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">237dollars Educational Platform</p>
      </div>
    `;
    return await this.sendEmail(email, subject, html);
  }

  async sendAdminNotification(adminEmail: string, subject: string, message: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Admin Notification</h2>
        <p>${message}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">237dollars Admin System</p>
      </div>
    `;
    return await this.sendEmail(adminEmail, subject, html);
  }
}
