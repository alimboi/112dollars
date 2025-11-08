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
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../types/user-role.enum';

@Controller('blog')
export class BlogController {
  constructor(private blogService: BlogService) {}

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
}
