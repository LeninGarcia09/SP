import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOpportunities } from '../hooks/use-opportunities';
import { OpportunityFormDialog } from '../components/opportunities/OpportunityFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const statusColors: Record<string, string> = {
  IDENTIFIED: 'bg-gray-100 text-gray-800',
  QUALIFYING: 'bg-blue-100 text-blue-800',
  PROPOSAL: 'bg-indigo-100 text-indigo-800',
  NEGOTIATION: 'bg-purple-100 text-purple-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
  CONVERTED: 'bg-emerald-100 text-emerald-800',
};

export function OpportunitiesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = useOpportunities({ page, limit: 25, search: search || undefined });
  const opportunities = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('opportunities.title')}</h1>
        <Button onClick={() => setDialogOpen(true)}>{t('opportunities.new')}</Button>
      </div>

      <Input
        placeholder={t('opportunities.search')}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-sm"
      />

      {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
      {error && <p className="text-destructive">{t('opportunities.error')}</p>}

      {!isLoading && !error && (
        <>
          {opportunities.length === 0 ? (
            <p className="text-muted-foreground">{t('opportunities.empty')}</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">{t('common.code')}</th>
                    <th className="text-left p-3 font-medium">{t('common.name')}</th>
                    <th className="text-left p-3 font-medium">{t('opportunities.client')}</th>
                    <th className="text-left p-3 font-medium">{t('common.status')}</th>
                    <th className="text-left p-3 font-medium">{t('opportunities.stage')}</th>
                    <th className="text-right p-3 font-medium">{t('opportunities.value')}</th>
                    <th className="text-right p-3 font-medium">{t('opportunities.probability')}</th>
                    <th className="text-left p-3 font-medium">{t('opportunities.closeDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp) => (
                    <tr
                      key={opp.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                    >
                      <td className="p-3 font-mono text-xs">{opp.code}</td>
                      <td className="p-3 font-medium">{opp.name}</td>
                      <td className="p-3">{opp.clientName}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[opp.status] ?? 'bg-gray-100 text-gray-800'}`}>
                          {t(`statuses.${opp.status}`)}
                        </span>
                      </td>
                      <td className="p-3 text-xs">{t(`statuses.${opp.stage}`)}</td>
                      <td className="p-3 text-right font-mono">${Number(opp.estimatedValue).toLocaleString()}</td>
                      <td className="p-3 text-right">{opp.probability}%</td>
                      <td className="p-3">{opp.expectedCloseDate ?? t('common.noData')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('common.pageAlt', { page: meta.page, totalPages: meta.totalPages, total: meta.total })}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.previous')}</Button>
                <Button size="sm" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>{t('common.next')}</Button>
              </div>
            </div>
          )}
        </>
      )}

      <OpportunityFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
