import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ProjectStatus } from '@bizops/shared';
import type { Project } from '@bizops/shared';
import { useCreateProject, useUpdateProject } from '../../hooks/use-projects';
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

const projectFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(5000),
  status: z.nativeEnum(ProjectStatus),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budget: z.coerce.number().nonnegative('Budget must be non-negative'),
  actualCost: z.coerce.number().nonnegative('Actual cost must be non-negative'),
  costRate: z.coerce.number().nonnegative('Cost rate must be non-negative'),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  const isEdit = !!project;
  const { t } = useTranslation();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: project
      ? {
          name: project.name,
          description: project.description,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
          budget: Number(project.budget),
          actualCost: Number(project.actualCost),
          costRate: Number(project.costRate),
        }
      : {
          name: '',
          description: '',
          status: ProjectStatus.PLANNING,
          startDate: '',
          endDate: '',
          budget: 0,
          actualCost: 0,
          costRate: 0,
        },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: ProjectFormValues) {
    if (isEdit && project) {
      await updateMutation.mutateAsync({ id: project.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('projectForm.editTitle') : t('projectForm.newTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('projectForm.editDesc') : t('projectForm.newDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('projectForm.nameLabel')}</Label>
            <Input id="name" {...form.register('name')} placeholder={t('projectForm.namePlaceholder')} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('projectForm.descLabel')}</Label>
            <Textarea id="description" {...form.register('description')} placeholder={t('projectForm.descPlaceholder')} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t('projectForm.statusLabel')}</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(v) => form.setValue('status', v as ProjectStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ProjectStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`statuses.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('projectForm.startDateLabel')}</Label>
              <Input id="startDate" type="date" {...form.register('startDate')} />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('projectForm.endDateLabel')}</Label>
              <Input id="endDate" type="date" {...form.register('endDate')} />
              {form.formState.errors.endDate && (
                <p className="text-sm text-destructive">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">{t('projectForm.budgetLabel')}</Label>
            <Input id="budget" type="number" step="0.01" min="0" {...form.register('budget')} />
            {form.formState.errors.budget && (
              <p className="text-sm text-destructive">{form.formState.errors.budget.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actualCost">{t('projectForm.actualCostLabel')}</Label>
              <Input id="actualCost" type="number" step="0.01" min="0" {...form.register('actualCost')} />
              {form.formState.errors.actualCost && (
                <p className="text-sm text-destructive">{form.formState.errors.actualCost.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="costRate">{t('projectForm.costRateLabel')}</Label>
              <Input id="costRate" type="number" step="0.01" min="0" {...form.register('costRate')} />
              {form.formState.errors.costRate && (
                <p className="text-sm text-destructive">{form.formState.errors.costRate.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : isEdit ? t('projectForm.saveBtn') : t('projectForm.createBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
