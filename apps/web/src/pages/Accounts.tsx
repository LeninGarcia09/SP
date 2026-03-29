import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccounts } from '../hooks/use-accounts';
import { usePermissions } from '../hooks/use-permissions';
import { AccountFormDialog } from '../components/accounts/AccountFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const typeColors: Record<string, string> = {
  PROSPECT: 'bg-blue-100 text-blue-800',
  CUSTOMER: 'bg-green-100 text-green-800',
  PARTNER: 'bg-purple-100 text-purple-800',
  COMPETITOR: 'bg-red-100 text-red-800',
  VENDOR: 'bg-amber-100 text-amber-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

const tierColors: Record<string, string> = {
  ENTERPRISE: 'bg-indigo-100 text-indigo-800',
  MID_MARKET: 'bg-sky-100 text-sky-800',
  SMB: 'bg-teal-100 text-teal-800',
  STARTUP: 'bg-orange-100 text-orange-800',
};

export function AccountsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = useAccounts({ page, limit: 25, search: search || undefined });
  const { can } = usePermissions();
  const accounts = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('accounts.title')}</h1>
        {can('accounts.create') && (
          <Button onClick={() => setDialogOpen(true)}>{t('accounts.new')}</Button>
        )}
      </div>

      <Input
        placeholder={t('accounts.search')}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-full sm:max-w-sm"
      />

      {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
      {error && <p className="text-destructive">{t('accounts.error')}</p>}

      {!isLoading && !error && (
        <>
          {accounts.length === 0 ? (
            <p className="text-muted-foreground">{t('accounts.empty')}</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">{t('common.code')}</th>
                    <th className="text-left p-3 font-medium">{t('common.name')}</th>
                    <th className="text-left p-3 font-medium">{t('accounts.industry')}</th>
                    <th className="text-left p-3 font-medium">{t('accounts.type')}</th>
                    <th className="text-left p-3 font-medium">{t('accounts.tier')}</th>
                    <th className="text-left p-3 font-medium">{t('accounts.phone')}</th>
                    <th className="text-right p-3 font-medium">{t('accounts.annualRevenue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr
                      key={acc.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/accounts/${acc.id}`)}
                    >
                      <td className="p-3 font-mono text-xs">{acc.code}</td>
                      <td className="p-3 font-medium">{acc.name}</td>
                      <td className="p-3">{acc.industry ?? '—'}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeColors[acc.type] ?? 'bg-gray-100 text-gray-800'}`}>
                          {acc.type}
                        </span>
                      </td>
                      <td className="p-3">
                        {acc.tier ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${tierColors[acc.tier] ?? 'bg-gray-100 text-gray-800'}`}>
                            {acc.tier.replace('_', ' ')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-3">{acc.phone ?? '—'}</td>
                      <td className="p-3 text-right font-mono">
                        {acc.annualRevenue != null ? `$${Number(acc.annualRevenue).toLocaleString()}` : '—'}
                      </td>
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

      <AccountFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
