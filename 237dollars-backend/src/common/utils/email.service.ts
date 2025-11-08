import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

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
    } else {
      console.warn('⚠️  Email service not configured. Set GMAIL_EMAIL and GMAIL_APP_PASSWORD in .env');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    if (!this.transporter) {
      console.log('📧 Email would be sent to:', to);
      console.log('Subject:', subject);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('GMAIL_EMAIL'),
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      return false;
    }
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
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">237dollars Educational Platform</p>
      </div>
    `;
    return await this.sendEmail(email, subject, html);
  }

  async sendEnrollmentApprovalEmail(
    email: string,
    studentName: string,
  ): Promise<boolean> {
    const subject = '237dollars - Enrollment Approved';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations ${studentName}!</h2>
        <p>Your enrollment has been approved.</p>
        <p>Please visit our office to sign the contract and complete the enrollment process.</p>
        <p>We'll send you another email with your account creation link after the contract is signed.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">237dollars Educational Platform</p>
      </div>
    `;
    return await this.sendEmail(email, subject, html);
  }

  async sendAccountCreationLink(
    email: string,
    link: string,
  ): Promise<boolean> {
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

  async sendDiscountCodeEmail(
    email: string,
    code: string,
    discountPercentage: number,
  ): Promise<boolean> {
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
        <p>Use it when enrolling in a course.</p>
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
        <p>Our team typically responds within 24-48 hours.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">237dollars Educational Platform</p>
      </div>
    `;
    return await this.sendEmail(email, subject, html);
  }

  async sendAdminNotification(
    adminEmail: string,
    subject: string,
    message: string,
  ): Promise<boolean> {
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
