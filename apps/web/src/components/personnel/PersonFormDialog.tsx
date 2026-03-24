import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AssignmentStatus } from '@telnub/shared';
import type { Person } from '@telnub/shared';
import { useCreatePerson, useUpdatePerson } from '../../hooks/use-personnel';
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

const personFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  departmentId: z.string().min(1, 'Department is required'),
  assignmentStatus: z.nativeEnum(AssignmentStatus),
  startDate: z.string().min(1, 'Start date is required'),
  skills: z.string(),
  employeeId: z.string().max(50),
  availabilityNotes: z.string().max(2000),
});

type PersonFormValues = z.infer<typeof personFormSchema>;

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
}

export function PersonFormDialog({ open, onOpenChange, person }: PersonFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!person;
  const createMutation = useCreatePerson();
  const updateMutation = useUpdatePerson();

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: person
      ? {
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          jobTitle: person.jobTitle,
          departmentId: person.departmentId,
          assignmentStatus: person.assignmentStatus,
          startDate: person.startDate,
          skills: person.skills?.join(', ') ?? '',
          employeeId: person.employeeId ?? '',
          availabilityNotes: person.availabilityNotes ?? '',
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          jobTitle: '',
          departmentId: '',
          assignmentStatus: AssignmentStatus.ON_BENCH,
          startDate: '',
          skills: '',
          employeeId: '',
          availabilityNotes: '',
        },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: PersonFormValues) {
    const payload = {
      ...values,
      skills: values.skills
        ? values.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      employeeId: values.employeeId || null,
      availabilityNotes: values.availabilityNotes || null,
    };

    if (isEdit && person) {
      await updateMutation.mutateAsync({ id: person.id, ...payload });
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
          <DialogTitle>{isEdit ? t('personForm.editTitle') : t('personForm.newTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('personForm.editDesc') : t('personForm.newDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('personForm.firstNameLabel')}</Label>
              <Input id="firstName" {...form.register('firstName')} />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('personForm.lastNameLabel')}</Label>
              <Input id="lastName" {...form.register('lastName')} />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
              <Label htmlFor="email">{t('personForm.emailLabel')}</Label>
            <Input id="email" type="email" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">{t('personForm.jobTitleLabel')}</Label>
              <Input id="jobTitle" {...form.register('jobTitle')} />
              {form.formState.errors.jobTitle && (
                <p className="text-sm text-destructive">{form.formState.errors.jobTitle.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">{t('personForm.employeeIdLabel')}</Label>
              <Input id="employeeId" {...form.register('employeeId')} placeholder={t('personForm.employeeIdPlaceholder')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="departmentId">{t('personForm.departmentIdLabel')}</Label>
            <Input id="departmentId" {...form.register('departmentId')} placeholder={t('personForm.departmentIdPlaceholder')} />
            {form.formState.errors.departmentId && (
              <p className="text-sm text-destructive">{form.formState.errors.departmentId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignmentStatus">{t('personForm.statusLabel')}</Label>
              <Select
                value={form.watch('assignmentStatus')}
                onValueChange={(v) => form.setValue('assignmentStatus', v as AssignmentStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AssignmentStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`statuses.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('personForm.startDateLabel')}</Label>
              <Input id="startDate" type="date" {...form.register('startDate')} />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">{t('personForm.skillsLabel')}</Label>
            <Input id="skills" {...form.register('skills')} placeholder={t('personForm.skillsPlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availabilityNotes">{t('personForm.availabilityLabel')}</Label>
            <Textarea id="availabilityNotes" {...form.register('availabilityNotes')} rows={2} placeholder={t('personForm.availabilityPlaceholder')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : isEdit ? t('personForm.saveBtn') : t('personForm.createBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
