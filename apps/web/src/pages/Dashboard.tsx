import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProjects } from '../hooks/use-projects';
import { usePersonnel } from '../hooks/use-personnel';
import { useInventoryItems } from '../hooks/use-inventory';

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const projects = useProjects({ limit: 100 });
  const personnel = usePersonnel({ limit: 100 });
  const inventory = useInventoryItems({ limit: 100 });

  const activeProjects = projects.data?.data?.filter((p) => p.status === 'ACTIVE').length ?? '—';
  const totalPersonnel = personnel.data?.data?.length ?? '—';
  const totalInventory = inventory.data?.data?.length ?? '—';

  const isLoading = projects.isLoading || personnel.isLoading || inventory.isLoading;
  const hasError = projects.isError || personnel.isError || inventory.isError;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h2>

      {hasError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 mb-6 text-sm text-destructive">
          {t('dashboard.error')}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-lg border bg-card p-6 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/projects')}
        >
          <p className="text-sm text-muted-foreground">{t('dashboard.activeProjects')}</p>
          <p className="text-3xl font-bold mt-2">
            {isLoading ? '…' : activeProjects}
          </p>
        </div>
        <div
          className="rounded-lg border bg-card p-6 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/projects')}
        >
          <p className="text-sm text-muted-foreground">{t('dashboard.totalProjects')}</p>
          <p className="text-3xl font-bold mt-2">
            {isLoading ? '…' : (projects.data?.meta?.total ?? projects.data?.data?.length ?? '—')}
          </p>
        </div>
        <div
          className="rounded-lg border bg-card p-6 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/personnel')}
        >
          <p className="text-sm text-muted-foreground">{t('dashboard.personnel')}</p>
          <p className="text-3xl font-bold mt-2">
            {isLoading ? '…' : totalPersonnel}
          </p>
        </div>
        <div
          className="rounded-lg border bg-card p-6 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/inventory')}
        >
          <p className="text-sm text-muted-foreground">{t('dashboard.inventoryItems')}</p>
          <p className="text-3xl font-bold mt-2">
            {isLoading ? '…' : totalInventory}
          </p>
        </div>
      </div>

      {/* Recent Projects */}
      {projects.data?.data && projects.data.data.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.recentProjects')}</h3>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('common.code')}</th>
                  <th className="text-left p-3 font-medium">{t('common.name')}</th>
                  <th className="text-left p-3 font-medium">{t('common.status')}</th>
                  <th className="text-left p-3 font-medium">{t('common.budget')}</th>
                </tr>
              </thead>
              <tbody>
                {projects.data.data.slice(0, 5).map((project) => (
                  <tr
                    key={project.id}
                    className="border-b last:border-0 hover:bg-muted/25 cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <td className="p-3 font-mono text-xs">{project.code}</td>
                    <td className="p-3">{project.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700' :
                        project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t(`statuses.${project.status}`)}
                      </span>
                    </td>
                    <td className="p-3">${Number(project.budget).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
