import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ActivityType, ActivityStatus, Priority } from '@telnub/shared';

interface ActivityLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: ActivityType;
  onSubmit: (values: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

const MANUAL_TYPES = [
  { value: ActivityType.CALL, label: 'Call' },
  { value: ActivityType.EMAIL, label: 'Email' },
  { value: ActivityType.MEETING, label: 'Meeting' },
  { value: ActivityType.NOTE, label: 'Note' },
  { value: ActivityType.TASK, label: 'Task' },
];

const OUTCOMES = [
  'CONNECTED', 'VOICEMAIL', 'NO_ANSWER', 'BUSY', 'LEFT_MESSAGE',
  'COMPLETED', 'NO_SHOW', 'RESCHEDULED', 'CANCELLED',
];

export function ActivityLogForm({ open, onOpenChange, defaultType, onSubmit, isSubmitting }: ActivityLogFormProps) {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: {
      type: defaultType ?? ActivityType.NOTE,
      subject: '',
      description: '',
      status: '' as string,
      priority: '' as string,
      dueDate: '',
      startTime: '',
      endTime: '',
      location: '',
      duration: '',
      outcome: '',
    },
  });

  const watchType = form.watch('type');

  useEffect(() => {
    if (open) {
      form.reset({
        type: defaultType ?? ActivityType.NOTE,
        subject: '',
        description: '',
        status: '',
        priority: '',
        dueDate: '',
        startTime: '',
        endTime: '',
        location: '',
        duration: '',
        outcome: '',
      });
    }
  }, [open, defaultType, form]);

  function handleSubmit(values: Record<string, unknown>) {
    const payload: Record<string, unknown> = {
      type: values.type,
      subject: values.subject,
    };
    if (values.description) payload.description = values.description;
    if (values.status) payload.status = values.status;
    if (values.priority) payload.priority = values.priority;
    if (values.dueDate) payload.dueDate = new Date(values.dueDate as string).toISOString();
    if (values.startTime) payload.startTime = new Date(values.startTime as string).toISOString();
    if (values.endTime) payload.endTime = new Date(values.endTime as string).toISOString();
    if (values.location) payload.location = values.location;
    if (values.duration) payload.duration = parseInt(values.duration as string, 10) * 60; // mins → seconds
    if (values.outcome) payload.outcome = values.outcome;
    onSubmit(payload);
  }

  const showCallFields = watchType === ActivityType.CALL;
  const showMeetingFields = watchType === ActivityType.MEETING;
  const showTaskFields = watchType === ActivityType.TASK;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('activities.logActivity', 'Log Activity')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Type */}
          <div className="space-y-1.5">
            <Label>{t('activities.type', 'Type')}</Label>
            <Select
              value={form.watch('type')}
              onValueChange={(v) => form.setValue('type', v as ActivityType)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MANUAL_TYPES.map((mt) => (
                  <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label>{t('activities.subject', 'Subject')} *</Label>
            <Input {...form.register('subject', { required: true })} placeholder={t('activities.subjectPlaceholder', 'Brief description...')} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>{t('activities.description', 'Details')}</Label>
            <Textarea {...form.register('description')} rows={3} placeholder={t('activities.descriptionPlaceholder', 'Add details, notes, or outcomes...')} />
          </div>

          {/* Call-specific: duration + outcome */}
          {showCallFields && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('activities.durationMins', 'Duration (min)')}</Label>
                <Input type="number" min={0} {...form.register('duration')} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('activities.outcome', 'Outcome')}</Label>
                <Select
                  value={form.watch('outcome')}
                  onValueChange={(v) => form.setValue('outcome', v)}
                >
                  <SelectTrigger><SelectValue placeholder={t('activities.selectOutcome', 'Select...')} /></SelectTrigger>
                  <SelectContent>
                    {OUTCOMES.map((o) => (
                      <SelectItem key={o} value={o}>{o.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Meeting-specific: start/end time + location */}
          {showMeetingFields && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t('activities.startTime', 'Start Time')}</Label>
                  <Input type="datetime-local" {...form.register('startTime')} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('activities.endTime', 'End Time')}</Label>
                  <Input type="datetime-local" {...form.register('endTime')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t('activities.location', 'Location')}</Label>
                <Input {...form.register('location')} placeholder="Teams / Office Room 301 / Client site" />
              </div>
              <div className="space-y-1.5">
                <Label>{t('activities.outcome', 'Outcome')}</Label>
                <Select
                  value={form.watch('outcome')}
                  onValueChange={(v) => form.setValue('outcome', v)}
                >
                  <SelectTrigger><SelectValue placeholder={t('activities.selectOutcome', 'Select...')} /></SelectTrigger>
                  <SelectContent>
                    {['COMPLETED', 'NO_SHOW', 'RESCHEDULED', 'CANCELLED'].map((o) => (
                      <SelectItem key={o} value={o}>{o.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Task-specific: status, priority, due date */}
          {showTaskFields && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t('activities.statusLabel', 'Status')}</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(v) => form.setValue('status', v)}
                >
                  <SelectTrigger><SelectValue placeholder="Status..." /></SelectTrigger>
                  <SelectContent>
                    {Object.values(ActivityStatus).map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('activities.priorityLabel', 'Priority')}</Label>
                <Select
                  value={form.watch('priority')}
                  onValueChange={(v) => form.setValue('priority', v)}
                >
                  <SelectTrigger><SelectValue placeholder="Priority..." /></SelectTrigger>
                  <SelectContent>
                    {Object.values(Priority).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('activities.dueDate', 'Due Date')}</Label>
                <Input type="datetime-local" {...form.register('dueDate')} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving', 'Saving...') : t('activities.logActivity', 'Log Activity')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
