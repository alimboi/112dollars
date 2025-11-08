import { Controller, Get, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../types/user-role.enum';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('dashboard')
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT_MANAGER)
  @Get('students')
  getStudentAnalytics() {
    return this.analyticsService.getStudentAnalytics();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Get('content')
  getContentAnalytics() {
    return this.analyticsService.getContentAnalytics();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post('export')
  exportData(@Query('type') type: string) {
    return this.analyticsService.exportData(type);
  }
}
