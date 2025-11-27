import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  console.log('[DEBUG] Starting NestFactory.create...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  console.log('[DEBUG] NestFactory.create completed');

  // Global prefix
  app.setGlobalPrefix('api');
  console.log('[DEBUG] Global prefix set');

  // Serve static files (uploaded images)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  console.log('[DEBUG] Static assets configured');

  // Increase payload size limit for image uploads (50MB)
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  console.log('[DEBUG] Body parser configured');

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4200'],
    credentials: true,
  });
  console.log('[DEBUG] CORS enabled');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  console.log('[DEBUG] Validation pipe configured');

  const port = process.env.PORT || 3000;
  console.log(`[DEBUG] About to listen on port ${port}...`);
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}

bootstrap();
