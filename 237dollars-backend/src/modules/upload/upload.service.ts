import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
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
}
