import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { runWithTenant } from './tenant.context';

/**
 * Global interceptor that wraps every authenticated request in a tenant context.
 * Reads tenantId and role from req.user (set by JwtStrategy) and stores them
 * in AsyncLocalStorage so any service can access via getTenantFilter().
 *
 * Must run AFTER AuthGuard (interceptors execute after guards in NestJS).
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const tenantId = user?.tenantId ?? null;
    const role = user?.role ?? '';

    return new Observable((subscriber) => {
      runWithTenant({ tenantId, role }, () => {
        next.handle().subscribe({
          next: (val) => subscriber.next(val),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
