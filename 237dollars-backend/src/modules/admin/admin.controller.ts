import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Param,
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

  /**
   * Create new admin (Super Admin only)
   */
  @Roles(UserRole.SUPER_ADMIN)
  @Post('create-admin')
  createAdmin(@Request() req, @Body() createAdminDto: CreateAdminDto) {
    return this.adminService.createAdmin(req.user.userId, createAdminDto);
  }

  /**
   * Get all admins (Super Admin only)
   */
  @Roles(UserRole.SUPER_ADMIN)
  @Get('admins')
  getAllAdmins(@Request() req) {
    return this.adminService.getAllAdmins(req.user.userId);
  }

  /**
   * Get specific admin details (Super Admin only)
   */
  @Roles(UserRole.SUPER_ADMIN)
  @Get('admins/:id')
  getAdminById(@Request() req, @Param('id') id: string) {
    return this.adminService.getAdminById(req.user.userId, +id);
  }

  /**
   * Update admin role (Super Admin only)
   */
  @Roles(UserRole.SUPER_ADMIN)
  @Put('admins/:id/role')
  updateAdminRole(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { role: UserRole },
  ) {
    return this.adminService.updateAdminRole(req.user.userId, +id, body.role);
  }

  /**
   * Delete/Deactivate admin (Super Admin only)
   */
  @Roles(UserRole.SUPER_ADMIN)
  @Delete('admins/:id')
  deleteAdmin(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteAdmin(req.user.userId, +id);
  }

  /**
   * Reactivate admin (Super Admin only)
   */
  @Roles(UserRole.SUPER_ADMIN)
  @Put('admins/:id/reactivate')
  reactivateAdmin(@Request() req, @Param('id') id: string) {
    return this.adminService.reactivateAdmin(req.user.userId, +id);
  }

  /**
   * Get admin statistics (Super Admin only)
   */
  @Roles(UserRole.SUPER_ADMIN)
  @Get('stats')
  getAdminStats(@Request() req) {
    return this.adminService.getAdminStats(req.user.userId);
  }

  /**
   * Get activity logs
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('activity-logs')
  getActivityLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getActivityLogs(+page, +limit);
  }

  /**
   * Mark real test as passed
   */
  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Post('mark-real-test-passed')
  markRealTestPassed(@Request() req, @Body() markTestDto: MarkTestPassedDto) {
    return this.adminService.markRealTestPassed(req.user.userId, markTestDto);
  }
}
