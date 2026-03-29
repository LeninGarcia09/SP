import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderKanban,
  Target,
  DollarSign,
  PieChart as PieChartIcon,
  CheckSquare,
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { useProjects } from '../hooks/use-projects';
import { usePersonnel } from '../hooks/use-personnel';
import { useOpportunities } from '../hooks/use-opportunities';
import { useAuthStore } from '../store/auth-store';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import type { Project, Opportunity } from '@telnub/shared';

// ─── Helpers ───

const STATUS_COLORS: Record<string, string> = {
  PLANNING: '#9ca3af',
  ACTIVE: '#22c55e',
  ON_HOLD: '#eab308',
  COMPLETED: '#3b82f6',
  CANCELLED: '#ef4444',
};

const PIPELINE_STAGES = ['IDENTIFIED', 'QUALIFYING', 'PROPOSAL', 'NEGOTIATION', 'WON'] as const;
const STAGE_COLORS = ['#94a3b8', '#60a5fa', '#a78bfa', '#f59e0b', '#22c55e'];

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

// ─── KPI Card ───

function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  accentColor,
  onClick,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor: string;
  onClick?: () => void;
  trend?: { direction: 'up' | 'down' | 'neutral'; text: string };
}) {
  return (
    <Card
      className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${accentColor}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="rounded-lg bg-muted p-2.5">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend.direction === 'up' && <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />}
            {trend.direction === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />}
            <span className={
              trend.direction === 'up' ? 'text-green-600' :
              trend.direction === 'down' ? 'text-red-600' :
              'text-muted-foreground'
            }>
              {trend.text}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Dashboard ───

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const projects = useProjects({ limit: 100 });
  const personnel = usePersonnel({ limit: 100 });
  const opportunities = useOpportunities({ limit: 100 });

  const isLoading = projects.isLoading || personnel.isLoading || opportunities.isLoading;
  const allFailed = projects.isError && personnel.isError && opportunities.isError;
  const partialError = !allFailed && (projects.isError || personnel.isError || opportunities.isError);

  // ─── Computed Metrics ───
  const metrics = useMemo(() => {
    const allProjects: Project[] = projects.data?.data ?? [];
    const allOpps: Opportunity[] = opportunities.data?.data ?? [];
    const allPersonnel = personnel.data?.data ?? [];

    const active = allProjects.filter((p) => p.status === 'ACTIVE');
    const totalBudget = active.reduce((s, p) => s + Number(p.budget || 0), 0);
    const totalActual = active.reduce((s, p) => s + Number(p.actualCost || 0), 0);
    const budgetUtil = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

    const openOpps = allOpps.filter((o) => !['WON', 'LOST', 'CONVERTED'].includes(o.status));
    const pipelineValue = openOpps.reduce((s, o) => s + Number(o.estimatedValue || 0), 0);

    const assignedPersonnel = allPersonnel.filter((p) => p.assignmentStatus === 'ON_PROJECT' || p.assignmentStatus === 'ON_OPPORTUNITY');
    const teamUtil = allPersonnel.length > 0 ? Math.round((assignedPersonnel.length / allPersonnel.length) * 100) : 0;

    // Status distribution for donut chart
    const statusCounts = allProjects.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Budget overview — top 5 active projects by budget
    const topBudget = [...active]
      .sort((a, b) => Number(b.budget || 0) - Number(a.budget || 0))
      .slice(0, 5)
      .map((p) => ({
        name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
        budget: Number(p.budget || 0),
        actual: Number(p.actualCost || 0),
      }));

    // Pipeline stages
    const pipelineData = PIPELINE_STAGES.map((stage) => {
      const opps = allOpps.filter((o) => o.status === stage);
      return {
        stage,
        count: opps.length,
        value: opps.reduce((s, o) => s + Number(o.estimatedValue || 0), 0),
      };
    });

    // Recent projects (last 5 by updatedAt)
    const recentProjects = [...allProjects]
      .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
      .slice(0, 5);

    // This month new projects
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = allProjects.filter((p) => new Date(p.createdAt) >= monthStart).length;

    return {
      activeCount: active.length,
      totalProjects: allProjects.length,
      pipelineValue,
      totalBudget,
      budgetUtil,
      totalActual,
      teamUtil,
      totalPersonnel: allPersonnel.length,
      assignedCount: assignedPersonnel.length,
      statusData,
      topBudget,
      pipelineData,
      recentProjects,
      newThisMonth,
      openOppCount: openOpps.length,
    };
  }, [projects.data, personnel.data, opportunities.data]);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {authUser?.displayName
              ? t('dashboard.welcome', { name: authUser.displayName.split(' ')[0] })
              : t('dashboard.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.todayIs', { date: new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/projects')} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t('dashboard.newProject')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/opportunities')} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t('dashboard.newOpportunity')}
          </Button>
        </div>
      </div>

      {allFailed && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">{t('dashboard.error')}</p>
        </div>
      )}

      {partialError && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          {t('dashboard.partialError', 'Some data could not be loaded. Showing available information.')}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          icon={FolderKanban}
          label={t('dashboard.activeProjects')}
          value={isLoading ? '…' : metrics.activeCount}
          subtitle={isLoading ? '' : `${metrics.totalProjects} ${t('dashboard.totalProjects').toLowerCase()}`}
          accentColor="border-l-green-500"
          onClick={() => navigate('/projects')}
          trend={!isLoading && metrics.newThisMonth > 0 ? { direction: 'up', text: `+${metrics.newThisMonth} ${t('dashboard.thisMonth')}` } : undefined}
        />
        <KpiCard
          icon={Target}
          label={t('dashboard.pipelineValue')}
          value={isLoading ? '…' : formatCurrency(metrics.pipelineValue)}
          subtitle={isLoading ? '' : `${metrics.openOppCount} ${t('opportunities.title').toLowerCase()}`}
          accentColor="border-l-purple-500"
          onClick={() => navigate('/opportunities')}
        />
        <KpiCard
          icon={DollarSign}
          label={t('dashboard.totalBudget')}
          value={isLoading ? '…' : formatCurrency(metrics.totalBudget)}
          subtitle={isLoading ? '' : t('dashboard.acrossProjects', { count: metrics.activeCount })}
          accentColor="border-l-blue-500"
          onClick={() => navigate('/projects')}
        />
        <KpiCard
          icon={PieChartIcon}
          label={t('dashboard.budgetUtilization')}
          value={isLoading ? '…' : `${metrics.budgetUtil}%`}
          subtitle={isLoading ? '' : `${formatCurrency(metrics.totalActual)} ${t('dashboard.actual').toLowerCase()}`}
          accentColor="border-l-amber-500"
          onClick={() => navigate('/projects')}
          trend={!isLoading ? {
            direction: metrics.budgetUtil > 90 ? 'down' : metrics.budgetUtil > 70 ? 'neutral' : 'up',
            text: metrics.budgetUtil > 90 ? t('dashboard.overdue') : formatCurrency(metrics.totalBudget - metrics.totalActual) + ' remaining',
          } : undefined}
        />
        <KpiCard
          icon={CheckSquare}
          label={t('dashboard.openTasks')}
          value={isLoading ? '…' : '—'}
          subtitle=""
          accentColor="border-l-indigo-500"
          onClick={() => navigate('/projects')}
        />
        <KpiCard
          icon={Users}
          label={t('dashboard.teamUtilization')}
          value={isLoading ? '…' : `${metrics.teamUtil}%`}
          subtitle={isLoading ? '' : t('dashboard.ofPersonnel', { count: metrics.totalPersonnel })}
          accentColor="border-l-cyan-500"
          onClick={() => navigate('/personnel')}
        />
      </div>

      {/* Charts Row */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Status Donut */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('dashboard.projectsByStatus')}</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.statusData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {metrics.statusData.map((entry) => (
                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number, name: string) => [value, t(`statuses.${name}`)]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2">
                    {metrics.statusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[item.name] || '#94a3b8' }}
                        />
                        <span className="text-muted-foreground">{t(`statuses.${item.name}`)}</span>
                        <span className="font-medium ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">{t('projects.empty')}</p>
              )}
            </CardContent>
          </Card>

          {/* Budget Overview Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('dashboard.budgetOverview')}</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.topBudget.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={metrics.topBudget} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v)} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="budget" fill="#3b82f6" name={t('dashboard.budget')} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="actual" fill="#f59e0b" name={t('dashboard.actual')} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">{t('projects.empty')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Opportunity Pipeline */}
      {!isLoading && metrics.pipelineData.some((s) => s.count > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('dashboard.opportunityPipeline')}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')} className="gap-1 text-xs">
                {t('dashboard.viewAll')} <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              {metrics.pipelineData.map((stage, i) => {
                const maxCount = Math.max(...metrics.pipelineData.map((s) => s.count), 1);
                const flex = Math.max(stage.count / maxCount, 0.15);
                return (
                  <div
                    key={stage.stage}
                    className="flex flex-col items-center rounded-lg p-3 text-center transition-colors hover:opacity-90"
                    style={{ flex, backgroundColor: STAGE_COLORS[i] + '20', borderBottom: `3px solid ${STAGE_COLORS[i]}` }}
                  >
                    <span className="text-xs font-medium text-muted-foreground">{t(`statuses.${stage.stage}`)}</span>
                    <span className="text-xl font-bold mt-1">{stage.count}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{formatCurrency(stage.value)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Projects */}
      {!isLoading && metrics.recentProjects.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('dashboard.recentProjects')}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="gap-1 text-xs">
                {t('dashboard.viewAll')} <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">{t('common.code')}</th>
                    <th className="text-left p-3 font-medium">{t('common.name')}</th>
                    <th className="text-left p-3 font-medium">{t('common.status')}</th>
                    <th className="text-left p-3 font-medium">{t('common.budget')}</th>
                    <th className="text-left p-3 font-medium">{t('dashboard.budgetUtilization')}</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentProjects.map((project) => {
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
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700' :
                            project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                            project.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[project.status] }} />
                            {t(`statuses.${project.status}`)}
                          </span>
                        </td>
                        <td className="p-3">{formatCurrency(budget)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress
                              value={pct}
                              className="h-1.5 flex-1"
                              indicatorClassName={pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'}
                            />
                            <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-48 bg-muted animate-pulse rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
