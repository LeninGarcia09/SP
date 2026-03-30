import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../hooks/use-products';
import { usePermissions } from '../hooks/use-permissions';
import { ProductFormDialog } from '../components/products/ProductFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import type { Product } from '@telnub/shared';

const categoryColors: Record<string, string> = {
  SERVICE: 'bg-blue-100 text-blue-800',
  PRODUCT: 'bg-green-100 text-green-800',
  SUBSCRIPTION: 'bg-purple-100 text-purple-800',
  LICENSE: 'bg-indigo-100 text-indigo-800',
  CONSULTING: 'bg-amber-100 text-amber-800',
  TRAINING: 'bg-teal-100 text-teal-800',
  SUPPORT: 'bg-sky-100 text-sky-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export function ProductsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const { data, isLoading, error } = useProducts({ page, limit: 25, search: search || undefined });
  const { can } = usePermissions();
  const products = data?.data ?? [];
  const meta = data?.meta;

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditProduct(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('products.title')}</h1>
        {can('products.create') && (
          <Button onClick={() => setDialogOpen(true)}>{t('products.new')}</Button>
        )}
      </div>

      <Input
        placeholder={t('products.search')}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-full sm:max-w-sm"
      />

      {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
      {error && <p className="text-destructive">{t('products.error')}</p>}

      {!isLoading && !error && (
        <>
          {products.length === 0 ? (
            <p className="text-muted-foreground">{t('products.empty')}</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">{t('common.code')}</th>
                    <th className="text-left p-3 font-medium">{t('common.name')}</th>
                    <th className="text-left p-3 font-medium">{t('products.category')}</th>
                    <th className="text-left p-3 font-medium">{t('products.vendor')}</th>
                    <th className="text-left p-3 font-medium">{t('products.family')}</th>
                    <th className="text-right p-3 font-medium">{t('products.unitPrice')}</th>
                    <th className="text-center p-3 font-medium">{t('products.recurring')}</th>
                    <th className="text-center p-3 font-medium">{t('common.status')}</th>
                    <th className="text-right p-3 font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-mono text-xs">{product.code}</td>
                      <td className="p-3 font-medium">{product.name}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${categoryColors[product.category] ?? 'bg-gray-100 text-gray-800'}`}>
                          {product.category}
                        </span>
                      </td>
                      <td className="p-3">{product.vendor?.name ?? '—'}</td>
                      <td className="p-3">{product.family ?? '—'}</td>
                      <td className="p-3 text-right font-mono">
                        {product.currency} {Number(product.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        {product.isRecurring ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {product.recurringInterval ?? 'Yes'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {product.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {can('products.update') && (
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                            {t('common.edit')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('common.pageAlt', { page: meta.page, totalPages: meta.totalPages, total: meta.total })}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.previous')}</Button>
                <Button size="sm" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>{t('common.next')}</Button>
              </div>
            </div>
          )}
        </>
      )}

      <ProductFormDialog open={dialogOpen} onOpenChange={handleDialogClose} product={editProduct} />
    </div>
  );
}
