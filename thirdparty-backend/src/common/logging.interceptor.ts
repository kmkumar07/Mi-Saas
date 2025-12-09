import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const user = request.user;
    const feature =
      request.permissionDecision?.featureKey ??
      request.requiredFeature ??
      'N/A';

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(
          `${method} ${url} - user=${user?.id ?? 'anonymous'} tenant=${
            user?.tenantId ?? 'N/A'
          } feature=${feature} ${ms}ms`,
        );
      }),
    );
  }
}


