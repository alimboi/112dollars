import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student } from '../../database/entities/student.entity';
import { AwsS3Service } from '../../common/utils/aws-s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Student])],
  controllers: [StudentsController],
  providers: [StudentsService, AwsS3Service],
  exports: [StudentsService],
})
export class StudentsModule {}
