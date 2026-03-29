import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContacts } from '../hooks/use-contacts';
import { usePermissions } from '../hooks/use-permissions';
import { ContactFormDialog } from '../components/contacts/ContactFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const typeColors: Record<string, string> = {
  PRIMARY: 'bg-green-100 text-green-800',
  BILLING: 'bg-amber-100 text-amber-800',
  TECHNICAL: 'bg-blue-100 text-blue-800',
  EXECUTIVE: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

const influenceColors: Record<string, string> = {
  DECISION_MAKER: 'bg-red-100 text-red-800',
  CHAMPION: 'bg-green-100 text-green-800',
  INFLUENCER: 'bg-blue-100 text-blue-800',
  BLOCKER: 'bg-orange-100 text-orange-800',
  END_USER: 'bg-gray-100 text-gray-800',
  EVALUATOR: 'bg-sky-100 text-sky-800',
  ECONOMIC_BUYER: 'bg-purple-100 text-purple-800',
};

export function ContactsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error } = useContacts({ page, limit: 25, search: search || undefined });
  const { can } = usePermissions();
  const contacts = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('contacts.title')}</h1>
        {can('contacts.create') && (
          <Button onClick={() => setDialogOpen(true)}>{t('contacts.new')}</Button>
        )}
      </div>

      <Input
        placeholder={t('contacts.search')}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-full sm:max-w-sm"
      />

      {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
      {error && <p className="text-destructive">{t('contacts.error')}</p>}

      {!isLoading && !error && (
        <>
          {contacts.length === 0 ? (
            <p className="text-muted-foreground">{t('contacts.empty')}</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">{t('common.code')}</th>
                    <th className="text-left p-3 font-medium">{t('common.name')}</th>
                    <th className="text-left p-3 font-medium">{t('contacts.email')}</th>
                    <th className="text-left p-3 font-medium">{t('contacts.jobTitle')}</th>
                    <th className="text-left p-3 font-medium">{t('contacts.type')}</th>
                    <th className="text-left p-3 font-medium">{t('contacts.influence')}</th>
                    <th className="text-left p-3 font-medium">{t('contacts.phone')}</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                    >
                      <td className="p-3 font-mono text-xs">{contact.code}</td>
                      <td className="p-3 font-medium">{contact.firstName} {contact.lastName}</td>
                      <td className="p-3">{contact.email ?? '—'}</td>
                      <td className="p-3">{contact.jobTitle ?? '—'}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeColors[contact.type] ?? 'bg-gray-100 text-gray-800'}`}>
                          {contact.type}
                        </span>
                      </td>
                      <td className="p-3">
                        {contact.influence ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${influenceColors[contact.influence] ?? 'bg-gray-100 text-gray-800'}`}>
                            {contact.influence.replace(/_/g, ' ')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-3">{contact.phone ?? '—'}</td>
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

      <ContactFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
