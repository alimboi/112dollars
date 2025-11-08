import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Student } from '../../database/entities/student.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EmailService } from '../../common/utils/email.service';
import { TelegramService } from '../../common/utils/telegram.service';
import { EnrollmentStatus } from '../../types/enrollment-status.enum';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private emailService: EmailService,
    private telegramService: TelegramService,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    // Create student record first
    const student = this.studentRepository.create({
      fullName: createEnrollmentDto.fullName,
      email: createEnrollmentDto.email,
      phonePersonal: createEnrollmentDto.phone,
      courseName: createEnrollmentDto.courseInterested,
    });
    const savedStudent = await this.studentRepository.save(student);

    // Create enrollment
    const enrollment = this.enrollmentRepository.create({
      studentId: savedStudent.id,
      courseName: createEnrollmentDto.courseInterested,
      status: EnrollmentStatus.PENDING,
    });
    const savedEnrollment = await this.enrollmentRepository.save(enrollment);

    // Send notifications
    await this.emailService.sendAdminNotification(
      'admin@237dollars.com',
      'New Enrollment Request',
      `New enrollment from ${createEnrollmentDto.fullName} for ${createEnrollmentDto.courseInterested}`,
    );

    await this.telegramService.sendEnrollmentNotification(
      createEnrollmentDto.fullName,
      createEnrollmentDto.courseInterested,
      createEnrollmentDto.email,
    );

    return savedEnrollment;
  }

  async findAll(page: number = 1, limit: number = 10, status?: EnrollmentStatus) {
    const query = this.enrollmentRepository.createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student');

    if (status) {
      query.where('enrollment.status = :status', { status });
    }

    const [enrollments, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('enrollment.createdAt', 'DESC')
      .getManyAndCount();

    return {
      enrollments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!enrollment) {
      throw new NotFoundException(ErrorMessages.ENROLLMENT_NOT_FOUND);
    }

    return enrollment;
  }

  async approve(id: number) {
    const enrollment = await this.findOne(id);
    enrollment.status = EnrollmentStatus.APPROVED;
    await this.enrollmentRepository.save(enrollment);

    // Send email to student
    await this.emailService.sendEnrollmentApprovalEmail(
      enrollment.student.email,
      enrollment.student.fullName,
    );

    return enrollment;
  }

  async reject(id: number, reason?: string) {
    const enrollment = await this.findOne(id);
    enrollment.status = EnrollmentStatus.REJECTED;
    await this.enrollmentRepository.save(enrollment);

    // Send email to student with reason
    await this.emailService.sendEmail(
      enrollment.student.email,
      'Enrollment Status',
      `<p>Your enrollment has been rejected. ${reason ? `Reason: ${reason}` : ''}</p>`,
    );

    return enrollment;
  }

  async markContractSigned(id: number) {
    const enrollment = await this.findOne(id);
    enrollment.contractSigned = true;
    await this.enrollmentRepository.save(enrollment);

    // Generate account creation link
    const link = `http://localhost:4200/auth/create-account?enrollment=${id}&email=${enrollment.student.email}`;

    await this.emailService.sendAccountCreationLink(enrollment.student.email, link);

    return enrollment;
  }

  async completeEnrollment(id: number, userId: number) {
    const enrollment = await this.findOne(id);
    enrollment.accountCreated = true;

    // Link student to user
    const student = enrollment.student;
    student.userId = userId;
    await this.studentRepository.save(student);
    await this.enrollmentRepository.save(enrollment);

    return enrollment;
  }
}
