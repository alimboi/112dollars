import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { ValidateCodeDto } from './dto/validate-code.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../types/user-role.enum';

@Controller('discounts')
export class DiscountsController {
  constructor(private discountsService: DiscountsService) {}

  @Post('apply')
  applyForDiscount(@Request() req, @Body() applyDto: ApplyDiscountDto) {
    return this.discountsService.applyForDiscount(req.user.userId, applyDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Get('applications')
  getApplications(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.discountsService.getApplications(+page, +limit);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Put('applications/:id/approve')
  approveApplication(@Param('id') id: string) {
    return this.discountsService.approveApplication(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Put('applications/:id/reject')
  rejectApplication(@Param('id') id: string) {
    return this.discountsService.rejectApplication(+id);
  }

  @Post('validate-code')
  validateCode(@Body() validateDto: ValidateCodeDto) {
    return this.discountsService.validateCode(validateDto);
  }
}
