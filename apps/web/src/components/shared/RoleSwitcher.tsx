import { useState } from 'react';
import { UserRole } from '@telnub/shared';
import { useAuthStore } from '../../store/auth-store';
import { api } from '../../lib/axios';
import { Shield, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.OPERATIONS_DIRECTOR]: 'Ops Director',
  [UserRole.DEPARTMENT_MANAGER]: 'Dept Manager',
  [UserRole.PROGRAM_MANAGER]: 'Program Manager',
  [UserRole.PROJECT_MANAGER]: 'Project Manager',
  [UserRole.TEAM_MEMBER]: 'Team Member',
  [UserRole.INVENTORY_MANAGER]: 'Inventory Mgr',
  [UserRole.HR_MANAGER]: 'HR Manager',
  [UserRole.SALES_EXECUTIVE]: 'Sales Exec',
};

const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  [UserRole.OPERATIONS_DIRECTOR]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  [UserRole.DEPARTMENT_MANAGER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [UserRole.PROGRAM_MANAGER]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  [UserRole.PROJECT_MANAGER]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [UserRole.TEAM_MEMBER]: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  [UserRole.INVENTORY_MANAGER]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  [UserRole.HR_MANAGER]: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  [UserRole.SALES_EXECUTIVE]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export function RoleSwitcher() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!user) return null;

  const currentRole = user.role as UserRole;

  async function switchTo(role: UserRole) {
    if (role === currentRole) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      const res = await api.post('/auth/dev-login', { role });
      const data = res.data?.data;
      if (data?.access_token && data?.user) {
        setAuth(data.user, data.access_token);
      }
      setOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={switching}
        className="gap-1.5 text-xs"
      >
        <Shield className="h-3.5 w-3.5" />
        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[currentRole]}`}>
          {ROLE_LABELS[currentRole]}
        </span>
        <ChevronDown className="h-3 w-3" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border bg-popover p-1 shadow-lg">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Switch Role (Dev Only)
            </div>
            {Object.values(UserRole).map((role) => (
              <button
                key={role}
                onClick={() => switchTo(role)}
                disabled={switching}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                  role === currentRole ? 'bg-accent font-medium' : ''
                }`}
              >
                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[role]}`}>
                  {ROLE_LABELS[role]}
                </span>
                {role === currentRole && <span className="ml-auto text-xs text-muted-foreground">current</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
