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
    });

    if (!user) {
      throw new UnauthorizedException('User not found, inactive, or email not verified');
    }

    return {
      sub: user.id, // Use 'sub' for consistency with JWT spec
      email: user.email,
      role: user.role,
    };
  }
}
