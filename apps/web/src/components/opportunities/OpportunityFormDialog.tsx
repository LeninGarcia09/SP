import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { OpportunityStatus, OpportunityStage } from '@telnub/shared';
import type { Opportunity } from '@telnub/shared';
import { useCreateOpportunity, useUpdateOpportunity } from '../../hooks/use-opportunities';
import { useUsers } from '../../hooks/use-users';
import { useAuthStore } from '../../store/auth-store';
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
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const opportunityFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(5000),
  status: z.nativeEnum(OpportunityStatus),
  stage: z.nativeEnum(OpportunityStage),
  estimatedValue: z.coerce.number().nonnegative('Estimated value must be non-negative'),
  probability: z.coerce.number().min(0).max(100),
  expectedCloseDate: z.string(),
  clientName: z.string().min(1, 'Client name is required').max(200),
  clientContact: z.string().max(200),
  ownerId: z.string().min(1, 'Owner is required'),
});

type OpportunityFormValues = z.infer<typeof opportunityFormSchema>;

interface OpportunityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: Opportunity | null;
}

export function OpportunityFormDialog({ open, onOpenChange, opportunity }: OpportunityFormDialogProps) {
  const isEdit = !!opportunity;
  const { t } = useTranslation();
  const createMutation = useCreateOpportunity();
  const updateMutation = useUpdateOpportunity();
  const usersQuery = useUsers({ limit: 100 });
  const users = usersQuery.data?.data ?? [];
  const currentUser = useAuthStore((s) => s.user);

  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: opportunity
      ? {
          name: opportunity.name,
          description: opportunity.description,
          status: opportunity.status,
          stage: opportunity.stage,
          estimatedValue: Number(opportunity.estimatedValue),
          probability: Number(opportunity.probability),
          expectedCloseDate: opportunity.expectedCloseDate ?? '',
          clientName: opportunity.clientName,
          clientContact: opportunity.clientContact ?? '',
          ownerId: opportunity.ownerId,
        }
      : {
          name: '',
          description: '',
          status: OpportunityStatus.IDENTIFIED,
          stage: OpportunityStage.SEED,
          estimatedValue: 0,
          probability: 0,
          expectedCloseDate: '',
          clientName: '',
          clientContact: '',
          ownerId: currentUser?.id ?? '',
        },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: OpportunityFormValues) {
    const payload = {
      ...values,
      expectedCloseDate: values.expectedCloseDate || null,
      clientContact: values.clientContact || null,
    };
    if (isEdit && opportunity) {
      await updateMutation.mutateAsync({ id: opportunity.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('opportunityForm.editTitle') : t('opportunityForm.newTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('opportunityForm.editDesc') : t('opportunityForm.newDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('opportunityForm.nameLabel')}</Label>
            <Input id="name" {...form.register('name')} placeholder={t('opportunityForm.namePlaceholder')} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientName">{t('opportunityForm.clientNameLabel')}</Label>
            <Input id="clientName" {...form.register('clientName')} placeholder={t('opportunityForm.clientNamePlaceholder')} />
            {form.formState.errors.clientName && (
              <p className="text-sm text-destructive">{form.formState.errors.clientName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientContact">{t('opportunityForm.clientContactLabel')}</Label>
            <Input id="clientContact" {...form.register('clientContact')} placeholder={t('opportunityForm.clientContactPlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('opportunityForm.descLabel')}</Label>
            <Textarea id="description" {...form.register('description')} placeholder={t('opportunityForm.descPlaceholder')} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">{t('opportunityForm.statusLabel')}</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(v) => form.setValue('status', v as OpportunityStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OpportunityStatus).map((s) => (
                    <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">{t('opportunityForm.stageLabel')}</Label>
              <Select
                value={form.watch('stage')}
                onValueChange={(v) => form.setValue('stage', v as OpportunityStage)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OpportunityStage).map((s) => (
                    <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">{t('opportunityForm.valueLabel')}</Label>
              <Input id="estimatedValue" type="number" step="0.01" {...form.register('estimatedValue')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">{t('opportunityForm.probabilityLabel')}</Label>
              <Input id="probability" type="number" min={0} max={100} {...form.register('probability')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedCloseDate">{t('opportunityForm.closeDateLabel')}</Label>
              <Input id="expectedCloseDate" type="date" {...form.register('expectedCloseDate')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerId">{t('opportunityForm.ownerLabel')}</Label>
              <Select
                value={form.watch('ownerId')}
                onValueChange={(v) => form.setValue('ownerId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.ownerId && (
                <p className="text-sm text-destructive">{form.formState.errors.ownerId.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : isEdit ? t('opportunityForm.saveBtn') : t('opportunityForm.createBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
