import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);

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

  async saveImage(file: Express.Multer.File) {
    // SECURITY: Verify magic bytes to prevent file type spoofing
    await this.verifyImageMagicBytes(file.path);

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

  /**
   * Verify file is actually an image by checking magic bytes
   * Prevents uploading malicious files disguised as images
   */
  private async verifyImageMagicBytes(filePath: string) {
    const buffer = await readFile(filePath);
    const fileType = await fileTypeFromBuffer(buffer);

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!fileType || !ALLOWED_TYPES.includes(fileType.mime)) {
      // Delete the invalid file
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
      throw new BadRequestException(
        `Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed. Detected: ${fileType?.mime || 'unknown'}`
      );
    }
  }

  async saveImageFromBuffer(buffer: Buffer, mimetype: string, originalName?: string) {
    await this.ensureUploadDir();

    // SECURITY: Verify magic bytes before saving
    const fileType = await fileTypeFromBuffer(buffer);
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!fileType || !ALLOWED_TYPES.includes(fileType.mime)) {
      throw new BadRequestException(
        `Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed. Detected: ${fileType?.mime || 'unknown'}`
      );
    }

    // Generate unique filename using cryptographically secure random bytes
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = this.getExtensionFromMimetype(fileType.mime);
    const filename = `${hash}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    // Check if file already exists (prevent overwrite)
    if (fs.existsSync(filepath)) {
      // Regenerate filename if collision occurs
      const newHash = crypto.randomBytes(20).toString('hex');
      const newFilename = `${newHash}${ext}`;
      const newFilepath = path.join(this.uploadDir, newFilename);
      await writeFile(newFilepath, buffer);

      const imageUrl = `/uploads/images/${newFilename}`;
      return {
        url: imageUrl,
        filename: newFilename,
        originalName: originalName || newFilename,
        mimetype: fileType.mime,
        size: buffer.length,
      };
    }

    // Write file to disk
    await writeFile(filepath, buffer);

    // Generate URL
    const imageUrl = `/uploads/images/${filename}`;

    return {
      url: imageUrl,
      filename,
      originalName: originalName || filename,
      mimetype: fileType.mime,
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
