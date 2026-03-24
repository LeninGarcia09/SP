import { UserRole } from '@telnub/shared';
import { useAuthStore } from '../store/auth-store';

/**
 * Permission actions mapped to which roles can perform them.
 * Based on CLAUDE.md §5 RBAC Permission Matrix.
 */
const PERMISSION_MAP: Record<string, UserRole[]> = {
  // Projects
  'projects.create': [UserRole.ADMIN, UserRole.PROJECT_MANAGER],
  'projects.update': [UserRole.ADMIN, UserRole.PROJECT_MANAGER],
  'projects.delete': [UserRole.ADMIN],
  'projects.read': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.INVENTORY_MANAGER, UserRole.SALES_EXECUTIVE],

  // Tasks
  'tasks.create': [UserRole.ADMIN, UserRole.PROJECT_MANAGER],
  'tasks.update': [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER],
  'tasks.delete': [UserRole.ADMIN],
  'tasks.read': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER],

  // RAG override
  'health.override': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR],

  // Personnel
  'personnel.create': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER],
  'personnel.update': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER],
  'personnel.read': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER],

  // Assignments
  'assignments.create': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER],
  'assignments.update': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER],
  'assignments.read': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER, UserRole.PROGRAM_MANAGER],

  // Inventory
  'inventory.create': [UserRole.ADMIN, UserRole.INVENTORY_MANAGER],
  'inventory.update': [UserRole.ADMIN, UserRole.INVENTORY_MANAGER],
  'inventory.read': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.INVENTORY_MANAGER, UserRole.SALES_EXECUTIVE],

  // Users
  'users.read': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR],
  'users.updateRole': [UserRole.ADMIN],

  // Programs
  'programs.create': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROGRAM_MANAGER],
  'programs.update': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROGRAM_MANAGER],
  'programs.delete': [UserRole.ADMIN],
  'programs.read': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.SALES_EXECUTIVE],

  // Opportunities
  'opportunities.create': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE],
  'opportunities.update': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE],
  'opportunities.delete': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR],
  'opportunities.read': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE],

  // Skills
  'skills.create': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.HR_MANAGER],
  'skills.update': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.HR_MANAGER],
  'skills.delete': [UserRole.ADMIN, UserRole.HR_MANAGER],
  'skills.read': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.HR_MANAGER, UserRole.DEPARTMENT_MANAGER],

  // Costs
  'costs.create': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER],
  'costs.approve': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROJECT_MANAGER],
  'costs.transfer': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR],

  // Notifications
  'notifications.create': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR],

  // Navigation sections visible per role
  'nav.dashboard': Object.values(UserRole) as UserRole[],
  'nav.programs': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.SALES_EXECUTIVE],
  'nav.projects': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.INVENTORY_MANAGER, UserRole.SALES_EXECUTIVE],
  'nav.opportunities': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE],
  'nav.personnel': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER],
  'nav.skills': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.HR_MANAGER, UserRole.DEPARTMENT_MANAGER],
  'nav.capacity': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER],
  'nav.inventory': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.DEPARTMENT_MANAGER, UserRole.PROGRAM_MANAGER, UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER, UserRole.INVENTORY_MANAGER, UserRole.SALES_EXECUTIVE],
  'nav.users': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR],
  'nav.trash': [UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR],
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
