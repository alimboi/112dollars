import * as fs from 'fs';
import * as path from 'path';

export class EmailTemplateUtil {
  private static readonly TEMPLATE_PATH = path.join(
    __dirname,
    '../templates/email',
  );

  /**
   * Load and populate an email template with provided variables
   */
  static renderTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): string {
    // Load base template
    const basePath = path.join(this.TEMPLATE_PATH, 'base.template.html');
    let baseTemplate = fs.readFileSync(basePath, 'utf-8');

    // Load content template
    const contentPath = path.join(this.TEMPLATE_PATH, `${templateName}.html`);
    let contentTemplate = fs.readFileSync(contentPath, 'utf-8');

    // Replace variables in content template
    contentTemplate = this.replaceVariables(contentTemplate, variables);

    // Insert content into base template
    baseTemplate = baseTemplate.replace('{{content}}', contentTemplate);

    // Replace any remaining base variables
    baseTemplate = this.replaceVariables(baseTemplate, variables);

    return baseTemplate;
  }

  /**
   * Replace template variables with actual values
   */
  private static replaceVariables(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }

    return result;
  }

  /**
   * Generate welcome email
   */
  static generateWelcomeEmail(data: {
    userName: string;
    userEmail: string;
    registrationDate: string;
    dashboardUrl: string;
  }): string {
    return this.renderTemplate('welcome', {
      title: 'Welcome to 237DOLLARS',
      userName: data.userName,
      userEmail: data.userEmail,
      registrationDate: data.registrationDate,
      dashboardUrl: data.dashboardUrl,
    });
  }

  /**
   * Generate password reset email
   */
  static generatePasswordResetEmail(data: {
    userName: string;
    resetCode: string;
    resetUrl: string;
  }): string {
    return this.renderTemplate('password-reset', {
      title: 'Password Reset Request',
      userName: data.userName,
      resetCode: data.resetCode,
      resetUrl: data.resetUrl,
    });
  }

  /**
   * Generate enrollment approved email
   */
  static generateEnrollmentApprovedEmail(data: {
    studentName: string;
    majorName: string;
    applicationDate: string;
    approvalDate: string;
    dashboardUrl: string;
  }): string {
    return this.renderTemplate('enrollment-approved', {
      title: 'Enrollment Approved',
      studentName: data.studentName,
      majorName: data.majorName,
      applicationDate: data.applicationDate,
      approvalDate: data.approvalDate,
      dashboardUrl: data.dashboardUrl,
    });
  }

  /**
   * Generate discount code email
   */
  static generateDiscountCodeEmail(data: {
    studentName: string;
    discountCode: string;
    discountPercentage: string;
    generatedDate: string;
    dashboardUrl: string;
  }): string {
    return this.renderTemplate('discount-generated', {
      title: 'Your Discount Code is Ready',
      studentName: data.studentName,
      discountCode: data.discountCode,
      discountPercentage: data.discountPercentage,
      generatedDate: data.generatedDate,
      dashboardUrl: data.dashboardUrl,
    });
  }
}
