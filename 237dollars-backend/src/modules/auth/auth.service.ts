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
  // SECURITY: Password reset codes moved to database (Fix #8)
  private readonly PASSWORD_RESET_CODE_LENGTH = 6;
  private readonly PASSWORD_RESET_EXPIRY_MINUTES = 10;
  private readonly MAX_PASSWORD_RESET_ATTEMPTS = 3;

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
        secret: process.env.JWT_REFRESH_SECRET,
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
   * SECURITY: Stores codes in database instead of memory (Fix #8)
   */
  async passwordResetRequest(dto: PasswordResetRequestDto) {
    const { identifier } = dto;

    // Try to find user by email or username
    const user = await this.findUserByIdentifier(identifier);

    if (!user) {
      // SECURITY: Don't reveal if user exists
      return { message: 'If user exists, reset code will be sent' };
    }

    // Generate 6-digit code
    const code = this.passwordService.generateResetCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.PASSWORD_RESET_EXPIRY_MINUTES);

    // SECURITY: Store code in database instead of memory (Fix #8)
    user.passwordResetCode = code;
    user.passwordResetExpiry = expiresAt;
    user.passwordResetAttempts = 0; // Reset attempts when new code is sent
    user.lastPasswordResetRequest = new Date();

    await this.userRepository.save(user);

    // Send email
    await this.emailService.sendPasswordResetEmail(user.email, code);

    return { message: 'If user exists, reset code will be sent' };
  }

  /**
   * Verify password reset code and update password
   * SECURITY: Reads codes from database instead of memory (Fix #8)
   */
  async passwordResetVerify(dto: PasswordResetVerifyDto) {
    const { identifier, code, newPassword } = dto;

    // Find user by identifier
    const user = await this.findUserByIdentifier(identifier);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // SECURITY: Check code from database instead of memory (Fix #8)
    if (!user.passwordResetCode || !user.passwordResetExpiry) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Check if code expired
    if (new Date() > user.passwordResetExpiry) {
      // Clean up expired code
      user.passwordResetCode = null;
      user.passwordResetExpiry = null;
      user.passwordResetAttempts = 0;
      await this.userRepository.save(user);
      throw new BadRequestException('Reset code expired');
    }

    // Check attempts to prevent brute force
    if (user.passwordResetAttempts >= this.MAX_PASSWORD_RESET_ATTEMPTS) {
      throw new BadRequestException(
        'Maximum reset attempts exceeded. Please request a new code',
      );
    }

    // Verify code
    if (user.passwordResetCode !== code) {
      user.passwordResetAttempts += 1;
      await this.userRepository.save(user);

      const remainingAttempts = this.MAX_PASSWORD_RESET_ATTEMPTS - user.passwordResetAttempts;
      throw new BadRequestException(
        `Invalid reset code. ${remainingAttempts} attempt(s) remaining`,
      );
    }

    // Validate new password
    if (!this.passwordService.validatePasswordStrength(newPassword)) {
      throw new BadRequestException(ErrorMessages.WEAK_PASSWORD);
    }

    const hashedPassword = await this.passwordService.hashPassword(newPassword);
    user.password = hashedPassword;

    // Clean up reset code fields
    user.passwordResetCode = null;
    user.passwordResetExpiry = null;
    user.passwordResetAttempts = 0;
    user.lastPasswordResetRequest = null;

    // SECURITY: Only activate if email was already verified
    // Don't auto-verify on password reset - this could bypass email verification
    if (user.emailVerified) {
      user.isActive = true;
    }

    await this.userRepository.save(user);

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
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      // SECURITY: Do NOT auto-link accounts - this is an account takeover vulnerability
      // If user exists with this email but different auth method, deny login
      if (existingUser) {
        throw new BadRequestException(
          'An account with this email already exists. Please login with your password or contact support to link your Google account.',
        );
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
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d', // 30 days for refresh token
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
