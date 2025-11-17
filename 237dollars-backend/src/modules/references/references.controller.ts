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
import { ReferencesService } from './references.service';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';
import { ReorderReferencesDto } from './dto/reorder-references.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../types/user-role.enum';

@Controller('references')
export class ReferencesController {
  constructor(private referencesService: ReferencesService) {}

  // Majors
  @Public()
  @Get('majors')
  getAllMajors() {
    return this.referencesService.getAllMajors();
  }

  // Topics
  @Public()
  @Get('majors/:majorId/topics')
  getTopicsByMajor(@Param('majorId') majorId: string) {
    return this.referencesService.getTopicsByMajor(+majorId);
  }

  // Admin - Get all references
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Get('admin/all')
  getAllReferences(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('published') published?: string,
    @Query('majorId') majorId?: string,
    @Query('topicId') topicId?: string,
  ) {
    const publishedFilter = published === 'true' ? true : published === 'false' ? false : undefined;
    const majorIdFilter = majorId ? +majorId : undefined;
    const topicIdFilter = topicId ? +topicId : undefined;
    return this.referencesService.findAll(+page, +limit, publishedFilter, majorIdFilter, topicIdFilter);
  }

  // References
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Post()
  create(@Body() createReferenceDto: CreateReferenceDto, @Request() req) {
    return this.referencesService.create(createReferenceDto, req.user.userId);
  }

  @Public()
  @Get('topics/:topicId')
  findByTopic(
    @Param('topicId') topicId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.referencesService.findByTopic(+topicId, +page, +limit);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('reorder')
  updateReferenceOrder(@Body() dto: ReorderReferencesDto) {
    return this.referencesService.updateOrder(dto.references);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId;
    return this.referencesService.findOne(+id, userId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateReferenceDto: UpdateReferenceDto) {
    return this.referencesService.update(+id, updateReferenceDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put(':id/publish')
  publish(@Param('id') id: string) {
    return this.referencesService.publish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.referencesService.unpublish(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.referencesService.remove(+id);
  }

  // Content Blocks
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Post(':id/content-blocks')
  addContentBlock(@Param('id') id: string, @Body() blockData: any) {
    return this.referencesService.addContentBlock(+id, blockData);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put('content-blocks/:blockId')
  updateContentBlock(@Param('blockId') blockId: string, @Body() blockData: any) {
    return this.referencesService.updateContentBlock(+blockId, blockData);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Delete('content-blocks/:blockId')
  deleteContentBlock(@Param('blockId') blockId: string) {
    return this.referencesService.deleteContentBlock(+blockId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MANAGER)
  @Put(':id/reorder-blocks')
  reorderContentBlocks(@Param('id') id: string, @Body() body: { newOrder: number[] }) {
    return this.referencesService.reorderContentBlocks(+id, body.newOrder);
  }
}
