import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useDeleteAccount } from '../hooks/use-accounts';
import { usePermissions } from '../hooks/use-permissions';
import { AccountFormDialog } from '../components/accounts/AccountFormDialog';
import { Button } from '../components/ui/button';
import { ArrowLeft, Pencil, Trash2, Globe, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import { ActivityTimeline } from '../components/activities/ActivityTimeline';

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, error } = useAccount(id!);
  const deleteMut = useDeleteAccount();
  const { can } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);

  const account = data?.data;

  if (isLoading) return <p className="p-6 text-muted-foreground">{t('common.loading')}</p>;
  if (error || !account) return <p className="p-6 text-destructive">{t('accounts.notFound')}</p>;

  const handleDelete = () => {
    if (!confirm(t('common.delete') + '?')) return;
    deleteMut.mutate(account.id, { onSuccess: () => navigate('/accounts') });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('accounts.backTo')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-mono">{account.code}</p>
          <h1 className="text-2xl font-bold">{account.name}</h1>
          {account.legalName && <p className="text-sm text-muted-foreground">{account.legalName}</p>}
        </div>
        <div className="flex gap-2">
          {can('accounts.update') && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" /> {t('common.edit')}
            </Button>
          )}
          {can('accounts.delete') && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> {t('common.delete')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard icon={Building2} label={t('accounts.type')} value={account.type} />
        <InfoCard icon={Building2} label={t('accounts.tier')} value={account.tier?.replace('_', ' ') ?? '—'} />
        <InfoCard icon={Building2} label={t('accounts.industry')} value={account.industry ?? '—'} />
        <InfoCard icon={Phone} label={t('accounts.phone')} value={account.phone ?? '—'} />
        <InfoCard icon={Mail} label={t('accounts.email')} value={account.email ?? '—'} />
        <InfoCard icon={Globe} label={t('accounts.website')} value={account.website ?? '—'} link={account.website} />
        <InfoCard
          icon={MapPin}
          label={t('accounts.address')}
          value={[account.addressLine1, account.city, account.state, account.country].filter(Boolean).join(', ') || '—'}
        />
        <InfoCard icon={Building2} label={t('accounts.annualRevenue')} value={account.annualRevenue != null ? `$${Number(account.annualRevenue).toLocaleString()}` : '—'} />
        <InfoCard icon={Building2} label={t('accounts.employeeCount')} value={account.employeeCount?.toString() ?? '—'} />
      </div>

      {account.tags && account.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {account.tags.map((tag) => (
              <span key={tag} className="inline-block px-2 py-0.5 rounded bg-muted text-xs">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Activities */}
      <div className="mt-6">
        <ActivityTimeline entityType="accounts" entityId={account.id} />
      </div>

      <AccountFormDialog open={editOpen} onOpenChange={setEditOpen} account={account} />
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, link }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; link?: string | null }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{value}</a>
      ) : (
        <p className="text-sm font-medium">{value}</p>
      )}
    </div>
  );
}
