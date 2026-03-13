import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AssetCategory } from '@bizops/shared';
import type { InventoryItem } from '@bizops/shared';
import { useCreateInventoryItem, useUpdateInventoryItem } from '../../hooks/use-inventory';
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

const inventoryFormSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000),
  category: z.nativeEnum(AssetCategory),
  serialNumber: z.string().max(100),
  location: z.string().max(200),
  purchaseDate: z.string(),
  purchaseCost: z.coerce.number().nonnegative().optional(),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

interface InventoryItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
}

export function InventoryItemFormDialog({ open, onOpenChange, item }: InventoryItemFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!item;
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: item
      ? {
          sku: item.sku,
          name: item.name,
          description: item.description ?? '',
          category: item.category,
          serialNumber: item.serialNumber ?? '',
          location: item.location ?? '',
          purchaseDate: item.purchaseDate ?? '',
          purchaseCost: item.purchaseCost ?? undefined,
        }
      : {
          sku: '',
          name: '',
          description: '',
          category: AssetCategory.TOOL_EQUIPMENT,
          serialNumber: '',
          location: '',
          purchaseDate: '',
          purchaseCost: undefined,
        },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: InventoryFormValues) {
    const payload = {
      ...values,
      description: values.description || null,
      serialNumber: values.serialNumber || null,
      location: values.location || null,
      purchaseDate: values.purchaseDate || null,
      purchaseCost: values.purchaseCost ?? null,
    };

    if (isEdit && item) {
      await updateMutation.mutateAsync({ id: item.id, ...payload });
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
          <DialogTitle>{isEdit ? t('inventoryForm.editTitle') : t('inventoryForm.newTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('inventoryForm.editDesc') : t('inventoryForm.newDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">{t('inventoryForm.skuLabel')}</Label>
              <Input id="sku" {...form.register('sku')} placeholder={t('inventoryForm.skuPlaceholder')} disabled={isEdit} />
              {form.formState.errors.sku && (
                <p className="text-sm text-destructive">{form.formState.errors.sku.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('inventoryForm.nameLabel')}</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('inventoryForm.descLabel')}</Label>
            <Textarea id="description" {...form.register('description')} rows={2} placeholder={t('inventoryForm.descPlaceholder')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t('inventoryForm.categoryLabel')}</Label>
            <Select
              value={form.watch('category')}
              onValueChange={(v) => form.setValue('category', v as AssetCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(AssetCategory).map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`inventoryForm.categories.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">{t('inventoryForm.serialLabel')}</Label>
              <Input id="serialNumber" {...form.register('serialNumber')} placeholder={t('inventoryForm.serialPlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t('inventoryForm.locationLabel')}</Label>
              <Input id="location" {...form.register('location')} placeholder={t('inventoryForm.locationPlaceholder')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">{t('inventoryForm.purchaseDateLabel')}</Label>
              <Input id="purchaseDate" type="date" {...form.register('purchaseDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseCost">{t('inventoryForm.purchaseCostLabel')}</Label>
              <Input id="purchaseCost" type="number" step="0.01" min="0" {...form.register('purchaseCost')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.saving') : isEdit ? t('inventoryForm.saveBtn') : t('inventoryForm.createBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
