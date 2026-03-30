import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { VendorStatus } from '@telnub/shared';
import type { Vendor } from '@telnub/shared';
import { useCreateVendor, useUpdateVendor } from '../../hooks/use-vendors';
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

const vendorFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  legalName: z.string().max(200).optional().or(z.literal('')),
  website: z.string().max(500).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email().max(200).optional().or(z.literal('')),
  contactPerson: z.string().max(200).optional().or(z.literal('')),
  addressLine1: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  status: z.nativeEnum(VendorStatus),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

interface VendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
}

export function VendorFormDialog({ open, onOpenChange, vendor }: VendorFormDialogProps) {
  const isEdit = !!vendor;
  const { t } = useTranslation();
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: '',
      legalName: '',
      website: '',
      phone: '',
      email: '',
      contactPerson: '',
      addressLine1: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      status: VendorStatus.ACTIVE,
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (vendor) {
        form.reset({
          name: vendor.name,
          legalName: vendor.legalName ?? '',
          website: vendor.website ?? '',
          phone: vendor.phone ?? '',
          email: vendor.email ?? '',
          contactPerson: vendor.contactPerson ?? '',
          addressLine1: vendor.addressLine1 ?? '',
          city: vendor.city ?? '',
          state: vendor.state ?? '',
          country: vendor.country ?? '',
          postalCode: vendor.postalCode ?? '',
          status: vendor.status,
          notes: vendor.notes ?? '',
        });
      } else {
        form.reset({
          name: '',
          legalName: '',
          website: '',
          phone: '',
          email: '',
          contactPerson: '',
          addressLine1: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          status: VendorStatus.ACTIVE,
          notes: '',
        });
      }
    }
  }, [open, vendor, form]);

  const onSubmit = (values: VendorFormValues) => {
    const payload: Record<string, unknown> = { ...values };
    for (const key of Object.keys(payload)) {
      if (payload[key] === '') delete payload[key];
    }

    if (isEdit) {
      updateMutation.mutate(
        { id: vendor!.id, ...payload },
        { onSuccess: () => { onOpenChange(false); } },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { onOpenChange(false); },
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('vendorForm.editTitle') : t('vendorForm.newTitle')}</DialogTitle>
          <DialogDescription>{isEdit ? t('vendorForm.editDesc') : t('vendorForm.newDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t('common.name')} *</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="legalName">{t('vendors.legalName')}</Label>
              <Input id="legalName" {...form.register('legalName')} />
            </div>
            <div>
              <Label htmlFor="contactPerson">{t('vendors.contactPerson')}</Label>
              <Input id="contactPerson" {...form.register('contactPerson')} />
            </div>
            <div>
              <Label htmlFor="email">{t('vendors.email')}</Label>
              <Input id="email" type="email" {...form.register('email')} />
            </div>
            <div>
              <Label htmlFor="phone">{t('vendors.phone')}</Label>
              <Input id="phone" {...form.register('phone')} />
            </div>
            <div>
              <Label htmlFor="website">{t('vendors.website')}</Label>
              <Input id="website" {...form.register('website')} placeholder="https://" />
            </div>
            <div>
              <Label htmlFor="status">{t('common.status')}</Label>
              <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v as VendorStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(VendorStatus).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">{t('vendors.address')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="addressLine1">{t('vendors.addressLine1')}</Label>
                <Input id="addressLine1" {...form.register('addressLine1')} />
              </div>
              <div>
                <Label htmlFor="city">{t('vendors.city')}</Label>
                <Input id="city" {...form.register('city')} />
              </div>
              <div>
                <Label htmlFor="state">{t('vendors.state')}</Label>
                <Input id="state" {...form.register('state')} />
              </div>
              <div>
                <Label htmlFor="country">{t('vendors.country')}</Label>
                <Input id="country" {...form.register('country')} />
              </div>
              <div>
                <Label htmlFor="postalCode">{t('vendors.postalCode')}</Label>
                <Input id="postalCode" {...form.register('postalCode')} />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">{t('vendors.notes')}</Label>
            <textarea
              id="notes"
              {...form.register('notes')}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? t('common.loading') : t('common.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
