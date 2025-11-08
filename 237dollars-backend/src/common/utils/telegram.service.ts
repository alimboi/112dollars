import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private botToken: string;
  private adminChatId: string;
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID');

    if (this.botToken && this.adminChatId) {
      this.isConfigured = true;
      console.log('✅ Telegram bot configured');
    } else {
      console.warn(
        '⚠️  Telegram bot not configured (optional). Set TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID in .env to enable.',
      );
    }
  }

  async sendMessage(message: string, chatId?: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📱 Telegram message would be sent:', message);
      return false;
    }

    const targetChatId = chatId || this.adminChatId;
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (response.ok) {
        console.log('✅ Telegram message sent');
        return true;
      } else {
        console.error('❌ Telegram API error:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ Telegram sending failed:', error.message);
      return false;
    }
  }

  async sendEnrollmentNotification(
    studentName: string,
    courseName: string,
    email: string,
  ): Promise<boolean> {
    const message = `
<b>🎓 New Enrollment Request</b>

<b>Student:</b> ${studentName}
<b>Course:</b> ${courseName}
<b>Email:</b> ${email}

Please review in admin panel.
    `.trim();

    return await this.sendMessage(message);
  }

  async sendDiscountApplicationNotification(
    userName: string,
    topicName: string,
    email: string,
  ): Promise<boolean> {
    const message = `
<b>💰 New Discount Application</b>

<b>User:</b> ${userName}
<b>Topic:</b> ${topicName}
<b>Email:</b> ${email}

Please review in admin panel.
    `.trim();

    return await this.sendMessage(message);
  }

  async sendContactNotification(
    name: string,
    email: string,
    subject: string,
  ): Promise<boolean> {
    const message = `
<b>📨 New Contact Message</b>

<b>From:</b> ${name}
<b>Email:</b> ${email}
<b>Subject:</b> ${subject}

Please check admin panel for full message.
    `.trim();

    return await this.sendMessage(message);
  }

  async sendStudentDeletionRequest(
    studentName: string,
    studentId: string,
    requestedBy: string,
  ): Promise<boolean> {
    const message = `
<b>🗑️ Student Deletion Request</b>

<b>Student:</b> ${studentName}
<b>ID:</b> ${studentId}
<b>Requested by:</b> ${requestedBy}

Super Admin approval required in admin panel.
    `.trim();

    return await this.sendMessage(message);
  }
}
