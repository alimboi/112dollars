import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../types/user-role.enum';

@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Post()
  create(@Body() body: any) {
    return this.quizzesService.create(body.referenceId, body);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.CONTENT_MANAGER)
  @Post(':id/questions')
  addQuestion(@Param('id') id: string, @Body() questionData: any) {
    return this.quizzesService.addQuestion(+id, questionData);
  }

  @Public()
  @Get('reference/:referenceId')
  getQuiz(@Param('referenceId') referenceId: string) {
    return this.quizzesService.getQuiz(+referenceId);
  }

  @Post(':id/submit')
  submitQuiz(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.quizzesService.submitQuiz(req.user.userId, +id, body.answers, body.timeTaken);
  }
}
