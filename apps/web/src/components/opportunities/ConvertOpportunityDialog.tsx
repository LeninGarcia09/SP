import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useConvertOpportunity } from '../../hooks/use-opportunities';
import { useUsers } from '../../hooks/use-users';
import { usePrograms } from '../../hooks/use-programs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const convertFormSchema = z.object({
  projectName: z.string().min(1, 'Project name is required').max(200),
  projectCode: z.string().min(1, 'Project code is required').max(50),
  projectLeadId: z.string().min(1, 'Project lead is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budget: z.coerce.number().nonnegative('Budget must be non-negative').optional(),
  programId: z.string().optional(),
});

type ConvertFormValues = z.infer<typeof convertFormSchema>;

interface ConvertOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string;
  opportunityName: string;
  onConverted?: () => void;
}

export function ConvertOpportunityDialog({
  open,
  onOpenChange,
  opportunityId,
  opportunityName,
  onConverted,
}: ConvertOpportunityDialogProps) {
  const convertMutation = useConvertOpportunity();
  const { t } = useTranslation();
  const usersQuery = useUsers({ limit: 100 });
  const programsQuery = usePrograms({ limit: 100 });
  const users = usersQuery.data?.data ?? [];
  const programs = programsQuery.data?.data ?? [];

  const form = useForm<ConvertFormValues>({
    resolver: zodResolver(convertFormSchema),
    defaultValues: {
      projectName: opportunityName,
      projectCode: '',
      projectLeadId: '',
      startDate: '',
      endDate: '',
      budget: undefined,
      programId: undefined,
    },
  });

  async function onSubmit(values: ConvertFormValues) {
    const payload: Record<string, unknown> = {
      id: opportunityId,
      projectName: values.projectName,
      projectCode: values.projectCode,
      projectLeadId: values.projectLeadId,
      startDate: values.startDate,
      endDate: values.endDate,
    };
    if (values.budget !== undefined) payload.budget = values.budget;
    if (values.programId) payload.programId = values.programId;

    await convertMutation.mutateAsync(payload as { id: string } & Record<string, unknown>);
    form.reset();
    onOpenChange(false);
    onConverted?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('convertDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('convertDialog.desc', { name: opportunityName })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">{t('convertDialog.projectName')}</Label>
            <Input id="projectName" {...form.register('projectName')} placeholder={t('convertDialog.projectNamePlaceholder')} />
            {form.formState.errors.projectName && (
              <p className="text-sm text-destructive">{form.formState.errors.projectName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectCode">{t('convertDialog.projectCode')}</Label>
            <Input id="projectCode" {...form.register('projectCode')} placeholder={t('convertDialog.projectCodePlaceholder')} />
            {form.formState.errors.projectCode && (
              <p className="text-sm text-destructive">{form.formState.errors.projectCode.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectLeadId">{t('convertDialog.projectLead')}</Label>
            <Select
              value={form.watch('projectLeadId')}
              onValueChange={(v) => form.setValue('projectLeadId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project lead" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.projectLeadId && (
              <p className="text-sm text-destructive">{form.formState.errors.projectLeadId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('convertDialog.startDate')}</Label>
              <Input id="startDate" type="date" {...form.register('startDate')} />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">{t('convertDialog.endDate')}</Label>
              <Input id="endDate" type="date" {...form.register('endDate')} />
              {form.formState.errors.endDate && (
                <p className="text-sm text-destructive">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">{t('convertDialog.budget')}</Label>
            <Input id="budget" type="number" step="0.01" {...form.register('budget')} placeholder={t('convertDialog.budgetPlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="programId">{t('convertDialog.program')}</Label>
            <Select
              value={form.watch('programId') ?? ''}
              onValueChange={(v) => form.setValue('programId', v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={convertMutation.isPending}>
              {convertMutation.isPending ? t('convertDialog.converting') : t('convertDialog.convertBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
