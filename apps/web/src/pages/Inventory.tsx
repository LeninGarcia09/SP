import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInventoryItems, useImportInventory } from '../hooks/use-inventory';
import { InventoryItemFormDialog } from '../components/inventory/InventoryItemFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();
  const inventory = useInventoryItems({ page, limit: 25, search: search || undefined });
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const importMutation = useImportInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleNew() {
    setDialogOpen(true);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
    e.target.value = '';
  }

  return (
    <div>
      <InventoryItemFormDialog open={dialogOpen} onOpenChange={setDialogOpen} item={null} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">{t('inventory.title')}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder={t('inventory.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-64"
          />
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}>
            {importMutation.isPending ? t('inventory.importing') : t('inventory.importExcel')}
          </Button>
          <Button onClick={handleNew}>{t('inventory.addItem')}</Button>
        </div>
      </div>

      {importMutation.isSuccess && importMutation.data?.data && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {t('inventory.importSuccess', { created: importMutation.data.data.imported, skipped: importMutation.data.data.skipped })}
          {importMutation.data.data.errors.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer underline">
                {t('inventory.importErrors', { count: importMutation.data.data.errors.length })}
              </summary>
              <ul className="mt-1 list-disc pl-4">
                {importMutation.data.data.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {importMutation.isError && (
        <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {t('inventory.importFailed')}
        </div>
      )}

      {inventory.isLoading && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          {t('common.loading')}
        </div>
      )}

      {inventory.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {t('inventory.error')}
        </div>
      )}

      {inventory.data?.data && inventory.data.data.length === 0 && (
        <div className="rounded-lg border">
          <div className="p-6 text-center text-muted-foreground">
            {t('inventory.empty')}
          </div>
        </div>
      )}

      {inventory.data?.data && inventory.data.data.length > 0 && (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('inventory.sku')}</th>
                  <th className="text-left p-3 font-medium">{t('common.name')}</th>
                  <th className="text-left p-3 font-medium">{t('common.category')}</th>
                  <th className="text-left p-3 font-medium">{t('common.status')}</th>
                  <th className="text-left p-3 font-medium">{t('inventory.location')}</th>
                  <th className="text-left p-3 font-medium">{t('inventory.serialNumber')}</th>
                </tr>
              </thead>
              <tbody>
                {inventory.data.data.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/25 cursor-pointer" onClick={() => navigate(`/inventory/${item.id}`)}>
                    <td className="p-3 font-mono text-xs">{item.sku}</td>
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3">{t(`inventoryForm.categories.${item.category}`)}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        item.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                        item.status === 'CHECKED_OUT' ? 'bg-yellow-100 text-yellow-700' :
                        item.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700' :
                        item.status === 'RETIRED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t(`statuses.${item.status}`)}
                      </span>
                    </td>
                    <td className="p-3">{item.location ?? t('common.noData')}</td>
                    <td className="p-3 font-mono text-xs">{item.serialNumber ?? t('common.noData')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inventory.data.meta && inventory.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">
                {t('common.page', { page: inventory.data.meta.page, totalPages: inventory.data.meta.totalPages, total: inventory.data.meta.total })}
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t('common.previous')}
                </button>
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={page >= (inventory.data.meta.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
