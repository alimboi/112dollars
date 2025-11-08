import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsS3Service {
  private s3: AWS.S3;
  private bucketName: string;
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const region = this.configService.get<string>('AWS_S3_REGION');

    if (accessKeyId && secretAccessKey && this.bucketName && region) {
      AWS.config.update({
        accessKeyId,
        secretAccessKey,
        region,
      });

      this.s3 = new AWS.S3();
      this.isConfigured = true;
      console.log('✅ AWS S3 configured');
    } else {
      console.warn(
        '⚠️  AWS S3 not configured. Set credentials in .env to enable file uploads.',
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<{ url: string; key: string }> {
    if (!this.isConfigured) {
      throw new Error('AWS S3 is not configured');
    }

    const key = `${folder}/${Date.now()}-${file.originalname}`;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    try {
      const result = await this.s3.upload(params).promise();
      return {
        url: result.Location,
        key: result.Key,
      };
    } catch (error) {
      console.error('AWS S3 Upload Error:', error);
      throw new Error('File upload failed');
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: this.bucketName,
      Key: key,
    };

    try {
      await this.s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('AWS S3 Delete Error:', error);
      return false;
    }
  }

  getFileUrl(key: string): string {
    if (!this.isConfigured) {
      return '';
    }

    const region = this.configService.get<string>('AWS_S3_REGION');
    return `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;
  }

  validateFileType(mimetype: string): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    return allowedTypes.includes(mimetype);
  }

  validateFileSize(size: number, maxSizeMB: number = 2): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }
}
