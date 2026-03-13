import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ProgramStatus } from '@bizops/shared';
import type { Program } from '@bizops/shared';
import { useCreateProgram, useUpdateProgram } from '../../hooks/use-programs';
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

const programFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(5000),
  status: z.nativeEnum(ProgramStatus),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string(),
  budget: z.coerce.number().nonnegative('Budget must be non-negative'),
});

type ProgramFormValues = z.infer<typeof programFormSchema>;

interface ProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: Program | null;
}

export function ProgramFormDialog({ open, onOpenChange, program }: ProgramFormDialogProps) {
  const isEdit = !!program;
  const { t } = useTranslation();
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: program
      ? {
          name: program.name,
          description: program.description,
          status: program.status,
          startDate: program.startDate,
          endDate: program.endDate ?? '',
          budget: Number(program.budget),
        }
      : {
          name: '',
          description: '',
          status: ProgramStatus.PLANNING,
          startDate: '',
          endDate: '',
          budget: 0,
        },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: ProgramFormValues) {
    const payload = {
      ...values,
      endDate: values.endDate || null,
    };
    if (isEdit && program) {
      await updateMutation.mutateAsync({ id: program.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('programForm.editTitle') : t('programForm.newTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('programForm.editDesc') : t('programForm.newDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('programForm.nameLabel')}</Label>
            <Input id="name" {...form.register('name')} placeholder={t('programForm.namePlaceholder')} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('programForm.descLabel')}</Label>
            <Textarea id="description" {...form.register('description')} placeholder={t('programForm.descPlaceholder')} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t('programForm.statusLabel')}</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(v) => form.setValue('status', v as ProgramStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ProgramStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`statuses.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('programForm.startDateLabel')}</Label>
              <Input id="startDate" type="date" {...form.register('startDate')} />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('programForm.endDateLabel')}</Label>
              <Input id="endDate" type="date" {...form.register('endDate')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">{t('programForm.budgetLabel')}</Label>
            <Input id="budget" type="number" step="0.01" {...form.register('budget')} />
            {form.formState.errors.budget && (
              <p className="text-sm text-destructive">{form.formState.errors.budget.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : isEdit ? t('programForm.saveBtn') : t('programForm.createBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
