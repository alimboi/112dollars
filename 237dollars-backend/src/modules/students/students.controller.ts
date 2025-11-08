import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { MatchStudentDto } from './dto/match-student.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../types/user-role.enum';

@Controller('students')
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query() filters: any,
  ) {
    return this.studentsService.findAll(+page, +limit, filters);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(+id, updateStudentDto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(+id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Post(':id/upload-picture')
  @UseInterceptors(FileInterceptor('file'))
  uploadStudentPicture(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.uploadPicture(+id, file, 'student');
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Post(':id/upload-id-card')
  @UseInterceptors(FileInterceptor('file'))
  uploadIdCard(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.uploadPicture(+id, file, 'idCard');
  }

  @Public()
  @Post('match')
  matchStudent(@Body() matchStudentDto: MatchStudentDto) {
    return this.studentsService.matchStudent(matchStudentDto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.STUDENT_MANAGER)
  @Post(':id/mark-test-passed')
  markRealTestPassed(
    @Param('id') id: string,
    @Body() body: { topicId: number },
  ) {
    return this.studentsService.markRealTestPassed(+id, body.topicId);
  }
}
