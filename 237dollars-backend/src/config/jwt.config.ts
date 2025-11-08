import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET || '237dollars-jwt-secret-key-development-only',
  signOptions: {
    expiresIn: process.env.JWT_EXPIRATION || '15m',
  },
};

export const jwtRefreshConfig: JwtModuleOptions = {
  secret: process.env.JWT_REFRESH_SECRET || '237dollars-refresh-secret-key-development-only',
  signOptions: {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
};
