import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEntityActivities, useCreateEntityActivity } from '../../hooks/use-activities';
import { ActivityLogForm } from './ActivityLogForm';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Phone,
  Mail,
  Users,
  StickyNote,
  CheckSquare,
  ArrowRightLeft,
  AlertCircle,
  Settings,
  Plus,
  Clock,
  Calendar,
} from 'lucide-react';
import type { Activity, ActivityType } from '@telnub/shared';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  CALL: { icon: Phone, color: 'bg-blue-100 text-blue-700', label: 'Call' },
  EMAIL: { icon: Mail, color: 'bg-green-100 text-green-700', label: 'Email' },
  MEETING: { icon: Users, color: 'bg-purple-100 text-purple-700', label: 'Meeting' },
  NOTE: { icon: StickyNote, color: 'bg-yellow-100 text-yellow-700', label: 'Note' },
  TASK: { icon: CheckSquare, color: 'bg-orange-100 text-orange-700', label: 'Task' },
  STAGE_CHANGE: { icon: ArrowRightLeft, color: 'bg-indigo-100 text-indigo-700', label: 'Stage Change' },
  STATUS_CHANGE: { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Status Change' },
  SYSTEM: { icon: Settings, color: 'bg-gray-100 text-gray-600', label: 'System' },
};

interface ActivityTimelineProps {
  entityType: 'opportunities' | 'accounts' | 'contacts';
  entityId: string;
}

export function ActivityTimeline({ entityType, entityId }: ActivityTimelineProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showLogForm, setShowLogForm] = useState(false);
  const [defaultType, setDefaultType] = useState<ActivityType | undefined>();

  const { data, isLoading } = useEntityActivities(entityType, entityId, {
    page,
    limit: 20,
    sortBy: 'createdAt',
    order: 'DESC',
    ...(typeFilter ? { type: typeFilter } : {}),
  } as any);
  const createMutation = useCreateEntityActivity(entityType, entityId);

  const activities = data?.data ?? [];
  const meta = data?.meta;

  const quickLogTypes: { type: ActivityType; icon: React.ElementType; label: string }[] = [
    { type: 'CALL' as ActivityType, icon: Phone, label: t('activities.call', 'Call') },
    { type: 'EMAIL' as ActivityType, icon: Mail, label: t('activities.email', 'Email') },
    { type: 'MEETING' as ActivityType, icon: Users, label: t('activities.meeting', 'Meeting') },
    { type: 'NOTE' as ActivityType, icon: StickyNote, label: t('activities.note', 'Note') },
    { type: 'TASK' as ActivityType, icon: CheckSquare, label: t('activities.task', 'Task') },
  ];

  function handleQuickLog(type: ActivityType) {
    setDefaultType(type);
    setShowLogForm(true);
  }

  function handleSubmit(values: Record<string, unknown>) {
    createMutation.mutate(values, {
      onSuccess: () => setShowLogForm(false),
    });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }

  return (
    <div className="space-y-4">
      {/* Quick Log Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">{t('activities.quickLog', 'Quick log')}:</span>
        {quickLogTypes.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => handleQuickLog(type)}
            className="gap-1.5"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
        <Button
          variant="default"
          size="sm"
          onClick={() => { setDefaultType(undefined); setShowLogForm(true); }}
          className="gap-1.5 ml-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('activities.logActivity', 'Log Activity')}
        </Button>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-1">
        <Badge
          variant={typeFilter === '' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setTypeFilter('')}
        >
          {t('activities.all', 'All')}
        </Badge>
        {Object.entries(TYPE_CONFIG)
          .filter(([key]) => !['STAGE_CHANGE', 'STATUS_CHANGE', 'SYSTEM'].includes(key))
          .map(([key, cfg]) => (
            <Badge
              key={key}
              variant={typeFilter === key ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTypeFilter(typeFilter === key ? '' : key)}
            >
              {cfg.label}
            </Badge>
          ))}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">{t('common.loading', 'Loading...')}</div>
      ) : activities.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {t('activities.noActivities', 'No activities yet. Use the quick log toolbar to add one.')}
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-muted space-y-4">
          {activities.map((activity: Activity) => {
            const cfg = (TYPE_CONFIG[activity.type] ?? TYPE_CONFIG['SYSTEM'])!;
            const Icon = cfg.icon;
            return (
              <div key={activity.id} className="relative">
                {/* Timeline dot */}
                <div className={`absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center ${cfg.color}`}>
                  <Icon className="h-2.5 w-2.5" />
                </div>

                <div className="bg-card border rounded-lg p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`text-xs ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                        {activity.status && (
                          <Badge variant="outline" className="text-xs">
                            {activity.status}
                          </Badge>
                        )}
                        {activity.isAutomated && (
                          <Badge variant="outline" className="text-xs bg-gray-50">
                            <Settings className="h-2.5 w-2.5 mr-1" />
                            {t('activities.automated', 'Auto')}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-sm mt-1">{activity.subject}</h4>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(activity.createdAt)}
                    </div>
                  </div>

                  {/* Activity details row */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    {activity.outcome && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{t('activities.outcome', 'Outcome')}:</span> {activity.outcome}
                      </span>
                    )}
                    {activity.duration != null && activity.duration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(activity.duration)}
                      </span>
                    )}
                    {activity.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t('activities.due', 'Due')}: {new Date(activity.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {activity.location && (
                      <span>{activity.location}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            {t('activities.showing', 'Showing')} {activities.length} {t('activities.of', 'of')} {meta.total}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              {t('common.previous', 'Previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              {t('common.next', 'Next')}
            </Button>
          </div>
        </div>
      )}

      {/* Log Activity Form */}
      <ActivityLogForm
        open={showLogForm}
        onOpenChange={setShowLogForm}
        defaultType={defaultType}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
