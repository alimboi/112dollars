import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // First, validate the JWT token via Passport
    const result = await super.canActivate(context);
    if (!result) {
      return false;
    }

    /**
     * SECURITY FIX #2: Check if token is revoked
     * Note: Token revocation checking is implemented in the JWT strategy itself
     * to avoid circular dependency issues with AuthService injection.
     * See jwt.strategy.ts for the implementation.
     */

    return true;
  }
}
