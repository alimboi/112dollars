import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../types/user-role.enum';
import { ContactStatus } from '../../types/contact-status.enum';

@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Public()
  @Post('send')
  create(@Body() createContactMessageDto: CreateContactMessageDto) {
    return this.contactService.create(createContactMessageDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER, UserRole.CONTENT_MANAGER)
  @Get('messages')
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: ContactStatus,
  ) {
    return this.contactService.findAll(+page, +limit, status);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER, UserRole.CONTENT_MANAGER)
  @Get('messages/:id')
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER, UserRole.CONTENT_MANAGER)
  @Put('messages/:id/mark-read')
  markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER, UserRole.CONTENT_MANAGER)
  @Put('messages/:id/mark-responded')
  markAsResponded(@Param('id') id: string) {
    return this.contactService.markAsResponded(+id);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete('messages/:id')
  remove(@Param('id') id: string) {
    return this.contactService.remove(+id);
  }
}
