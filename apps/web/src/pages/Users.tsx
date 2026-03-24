import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUsers, useUpdateUserRole } from '../hooks/use-users';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { UserRole } from '@telnub/shared';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  OPERATIONS_DIRECTOR: 'bg-blue-100 text-blue-700',
  DEPARTMENT_MANAGER: 'bg-cyan-100 text-cyan-700',
  PROGRAM_MANAGER: 'bg-indigo-100 text-indigo-700',
  PROJECT_MANAGER: 'bg-green-100 text-green-700',
  TEAM_MEMBER: 'bg-gray-100 text-gray-700',
  INVENTORY_MANAGER: 'bg-orange-100 text-orange-700',
  HR_MANAGER: 'bg-red-100 text-red-700',
  SALES_EXECUTIVE: 'bg-emerald-100 text-emerald-700',
};

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();
  const users = useUsers({ page, limit: 25, search: search || undefined });
  const updateRole = useUpdateUserRole();

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; displayName: string; role: string } | null>(null);
  const [newRole, setNewRole] = useState('');

  function openRoleDialog(user: { id: string; displayName: string; role: string }) {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  }

  async function handleRoleSubmit() {
    if (!selectedUser || !newRole) return;
    await updateRole.mutateAsync({ id: selectedUser.id, role: newRole });
    setRoleDialogOpen(false);
    setSelectedUser(null);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">{t('users.title')}</h2>
        <Input
          placeholder={t('users.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-64"
        />
      </div>

      {users.isLoading && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          Loading users…
        </div>
      )}

      {users.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {t('users.error')}
        </div>
      )}

      {users.data?.data && users.data.data.length === 0 && (
        <div className="rounded-lg border">
          <div className="p-6 text-center text-muted-foreground">
            {t('users.empty')}
          </div>
        </div>
      )}

      {users.data?.data && users.data.data.length > 0 && (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('common.name')}</th>
                  <th className="text-left p-3 font-medium">{t('common.email')}</th>
                  <th className="text-left p-3 font-medium">{t('common.role')}</th>
                  <th className="text-left p-3 font-medium">{t('common.status')}</th>
                  <th className="text-left p-3 font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.data.data.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{user.displayName}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${roleColors[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                        {t(`users.roles.${user.role}`) ?? user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button variant="outline" size="sm" onClick={() => openRoleDialog(user)}>
                        Change Role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.data.meta && users.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">
                Page {users.data.meta.page} of {users.data.meta.totalPages} · {users.data.meta.total} total
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t('common.previous')}
                </button>
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={page >= (users.data.meta.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.changeRole')}</DialogTitle>
            <DialogDescription>
              {t('users.changeRoleDesc', { name: selectedUser?.displayName })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`users.roles.${role}`) ?? role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleRoleSubmit} disabled={updateRole.isPending || newRole === selectedUser?.role}>
              {updateRole.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
