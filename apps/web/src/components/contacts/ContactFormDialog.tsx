import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ContactChannel, ContactType, ContactInfluence } from '@telnub/shared';
import type { Contact } from '@telnub/shared';
import { useCreateContact, useUpdateContact } from '../../hooks/use-contacts';
import { useAccounts } from '../../hooks/use-accounts';
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

const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email().max(200).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  mobilePhone: z.string().max(50).optional().or(z.literal('')),
  jobTitle: z.string().max(200).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
  accountId: z.string().min(1, 'Account is required'),
  type: z.nativeEnum(ContactType),
  influence: z.nativeEnum(ContactInfluence).optional(),
  preferredChannel: z.nativeEnum(ContactChannel),
  linkedinUrl: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
}

export function ContactFormDialog({ open, onOpenChange, contact }: ContactFormDialogProps) {
  const isEdit = !!contact;
  const { t } = useTranslation();
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const accountsQuery = useAccounts({ limit: 100 });
  const accounts = accountsQuery.data?.data ?? [];

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: contact
      ? {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email ?? '',
          phone: contact.phone ?? '',
          mobilePhone: contact.mobilePhone ?? '',
          jobTitle: contact.jobTitle ?? '',
          department: contact.department ?? '',
          accountId: contact.accountId,
          type: contact.type,
          influence: contact.influence ?? undefined,
          preferredChannel: contact.preferredChannel,
          linkedinUrl: contact.linkedinUrl ?? '',
          notes: contact.notes ?? '',
        }
      : {
          firstName: '',
          lastName: '',
          type: ContactType.OTHER,
          preferredChannel: ContactChannel.EMAIL,
          accountId: '',
        },
  });

  const onSubmit = (values: ContactFormValues) => {
    const payload: Record<string, unknown> = { ...values };
    for (const key of Object.keys(payload)) {
      if (payload[key] === '') delete payload[key];
    }

    if (isEdit) {
      updateMutation.mutate(
        { id: contact!.id, ...payload },
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
          <DialogTitle>{isEdit ? t('contactForm.editTitle') : t('contactForm.newTitle')}</DialogTitle>
          <DialogDescription>{isEdit ? t('contactForm.editDesc') : t('contactForm.newDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('contactForm.firstNameLabel')}</Label>
              <Input {...form.register('firstName')} placeholder={t('contactForm.firstNamePlaceholder')} />
              {form.formState.errors.firstName && <p className="text-xs text-destructive mt-1">{form.formState.errors.firstName.message}</p>}
            </div>
            <div>
              <Label>{t('contactForm.lastNameLabel')}</Label>
              <Input {...form.register('lastName')} placeholder={t('contactForm.lastNamePlaceholder')} />
              {form.formState.errors.lastName && <p className="text-xs text-destructive mt-1">{form.formState.errors.lastName.message}</p>}
            </div>
            <div>
              <Label>{t('contactForm.emailLabel')}</Label>
              <Input type="email" {...form.register('email')} placeholder={t('contactForm.emailPlaceholder')} />
            </div>
            <div>
              <Label>{t('contactForm.phoneLabel')}</Label>
              <Input {...form.register('phone')} placeholder={t('contactForm.phonePlaceholder')} />
            </div>
            <div>
              <Label>{t('contactForm.mobilePhoneLabel')}</Label>
              <Input {...form.register('mobilePhone')} placeholder={t('contactForm.mobilePhonePlaceholder')} />
            </div>
            <div>
              <Label>{t('contactForm.accountLabel')}</Label>
              <Select
                value={form.watch('accountId')}
                onValueChange={(v) => form.setValue('accountId', v)}
              >
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.accountId && <p className="text-xs text-destructive mt-1">{form.formState.errors.accountId.message}</p>}
            </div>
            <div>
              <Label>{t('contactForm.jobTitleLabel')}</Label>
              <Input {...form.register('jobTitle')} placeholder={t('contactForm.jobTitlePlaceholder')} />
            </div>
            <div>
              <Label>{t('contactForm.departmentLabel')}</Label>
              <Input {...form.register('department')} placeholder={t('contactForm.departmentPlaceholder')} />
            </div>
            <div>
              <Label>{t('contactForm.typeLabel')}</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(v) => form.setValue('type', v as ContactType)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(ContactType).map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('contactForm.influenceLabel')}</Label>
              <Select
                value={form.watch('influence') ?? ''}
                onValueChange={(v) => form.setValue('influence', v as ContactInfluence)}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {Object.values(ContactInfluence).map((v) => (
                    <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('contactForm.channelLabel')}</Label>
              <Select
                value={form.watch('preferredChannel')}
                onValueChange={(v) => form.setValue('preferredChannel', v as ContactChannel)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(ContactChannel).map((v) => (
                    <SelectItem key={v} value={v}>{v.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('contactForm.linkedinLabel')}</Label>
              <Input {...form.register('linkedinUrl')} placeholder={t('contactForm.linkedinPlaceholder')} />
            </div>
          </div>

          <div>
            <Label>{t('contactForm.notesLabel')}</Label>
            <Textarea {...form.register('notes')} placeholder={t('contactForm.notesPlaceholder')} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('common.saving') : isEdit ? t('contactForm.saveBtn') : t('contactForm.createBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
