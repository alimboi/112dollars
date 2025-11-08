import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { PasswordService } from '../../common/utils/password.service';
import { EmailService } from '../../common/utils/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetVerifyDto } from './dto/password-reset-verify.dto';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class AuthService {
  private resetCodes = new Map<
    string,
    { code: string; expiresAt: Date }
  >();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(ErrorMessages.EMAIL_ALREADY_EXISTS);
    }

    // Validate password strength
    if (!this.passwordService.validatePasswordStrength(password)) {
      throw new BadRequestException(ErrorMessages.WEAK_PASSWORD);
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(password);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        language: user.language,
        darkMode: user.darkMode,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS);
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        language: user.language,
        darkMode: user.darkMode,
      },
      ...tokens,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          '237dollars-refresh-secret-key-development-only',
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException(ErrorMessages.USER_NOT_FOUND);
      }

      const tokens = await this.generateTokens(user.id, user.role);
      return tokens;
    } catch (error) {
      throw new UnauthorizedException(ErrorMessages.INVALID_TOKEN);
    }
  }

  async passwordResetRequest(dto: PasswordResetRequestDto) {
    const { email } = dto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If user exists, reset code will be sent' };
    }

    // Generate 6-digit code
    const code = this.passwordService.generateResetCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    // Store code temporarily
    this.resetCodes.set(email, { code, expiresAt });

    // Send email
    await this.emailService.sendPasswordResetEmail(email, code);

    // Clean up expired codes (simple cleanup)
    this.cleanupExpiredCodes();

    return { message: 'If user exists, reset code will be sent' };
  }

  async passwordResetVerify(dto: PasswordResetVerifyDto) {
    const { email, code, newPassword } = dto;

    const storedData = this.resetCodes.get(email);

    if (!storedData) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (storedData.code !== code) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (new Date() > storedData.expiresAt) {
      this.resetCodes.delete(email);
      throw new BadRequestException('Reset code expired');
    }

    // Validate new password
    if (!this.passwordService.validatePasswordStrength(newPassword)) {
      throw new BadRequestException(ErrorMessages.WEAK_PASSWORD);
    }

    // Find user and update password
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException(ErrorMessages.USER_NOT_FOUND);
    }

    const hashedPassword = await this.passwordService.hashPassword(newPassword);
    user.password = hashedPassword;
    await this.userRepository.save(user);

    // Delete used code
    this.resetCodes.delete(email);

    return { message: 'Password reset successful' };
  }

  async generateTokens(userId: number, role: string) {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_REFRESH_SECRET ||
        '237dollars-refresh-secret-key-development-only',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private cleanupExpiredCodes() {
    const now = new Date();
    for (const [email, data] of this.resetCodes.entries()) {
      if (now > data.expiresAt) {
        this.resetCodes.delete(email);
      }
    }
  }
}
