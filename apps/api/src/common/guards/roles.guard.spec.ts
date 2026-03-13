import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@bizops/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

function mockContext(user?: { role: UserRole }): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are specified', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = mockContext({ role: UserRole.PROJECT_PERSONNEL });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when empty roles array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const ctx = mockContext({ role: UserRole.PROJECT_PERSONNEL });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user has one of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      UserRole.GLOBAL_LEAD,
      UserRole.PROJECT_LEAD,
    ]);
    const ctx = mockContext({ role: UserRole.PROJECT_LEAD });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when user role does not match', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      UserRole.GLOBAL_LEAD,
      UserRole.BIZ_OPS_MANAGER,
    ]);
    const ctx = mockContext({ role: UserRole.PROJECT_PERSONNEL });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('denies access when no user is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      UserRole.GLOBAL_LEAD,
    ]);
    const ctx = mockContext(undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('allows GLOBAL_LEAD for all role-protected endpoints', () => {
    const allRoles = Object.values(UserRole).filter(
      (v) => typeof v === 'number',
    ) as UserRole[];

    for (const requiredRole of allRoles) {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([requiredRole]);
      const ctx = mockContext({ role: requiredRole });
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });
});
