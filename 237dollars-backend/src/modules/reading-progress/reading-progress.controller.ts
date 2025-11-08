import { Controller, Post, Put, Get, Body, Param, Request } from '@nestjs/common';
import { ReadingProgressService } from './reading-progress.service';

@Controller('reading-progress')
export class ReadingProgressController {
  constructor(private progressService: ReadingProgressService) {}

  @Post('start')
  startReading(@Body() body: { referenceId: number }, @Request() req) {
    return this.progressService.startReading(req.user.userId, body.referenceId);
  }

  @Put(':referenceId')
  updateProgress(
    @Param('referenceId') referenceId: string,
    @Body() body: { percentageRead: number; readingTime: number },
    @Request() req,
  ) {
    return this.progressService.updateProgress(
      req.user.userId,
      +referenceId,
      body.percentageRead,
      body.readingTime,
    );
  }

  @Post(':referenceId/complete')
  completeReading(@Param('referenceId') referenceId: string, @Request() req) {
    return this.progressService.completeReading(req.user.userId, +referenceId);
  }

  @Get('user')
  getUserProgress(@Request() req) {
    return this.progressService.getUserProgress(req.user.userId);
  }
}
