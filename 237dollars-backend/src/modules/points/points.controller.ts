import { Controller, Get, Param, Request } from '@nestjs/common';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
  constructor(private pointsService: PointsService) {}

  @Get('user')
  getUserPoints(@Request() req) {
    return this.pointsService.getUserPoints(req.user.userId);
  }

  @Get('user/total')
  getTotalPoints(@Request() req) {
    return this.pointsService.getTotalPoints(req.user.userId);
  }

  @Get('user/breakdown')
  getPointsBreakdown(@Request() req) {
    return this.pointsService.getPointsBreakdown(req.user.userId);
  }
}
