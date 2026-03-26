import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layers, DollarSign, Activity, FolderKanban } from 'lucide-react';
import { usePrograms } from '../hooks/use-programs';
import { usePermissions } from '../hooks/use-permissions';
import { ProgramFormDialog } from '../components/programs/ProgramFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

const statusColors: Record<string, string> = {
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

const ALL_STATUS = 'ALL';
const STATUS_TABS = [ALL_STATUS, 'ACTIVE', 'PLANNING', 'ON_HOLD', 'COMPLETED'] as const;

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export function ProgramsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const programs = usePrograms({ page, limit: 25, search: search || undefined });

  // Portfolio summary metrics
  const summaryMetrics = useMemo(() => {
    const all = programs.data?.data ?? [];
    const active = all.filter((p) => p.status === 'ACTIVE').length;
    const totalBudget = all.reduce((s, p) => s + Number(p.budget || 0), 0);
    const totalActual = all.reduce((s, p) => s + Number(p.totalActualCost || 0), 0);
    const utilPct = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;
    return { total: all.length, active, totalBudget, totalActual, utilPct };
  }, [programs.data]);

  // Client-side status filter
  const filteredPrograms = (programs.data?.data ?? []).filter(
    (p) => statusFilter === ALL_STATUS || p.status === statusFilter,
  );

  return (
    <div className="space-y-4">
      <ProgramFormDialog open={dialogOpen} onOpenChange={setDialogOpen} program={null} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{t('programs.title')}</h2>
          {programs.data?.meta?.total != null && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {programs.data.meta.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder={t('programs.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-56"
          />
          {can('programs.create') && (
            <Button onClick={() => setDialogOpen(true)}>{t('programs.new')}</Button>
          )}
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      {!programs.isLoading && (programs.data?.data?.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('programs.totalPrograms')}</p>
                  <p className="text-2xl font-bold">{summaryMetrics.total}</p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('programs.activePrograms')}</p>
                  <p className="text-2xl font-bold">{summaryMetrics.active}</p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('programs.totalBudgetAll')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalBudget)}</p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t('programs.totalActualAll')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalActual)}</p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              {summaryMetrics.totalBudget > 0 && (
                <Progress
                  value={summaryMetrics.utilPct}
                  className="h-1.5 mt-2"
                  indicatorClassName={summaryMetrics.utilPct > 100 ? 'bg-red-500' : summaryMetrics.utilPct > 80 ? 'bg-amber-500' : 'bg-green-500'}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

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

      {programs.isLoading && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">{t('common.loading')}</div>
      )}

      {programs.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {t('programs.error')}
        </div>
      )}

      {!programs.isLoading && filteredPrograms.length === 0 && (
        <div className="rounded-lg border">
          <div className="p-6 text-center text-muted-foreground">
            {t('programs.empty')}
          </div>
        </div>
      )}

      {filteredPrograms.length > 0 && (
        <>
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
                </tr>
              </thead>
              <tbody>
                {filteredPrograms.map((program) => {
                  const budget = Number(program.budget || 0);
                  const actual = Number(program.totalActualCost || 0);
                  const pct = budget > 0 ? Math.round((actual / budget) * 100) : 0;
                  return (
                    <tr
                      key={program.id}
                      className="border-b last:border-0 hover:bg-muted/25 cursor-pointer"
                      onClick={() => navigate(`/programs/${program.id}`)}
                    >
                      <td className="p-3 font-mono text-xs">{program.code}</td>
                      <td className="p-3 font-medium">{program.name}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[program.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_DOTS[program.status] }} />
                          {t(`statuses.${program.status}`)}
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
                      <td className="p-3">{program.startDate ?? t('common.noData')}</td>
                      <td className="p-3">{program.endDate ?? t('common.noData')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {programs.data?.meta && programs.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">
                {t('common.page', { page: programs.data.meta.page, totalPages: programs.data.meta.totalPages, total: programs.data.meta.total })}
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
                  disabled={page >= (programs.data.meta.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
