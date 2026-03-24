import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { OpportunityStatus } from '@telnub/shared';
import { useOpportunity, useDeleteOpportunity } from '../hooks/use-opportunities';
import { OpportunityFormDialog } from '../components/opportunities/OpportunityFormDialog';
import { ConvertOpportunityDialog } from '../components/opportunities/ConvertOpportunityDialog';
import { Button } from '../components/ui/button';

const statusColors: Record<string, string> = {
  IDENTIFIED: 'bg-gray-100 text-gray-800',
  QUALIFYING: 'bg-blue-100 text-blue-800',
  PROPOSAL: 'bg-indigo-100 text-indigo-800',
  NEGOTIATION: 'bg-purple-100 text-purple-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
  CONVERTED: 'bg-emerald-100 text-emerald-800',
};

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, error } = useOpportunity(id!);
  const deleteMutation = useDeleteOpportunity();
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const opportunity = data?.data;

  if (isLoading) return <div className="p-6 text-muted-foreground">{t('common.loading')}</div>;
  if (error || !opportunity) return <div className="p-6 text-destructive">{t('opportunities.notFound')}</div>;

  const canConvert = opportunity.status === OpportunityStatus.WON;
  const isConverted = opportunity.status === OpportunityStatus.CONVERTED;

  async function handleDelete() {
    if (!confirm('Delete this opportunity?')) return;
    await deleteMutation.mutateAsync(id!);
    navigate('/opportunities');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('common.back')}
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{opportunity.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{opportunity.code}</p>
        </div>
        <div className="flex gap-2">
          {canConvert && (
            <Button variant="default" onClick={() => setConvertOpen(true)}>{t('opportunities.convertToProject')}</Button>
          )}
          {isConverted && opportunity.convertedProjectId && (
            <Button variant="outline" onClick={() => navigate(`/projects/${opportunity.convertedProjectId}`)}>
              {t('opportunities.viewProject')}
            </Button>
          )}
          <Button variant="outline" onClick={() => setEditOpen(true)} disabled={isConverted}>{t('common.edit')}</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isConverted}>{t('common.delete')}</Button>
        </div>
      </div>

      {/* Status + Stage */}
      <div className="flex gap-3">
        <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${statusColors[opportunity.status] ?? 'bg-gray-100 text-gray-800'}`}>
          {t(`statuses.${opportunity.status}`)}
        </span>
        <span className="inline-block px-3 py-1 rounded text-sm font-medium bg-slate-100 text-slate-800">
          {t('opportunities.stage')}: {t(`statuses.${opportunity.stage}`)}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t('opportunities.estimatedValue')}</p>
          <p className="text-lg font-semibold">${Number(opportunity.estimatedValue).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t('opportunities.probabilityFull')}</p>
          <p className="text-lg font-semibold">{opportunity.probability}%</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t('opportunities.expectedClose')}</p>
          <p className="text-lg font-semibold">{opportunity.expectedCloseDate ?? t('common.noData')}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t('opportunities.client')}</p>
          <p className="text-lg font-semibold">{opportunity.clientName}</p>
          {opportunity.clientContact && (
            <p className="text-sm text-muted-foreground">{opportunity.clientContact}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {opportunity.description && (
        <div>
          <h2 className="text-lg font-semibold mb-2">{t('common.description')}</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
        </div>
      )}

      {/* Conversion info */}
      {isConverted && opportunity.convertedAt && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <h2 className="text-lg font-semibold text-emerald-800 mb-1">{t('opportunities.converted')}</h2>
          <p className="text-sm text-emerald-700">
            {t('opportunities.convertedMessage', { date: new Date(opportunity.convertedAt).toLocaleDateString() })}
          </p>
        </div>
      )}

      <OpportunityFormDialog open={editOpen} onOpenChange={setEditOpen} opportunity={opportunity} />
      <ConvertOpportunityDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        opportunityId={opportunity.id}
        opportunityName={opportunity.name}
        onConverted={() => navigate('/opportunities')}
      />
    </div>
  );
}
