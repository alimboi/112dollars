import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: process.env.JWT_EXPIRATION || '1h',
  },
};

export const jwtRefreshConfig: JwtModuleOptions = {
  secret: process.env.JWT_REFRESH_SECRET,
  signOptions: {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
};
