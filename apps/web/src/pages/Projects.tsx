import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProjects } from '../hooks/use-projects';
import { ProjectFormDialog } from '../components/projects/ProjectFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const projects = useProjects({ page, limit: 25, search: search || undefined });

  function handleNew() {
    setDialogOpen(true);
  }

  return (
    <div>
      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={null}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">{t('projects.title')}</h2>
        <div className="flex items-center gap-3">
          <Input
            placeholder={t('projects.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-64"
          />
          <Button onClick={handleNew}>{t('projects.new')}</Button>
        </div>
      </div>

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

      {projects.data?.data && projects.data.data.length === 0 && (
        <div className="rounded-lg border">
          <div className="p-6 text-center text-muted-foreground">
            {t('projects.empty')}
          </div>
        </div>
      )}

      {projects.data?.data && projects.data.data.length > 0 && (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('common.code')}</th>
                  <th className="text-left p-3 font-medium">{t('common.name')}</th>
                  <th className="text-left p-3 font-medium">{t('common.status')}</th>
                  <th className="text-left p-3 font-medium">{t('common.startDate')}</th>
                  <th className="text-left p-3 font-medium">{t('common.endDate')}</th>
                  <th className="text-left p-3 font-medium">{t('common.budget')}</th>
                </tr>
              </thead>
              <tbody>
                {projects.data.data.map((project) => (
                  <tr key={project.id} className="border-b last:border-0 hover:bg-muted/25 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                    <td className="p-3 font-mono text-xs">{project.code}</td>
                    <td className="p-3 font-medium">{project.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700' :
                        project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t(`statuses.${project.status}`)}
                      </span>
                    </td>
                    <td className="p-3">{project.startDate ?? t('common.noData')}</td>
                    <td className="p-3">{project.endDate ?? t('common.noData')}</td>
                    <td className="p-3">${Number(project.budget).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {projects.data.meta && projects.data.meta.totalPages > 1 && (
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
        </>
      )}
    </div>
  );
}
