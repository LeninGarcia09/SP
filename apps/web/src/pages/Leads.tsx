import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLeads } from '../hooks/use-leads';
import { usePermissions } from '../hooks/use-permissions';
import { LeadFormDialog } from '../components/leads/LeadFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-sky-100 text-sky-800',
  ENGAGED: 'bg-indigo-100 text-indigo-800',
  QUALIFIED: 'bg-green-100 text-green-800',
  UNQUALIFIED: 'bg-gray-100 text-gray-800',
  CONVERTED: 'bg-purple-100 text-purple-800',
};

const ratingColors: Record<string, string> = {
  HOT: 'bg-red-100 text-red-800',
  WARM: 'bg-amber-100 text-amber-800',
  COLD: 'bg-blue-100 text-blue-800',
};

const sourceLabels: Record<string, string> = {
  WEB_FORM: 'Web Form',
  REFERRAL: 'Referral',
  EVENT: 'Event',
  COLD_OUTREACH: 'Cold Outreach',
  PARTNER: 'Partner',
  SOCIAL: 'Social',
  AD_CAMPAIGN: 'Ad Campaign',
  INBOUND_CALL: 'Inbound Call',
  OTHER: 'Other',
};

export function LeadsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = useLeads({
    page,
    limit: 25,
    search: search || undefined,
    status: statusFilter || undefined,
    rating: ratingFilter || undefined,
  });
  const { can } = usePermissions();
  const leads = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('leads.title')}</h1>
        {can('leads.create') && (
          <Button onClick={() => setDialogOpen(true)}>{t('leads.new')}</Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder={t('leads.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-full sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">{t('leads.allStatuses')}</option>
          {['NEW', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'].map((s) => (
            <option key={s} value={s}>{t(`leads.status.${s}`)}</option>
          ))}
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">{t('leads.allRatings')}</option>
          {['HOT', 'WARM', 'COLD'].map((r) => (
            <option key={r} value={r}>{t(`leads.rating.${r}`)}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
      {error && <p className="text-destructive">{t('leads.error')}</p>}

      {!isLoading && !error && (
        <>
          {leads.length === 0 ? (
            <p className="text-muted-foreground">{t('leads.empty')}</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">{t('common.code')}</th>
                    <th className="text-left p-3 font-medium">{t('common.name')}</th>
                    <th className="text-left p-3 font-medium">{t('leads.company')}</th>
                    <th className="text-left p-3 font-medium">{t('leads.sourceCol')}</th>
                    <th className="text-left p-3 font-medium">{t('common.status')}</th>
                    <th className="text-left p-3 font-medium">{t('leads.ratingCol')}</th>
                    <th className="text-left p-3 font-medium">{t('leads.score')}</th>
                    <th className="text-left p-3 font-medium">{t('leads.email')}</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <td className="p-3 font-mono text-xs">{lead.code}</td>
                      <td className="p-3 font-medium">{lead.firstName} {lead.lastName}</td>
                      <td className="p-3">{lead.companyName}</td>
                      <td className="p-3 text-xs">{sourceLabels[lead.source] ?? lead.source}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[lead.status] ?? 'bg-gray-100 text-gray-800'}`}>
                          {t(`leads.status.${lead.status}`)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ratingColors[lead.rating] ?? 'bg-gray-100 text-gray-800'}`}>
                          {t(`leads.rating.${lead.rating}`)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <span className="text-xs">{lead.score}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs">{lead.email ?? '—'}</td>
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

      <LeadFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
