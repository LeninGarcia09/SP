import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Send } from 'lucide-react';
import { useTaskActivities, useAddTaskComment } from '../../hooks/use-tasks';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import type { TaskActivity } from '@bizops/shared';
import { TaskActivityType } from '@bizops/shared';

const activityIcons: Record<TaskActivityType, string> = {
  [TaskActivityType.CREATED]: '🆕',
  [TaskActivityType.STATUS_CHANGED]: '🔄',
  [TaskActivityType.ASSIGNED]: '👤',
  [TaskActivityType.UNASSIGNED]: '➖',
  [TaskActivityType.PRIORITY_CHANGED]: '🎯',
  [TaskActivityType.DUE_DATE_CHANGED]: '📅',
  [TaskActivityType.COMMENT_ADDED]: '💬',
  [TaskActivityType.UPDATED]: '✏️',
};

function ActivityEntry({ activity, t }: { activity: TaskActivity; t: (key: string) => string }) {
  const time = new Date(activity.createdAt).toLocaleString();
  const typeKey = `tasks.activity.${activity.activityType}`;
  const icon = activityIcons[activity.activityType as TaskActivityType] ?? '•';

  if (activity.activityType === TaskActivityType.COMMENT_ADDED) {
    return (
      <div className="flex gap-3 py-3 border-b last:border-0">
        <div className="flex-shrink-0 mt-0.5">
          <MessageSquare className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{time}</p>
          <p className="text-sm mt-1 whitespace-pre-wrap">{activity.comment}</p>
        </div>
      </div>
    );
  }

  let description = t(typeKey);
  if (activity.field && activity.oldValue && activity.newValue) {
    description = `${t(typeKey)}: ${activity.oldValue} → ${activity.newValue}`;
  } else if (activity.newValue) {
    description = `${t(typeKey)}: ${activity.newValue}`;
  }

  return (
    <div className="flex gap-3 py-2 border-b last:border-0">
      <span className="flex-shrink-0 text-sm mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

interface Props {
  projectId: string;
  taskId: string;
}

export function TaskActivityTimeline({ projectId, taskId }: Props) {
  const { t } = useTranslation();
  const activities = useTaskActivities(projectId, taskId);
  const addComment = useAddTaskComment(projectId, taskId);
  const [comment, setComment] = useState('');

  async function handleSubmitComment() {
    if (!comment.trim()) return;
    await addComment.mutateAsync(comment.trim());
    setComment('');
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">{t('tasks.activityTitle')}</h4>

      {/* Comment input */}
      <div className="flex gap-2">
        <Textarea
          className="flex-1 min-h-[60px] text-sm"
          placeholder={t('tasks.commentPlaceholder')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleSubmitComment();
            }
          }}
        />
        <Button
          size="sm"
          className="self-end"
          disabled={!comment.trim() || addComment.isPending}
          onClick={handleSubmitComment}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Activity list */}
      {activities.isLoading && (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      )}

      {activities.data?.data && activities.data.data.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('tasks.noActivity')}</p>
      )}

      {activities.data?.data && activities.data.data.length > 0 && (
        <div className="max-h-[300px] overflow-y-auto rounded-lg border p-3">
          {activities.data.data.map((a) => (
            <ActivityEntry key={a.id} activity={a} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
