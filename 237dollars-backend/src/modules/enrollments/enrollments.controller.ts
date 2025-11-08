import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../types/user-role.enum';
import { EnrollmentStatus } from '../../types/enrollment-status.enum';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Public()
  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: EnrollmentStatus,
  ) {
    return this.enrollmentsService.findAll(+page, +limit, status);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Put(':id/approve')
  approve(@Param('id') id: string) {
    return this.enrollmentsService.approve(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Put(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.enrollmentsService.reject(+id, body.reason);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Put(':id/contract-signed')
  markContractSigned(@Param('id') id: string) {
    return this.enrollmentsService.markContractSigned(+id);
  }

  @Public()
  @Put(':id/complete')
  completeEnrollment(@Param('id') id: string, @Body() body: { userId: number }) {
    return this.enrollmentsService.completeEnrollment(+id, body.userId);
  }
}
