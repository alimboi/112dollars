import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogImageService } from './blog-image.service';
import { BlogGalleryService } from './blog-gallery.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { CreateBlogImageDto } from './dto/create-blog-image.dto';
import { UpdateBlogImageDto } from './dto/update-blog-image.dto';
import { CreateBlogGalleryDto } from './dto/create-blog-gallery.dto';
import { UpdateBlogGalleryDto } from './dto/update-blog-gallery.dto';
import { ReorderGalleriesDto } from './dto/reorder-galleries.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../types/user-role.enum';

@Controller('blog')
export class BlogController {
  constructor(
    private blogService: BlogService,
    private blogImageService: BlogImageService,
    private blogGalleryService: BlogGalleryService,
  ) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Post('posts')
  create(@Body() createBlogPostDto: CreateBlogPostDto, @Request() req) {
    return this.blogService.create(createBlogPostDto, req.user.sub);
  }

  @Public()
  @Get('posts')
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('published') published?: string,
  ) {
    const isPublished = published === 'true' ? true : published === 'false' ? false : undefined;
    return this.blogService.findAll(+page, +limit, isPublished);
  }

  @Public()
  @Get('posts/:id')
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('posts/:id')
  update(@Param('id') id: string, @Body() updateBlogPostDto: UpdateBlogPostDto) {
    return this.blogService.update(+id, updateBlogPostDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('posts/:id/publish')
  publish(@Param('id') id: string) {
    return this.blogService.publish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('posts/:id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.blogService.unpublish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Delete('posts/:id')
  remove(@Param('id') id: string) {
    return this.blogService.remove(+id);
  }

  // Blog Images
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Post('images')
  createImage(@Body() createBlogImageDto: CreateBlogImageDto, @Request() req) {
    return this.blogImageService.create(createBlogImageDto, req.user.sub);
  }

  @Public()
  @Get('images')
  findAllImages(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query('published') published?: string,
  ) {
    const isPublished = published === 'true' ? true : published === 'false' ? false : undefined;
    return this.blogImageService.findAll(+page, +limit, isPublished);
  }

  @Public()
  @Get('images/:id')
  findOneImage(@Param('id') id: string) {
    return this.blogImageService.findOne(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('images/:id')
  updateImage(@Param('id') id: string, @Body() updateBlogImageDto: UpdateBlogImageDto) {
    return this.blogImageService.update(+id, updateBlogImageDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('images/:id/publish')
  publishImage(@Param('id') id: string) {
    return this.blogImageService.publish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('images/:id/unpublish')
  unpublishImage(@Param('id') id: string) {
    return this.blogImageService.unpublish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Delete('images/:id')
  removeImage(@Param('id') id: string) {
    return this.blogImageService.remove(+id);
  }

  // Blog Image Galleries (Multiple images per gallery)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Post('galleries')
  createGallery(@Body() createGalleryDto: CreateBlogGalleryDto, @Request() req) {
    return this.blogGalleryService.create(createGalleryDto, req.user.sub);
  }

  @Public()
  @Get('galleries')
  findAllGalleries(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query('published') published?: string,
  ) {
    const isPublished = published === 'true' ? true : published === 'false' ? false : undefined;
    return this.blogGalleryService.findAll(+page, +limit, isPublished);
  }

  @Public()
  @Get('galleries/:id')
  findOneGallery(@Param('id') id: string) {
    return this.blogGalleryService.findOne(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('galleries/reorder')
  updateGalleryOrder(@Body() dto: ReorderGalleriesDto) {
    return this.blogGalleryService.updateOrder(dto.galleries);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('galleries/:id')
  updateGallery(@Param('id') id: string, @Body() updateGalleryDto: UpdateBlogGalleryDto) {
    return this.blogGalleryService.update(+id, updateGalleryDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('galleries/:id/publish')
  publishGallery(@Param('id') id: string) {
    return this.blogGalleryService.publish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('galleries/:id/unpublish')
  unpublishGallery(@Param('id') id: string) {
    return this.blogGalleryService.unpublish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Delete('galleries/:id')
  removeGallery(@Param('id') id: string) {
    return this.blogGalleryService.remove(+id);
  }
}
