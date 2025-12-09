import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  /**
   * This guard now ONLY enforces that a bearer token is present.
   * We rely on the UAM service to:
   *  - validate the JWT signature / expiry
   *  - perform all permission checks (via PermissionsGuard -> UAM /permissions/check-feature)
   *
   * The third-party backend is treated as a resource server that trusts UAM.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.token;

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    // We do not verify the token here. PermissionsGuard will send this token
    // to UAM, which will validate and decide access.
    return true;
  }
}


