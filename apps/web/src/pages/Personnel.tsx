import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePersonnel } from '../hooks/use-personnel';
import { PersonFormDialog } from '../components/personnel/PersonFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function PersonnelPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const personnel = usePersonnel({ page, limit: 25, search: search || undefined });

  function handleNew() {
    setDialogOpen(true);
  }

  return (
    <div>
      <PersonFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        person={null}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">{t('personnel.title')}</h2>
        <div className="flex items-center gap-3">
          <Input
            placeholder={t('personnel.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-64"
          />
          <Button onClick={handleNew}>{t('personnel.addPerson')}</Button>
        </div>
      </div>

      {personnel.isLoading && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          {t('common.loading')}
        </div>
      )}

      {personnel.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {t('personnel.error')}
        </div>
      )}

      {personnel.data?.data && personnel.data.data.length === 0 && (
        <div className="rounded-lg border">
          <div className="p-6 text-center text-muted-foreground">
            {t('personnel.empty')}
          </div>
        </div>
      )}

      {personnel.data?.data && personnel.data.data.length > 0 && (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('common.name')}</th>
                  <th className="text-left p-3 font-medium">{t('common.email')}</th>
                  <th className="text-left p-3 font-medium">{t('personnel.jobTitle')}</th>
                  <th className="text-left p-3 font-medium">{t('common.status')}</th>
                  <th className="text-left p-3 font-medium">{t('common.startDate')}</th>
                </tr>
              </thead>
              <tbody>
                {personnel.data.data.map((person) => (
                  <tr key={person.id} className="border-b last:border-0 hover:bg-muted/25 cursor-pointer" onClick={() => navigate(`/personnel/${person.id}`)}>
                    <td className="p-3 font-medium">{person.firstName} {person.lastName}</td>
                    <td className="p-3">{person.email}</td>
                    <td className="p-3">{person.jobTitle}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        person.assignmentStatus === 'ON_PROJECT' ? 'bg-green-100 text-green-700' :
                        person.assignmentStatus === 'ON_BENCH' ? 'bg-yellow-100 text-yellow-700' :
                        person.assignmentStatus === 'ON_OPERATIONS' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t(`statuses.${person.assignmentStatus}`)}
                      </span>
                    </td>
                    <td className="p-3">{person.startDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {personnel.data.meta && personnel.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">
                {t('common.page', { page: personnel.data.meta.page, totalPages: personnel.data.meta.totalPages, total: personnel.data.meta.total })}
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
                  disabled={page >= (personnel.data.meta.totalPages ?? 1)}
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
