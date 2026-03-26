import { useState, useMemo, useEffect } from 'react';
import { Shield, Users, RefreshCw, UserPlus, Trash2, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  useAllowedTenants,
  useTenantUsers,
  useAppRoles,
  useRoleAssignments,
  useAssignAppRole,
  useRemoveAppRoleAssignment,
  useSyncUsers,
  useCrmUsers,
} from '../hooks/use-admin';
import { usePermissions } from '../hooks/use-permissions';
import { UserRole } from '@telnub/shared';

type Tab = 'users' | 'roles' | 'sync';

export function AdminPage() {
  const { isRole } = usePermissions();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const { data: tenantsData, isLoading: loadingTenants } = useAllowedTenants();
  const tenants = tenantsData?.data ?? [];

  // Auto-select first tenant when loaded
  useEffect(() => {
    if (!selectedTenantId && tenants.length > 0 && tenants[0]) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [tenants, selectedTenantId]);

  if (!isRole(UserRole.ADMIN)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin role required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Admin — M365 User Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage tenant users, app role assignments, and sync M365 profiles into the CRM.
        </p>
      </div>

      {/* Tenant selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Tenant:</label>
        {loadingTenants ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('users')}
        >
          <Users className="h-4 w-4 mr-1" /> Tenant Users
        </Button>
        <Button
          variant={activeTab === 'roles' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('roles')}
        >
          <Shield className="h-4 w-4 mr-1" /> Role Assignments
        </Button>
        <Button
          variant={activeTab === 'sync' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('sync')}
        >
          <RefreshCw className="h-4 w-4 mr-1" /> User Sync
        </Button>
      </div>

      {activeTab === 'users' && <TenantUsersTab tenantId={selectedTenantId} />}
      {activeTab === 'roles' && <RoleAssignmentsTab tenantId={selectedTenantId} />}
      {activeTab === 'sync' && <UserSyncTab tenantId={selectedTenantId} />}
    </div>
  );
}

// ─── Tenant Users Tab ───

function TenantUsersTab({ tenantId }: { tenantId: string }) {
  const { data, isLoading, error } = useTenantUsers(tenantId);
  const [search, setSearch] = useState('');

  const users = data?.data ?? [];
  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.userPrincipalName.toLowerCase().includes(q) ||
        (u.mail?.toLowerCase().includes(q) ?? false),
    );
  }, [users, search]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Failed to load tenant users. Ensure Microsoft Graph is configured on the backend.
          </p>
          <p className="text-xs text-muted-foreground mt-1">{String(error)}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>M365 Tenant Users ({users.length})</span>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email / UPN</th>
                  <th className="text-left p-3 font-medium">Job Title</th>
                  <th className="text-left p-3 font-medium">Department</th>
                  <th className="text-center p-3 font-medium">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{user.displayName}</td>
                    <td className="p-3 text-muted-foreground">
                      {user.mail ?? user.userPrincipalName}
                    </td>
                    <td className="p-3">{user.jobTitle ?? '—'}</td>
                    <td className="p-3">{user.department ?? '—'}</td>
                    <td className="p-3 text-center">
                      {user.accountEnabled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {search ? 'No users match the search.' : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Role Assignments Tab ───

function RoleAssignmentsTab({ tenantId }: { tenantId: string }) {
  const { data: assignmentsData, isLoading: loadingAssignments } = useRoleAssignments();
  const { data: rolesData } = useAppRoles();
  const { data: usersData } = useTenantUsers(tenantId);
  const assignRole = useAssignAppRole();
  const removeRole = useRemoveAppRoleAssignment();

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const assignments = assignmentsData?.data ?? [];
  const roles = rolesData?.data ?? [];
  const tenantUsers = usersData?.data ?? [];

  const handleAssign = () => {
    if (!selectedUser || !selectedRole) return;
    assignRole.mutate(
      { userId: selectedUser, appRoleValue: selectedRole },
      { onSuccess: () => { setSelectedUser(''); setSelectedRole(''); } },
    );
  };

  return (
    <div className="space-y-4">
      {/* Assign new role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Assign Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {tenantUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.displayName} ({u.mail ?? u.userPrincipalName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.value}>
                      {r.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAssign}
              disabled={!selectedUser || !selectedRole || assignRole.isPending}
            >
              {assignRole.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <UserPlus className="h-4 w-4 mr-1" />
              )}
              Assign
            </Button>
          </div>
          {assignRole.isError && (
            <p className="text-destructive text-sm mt-2">
              {String(assignRole.error)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignments ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAssignments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Assigned</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{a.principalDisplayName}</td>
                      <td className="p-3">
                        <Badge variant="secondary">{a.appRoleName ?? a.appRoleId}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {a.createdDateTime
                          ? new Date(a.createdDateTime).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRole.mutate(a.id)}
                          disabled={removeRole.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No role assignments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── User Sync Tab ───

function UserSyncTab({ tenantId }: { tenantId: string }) {
  const { data: tenantData, isLoading: loadingTenant } = useTenantUsers(tenantId);
  const { data: crmData, isLoading: loadingCrm } = useCrmUsers();
  const syncMutation = useSyncUsers();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tenantUsers = tenantData?.data ?? [];
  const crmUsers = crmData?.data ?? [];

  // Build a set of M365 OIDs already synced
  const syncedOids = useMemo(
    () => new Set(crmUsers.map((u) => u.azureAdOid).filter(Boolean)),
    [crmUsers],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(tenantUsers.map((u) => u.id)));
  };

  const handleSync = () => {
    if (selected.size === 0) return;
    syncMutation.mutate({ userIds: Array.from(selected), tenantId }, {
      onSuccess: () => setSelected(new Set()),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sync M365 Users → CRM</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button
                size="sm"
                onClick={handleSync}
                disabled={selected.size === 0 || syncMutation.isPending}
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Sync Selected ({selected.size})
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncMutation.isSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-sm">
              Synced {syncMutation.data?.data?.synced ?? 0} users.
              {(syncMutation.data?.data?.failed ?? 0) > 0 && (
                <span className="text-destructive ml-2">
                  {syncMutation.data?.data?.failed} failed.
                </span>
              )}
            </div>
          )}

          {loadingTenant ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 w-10">
                      <input
                        type="checkbox"
                        checked={selected.size === tenantUsers.length && tenantUsers.length > 0}
                        onChange={() =>
                          selected.size === tenantUsers.length
                            ? setSelected(new Set())
                            : selectAll()
                        }
                      />
                    </th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Job Title</th>
                    <th className="text-center p-3 font-medium">In CRM</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => toggleSelect(user.id)}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                        />
                      </td>
                      <td className="p-3 font-medium">{user.displayName}</td>
                      <td className="p-3 text-muted-foreground">
                        {user.mail ?? user.userPrincipalName}
                      </td>
                      <td className="p-3">{user.jobTitle ?? '—'}</td>
                      <td className="p-3 text-center">
                        {syncedOids.has(user.id) ? (
                          <Badge variant="default" className="bg-green-600">Synced</Badge>
                        ) : (
                          <Badge variant="outline">Not synced</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRM Users overview */}
      <Card>
        <CardHeader>
          <CardTitle>CRM Users ({crmUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCrm ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Job Title</th>
                    <th className="text-left p-3 font-medium">Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {crmUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{user.displayName}</td>
                      <td className="p-3 text-muted-foreground">{user.email}</td>
                      <td className="p-3">
                        <Badge variant="secondary">{user.role}</Badge>
                      </td>
                      <td className="p-3">{user.jobTitle ?? '—'}</td>
                      <td className="p-3 text-muted-foreground">
                        {user.m365SyncedAt
                          ? new Date(user.m365SyncedAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
