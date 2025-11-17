import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { AdminActivityLog } from '../../database/entities/admin-activity-log.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { MarkTestPassedDto } from './dto/mark-test-passed.dto';
import { PasswordService } from '../../common/utils/password.service';
import { UserRole } from '../../types/user-role.enum';
import { ActivityType } from '../../types/activity-type.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AdminActivityLog)
    private activityLogRepository: Repository<AdminActivityLog>,
    private passwordService: PasswordService,
  ) {}

  async createAdmin(
    superAdminId: number,
    createAdminDto: CreateAdminDto,
  ): Promise<User> {
    // Check if super admin
    const superAdmin = await this.userRepository.findOne({
      where: { id: superAdminId },
    });

    if (!superAdmin || superAdmin.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can create admin users');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createAdminDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Validate role (only admin roles)
    const allowedRoles = [
      UserRole.ADMIN,
      UserRole.STUDENT_MANAGER,
      UserRole.CONTENT_MANAGER,
    ];

    if (!allowedRoles.includes(createAdminDto.role)) {
      throw new BadRequestException('Invalid admin role');
    }

    // Validate password
    if (!this.passwordService.validatePasswordStrength(createAdminDto.password)) {
      throw new BadRequestException(
        'Password must be at least 8 characters with uppercase, lowercase, and number',
      );
    }

    const hashedPassword = await this.passwordService.hashPassword(
      createAdminDto.password,
    );

    const admin = this.userRepository.create({
      email: createAdminDto.email,
      password: hashedPassword,
      role: createAdminDto.role,
      isActive: true,
      emailVerified: true, // Skip email verification for admin accounts
    });

    const saved = await this.userRepository.save(admin);

    // Log activity
    await this.logActivity(
      superAdminId,
      ActivityType.ADMIN_CREATED,
      `Created new admin: ${createAdminDto.email} with role ${createAdminDto.role}`,
    );

    return saved;
  }

  async getActivityLogs(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ logs: AdminActivityLog[]; total: number }> {
    const [logs, total] = await this.activityLogRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['admin'],
    });

    return { logs, total };
  }

  async markRealTestPassed(
    adminId: number,
    markTestDto: MarkTestPassedDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: markTestDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.realTestPassed = true;
    const updated = await this.userRepository.save(user);

    // Log activity
    await this.logActivity(
      adminId,
      ActivityType.TEST_MARKED,
      `Marked real test as passed for user ID: ${markTestDto.userId}`,
    );

    return updated;
  }

  async logActivity(
    adminId: number,
    activityType: ActivityType,
    description: string,
  ): Promise<AdminActivityLog> {
    const log = this.activityLogRepository.create({
      adminId,
      action: activityType,
      description,
    });

    return await this.activityLogRepository.save(log);
  }

  /**
   * Get all admin users (Super Admin only)
   */
  async getAllAdmins(requestingUserId: number): Promise<User[]> {
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser || requestingUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can view all admins');
    }

    const adminRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.STUDENT_MANAGER,
      UserRole.CONTENT_MANAGER,
    ];

    const admins = await this.userRepository.find({
      where: adminRoles.map((role) => ({ role })),
      select: [
        'id',
        'email',
        'username',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'lastLogin',
      ],
      order: { createdAt: 'DESC' },
    });

    return admins;
  }

  /**
   * Get specific admin details
   */
  async getAdminById(
    requestingUserId: number,
    adminId: number,
  ): Promise<User> {
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser || requestingUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can view admin details');
    }

    const admin = await this.userRepository.findOne({
      where: { id: adminId },
      select: [
        'id',
        'email',
        'username',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'lastLogin',
        'emailVerified',
      ],
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  /**
   * Update admin role
   */
  async updateAdminRole(
    requestingUserId: number,
    adminId: number,
    newRole: UserRole,
  ): Promise<User> {
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser || requestingUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can update admin roles');
    }

    // Cannot update your own role
    if (requestingUserId === adminId) {
      throw new BadRequestException('Cannot update your own role');
    }

    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Validate role
    const allowedRoles = [
      UserRole.ADMIN,
      UserRole.STUDENT_MANAGER,
      UserRole.CONTENT_MANAGER,
    ];

    if (!allowedRoles.includes(newRole)) {
      throw new BadRequestException('Invalid admin role');
    }

    const oldRole = admin.role;
    admin.role = newRole;
    const updated = await this.userRepository.save(admin);

    // Log activity
    await this.logActivity(
      requestingUserId,
      ActivityType.UPDATE,
      `Updated admin ${admin.email} role from ${oldRole} to ${newRole}`,
    );

    return updated;
  }

  /**
   * Delete/Deactivate admin
   */
  async deleteAdmin(requestingUserId: number, adminId: number): Promise<void> {
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser || requestingUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can delete admins');
    }

    // Cannot delete yourself
    if (requestingUserId === adminId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Don't allow deleting other super admins
    if (admin.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot delete other super admins');
    }

    // Soft delete - deactivate instead of removing
    admin.isActive = false;
    await this.userRepository.save(admin);

    // Log activity
    await this.logActivity(
      requestingUserId,
      ActivityType.DELETE,
      `Deactivated admin: ${admin.email} (${admin.role})`,
    );
  }

  /**
   * Reactivate admin
   */
  async reactivateAdmin(
    requestingUserId: number,
    adminId: number,
  ): Promise<User> {
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser || requestingUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can reactivate admins');
    }

    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    admin.isActive = true;
    const updated = await this.userRepository.save(admin);

    // Log activity
    await this.logActivity(
      requestingUserId,
      ActivityType.UPDATE,
      `Reactivated admin: ${admin.email} (${admin.role})`,
    );

    return updated;
  }

  /**
   * Get admin statistics
   */
  async getAdminStats(requestingUserId: number) {
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser || requestingUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can view admin stats');
    }

    const totalAdmins = await this.userRepository.count({
      where: [
        { role: UserRole.SUPER_ADMIN },
        { role: UserRole.ADMIN },
        { role: UserRole.STUDENT_MANAGER },
        { role: UserRole.CONTENT_MANAGER },
      ],
    });

    const activeAdmins = await this.userRepository.count({
      where: [
        { role: UserRole.SUPER_ADMIN, isActive: true },
        { role: UserRole.ADMIN, isActive: true },
        { role: UserRole.STUDENT_MANAGER, isActive: true },
        { role: UserRole.CONTENT_MANAGER, isActive: true },
      ],
    });

    const studentManagers = await this.userRepository.count({
      where: { role: UserRole.STUDENT_MANAGER },
    });

    const contentManagers = await this.userRepository.count({
      where: { role: UserRole.CONTENT_MANAGER },
    });

    const recentActivities = await this.activityLogRepository.find({
      take: 10,
      order: { createdAt: 'DESC' },
      relations: ['admin'],
    });

    return {
      totalAdmins,
      activeAdmins,
      inactiveAdmins: totalAdmins - activeAdmins,
      studentManagers,
      contentManagers,
      recentActivities,
    };
  }
}
