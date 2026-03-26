import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllowedTenants,
  fetchTenantUsers,
  fetchAppRoles,
  fetchRoleAssignments,
  assignAppRole,
  removeAppRoleAssignment,
  syncUsers,
  fetchCrmUsers,
} from '../lib/api';

export function useAllowedTenants() {
  return useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: fetchAllowedTenants,
  });
}

export function useTenantUsers(tenantId?: string) {
  return useQuery({
    queryKey: ['admin', 'tenant-users', tenantId],
    queryFn: () => fetchTenantUsers(tenantId),
    enabled: !!tenantId,
  });
}

export function useAppRoles() {
  return useQuery({
    queryKey: ['admin', 'app-roles'],
    queryFn: fetchAppRoles,
  });
}

export function useRoleAssignments() {
  return useQuery({
    queryKey: ['admin', 'role-assignments'],
    queryFn: fetchRoleAssignments,
  });
}

export function useAssignAppRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, appRoleValue }: { userId: string; appRoleValue: string }) =>
      assignAppRole(userId, appRoleValue),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'role-assignments'] });
    },
  });
}

export function useRemoveAppRoleAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => removeAppRoleAssignment(assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'role-assignments'] });
    },
  });
}

export function useSyncUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userIds, tenantId }: { userIds: string[]; tenantId?: string }) =>
      syncUsers(userIds, tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'crm-users'] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useCrmUsers() {
  return useQuery({
    queryKey: ['admin', 'crm-users'],
    queryFn: fetchCrmUsers,
  });
}
