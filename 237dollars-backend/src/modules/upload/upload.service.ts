import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as crypto from 'crypto';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'images');

  constructor() {
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }

  saveImage(file: Express.Multer.File) {
    // Generate URL for the uploaded file
    // In production, this would be an S3 URL
    const imageUrl = `/uploads/images/${file.filename}`;

    return {
      url: imageUrl,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  async saveImageFromBuffer(buffer: Buffer, mimetype: string, originalName?: string) {
    await this.ensureUploadDir();

    // Generate unique filename
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = this.getExtensionFromMimetype(mimetype) || this.getExtensionFromFilename(originalName);
    const filename = `${hash}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    // Write file to disk
    await writeFile(filepath, buffer);

    // Generate URL
    const imageUrl = `/uploads/images/${filename}`;

    return {
      url: imageUrl,
      filename,
      originalName: originalName || filename,
      mimetype,
      size: buffer.length,
    };
  }

  private getExtensionFromMimetype(mimetype: string): string {
    const mimetypeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/bmp': '.bmp',
      'image/tiff': '.tiff',
      'image/x-icon': '.ico',
    };
    return mimetypeMap[mimetype] || '.jpg';
  }

  private getExtensionFromFilename(filename?: string): string {
    if (!filename) return '.jpg';
    const ext = path.extname(filename);
    return ext || '.jpg';
  }
}
