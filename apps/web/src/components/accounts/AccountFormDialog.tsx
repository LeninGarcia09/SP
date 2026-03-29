import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { AccountType, AccountTier } from '@telnub/shared';
import type { Account } from '@telnub/shared';
import { useCreateAccount, useUpdateAccount } from '../../hooks/use-accounts';
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

const accountFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  legalName: z.string().max(200).optional().or(z.literal('')),
  industry: z.string().max(100).optional().or(z.literal('')),
  website: z.string().max(500).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email().max(200).optional().or(z.literal('')),
  type: z.nativeEnum(AccountType),
  tier: z.nativeEnum(AccountTier).optional(),
  addressLine1: z.string().max(200).optional().or(z.literal('')),
  addressLine2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  annualRevenue: z.coerce.number().nonnegative().optional().or(z.literal('')),
  employeeCount: z.coerce.number().nonnegative().optional().or(z.literal('')),
  source: z.string().max(100).optional().or(z.literal('')),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
}

export function AccountFormDialog({ open, onOpenChange, account }: AccountFormDialogProps) {
  const isEdit = !!account;
  const { t } = useTranslation();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: account
      ? {
          name: account.name,
          legalName: account.legalName ?? '',
          industry: account.industry ?? '',
          website: account.website ?? '',
          phone: account.phone ?? '',
          email: account.email ?? '',
          type: account.type,
          tier: account.tier ?? undefined,
          addressLine1: account.addressLine1 ?? '',
          addressLine2: account.addressLine2 ?? '',
          city: account.city ?? '',
          state: account.state ?? '',
          country: account.country ?? '',
          postalCode: account.postalCode ?? '',
          annualRevenue: account.annualRevenue ?? '',
          employeeCount: account.employeeCount ?? '',
          source: account.source ?? '',
        }
      : {
          name: '',
          type: AccountType.PROSPECT,
        },
  });

  const onSubmit = (values: AccountFormValues) => {
    // Strip empty strings → undefined for optional fields
    const payload: Record<string, unknown> = { ...values };
    for (const key of Object.keys(payload)) {
      if (payload[key] === '') delete payload[key];
    }

    if (isEdit) {
      updateMutation.mutate(
        { id: account!.id, ...payload },
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
          <DialogTitle>{isEdit ? t('accountForm.editTitle') : t('accountForm.newTitle')}</DialogTitle>
          <DialogDescription>{isEdit ? t('accountForm.editDesc') : t('accountForm.newDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('accountForm.nameLabel')}</Label>
              <Input {...form.register('name')} placeholder={t('accountForm.namePlaceholder')} />
              {form.formState.errors.name && <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label>{t('accountForm.legalNameLabel')}</Label>
              <Input {...form.register('legalName')} placeholder={t('accountForm.legalNamePlaceholder')} />
            </div>
            <div>
              <Label>{t('accountForm.typeLabel')}</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(v) => form.setValue('type', v as AccountType)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(AccountType).map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('accountForm.tierLabel')}</Label>
              <Select
                value={form.watch('tier') ?? ''}
                onValueChange={(v) => form.setValue('tier', v as AccountTier)}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {Object.values(AccountTier).map((v) => (
                    <SelectItem key={v} value={v}>{v.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('accountForm.industryLabel')}</Label>
              <Input {...form.register('industry')} placeholder={t('accountForm.industryPlaceholder')} />
            </div>
            <div>
              <Label>{t('accountForm.sourceLabel')}</Label>
              <Input {...form.register('source')} placeholder={t('accountForm.sourcePlaceholder')} />
            </div>
            <div>
              <Label>{t('accountForm.websiteLabel')}</Label>
              <Input {...form.register('website')} placeholder={t('accountForm.websitePlaceholder')} />
            </div>
            <div>
              <Label>{t('accountForm.phoneLabel')}</Label>
              <Input {...form.register('phone')} placeholder={t('accountForm.phonePlaceholder')} />
            </div>
            <div>
              <Label>{t('accountForm.emailLabel')}</Label>
              <Input {...form.register('email')} placeholder={t('accountForm.emailPlaceholder')} />
            </div>
            <div>
              <Label>{t('accountForm.annualRevenueLabel')}</Label>
              <Input type="number" {...form.register('annualRevenue')} />
            </div>
            <div>
              <Label>{t('accountForm.employeeCountLabel')}</Label>
              <Input type="number" {...form.register('employeeCount')} />
            </div>
          </div>

          <h3 className="text-sm font-medium pt-2">{t('accounts.address')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>{t('accountForm.addressLine1Label')}</Label>
              <Input {...form.register('addressLine1')} />
            </div>
            <div className="sm:col-span-2">
              <Label>{t('accountForm.addressLine2Label')}</Label>
              <Input {...form.register('addressLine2')} />
            </div>
            <div>
              <Label>{t('accountForm.cityLabel')}</Label>
              <Input {...form.register('city')} />
            </div>
            <div>
              <Label>{t('accountForm.stateLabel')}</Label>
              <Input {...form.register('state')} />
            </div>
            <div>
              <Label>{t('accountForm.countryLabel')}</Label>
              <Input {...form.register('country')} />
            </div>
            <div>
              <Label>{t('accountForm.postalCodeLabel')}</Label>
              <Input {...form.register('postalCode')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('common.saving') : isEdit ? t('accountForm.saveBtn') : t('accountForm.createBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
