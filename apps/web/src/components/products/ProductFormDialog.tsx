import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ProductCategory, RecurringInterval } from '@telnub/shared';
import type { Product } from '@telnub/shared';
import { useCreateProduct, useUpdateProduct } from '../../hooks/use-products';
import { useVendors } from '../../hooks/use-vendors';
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

const productFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(5000).optional().or(z.literal('')),
  category: z.nativeEnum(ProductCategory),
  family: z.string().max(100).optional().or(z.literal('')),
  vendorId: z.string().uuid().optional().or(z.literal('')),
  unitPrice: z.coerce.number().nonnegative(),
  currency: z.string().max(3),
  unit: z.string().max(50),
  isRecurring: z.boolean(),
  recurringInterval: z.nativeEnum(RecurringInterval).optional().or(z.literal('')),
  minQuantity: z.coerce.number().int().min(1),
  maxDiscount: z.coerce.number().min(0).max(100),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const isEdit = !!product;
  const { t } = useTranslation();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { data: vendorsData } = useVendors({ limit: 100 });
  const vendors = vendorsData?.data ?? [];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: ProductCategory.SERVICE,
      family: '',
      vendorId: '',
      unitPrice: 0,
      currency: 'USD',
      unit: 'unit',
      isRecurring: false,
      recurringInterval: '',
      minQuantity: 1,
      maxDiscount: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (product) {
        form.reset({
          name: product.name,
          description: product.description ?? '',
          category: product.category,
          family: product.family ?? '',
          vendorId: product.vendorId ?? '',
          unitPrice: Number(product.unitPrice),
          currency: product.currency,
          unit: product.unit,
          isRecurring: product.isRecurring,
          recurringInterval: product.recurringInterval ?? '',
          minQuantity: product.minQuantity,
          maxDiscount: Number(product.maxDiscount),
        });
      } else {
        form.reset({
          name: '',
          description: '',
          category: ProductCategory.SERVICE,
          family: '',
          vendorId: '',
          unitPrice: 0,
          currency: 'USD',
          unit: 'unit',
          isRecurring: false,
          recurringInterval: '',
          minQuantity: 1,
          maxDiscount: 0,
        });
      }
    }
  }, [open, product, form]);

  const onSubmit = (values: ProductFormValues) => {
    const payload: Record<string, unknown> = { ...values };
    for (const key of Object.keys(payload)) {
      if (payload[key] === '') delete payload[key];
    }

    if (isEdit) {
      updateMutation.mutate(
        { id: product!.id, ...payload },
        { onSuccess: () => { onOpenChange(false); } },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { onOpenChange(false); },
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const watchRecurring = form.watch('isRecurring');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('productForm.editTitle') : t('productForm.newTitle')}</DialogTitle>
          <DialogDescription>{isEdit ? t('productForm.editDesc') : t('productForm.newDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t('common.name')} *</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="category">{t('products.category')}</Label>
              <Select value={form.watch('category')} onValueChange={(v) => form.setValue('category', v as ProductCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(ProductCategory).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vendorId">{t('products.vendor')}</Label>
              <Select value={form.watch('vendorId') || '__none__'} onValueChange={(v) => form.setValue('vendorId', v === '__none__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder={t('products.selectVendor')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— {t('common.none')} —</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="family">{t('products.family')}</Label>
              <Input id="family" {...form.register('family')} />
            </div>
            <div>
              <Label htmlFor="unitPrice">{t('products.unitPrice')}</Label>
              <Input id="unitPrice" type="number" step="0.01" min="0" {...form.register('unitPrice')} />
            </div>
            <div>
              <Label htmlFor="currency">{t('products.currency')}</Label>
              <Input id="currency" {...form.register('currency')} maxLength={3} />
            </div>
            <div>
              <Label htmlFor="unit">{t('products.unit')}</Label>
              <Input id="unit" {...form.register('unit')} />
            </div>
            <div>
              <Label htmlFor="minQuantity">{t('products.minQuantity')}</Label>
              <Input id="minQuantity" type="number" min="1" {...form.register('minQuantity')} />
            </div>
            <div>
              <Label htmlFor="maxDiscount">{t('products.maxDiscount')}</Label>
              <Input id="maxDiscount" type="number" min="0" max="100" step="0.01" {...form.register('maxDiscount')} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isRecurring"
                {...form.register('isRecurring')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isRecurring">{t('products.recurring')}</Label>
            </div>
            {watchRecurring && (
              <div>
                <Label htmlFor="recurringInterval">{t('products.interval')}</Label>
                <Select value={form.watch('recurringInterval') || '__none__'} onValueChange={(v) => form.setValue('recurringInterval', v === '__none__' ? '' : v as RecurringInterval)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— {t('common.none')} —</SelectItem>
                    {Object.values(RecurringInterval).map((int) => (
                      <SelectItem key={int} value={int}>{int}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="description">{t('common.description')}</Label>
            <textarea
              id="description"
              {...form.register('description')}
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
