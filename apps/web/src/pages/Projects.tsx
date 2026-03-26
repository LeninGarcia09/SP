import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { useProjects } from '../hooks/use-projects';
import { usePrograms } from '../hooks/use-programs';
import { usePermissions } from '../hooks/use-permissions';
import { ProjectFormDialog } from '../components/projects/ProjectFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { Project } from '@telnub/shared';

const STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_DOTS: Record<string, string> = {
  PLANNING: '#9ca3af',
  ACTIVE: '#22c55e',
  ON_HOLD: '#eab308',
  COMPLETED: '#3b82f6',
  CANCELLED: '#ef4444',
};

type ViewMode = 'table' | 'cards';
const ALL_STATUS = 'ALL';
const STATUS_TABS = [ALL_STATUS, 'ACTIVE', 'PLANNING', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const;

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

// ─── Project Card Component ───

function ProjectCard({ project, programName, onClick, t }: {
  project: Project;
  programName?: string;
  onClick: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const budget = Number(project.budget || 0);
  const actual = Number(project.actualCost || 0);
  const pct = budget > 0 ? Math.round((actual / budget) * 100) : 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium truncate">{project.name}</p>
            <p className="text-xs font-mono text-muted-foreground">{project.code}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-700'}`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_DOTS[project.status] }} />
            {t(`statuses.${project.status}`)}
          </span>
        </div>

        {/* Budget bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(actual)} / {formatCurrency(budget)}</span>
            <span>{pct}%</span>
          </div>
          <Progress
            value={pct}
            className="h-1.5"
            indicatorClassName={pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-blue-500'}
          />
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{project.startDate ?? t('common.noData')} — {project.endDate ?? t('common.noData')}</span>
          {programName && (
            <span className="truncate ml-2 max-w-[120px]" title={programName}>{programName}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Projects Page ───

export function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('projects_view') as ViewMode) || 'table';
  });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const projects = useProjects({ page, limit: 25, search: search || undefined });
  const programsQuery = usePrograms({ limit: 100 });
  const programMap = new Map(
    (programsQuery.data?.data ?? []).map((p) => [p.id, p.name]),
  );

  function handleNew() {
    setDialogOpen(true);
  }

  function setView(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem('projects_view', mode);
  }

  // Client-side status filter
  const filteredProjects = (projects.data?.data ?? []).filter(
    (p) => statusFilter === ALL_STATUS || p.status === statusFilter,
  );

  return (
    <div className="space-y-4">
      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={null}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{t('projects.title')}</h2>
          {projects.data?.meta?.total != null && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {projects.data.meta.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t('projects.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-56"
          />
          {/* View toggle */}
          <div className="flex rounded-md border">
            <button
              onClick={() => setView('table')}
              className={`p-2 ${viewMode === 'table' ? 'bg-muted' : 'hover:bg-muted/50'} rounded-l-md transition-colors`}
              title={t('projects.viewTable')}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('cards')}
              className={`p-2 ${viewMode === 'cards' ? 'bg-muted' : 'hover:bg-muted/50'} rounded-r-md transition-colors`}
              title={t('projects.viewCards')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          {can('projects.create') && (
            <Button onClick={handleNew}>{t('projects.new')}</Button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); }}>
        <TabsList>
          {STATUS_TABS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s === ALL_STATUS ? t('common.allStatuses') : t(`statuses.${s}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {projects.isLoading && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          {t('common.loading')}
        </div>
      )}

      {projects.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {t('projects.error')}
        </div>
      )}

      {!projects.isLoading && filteredProjects.length === 0 && (
        <div className="rounded-lg border">
          <div className="p-6 text-center text-muted-foreground">
            {t('projects.empty')}
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredProjects.length > 0 && (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">{t('common.code')}</th>
                <th className="text-left p-3 font-medium">{t('common.name')}</th>
                <th className="text-left p-3 font-medium">{t('common.status')}</th>
                <th className="text-left p-3 font-medium">{t('common.budget')}</th>
                <th className="text-left p-3 font-medium">{t('dashboard.budgetUtilization')}</th>
                <th className="text-left p-3 font-medium">{t('common.startDate')}</th>
                <th className="text-left p-3 font-medium">{t('common.endDate')}</th>
                <th className="text-left p-3 font-medium">{t('projects.program')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const budget = Number(project.budget || 0);
                const actual = Number(project.actualCost || 0);
                const pct = budget > 0 ? Math.round((actual / budget) * 100) : 0;
                return (
                  <tr
                    key={project.id}
                    className="border-b last:border-0 hover:bg-muted/25 cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <td className="p-3 font-mono text-xs">{project.code}</td>
                    <td className="p-3 font-medium">{project.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_DOTS[project.status] }} />
                        {t(`statuses.${project.status}`)}
                      </span>
                    </td>
                    <td className="p-3">{formatCurrency(budget)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress
                          value={pct}
                          className="h-1.5 flex-1"
                          indicatorClassName={pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-blue-500'}
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="p-3">{project.startDate ?? t('common.noData')}</td>
                    <td className="p-3">{project.endDate ?? t('common.noData')}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {project.programId ? programMap.get(project.programId) ?? '—' : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'cards' && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              programName={project.programId ? programMap.get(project.programId) : undefined}
              onClick={() => navigate(`/projects/${project.id}`)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {projects.data?.meta && projects.data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            {t('common.page', { page: projects.data.meta.page, totalPages: projects.data.meta.totalPages, total: projects.data.meta.total })}
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
              disabled={page >= (projects.data.meta.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
