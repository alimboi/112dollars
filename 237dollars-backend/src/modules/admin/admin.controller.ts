import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { MarkTestPassedDto } from './dto/mark-test-passed.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../types/user-role.enum';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Roles(UserRole.SUPER_ADMIN)
  @Post('create-admin')
  createAdmin(@Request() req, @Body() createAdminDto: CreateAdminDto) {
    return this.adminService.createAdmin(req.user.userId, createAdminDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('activity-logs')
  getActivityLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getActivityLogs(+page, +limit);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Post('mark-real-test-passed')
  markRealTestPassed(@Request() req, @Body() markTestDto: MarkTestPassedDto) {
    return this.adminService.markRealTestPassed(req.user.userId, markTestDto);
  }
}
