import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
        isActive: true,
        emailVerified: true, // SECURITY: Only allow verified users
      },
      select: ['id', 'email', 'role', 'revokedTokens'], // Include revokedTokens for checking
    });

    if (!user) {
      throw new UnauthorizedException('User not found, inactive, or email not verified');
    }

    /**
     * SECURITY FIX #2: Check if token is revoked
     * Tokens can be revoked via logout or security breach detection
     */
    if (payload.jti) {
      const revokedTokens = Array.isArray(user.revokedTokens) ? user.revokedTokens : [];
      if (revokedTokens.includes(payload.jti)) {
        throw new UnauthorizedException('Token has been revoked. Please login again');
      }
    }

    return {
      sub: user.id, // Use 'sub' for consistency with JWT spec
      email: user.email,
      role: user.role,
      jti: payload.jti, // SECURITY FIX #2: Pass JTI for logout endpoint
    };
  }
}
