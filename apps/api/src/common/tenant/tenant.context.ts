import { AsyncLocalStorage } from 'async_hooks';

interface TenantInfo {
  tenantId: string | null;
  role: string;
}

const storage = new AsyncLocalStorage<TenantInfo>();

/**
 * Execute a function within a tenant context.
 * Used by the TenantInterceptor to wrap each request.
 */
export function runWithTenant<T>(info: TenantInfo, fn: () => T): T {
  return storage.run(info, fn);
}

/**
 * Returns a WHERE-clause filter for READ queries.
 * ADMIN role sees all tenants (returns empty object).
 * Other roles are scoped to their tenant.
 */
export function getTenantFilter(): { tenantId?: string } {
  const info = storage.getStore();
  if (!info?.tenantId) return {};
  if (info.role === 'ADMIN') return {};
  return { tenantId: info.tenantId };
}

/**
 * Returns the current user's tenant ID for WRITE operations.
 * Always returns the tenantId regardless of role (even ADMIN creates data under their tenant).
 */
export function getCurrentTenantId(): string | null {
  const info = storage.getStore();
  return info?.tenantId ?? null;
}
