import { UserRole } from '@bizops/shared';
import { useAuthStore } from '../store/auth-store';

/**
 * Permission actions mapped to which roles can perform them.
 * Based on CLAUDE.md §5 RBAC Permission Matrix.
 */
const PERMISSION_MAP: Record<string, UserRole[]> = {
  // Projects
  'projects.create': [UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD],
  'projects.update': [UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD],
  'projects.delete': [UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD],
  'projects.read': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL, UserRole.INVENTORY_MANAGER],

  // Tasks
  'tasks.create': [UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD],
  'tasks.update': [UserRole.GLOBAL_LEAD, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL],
  'tasks.delete': [UserRole.GLOBAL_LEAD],
  'tasks.read': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL],

  // RAG override
  'health.override': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],

  // Personnel
  'personnel.create': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER],
  'personnel.update': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER],
  'personnel.read': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL],

  // Assignments
  'assignments.create': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER],
  'assignments.update': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER],
  'assignments.read': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER, UserRole.PROGRAM_MANAGER],

  // Inventory
  'inventory.create': [UserRole.GLOBAL_LEAD, UserRole.INVENTORY_MANAGER],
  'inventory.update': [UserRole.GLOBAL_LEAD, UserRole.INVENTORY_MANAGER],
  'inventory.read': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL, UserRole.INVENTORY_MANAGER],

  // Users
  'users.read': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],
  'users.updateRole': [UserRole.GLOBAL_LEAD],

  // Programs
  'programs.create': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROGRAM_MANAGER],
  'programs.update': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROGRAM_MANAGER],
  'programs.delete': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],
  'programs.read': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL],

  // Opportunities
  'opportunities.create': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],
  'opportunities.update': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],
  'opportunities.delete': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],
  'opportunities.read': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],

  // Skills
  'skills.create': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.HR_ADMIN],
  'skills.update': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.HR_ADMIN],
  'skills.delete': [UserRole.GLOBAL_LEAD, UserRole.HR_ADMIN],
  'skills.read': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.HR_ADMIN, UserRole.RESOURCE_MANAGER],

  // Costs
  'costs.create': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL],
  'costs.approve': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.PROJECT_LEAD],
  'costs.transfer': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],

  // Notifications
  'notifications.create': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],

  // Navigation sections visible per role
  'nav.dashboard': Object.values(UserRole) as UserRole[],
  'nav.programs': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL],
  'nav.projects': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL, UserRole.INVENTORY_MANAGER],
  'nav.opportunities': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],
  'nav.personnel': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL],
  'nav.skills': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.HR_ADMIN, UserRole.RESOURCE_MANAGER],
  'nav.capacity': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER],
  'nav.inventory': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER, UserRole.RESOURCE_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_LEAD, UserRole.PROJECT_PERSONNEL, UserRole.INVENTORY_MANAGER],
  'nav.users': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],
  'nav.trash': [UserRole.GLOBAL_LEAD, UserRole.BIZ_OPS_MANAGER],
};

export type Permission = keyof typeof PERMISSION_MAP;

/** Check if a role has a specific permission. */
export function hasPermission(role: UserRole | undefined, permission: string): boolean {
  if (!role) return false;
  const allowed = PERMISSION_MAP[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

/** Hook: get current user's permission checker. */
export function usePermissions() {
  const role = useAuthStore((s) => s.user?.role);

  return {
    role,
    can: (permission: string) => hasPermission(role, permission),
    canAny: (...permissions: string[]) => permissions.some((p) => hasPermission(role, p)),
    canAll: (...permissions: string[]) => permissions.every((p) => hasPermission(role, p)),
    isRole: (...roles: UserRole[]) => !!role && roles.includes(role),
  };
}
