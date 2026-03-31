import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { LeadSource, LeadRating } from '@telnub/shared';
import type { Lead } from '@telnub/shared';
import { useCreateLead, useUpdateLead } from '../../hooks/use-leads';
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

const leadFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  companyName: z.string().min(1, 'Company name is required').max(200),
  email: z.string().email().max(200).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  jobTitle: z.string().max(200).optional().or(z.literal('')),
  industry: z.string().max(100).optional().or(z.literal('')),
  companySize: z.string().optional(),
  website: z.string().max(500).optional().or(z.literal('')),
  source: z.nativeEnum(LeadSource),
  rating: z.nativeEnum(LeadRating),
  score: z.coerce.number().int().min(0).max(100),
  budget: z.coerce.number().min(0).optional().or(z.literal(0)),
  authority: z.string().max(200).optional().or(z.literal('')),
  need: z.string().max(5000).optional().or(z.literal('')),
  timeline: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
}

export function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const isEdit = !!lead;
  const { t } = useTranslation();
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: lead
      ? {
          firstName: lead.firstName,
          lastName: lead.lastName,
          companyName: lead.companyName,
          email: lead.email ?? '',
          phone: lead.phone ?? '',
          jobTitle: lead.jobTitle ?? '',
          industry: lead.industry ?? '',
          companySize: lead.companySize ?? '',
          website: lead.website ?? '',
          source: lead.source,
          rating: lead.rating,
          score: lead.score,
          budget: lead.budget != null ? Number(lead.budget) : 0,
          authority: lead.authority ?? '',
          need: lead.need ?? '',
          timeline: lead.timeline ?? '',
          notes: lead.notes ?? '',
        }
      : {
          firstName: '',
          lastName: '',
          companyName: '',
          source: LeadSource.OTHER,
          rating: LeadRating.WARM,
          score: 0,
          budget: 0,
        },
  });

  const onSubmit = (values: LeadFormValues) => {
    const payload: Record<string, unknown> = { ...values };
    // Clean empty strings to undefined
    for (const key of Object.keys(payload)) {
      if (payload[key] === '' || payload[key] === 0) {
        if (key === 'firstName' || key === 'lastName' || key === 'companyName' || key === 'source' || key === 'rating' || key === 'score') continue;
        delete payload[key];
      }
    }

    if (isEdit) {
      updateMutation.mutate(
        { id: lead!.id, ...payload },
        { onSuccess: () => { onOpenChange(false); form.reset(); } },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { onOpenChange(false); form.reset(); },
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('leadForm.editTitle') : t('leadForm.newTitle')}</DialogTitle>
          <DialogDescription>{isEdit ? t('leadForm.editDesc') : t('leadForm.newDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Person Info */}
          <h3 className="text-sm font-semibold text-muted-foreground">{t('leadForm.personSection')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('leadForm.firstName')}</Label>
              <Input {...form.register('firstName')} />
              {form.formState.errors.firstName && <p className="text-xs text-destructive mt-1">{form.formState.errors.firstName.message}</p>}
            </div>
            <div>
              <Label>{t('leadForm.lastName')}</Label>
              <Input {...form.register('lastName')} />
              {form.formState.errors.lastName && <p className="text-xs text-destructive mt-1">{form.formState.errors.lastName.message}</p>}
            </div>
            <div>
              <Label>{t('leadForm.email')}</Label>
              <Input type="email" {...form.register('email')} />
            </div>
            <div>
              <Label>{t('leadForm.phone')}</Label>
              <Input {...form.register('phone')} />
            </div>
            <div>
              <Label>{t('leadForm.jobTitle')}</Label>
              <Input {...form.register('jobTitle')} />
            </div>
          </div>

          {/* Company Info */}
          <h3 className="text-sm font-semibold text-muted-foreground">{t('leadForm.companySection')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('leadForm.companyName')}</Label>
              <Input {...form.register('companyName')} />
              {form.formState.errors.companyName && <p className="text-xs text-destructive mt-1">{form.formState.errors.companyName.message}</p>}
            </div>
            <div>
              <Label>{t('leadForm.industry')}</Label>
              <Input {...form.register('industry')} />
            </div>
            <div>
              <Label>{t('leadForm.companySize')}</Label>
              <Select
                value={form.watch('companySize') ?? ''}
                onValueChange={(v) => form.setValue('companySize', v)}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {['1-10', '11-50', '51-200', '201-1000', '1000+'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('leadForm.website')}</Label>
              <Input {...form.register('website')} placeholder="https://..." />
            </div>
          </div>

          {/* Lead Status */}
          <h3 className="text-sm font-semibold text-muted-foreground">{t('leadForm.qualificationSection')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>{t('leadForm.source')}</Label>
              <Select
                value={form.watch('source')}
                onValueChange={(v) => form.setValue('source', v as LeadSource)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(LeadSource).map((v) => (
                    <SelectItem key={v} value={v}>{t(`leads.source.${v}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('leadForm.rating')}</Label>
              <Select
                value={form.watch('rating')}
                onValueChange={(v) => form.setValue('rating', v as LeadRating)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(LeadRating).map((v) => (
                    <SelectItem key={v} value={v}>{t(`leads.rating.${v}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('leadForm.score')}</Label>
              <Input type="number" min={0} max={100} {...form.register('score')} />
            </div>
          </div>

          {/* BANT */}
          <h3 className="text-sm font-semibold text-muted-foreground">{t('leadForm.bantSection')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('leadForm.budget')}</Label>
              <Input type="number" min={0} step="0.01" {...form.register('budget')} />
            </div>
            <div>
              <Label>{t('leadForm.authority')}</Label>
              <Input {...form.register('authority')} placeholder={t('leadForm.authorityPlaceholder')} />
            </div>
            <div>
              <Label>{t('leadForm.timeline')}</Label>
              <Input {...form.register('timeline')} placeholder={t('leadForm.timelinePlaceholder')} />
            </div>
          </div>
          <div>
            <Label>{t('leadForm.need')}</Label>
            <Textarea {...form.register('need')} placeholder={t('leadForm.needPlaceholder')} rows={3} />
          </div>

          <div>
            <Label>{t('leadForm.notes')}</Label>
            <Textarea {...form.register('notes')} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
