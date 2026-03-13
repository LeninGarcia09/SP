import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useProgram, useDeleteProgram } from '../hooks/use-programs';
import { ProgramFormDialog } from '../components/programs/ProgramFormDialog';
import { ProgramTimeline } from '../components/shared/ProjectGantt';
import { Button } from '../components/ui/button';

const statusColors: Record<string, string> = {
  PLANNING: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const program = useProgram(id!);
  const deleteProgram = useDeleteProgram();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (program.isLoading) {
    return <div className="p-6 text-center text-muted-foreground">{t('common.loading')}</div>;
  }

  if (program.isError || !program.data?.data) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/programs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{t('common.back')}
        </Button>
        <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {t('programs.notFound')}
        </div>
      </div>
    );
  }

  const p = program.data.data;

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this program?')) return;
    await deleteProgram.mutateAsync(id!);
    navigate('/programs');
  }

  return (
    <div>
      <ProgramFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} program={p} />

      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/programs')}>
          <ArrowLeft className="h-4 w-4 mr-1" />{t('common.back')}
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{p.name}</h2>
            <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[p.status] ?? 'bg-gray-100 text-gray-700'}`}>
              {t(`statuses.${p.status}`)}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditDialogOpen(true)}>{t('common.edit')}</Button>
        <Button variant="destructive" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.budget')}</p>
          <p className="text-lg font-semibold">${Number(p.budget).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.startDate')}</p>
          <p className="text-lg font-semibold">{p.startDate ?? t('common.noData')}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.endDate')}</p>
          <p className="text-lg font-semibold">{p.endDate ?? t('common.noData')}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('projects.title')}</p>
          <p className="text-lg font-semibold">{p.projects?.length ?? 0}</p>
        </div>
      </div>

      {p.description && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">{t('common.description')}</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.description}</p>
        </div>
      )}

      {/* Timeline */}
      {p.projects && p.projects.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">{t('programs.timeline')}</h3>
          <ProgramTimeline projects={p.projects} />
        </div>
      )}

      {/* Linked projects */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{t('programs.projectsInProgram')}</h3>
        {(!p.projects || p.projects.length === 0) ? (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            {t('programs.noProjects')}
          </div>
        ) : (
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
                {p.projects.map((proj) => (
                  <tr
                    key={proj.id}
                    className="border-b last:border-0 hover:bg-muted/25 cursor-pointer"
                    onClick={() => navigate(`/projects/${proj.id}`)}
                  >
                    <td className="p-3 font-mono text-xs">{proj.code}</td>
                    <td className="p-3 font-medium">{proj.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[proj.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {t(`statuses.${proj.status}`)}
                      </span>
                    </td>
                    <td className="p-3">${Number(proj.budget).toLocaleString()}</td>
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
