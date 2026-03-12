import { useState } from 'react';
import { useInventoryItems } from '../hooks/use-inventory';

export function InventoryPage() {
  const [page, setPage] = useState(1);
  const inventory = useInventoryItems({ page, limit: 25 });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Inventory</h2>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Add Item
        </button>
      </div>

      {inventory.isLoading && (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          Loading inventory…
        </div>
      )}

      {inventory.isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load inventory. Is the API running?
        </div>
      )}

      {inventory.data?.data && inventory.data.data.length === 0 && (
        <div className="rounded-lg border">
          <div className="p-6 text-center text-muted-foreground">
            No inventory items yet. Add your first item to start tracking.
          </div>
        </div>
      )}

      {inventory.data?.data && inventory.data.data.length > 0 && (
        <>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">SKU</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">Serial #</th>
                </tr>
              </thead>
              <tbody>
                {inventory.data.data.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/25 cursor-pointer">
                    <td className="p-3 font-mono text-xs">{item.sku}</td>
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3">{item.category.replace(/_/g, ' ')}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        item.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                        item.status === 'CHECKED_OUT' ? 'bg-yellow-100 text-yellow-700' :
                        item.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700' :
                        item.status === 'RETIRED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3">{item.location ?? '—'}</td>
                    <td className="p-3 font-mono text-xs">{item.serialNumber ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inventory.data.meta && inventory.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground">
                Page {inventory.data.meta.page} of {inventory.data.meta.totalPages} · {inventory.data.meta.total} total
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={page >= (inventory.data.meta.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
