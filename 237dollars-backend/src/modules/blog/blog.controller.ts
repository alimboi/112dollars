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
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { CreateBlogImageDto } from './dto/create-blog-image.dto';
import { UpdateBlogImageDto } from './dto/update-blog-image.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../types/user-role.enum';

@Controller('blog')
export class BlogController {
  constructor(
    private blogService: BlogService,
    private blogImageService: BlogImageService,
  ) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Post('posts')
  create(@Body() createBlogPostDto: CreateBlogPostDto, @Request() req) {
    return this.blogService.create(createBlogPostDto, req.user.userId);
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

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Put('posts/:id')
  update(@Param('id') id: string, @Body() updateBlogPostDto: UpdateBlogPostDto) {
    return this.blogService.update(+id, updateBlogPostDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Put('posts/:id/publish')
  publish(@Param('id') id: string) {
    return this.blogService.publish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Put('posts/:id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.blogService.unpublish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Delete('posts/:id')
  remove(@Param('id') id: string) {
    return this.blogService.remove(+id);
  }

  // Blog Images
  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Post('images')
  createImage(@Body() createBlogImageDto: CreateBlogImageDto, @Request() req) {
    return this.blogImageService.create(createBlogImageDto, req.user.userId);
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

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Put('images/:id')
  updateImage(@Param('id') id: string, @Body() updateBlogImageDto: UpdateBlogImageDto) {
    return this.blogImageService.update(+id, updateBlogImageDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Put('images/:id/publish')
  publishImage(@Param('id') id: string) {
    return this.blogImageService.publish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Put('images/:id/unpublish')
  unpublishImage(@Param('id') id: string) {
    return this.blogImageService.unpublish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Delete('images/:id')
  removeImage(@Param('id') id: string) {
    return this.blogImageService.remove(+id);
  }
}
