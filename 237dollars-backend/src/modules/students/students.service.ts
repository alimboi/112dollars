import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Student } from '../../database/entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { MatchStudentDto } from './dto/match-student.dto';
import { AwsS3Service } from '../../common/utils/aws-s3.service';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private awsS3Service: AwsS3Service,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    const student = this.studentRepository.create(createStudentDto);
    return await this.studentRepository.save(student);
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const query = this.studentRepository.createQueryBuilder('student');

    if (filters?.courseName) {
      query.andWhere('student.courseName = :courseName', { courseName: filters.courseName });
    }

    if (filters?.realTestPassed !== undefined) {
      query.andWhere('student.realTestPassed = :realTestPassed', { realTestPassed: filters.realTestPassed });
    }

    if (filters?.search) {
      query.andWhere(
        '(student.fullName LIKE :search OR student.email LIKE :search OR student.studentId LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const [students, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('student.createdAt', 'DESC')
      .getManyAndCount();

    return {
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['user', 'enrollments'],
    });

    if (!student) {
      throw new NotFoundException(ErrorMessages.STUDENT_NOT_FOUND);
    }

    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    const student = await this.findOne(id);
    Object.assign(student, updateStudentDto);
    return await this.studentRepository.save(student);
  }

  async remove(id: number) {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student);
    return { message: 'Student deleted successfully' };
  }

  async uploadPicture(id: number, file: Express.Multer.File, type: 'student' | 'idCard') {
    const student = await this.findOne(id);

    // Validate file
    if (!this.awsS3Service.validateFileType(file.mimetype)) {
      throw new BadRequestException(ErrorMessages.INVALID_FILE_FORMAT);
    }

    if (!this.awsS3Service.validateFileSize(file.size, 2)) {
      throw new BadRequestException(ErrorMessages.FILE_TOO_LARGE);
    }

    // Upload to S3
    const { url, key } = await this.awsS3Service.uploadFile(file, 'students');

    // Update student record
    if (type === 'student') {
      student.studentPictureUrl = url;
    } else {
      student.idCardPictureUrl = url;
    }

    await this.studentRepository.save(student);

    return { url };
  }

  async matchStudent(matchDto: MatchStudentDto) {
    const { name, email, phone, studentId } = matchDto;

    // Find all students
    const students = await this.studentRepository.find();

    // Fuzzy match logic: check if 3 out of 4 fields match
    for (const student of students) {
      let matchCount = 0;

      // Name fuzzy match (case insensitive, partial)
      if (student.fullName.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(student.fullName.toLowerCase())) {
        matchCount++;
      }

      // Email exact match
      if (student.email.toLowerCase() === email.toLowerCase()) {
        matchCount++;
      }

      // Phone exact match (remove spaces and dashes)
      const cleanPhone = phone.replace(/[\s-]/g, '');
      const cleanStudentPhone = student.phonePersonal.replace(/[\s-]/g, '');
      if (cleanStudentPhone === cleanPhone) {
        matchCount++;
      }

      // Student ID exact match
      if (studentId && student.studentId && student.studentId === studentId) {
        matchCount++;
      }

      // If 3 or more fields match, return success
      if (matchCount >= 3) {
        return {
          match: true,
          student: {
            id: student.id,
            fullName: student.fullName,
            email: student.email,
            courseName: student.courseName,
          },
        };
      }
    }

    return { match: false };
  }

  async markRealTestPassed(id: number, topicId: number) {
    const student = await this.findOne(id);
    student.realTestPassed = true;
    await this.studentRepository.save(student);
    return { message: 'Student marked as real test passed' };
  }
}
