import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { Lead, LeadConvertPayload } from '@telnub/shared';
import { useConvertLead } from '../../hooks/use-leads';
import { usePipelines, usePipelineStages } from '../../hooks/use-pipelines';
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
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Building2, UserCircle, Target, CheckCircle } from 'lucide-react';

const convertSchema = z.object({
  createAccount: z.boolean(),
  accountName: z.string().optional(),
  accountIndustry: z.string().optional(),
  accountWebsite: z.string().optional(),
  contactFirstName: z.string().min(1),
  contactLastName: z.string().min(1),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
  contactJobTitle: z.string().optional().or(z.literal('')),
  createOpportunity: z.boolean(),
  opportunityName: z.string().optional(),
  opportunityAmount: z.coerce.number().min(0).optional(),
  opportunityExpectedCloseDate: z.string().optional(),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
});

type ConvertFormValues = z.infer<typeof convertSchema>;

interface LeadConvertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

const steps = [
  { key: 'account', icon: Building2 },
  { key: 'contact', icon: UserCircle },
  { key: 'opportunity', icon: Target },
  { key: 'confirm', icon: CheckCircle },
] as const;

export function LeadConvertDialog({ open, onOpenChange, lead }: LeadConvertDialogProps) {
  const { t } = useTranslation();
  const convertMut = useConvertLead();
  const [step, setStep] = useState(0);

  const { data: pipelinesData } = usePipelines({ page: 1, limit: 100 });
  const pipelines = pipelinesData?.data ?? [];

  const form = useForm<ConvertFormValues>({
    resolver: zodResolver(convertSchema),
    defaultValues: {
      createAccount: true,
      accountName: lead.companyName,
      accountIndustry: lead.industry ?? '',
      accountWebsite: lead.website ?? '',
      contactFirstName: lead.firstName,
      contactLastName: lead.lastName,
      contactEmail: lead.email ?? '',
      contactPhone: lead.phone ?? '',
      contactJobTitle: lead.jobTitle ?? '',
      createOpportunity: true,
      opportunityName: `${lead.companyName} — Opportunity`,
      opportunityAmount: lead.budget != null ? Number(lead.budget) : 0,
      opportunityExpectedCloseDate: '',
      pipelineId: '',
      stageId: '',
    },
  });

  const createAccount = form.watch('createAccount');
  const createOpportunity = form.watch('createOpportunity');
  const selectedPipelineId = form.watch('pipelineId');

  const { data: stagesData } = usePipelineStages(selectedPipelineId ?? '');
  const stages = stagesData?.data ?? [];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const onSubmit = (values: ConvertFormValues) => {
    const payload: LeadConvertPayload = {
      createAccount: values.createAccount,
      createOpportunity: values.createOpportunity,
    };
    if (values.createAccount) {
      payload.accountName = values.accountName;
      payload.accountIndustry = values.accountIndustry || undefined;
      payload.accountWebsite = values.accountWebsite || undefined;
    }
    payload.contactFirstName = values.contactFirstName;
    payload.contactLastName = values.contactLastName;
    payload.contactEmail = values.contactEmail || undefined;
    payload.contactPhone = values.contactPhone || undefined;
    payload.contactJobTitle = values.contactJobTitle || undefined;

    if (values.createOpportunity) {
      payload.opportunityName = values.opportunityName;
      payload.estimatedValue = values.opportunityAmount;
      payload.expectedCloseDate = values.opportunityExpectedCloseDate || undefined;
      payload.pipelineId = values.pipelineId || undefined;
    }

    convertMut.mutate(
      { id: lead.id, payload },
      {
        onSuccess: () => {
          onOpenChange(false);
          setStep(0);
          form.reset();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('leadConvert.title')}</DialogTitle>
          <DialogDescription>{t('leadConvert.desc')}</DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <div key={s.key} className="flex items-center gap-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                    active ? 'bg-primary text-primary-foreground' : done ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-xs hidden sm:block ${active ? 'font-semibold' : 'text-muted-foreground'}`}>
                  {t(`leadConvert.step.${s.key}`)}
                </span>
                {i < steps.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
              </div>
            );
          })}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Step 0 — Account */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={createAccount}
                  onCheckedChange={(v) => form.setValue('createAccount', !!v)}
                  id="createAccount"
                />
                <Label htmlFor="createAccount">{t('leadConvert.createNewAccount')}</Label>
              </div>
              {createAccount && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('leadConvert.accountName')}</Label>
                    <Input {...form.register('accountName')} />
                  </div>
                  <div>
                    <Label>{t('leadConvert.accountIndustry')}</Label>
                    <Input {...form.register('accountIndustry')} />
                  </div>
                  <div className="col-span-full">
                    <Label>{t('leadConvert.accountWebsite')}</Label>
                    <Input {...form.register('accountWebsite')} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1 — Contact */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('leadConvert.contactFirstName')}</Label>
                <Input {...form.register('contactFirstName')} />
                {form.formState.errors.contactFirstName && <p className="text-xs text-destructive mt-1">Required</p>}
              </div>
              <div>
                <Label>{t('leadConvert.contactLastName')}</Label>
                <Input {...form.register('contactLastName')} />
                {form.formState.errors.contactLastName && <p className="text-xs text-destructive mt-1">Required</p>}
              </div>
              <div>
                <Label>{t('leadConvert.contactEmail')}</Label>
                <Input type="email" {...form.register('contactEmail')} />
              </div>
              <div>
                <Label>{t('leadConvert.contactPhone')}</Label>
                <Input {...form.register('contactPhone')} />
              </div>
              <div className="col-span-full">
                <Label>{t('leadConvert.contactJobTitle')}</Label>
                <Input {...form.register('contactJobTitle')} />
              </div>
            </div>
          )}

          {/* Step 2 — Opportunity */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={createOpportunity}
                  onCheckedChange={(v) => form.setValue('createOpportunity', !!v)}
                  id="createOpp"
                />
                <Label htmlFor="createOpp">{t('leadConvert.createOpportunity')}</Label>
              </div>
              {createOpportunity && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <Label>{t('leadConvert.oppName')}</Label>
                    <Input {...form.register('opportunityName')} />
                  </div>
                  <div>
                    <Label>{t('leadConvert.oppAmount')}</Label>
                    <Input type="number" min={0} step="0.01" {...form.register('opportunityAmount')} />
                  </div>
                  <div>
                    <Label>{t('leadConvert.oppCloseDate')}</Label>
                    <Input type="date" {...form.register('opportunityExpectedCloseDate')} />
                  </div>
                  <div>
                    <Label>{t('leadConvert.pipeline')}</Label>
                    <Select
                      value={selectedPipelineId ?? ''}
                      onValueChange={(v) => {
                        form.setValue('pipelineId', v);
                        form.setValue('stageId', '');
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder={t('leadConvert.selectPipeline')} /></SelectTrigger>
                      <SelectContent>
                        {pipelines.map((p: { id: string; name: string }) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedPipelineId && (
                    <div>
                      <Label>{t('leadConvert.stage')}</Label>
                      <Select
                        value={form.watch('stageId') ?? ''}
                        onValueChange={(v) => form.setValue('stageId', v)}
                      >
                        <SelectTrigger><SelectValue placeholder={t('leadConvert.selectStage')} /></SelectTrigger>
                        <SelectContent>
                          {stages.map((s: { id: string; name: string }) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div className="space-y-3 text-sm">
              <h4 className="font-semibold">{t('leadConvert.confirmTitle')}</h4>
              <div className="rounded border p-3 space-y-2">
                <p><span className="text-muted-foreground">{t('leadConvert.leadName')}:</span> {lead.firstName} {lead.lastName}</p>
                {createAccount && (
                  <p><span className="text-muted-foreground">{t('leadConvert.step.account')}:</span> {form.getValues('accountName') || '—'}</p>
                )}
                <p><span className="text-muted-foreground">{t('leadConvert.step.contact')}:</span> {form.getValues('contactFirstName')} {form.getValues('contactLastName')}</p>
                {createOpportunity && (
                  <p><span className="text-muted-foreground">{t('leadConvert.step.opportunity')}:</span> {form.getValues('opportunityName') || '—'}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between gap-2">
            <div className="flex gap-2">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  {t('common.back')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              {step < steps.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  {t('leadConvert.next')}
                </Button>
              ) : (
                <Button type="submit" disabled={convertMut.isPending}>
                  {convertMut.isPending ? t('common.loading') : t('leadConvert.convert')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
