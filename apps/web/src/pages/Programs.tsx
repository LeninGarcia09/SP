import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePrograms } from '../hooks/use-programs';
import { usePermissions } from '../hooks/use-permissions';
import { ProgramFormDialog } from '../components/programs/ProgramFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const statusColors: Record<string, string> = {
  PLANNING: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function ProgramsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const programs = usePrograms({ page, limit: 25, search: search || undefined });

  return (
    <div>
      <ProgramFormDialog open={dialogOpen} onOpenChange={setDialogOpen} program={null} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">{t('programs.title')}</h2>
        <div className="flex items-center gap-3">
          <Input
            placeholder={t('programs.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-64"
          />
          {can('programs.create') && (
            <Button onClick={() => setDialogOpen(true)}>{t('programs.new')}</Button>
          )}
        </div>
      </div>

      {programs.isLoading && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">{t('common.loading')}</div>
      )}

      {programs.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {t('programs.error')}
        </div>
      )}

      {programs.data?.data && programs.data.data.length === 0 && (
        <div className="rounded-lg border">
          <div className="p-6 text-center text-muted-foreground">
            {t('programs.empty')}
          </div>
        </div>
      )}

      {programs.data?.data && programs.data.data.length > 0 && (
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
                {programs.data.data.map((program) => (
                  <tr
                    key={program.id}
                    className="border-b last:border-0 hover:bg-muted/25 cursor-pointer"
                    onClick={() => navigate(`/programs/${program.id}`)}
                  >
                    <td className="p-3 font-mono text-xs">{program.code}</td>
                    <td className="p-3 font-medium">{program.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[program.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {t(`statuses.${program.status}`)}
                      </span>
                    </td>
                    <td className="p-3">{program.startDate ?? t('common.noData')}</td>
                    <td className="p-3">{program.endDate ?? t('common.noData')}</td>
                    <td className="p-3">${Number(program.budget).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {programs.data.meta && programs.data.meta.totalPages > 1 && (
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
