import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVendors } from '../hooks/use-vendors';
import { usePermissions } from '../hooks/use-permissions';
import { VendorFormDialog } from '../components/vendors/VendorFormDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import type { Vendor } from '@telnub/shared';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
};

export function VendorsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);

  const { data, isLoading, error } = useVendors({ page, limit: 25, search: search || undefined });
  const { can } = usePermissions();
  const vendors = data?.data ?? [];
  const meta = data?.meta;

  const handleEdit = (vendor: Vendor) => {
    setEditVendor(vendor);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditVendor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('vendors.title')}</h1>
        {can('vendors.create') && (
          <Button onClick={() => setDialogOpen(true)}>{t('vendors.new')}</Button>
        )}
      </div>

      <Input
        placeholder={t('vendors.search')}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-full sm:max-w-sm"
      />

      {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}
      {error && <p className="text-destructive">{t('vendors.error')}</p>}

      {!isLoading && !error && (
        <>
          {vendors.length === 0 ? (
            <p className="text-muted-foreground">{t('vendors.empty')}</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">{t('common.code')}</th>
                    <th className="text-left p-3 font-medium">{t('common.name')}</th>
                    <th className="text-left p-3 font-medium">{t('vendors.contactPerson')}</th>
                    <th className="text-left p-3 font-medium">{t('vendors.email')}</th>
                    <th className="text-left p-3 font-medium">{t('vendors.phone')}</th>
                    <th className="text-left p-3 font-medium">{t('vendors.country')}</th>
                    <th className="text-center p-3 font-medium">{t('common.status')}</th>
                    <th className="text-right p-3 font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-mono text-xs">{vendor.code}</td>
                      <td className="p-3 font-medium">{vendor.name}</td>
                      <td className="p-3">{vendor.contactPerson ?? '—'}</td>
                      <td className="p-3">{vendor.email ?? '—'}</td>
                      <td className="p-3">{vendor.phone ?? '—'}</td>
                      <td className="p-3">{vendor.country ?? '—'}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[vendor.status] ?? 'bg-gray-100 text-gray-800'}`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {can('vendors.update') && (
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(vendor)}>
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

      <VendorFormDialog open={dialogOpen} onOpenChange={handleDialogClose} vendor={editVendor} />
    </div>
  );
}
