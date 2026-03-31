import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLead, useDeleteLead, useQualifyLead, useDisqualifyLead } from '../hooks/use-leads';
import { usePermissions } from '../hooks/use-permissions';
import { LeadFormDialog } from '../components/leads/LeadFormDialog';
import { LeadConvertDialog } from '../components/leads/LeadConvertDialog';

import { Button } from '../components/ui/button';
import { ArrowLeft, Pencil, Trash2, Mail, Phone, Building2, Globe, ArrowRightLeft, Briefcase, Target, Clock, CheckCircle, XCircle } from 'lucide-react';

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

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, error } = useLead(id!);
  const deleteMut = useDeleteLead();
  const qualifyMut = useQualifyLead();
  const disqualifyMut = useDisqualifyLead();
  const { can } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const lead = data?.data;

  if (isLoading) return <p className="p-6 text-muted-foreground">{t('common.loading')}</p>;
  if (error || !lead) return <p className="p-6 text-destructive">{t('leads.notFound')}</p>;

  const isConverted = lead.status === 'CONVERTED';

  const handleDelete = () => {
    if (!confirm(t('common.delete') + '?')) return;
    deleteMut.mutate(lead.id, { onSuccess: () => navigate('/leads') });
  };

  const handleQualify = () => qualifyMut.mutate(lead.id);
  const handleDisqualify = () => disqualifyMut.mutate(lead.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('leads.backTo')}
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-mono">{lead.code}</p>
          <h1 className="text-2xl font-bold">{lead.firstName} {lead.lastName}</h1>
          <p className="text-sm text-muted-foreground">{lead.companyName}{lead.jobTitle ? ` — ${lead.jobTitle}` : ''}</p>
          <div className="flex gap-2 mt-2">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[lead.status]}`}>
              {t(`leads.status.${lead.status}`)}
            </span>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ratingColors[lead.rating]}`}>
              {t(`leads.rating.${lead.rating}`)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isConverted && can('leads.update') && (
            <>
              <Button size="sm" onClick={() => setConvertOpen(true)}>
                <ArrowRightLeft className="h-4 w-4 mr-1" /> {t('leads.convert')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleQualify} disabled={qualifyMut.isPending}>
                <CheckCircle className="h-4 w-4 mr-1" /> {t('leads.qualify')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisqualify} disabled={disqualifyMut.isPending}>
                <XCircle className="h-4 w-4 mr-1" /> {t('leads.disqualify')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-1" /> {t('common.edit')}
              </Button>
            </>
          )}
          {can('leads.delete') && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> {t('common.delete')}
            </Button>
          )}
        </div>
      </div>

      {/* Score bar */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t('leads.score')}</span>
          <span className="text-sm font-bold">{lead.score}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${lead.score >= 70 ? 'bg-green-500' : lead.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${lead.score}%` }}
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard icon={Mail} label={t('leads.email')} value={lead.email ?? '—'} />
        <InfoCard icon={Phone} label={t('leads.phone')} value={lead.phone ?? '—'} />
        <InfoCard icon={Briefcase} label={t('leads.jobTitle')} value={lead.jobTitle ?? '—'} />
        <InfoCard icon={Building2} label={t('leads.company')} value={lead.companyName} />
        <InfoCard icon={Building2} label={t('leads.industry')} value={lead.industry ?? '—'} />
        <InfoCard icon={Building2} label={t('leads.companySize')} value={lead.companySize ?? '—'} />
        <InfoCard icon={Globe} label={t('leads.website')} value={lead.website ?? '—'} link={lead.website} />
        <InfoCard icon={Target} label={t('leads.sourceCol')} value={t(`leads.source.${lead.source}`)} />
        <InfoCard icon={Clock} label={t('leads.nextFollowUp')} value={lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : '—'} />
      </div>

      {/* BANT Qualification */}
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-semibold mb-3">{t('leads.bantTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('leads.budget')}</p>
            <p className="text-sm">{lead.budget != null ? `$${Number(lead.budget).toLocaleString()}` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('leads.authority')}</p>
            <p className="text-sm">{lead.authority ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('leads.need')}</p>
            <p className="text-sm whitespace-pre-wrap">{lead.need ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('leads.timeline')}</p>
            <p className="text-sm">{lead.timeline ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-2">{t('leads.notes')}</h3>
          <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}

      {/* Conversion Info */}
      {isConverted && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <h3 className="text-sm font-semibold mb-3 text-purple-800">{t('leads.conversionInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {lead.convertedAccountId && (
              <div>
                <p className="text-xs text-muted-foreground">{t('leads.convertedAccount')}</p>
                <Link to={`/accounts/${lead.convertedAccountId}`} className="text-blue-600 hover:underline font-medium">
                  {t('leads.viewAccount')}
                </Link>
              </div>
            )}
            {lead.convertedContactId && (
              <div>
                <p className="text-xs text-muted-foreground">{t('leads.convertedContact')}</p>
                <Link to={`/contacts/${lead.convertedContactId}`} className="text-blue-600 hover:underline font-medium">
                  {t('leads.viewContact')}
                </Link>
              </div>
            )}
            {lead.convertedOpportunityId && (
              <div>
                <p className="text-xs text-muted-foreground">{t('leads.convertedOpportunity')}</p>
                <Link to={`/opportunities/${lead.convertedOpportunityId}`} className="text-blue-600 hover:underline font-medium">
                  {t('leads.viewOpportunity')}
                </Link>
              </div>
            )}
          </div>
          {lead.convertedAt && (
            <p className="text-xs text-muted-foreground mt-2">{t('leads.convertedOn')}: {new Date(lead.convertedAt).toLocaleString()}</p>
          )}
        </div>
      )}



      {!isConverted && (
        <>
          <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} />
          <LeadConvertDialog open={convertOpen} onOpenChange={setConvertOpen} lead={lead} />
        </>
      )}
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
