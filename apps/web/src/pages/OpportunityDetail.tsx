import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Package, Swords, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { ActivityTimeline } from '../components/activities/ActivityTimeline';
import { OpportunityStatus, DealHealth } from '@telnub/shared';
import type { OpportunityStakeholder, OpportunityLineItem, OpportunityCompetitor } from '@telnub/shared';
import {
  useOpportunity,
  useDeleteOpportunity,
  useStakeholders,
  useRemoveStakeholder,
  useLineItems,
  useRemoveLineItem,
  useCompetitors,
  useRemoveCompetitor,
} from '../hooks/use-opportunities';
import { OpportunityFormDialog } from '../components/opportunities/OpportunityFormDialog';
import { ConvertOpportunityDialog } from '../components/opportunities/ConvertOpportunityDialog';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const statusColors: Record<string, string> = {
  IDENTIFIED: 'bg-gray-100 text-gray-800',
  QUALIFYING: 'bg-blue-100 text-blue-800',
  PROPOSAL: 'bg-indigo-100 text-indigo-800',
  NEGOTIATION: 'bg-purple-100 text-purple-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
  CONVERTED: 'bg-emerald-100 text-emerald-800',
};

const healthColors: Record<string, string> = {
  HEALTHY: 'bg-green-100 text-green-800',
  AT_RISK: 'bg-yellow-100 text-yellow-800',
  STALLED: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, error } = useOpportunity(id!);
  const deleteMutation = useDeleteOpportunity();
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Sub-resource queries
  const { data: stakeholdersData } = useStakeholders(id!);
  const { data: lineItemsData } = useLineItems(id!);
  const { data: competitorsData } = useCompetitors(id!);

  const removeStakeholderMut = useRemoveStakeholder();
  const removeLineItemMut = useRemoveLineItem();
  const removeCompetitorMut = useRemoveCompetitor();

  const opportunity = data?.data;

  if (isLoading) return <div className="p-6 text-muted-foreground">{t('common.loading')}</div>;
  if (error || !opportunity) return <div className="p-6 text-destructive">{t('opportunities.notFound')}</div>;

  const canConvert = opportunity.status === OpportunityStatus.WON;
  const isConverted = opportunity.status === OpportunityStatus.CONVERTED;

  const stakeholders: OpportunityStakeholder[] = stakeholdersData?.data ?? opportunity.stakeholders ?? [];
  const lineItems: OpportunityLineItem[] = lineItemsData?.data ?? opportunity.lineItems ?? [];
  const competitors: OpportunityCompetitor[] = competitorsData?.data ?? opportunity.competitors ?? [];

  async function handleDelete() {
    if (!confirm('Delete this opportunity?')) return;
    await deleteMutation.mutateAsync(id!);
    navigate('/opportunities');
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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

      {/* Status badges */}
      <div className="flex gap-3 flex-wrap">
        <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${statusColors[opportunity.status] ?? 'bg-gray-100 text-gray-800'}`}>
          {t(`statuses.${opportunity.status}`)}
        </span>
        {opportunity.currentStage && (
          <span className="inline-block px-3 py-1 rounded text-sm font-medium bg-slate-100 text-slate-800">
            {opportunity.currentStage.name}
          </span>
        )}
        {!opportunity.currentStage && opportunity.stage && (
          <span className="inline-block px-3 py-1 rounded text-sm font-medium bg-slate-100 text-slate-800">
            {t(`statuses.${opportunity.stage}`)}
          </span>
        )}
        {opportunity.healthStatus && (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${healthColors[opportunity.healthStatus] ?? ''}`}>
            {opportunity.healthStatus === DealHealth.HEALTHY ? <TrendingUp className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {opportunity.healthStatus}
          </span>
        )}
        {opportunity.priority && (
          <span className="inline-block px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
            {opportunity.priority}
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t('opportunities.estimatedValue')}</p>
          <p className="text-lg font-semibold">${Number(opportunity.estimatedValue).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t('opportunities.weightedValue')}</p>
          <p className="text-lg font-semibold">${Number(opportunity.weightedValue ?? 0).toLocaleString()}</p>
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

      {/* Next step */}
      {opportunity.nextStep && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800">{t('opportunities.nextStep')}</p>
          <p className="text-blue-900">{opportunity.nextStep}</p>
          {opportunity.nextStepDueDate && (
            <p className="text-xs text-blue-700 mt-1">Due: {opportunity.nextStepDueDate}</p>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('common.overview')}</TabsTrigger>
          <TabsTrigger value="stakeholders" className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {t('opportunities.stakeholders')} ({stakeholders.length})
          </TabsTrigger>
          <TabsTrigger value="line-items" className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" /> {t('opportunities.lineItems')} ({lineItems.length})
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-1">
            <Swords className="h-3.5 w-3.5" /> {t('opportunities.competitors')} ({competitors.length})
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" /> {t('activities.title')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {opportunity.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('common.description')}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{opportunity.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunity.type && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t('opportunities.type')}</p>
                <p className="font-medium">{opportunity.type.replace(/_/g, ' ')}</p>
              </div>
            )}
            {opportunity.forecastCategory && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t('opportunities.forecastCategory')}</p>
                <p className="font-medium">{opportunity.forecastCategory}</p>
              </div>
            )}
            {opportunity.leadSource && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t('opportunities.leadSource')}</p>
                <p className="font-medium">{opportunity.leadSource}</p>
              </div>
            )}
            {opportunity.lostReason && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t('opportunities.lostReason')}</p>
                <p className="font-medium text-red-700">{opportunity.lostReason}</p>
              </div>
            )}
            {opportunity.pushCount > 0 && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t('opportunities.pushCount')}</p>
                <p className="font-medium text-amber-600">{opportunity.pushCount}x pushed</p>
              </div>
            )}
            {opportunity.daysInCurrentStage > 0 && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t('opportunities.daysInStage')}</p>
                <p className="font-medium">{opportunity.daysInCurrentStage} days</p>
              </div>
            )}
          </div>

          {opportunity.tags && opportunity.tags.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">{t('opportunities.tags')}</p>
              <div className="flex gap-1 flex-wrap">
                {opportunity.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-700">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {isConverted && opportunity.convertedAt && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
              <h3 className="text-lg font-semibold text-emerald-800 mb-1">{t('opportunities.converted')}</h3>
              <p className="text-sm text-emerald-700">
                {t('opportunities.convertedMessage', { date: new Date(opportunity.convertedAt).toLocaleDateString() })}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Stakeholders Tab */}
        <TabsContent value="stakeholders">
          <div className="space-y-3">
            {stakeholders.length === 0 ? (
              <p className="text-muted-foreground py-4">{t('opportunities.noStakeholders')}</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">{t('common.contact')}</th>
                      <th className="text-left p-3 font-medium">{t('common.role')}</th>
                      <th className="text-left p-3 font-medium">{t('opportunities.influence')}</th>
                      <th className="text-left p-3 font-medium">{t('opportunities.sentiment')}</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakeholders.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="p-3">
                          {s.contact ? `${s.contact.firstName} ${s.contact.lastName}` : s.contactId}
                          {s.isPrimary && <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">Primary</span>}
                        </td>
                        <td className="p-3">{s.role.replace(/_/g, ' ')}</td>
                        <td className="p-3">{s.influence}</td>
                        <td className="p-3">{s.sentiment}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => removeStakeholderMut.mutate({ id: s.id, opportunityId: id! })}
                          >
                            {t('common.remove')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Line Items Tab */}
        <TabsContent value="line-items">
          <div className="space-y-3">
            {lineItems.length === 0 ? (
              <p className="text-muted-foreground py-4">{t('opportunities.noLineItems')}</p>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">{t('common.name')}</th>
                        <th className="text-right p-3 font-medium">{t('opportunities.qty')}</th>
                        <th className="text-right p-3 font-medium">{t('opportunities.unitPrice')}</th>
                        <th className="text-right p-3 font-medium">{t('opportunities.discount')}</th>
                        <th className="text-right p-3 font-medium">{t('opportunities.total')}</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((li) => (
                        <tr key={li.id} className="border-t">
                          <td className="p-3">
                            {li.name}
                            {li.product && <span className="ml-1 text-xs text-muted-foreground">({li.product.code})</span>}
                          </td>
                          <td className="p-3 text-right">{li.quantity}</td>
                          <td className="p-3 text-right">${Number(li.unitPrice).toLocaleString()}</td>
                          <td className="p-3 text-right">{li.discount}%</td>
                          <td className="p-3 text-right font-medium">${Number(li.totalPrice).toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => removeLineItemMut.mutate({ id: li.id, opportunityId: id! })}
                            >
                              {t('common.remove')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-right font-semibold text-lg">
                  {t('opportunities.total')}: ${lineItems.reduce((sum, li) => sum + Number(li.totalPrice), 0).toLocaleString()}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors">
          <div className="space-y-3">
            {competitors.length === 0 ? (
              <p className="text-muted-foreground py-4">{t('opportunities.noCompetitors')}</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">{t('common.name')}</th>
                      <th className="text-left p-3 font-medium">{t('opportunities.threatLevel')}</th>
                      <th className="text-left p-3 font-medium">{t('common.status')}</th>
                      <th className="text-left p-3 font-medium">{t('opportunities.strengths')}</th>
                      <th className="text-left p-3 font-medium">{t('opportunities.weaknesses')}</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="p-3 font-medium">{c.competitorName}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            c.threatLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                            c.threatLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>{c.threatLevel}</span>
                        </td>
                        <td className="p-3">{c.status.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-muted-foreground max-w-[200px] truncate">{c.strengths ?? '-'}</td>
                        <td className="p-3 text-muted-foreground max-w-[200px] truncate">{c.weaknesses ?? '-'}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => removeCompetitorMut.mutate({ id: c.id, opportunityId: id! })}
                          >
                            {t('common.remove')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
        {/* Activities Tab */}
        <TabsContent value="activities">
          <ActivityTimeline entityType="opportunities" entityId={id!} />
        </TabsContent>
      </Tabs>

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
