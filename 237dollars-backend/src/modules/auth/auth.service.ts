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
import { EmailVerificationService } from '../../common/utils/email-verification.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetVerifyDto } from './dto/password-reset-verify.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
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
    private emailVerificationService: EmailVerificationService,
  ) {}

  /**
   * Register new user with email verification
   */
  async register(registerDto: RegisterDto) {
    const { email, password, username, firstName, lastName, telegramUsername, telegramPhone } = registerDto;

    // Check if email exists
    const existingEmail = await this.userRepository.findOne({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if username exists
    const existingUsername = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Validate password strength
    if (!this.passwordService.validatePasswordStrength(password)) {
      throw new BadRequestException(ErrorMessages.WEAK_PASSWORD);
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(password);

    // Normalize telegram username (remove @ if present)
    const normalizedTelegramUsername = telegramUsername?.startsWith('@')
      ? telegramUsername.substring(1)
      : telegramUsername;

    // Create user (not active until email verified)
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      username,
      firstName,
      lastName,
      telegramUsername: normalizedTelegramUsername,
      telegramPhone,
      emailVerified: false,
      isActive: false, // Account not active until email verified
    });

    await this.userRepository.save(user);

    // Send verification email
    await this.emailVerificationService.sendVerificationEmail(email);

    return {
      message: 'Registration successful! Please check your email for verification code',
      email: user.email,
      username: user.username,
    };
  }

  /**
   * Verify email with code
   */
  async verifyEmail(dto: VerifyEmailDto) {
    await this.emailVerificationService.verifyEmail(dto.email, dto.code);

    const user = await this.userRepository.findOne({ where: { email: dto.email } });

    // Generate tokens after verification
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      message: 'Email verified successfully! You can now login',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Resend verification code
   */
  async resendVerification(dto: ResendVerificationDto) {
    await this.emailVerificationService.sendVerificationEmail(dto.email);

    return {
      message: 'Verification code sent! Please check your email',
    };
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(username: string) {
    if (!username || username.length < 3) {
      return { available: false, message: 'Username must be at least 3 characters' };
    }

    const existing = await this.userRepository.findOne({
      where: { username },
      select: ['id'],
    });

    return {
      available: !existing,
      message: existing ? 'Username already taken' : 'Username available',
    };
  }

  /**
   * Check email availability
   */
  async checkEmailAvailability(email: string) {
    if (!email || !email.includes('@')) {
      return { available: false, message: 'Invalid email format' };
    }

    const existing = await this.userRepository.findOne({
      where: { email },
      select: ['id'],
    });

    return {
      available: !existing,
      message: existing ? 'Email already registered' : 'Email available',
    };
  }

  /**
   * Login with username or email
   */
  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;

    // Try to find user by email or username
    const user = await this.findUserByIdentifier(identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is not active');
    }

    // Validate password
    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        language: user.language,
        darkMode: user.darkMode,
      },
      ...tokens,
    };
  }

  /**
   * Validate user credentials (for Passport LocalStrategy)
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return null;
    }

    const isPasswordValid = await this.passwordService.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Find user by email or username
   */
  private async findUserByIdentifier(identifier: string): Promise<User | null> {
    // Check if identifier is an email (contains @)
    const isEmail = identifier.includes('@');

    if (isEmail) {
      return await this.userRepository.findOne({
        where: { email: identifier },
      });
    } else {
      return await this.userRepository.findOne({
        where: { username: identifier },
      });
    }
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

      if (!user || !user.isActive || !user.emailVerified) {
        throw new UnauthorizedException(ErrorMessages.USER_NOT_FOUND);
      }

      const tokens = await this.generateTokens(user.id, user.role);
      return tokens;
    } catch (error) {
      throw new UnauthorizedException(ErrorMessages.INVALID_TOKEN);
    }
  }

  /**
   * Request password reset (supports username or email)
   */
  async passwordResetRequest(dto: PasswordResetRequestDto) {
    const { identifier } = dto;

    // Try to find user by email or username
    const user = await this.findUserByIdentifier(identifier);

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If user exists, reset code will be sent' };
    }

    // Generate 6-digit code
    const code = this.passwordService.generateResetCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Store code temporarily (using email as key since it's unique)
    this.resetCodes.set(user.email, { code, expiresAt });

    // Send email
    await this.emailService.sendPasswordResetEmail(user.email, code);

    // Clean up expired codes
    this.cleanupExpiredCodes();

    return { message: 'If user exists, reset code will be sent' };
  }

  async passwordResetVerify(dto: PasswordResetVerifyDto) {
    const { identifier, code, newPassword } = dto;

    // Find user by identifier first to get their email
    const user = await this.findUserByIdentifier(identifier);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Now use email to look up reset code (since resetCodes map uses email as key)
    const storedData = this.resetCodes.get(user.email);

    if (!storedData) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (storedData.code !== code) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (new Date() > storedData.expiresAt) {
      this.resetCodes.delete(user.email);
      throw new BadRequestException('Reset code expired');
    }

    // Validate new password
    if (!this.passwordService.validatePasswordStrength(newPassword)) {
      throw new BadRequestException(ErrorMessages.WEAK_PASSWORD);
    }

    const hashedPassword = await this.passwordService.hashPassword(newPassword);
    user.password = hashedPassword;

    // If user can verify password reset via email, their email is verified
    user.emailVerified = true;
    user.isActive = true;

    await this.userRepository.save(user);

    // Delete used code
    this.resetCodes.delete(user.email);

    return { message: 'Password reset successful' };
  }

  async googleLogin(googleUser: any) {
    const { googleId, email, firstName, lastName, picture } = googleUser;

    // Check if user exists by Google ID
    let user = await this.userRepository.findOne({
      where: { googleId },
    });

    // If not found by Google ID, check by email
    if (!user) {
      user = await this.userRepository.findOne({
        where: { email },
      });

      // If user exists with email but no Google ID, link Google account
      if (user) {
        user.googleId = googleId;
        user.profilePicture = picture;
        user.emailVerified = true; // Google already verified the email
        user.isActive = true;
        await this.userRepository.save(user);
      }
    }

    // If user doesn't exist at all, create new user
    if (!user) {
      // Generate username from email
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      let username = baseUsername;
      let counter = 1;

      // Ensure username is unique
      while (await this.userRepository.findOne({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = this.userRepository.create({
        email,
        googleId,
        username,
        firstName,
        lastName,
        profilePicture: picture,
        isActive: true,
        emailVerified: true, // Google users are already verified
        password: null, // Google users don't have a password
      });

      await this.userRepository.save(user);
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
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        language: user.language,
        darkMode: user.darkMode,
      },
      ...tokens,
    };
  }

  async generateTokens(userId: number, role: string) {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_REFRESH_SECRET ||
        '237dollars-refresh-secret-key-development-only',
      expiresIn: '30d', // 30 days for refresh token
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
