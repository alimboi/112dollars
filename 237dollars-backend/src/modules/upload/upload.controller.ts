import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../types/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadService.saveImage(file);
  }

  /**
   * Serve uploaded files with authentication
   * Requires valid JWT token
   */
  @UseGuards(JwtAuthGuard)
  @Get('file/images/:filename')
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    // Prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Invalid filename');
    }

    const filePath = join(process.cwd(), 'uploads', 'images', filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    // Set appropriate content type and cache headers
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };

    res.setHeader('Content-Type', contentTypes[ext || ''] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=31536000'); // 1 year cache for authenticated users

    return res.sendFile(filePath);
  }
}
