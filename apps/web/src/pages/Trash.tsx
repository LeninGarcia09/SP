import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { useDeletedProjects, useRestoreProject } from '../hooks/use-projects';
import { useDeletedPrograms, useRestoreProgram } from '../hooks/use-programs';
import { Button } from '../components/ui/button';

const statusColors: Record<string, string> = {
  PLANNING: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function TrashPage() {
  const { t } = useTranslation();
  const deletedProjects = useDeletedProjects();
  const deletedPrograms = useDeletedPrograms();
  const restoreProject = useRestoreProject();
  const restoreProgram = useRestoreProgram();

  const projects = deletedProjects.data?.data ?? [];
  const programs = deletedPrograms.data?.data ?? [];
  const isLoading = deletedProjects.isLoading || deletedPrograms.isLoading;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t('trash.title')}</h2>

      {isLoading && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">{t('common.loading')}</div>
      )}

      {/* Deleted Programs */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">{t('trash.deletedPrograms')}</h3>
        {programs.length === 0 ? (
          <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
            {t('trash.noProgramsInTrash')}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('common.code')}</th>
                  <th className="text-left p-3 font-medium">{t('common.name')}</th>
                  <th className="text-left p-3 font-medium">{t('common.status')}</th>
                  <th className="text-left p-3 font-medium">{t('trash.deletedAt')}</th>
                  <th className="text-right p-3 font-medium w-24">{t('trash.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((prog) => (
                  <tr key={prog.id} className="border-b last:border-0 hover:bg-muted/25">
                    <td className="p-3 font-mono text-xs">{prog.code}</td>
                    <td className="p-3 font-medium">{prog.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[prog.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {t(`statuses.${prog.status}`)}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {prog.deletedAt ? new Date(prog.deletedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={restoreProgram.isPending}
                        onClick={() => restoreProgram.mutate(prog.id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />{t('trash.restore')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deleted Projects */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{t('trash.deletedProjects')}</h3>
        {projects.length === 0 ? (
          <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
            {t('trash.noProjectsInTrash')}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('common.code')}</th>
                  <th className="text-left p-3 font-medium">{t('common.name')}</th>
                  <th className="text-left p-3 font-medium">{t('common.status')}</th>
                  <th className="text-left p-3 font-medium">{t('trash.deletedAt')}</th>
                  <th className="text-right p-3 font-medium w-24">{t('trash.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => (
                  <tr key={proj.id} className="border-b last:border-0 hover:bg-muted/25">
                    <td className="p-3 font-mono text-xs">{proj.code}</td>
                    <td className="p-3 font-medium">{proj.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[proj.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {t(`statuses.${proj.status}`)}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {proj.deletedAt ? new Date(proj.deletedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={restoreProject.isPending}
                        onClick={() => restoreProject.mutate(proj.id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />{t('trash.restore')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
