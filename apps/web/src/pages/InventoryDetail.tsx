import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useInventoryItem, useInventoryTransactions, useCreateInventoryTransaction } from '../hooks/use-inventory';
import { InventoryItemFormDialog } from '../components/inventory/InventoryItemFormDialog';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { TransactionType } from '@telnub/shared';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  CHECKED_OUT: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  RETIRED: 'bg-gray-100 text-gray-700',
};

const txTypeColors: Record<string, string> = {
  CHECK_OUT: 'bg-blue-100 text-blue-700',
  CHECK_IN: 'bg-green-100 text-green-700',
  TRANSFER: 'bg-purple-100 text-purple-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  RETIREMENT: 'bg-red-100 text-red-700',
};

const defaultTx = {
  transactionType: '' as string,
  toPersonId: '',
  toProjectId: '',
  notes: '',
};

export function InventoryDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = useInventoryItem(id!);
  const transactions = useInventoryTransactions(id!);
  const createTx = useCreateInventoryTransaction(id!);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txForm, setTxForm] = useState(defaultTx);

  if (item.isLoading) {
    return <div className="text-center text-muted-foreground py-12">{t('common.loading')}</div>;
  }

  if (item.isError || !item.data?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{t('inventory.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/inventory')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t('inventory.backTo')}
        </Button>
      </div>
    );
  }

  const i = item.data.data;

  function handleCreateTx() {
    if (!txForm.transactionType) return;
    createTx.mutate(
      {
        transactionType: txForm.transactionType,
        toPersonId: txForm.toPersonId || null,
        toProjectId: txForm.toProjectId || null,
        notes: txForm.notes || null,
      },
      {
        onSuccess: () => {
          setTxDialogOpen(false);
          setTxForm(defaultTx);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/inventory')}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> {t('nav.inventory')}
          </button>
          <h2 className="text-2xl font-bold">{i.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">SKU: {i.sku}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>{t('common.edit')}</Button>
        </div>
      </div>

      <InventoryItemFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} item={i} />

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.status')}</p>
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[i.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {t(`statuses.${i.status}`)}
          </span>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.category')}</p>
          <p className="font-medium text-sm">{t(`inventoryForm.categories.${i.category}`)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('inventory.purchaseDate')}</p>
          <p className="font-medium">{i.purchaseDate ?? '—'}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('inventory.purchaseCost')}</p>
          <p className="font-medium">{i.purchaseCost != null ? `$${Number(i.purchaseCost).toLocaleString()}` : '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('inventory.serialNumber')}</p>
          <p className="font-medium font-mono text-xs">{i.serialNumber ?? '—'}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('inventory.location')}</p>
          <p className="font-medium">{i.location ?? '—'}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('inventory.assignedPerson')}</p>
          <p className="font-medium font-mono text-xs">{i.assignedToPersonId ?? '—'}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('inventory.assignedProject')}</p>
          <p className="font-medium font-mono text-xs">{i.assignedToProjectId ?? '—'}</p>
        </div>
      </div>

      {i.description && (
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('common.description')}</p>
          <p className="text-sm whitespace-pre-wrap">{i.description}</p>
        </div>
      )}

      {/* Transactions Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{t('inventory.transactionHistory')}</h3>
          <Button size="sm" onClick={() => setTxDialogOpen(true)}>{t('inventory.newTransaction')}</Button>
        </div>

        {transactions.isLoading && (
          <div className="rounded-lg border p-4 text-center text-muted-foreground">{t('inventory.loadingTransactions')}</div>
        )}

        {transactions.data?.data && transactions.data.data.length === 0 && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            {t('inventory.noTransactions')}
          </div>
        )}

        {transactions.data?.data && transactions.data.data.length > 0 && (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">{t('common.type')}</th>
                  <th className="text-left p-3 font-medium">{t('common.date')}</th>
                  <th className="text-left p-3 font-medium">{t('inventory.toPerson')}</th>
                  <th className="text-left p-3 font-medium">{t('inventory.toProject')}</th>
                  <th className="text-left p-3 font-medium">{t('common.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.data.data.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${txTypeColors[tx.transactionType] ?? 'bg-gray-100 text-gray-700'}`}>
                        {t(`transactions.${tx.transactionType}`)}
                      </span>
                    </td>
                    <td className="p-3">{new Date(tx.transactionDate).toLocaleString()}</td>
                    <td className="p-3 font-mono text-xs">{tx.toPersonId ?? '—'}</td>
                    <td className="p-3 font-mono text-xs">{tx.toProjectId ?? '—'}</td>
                    <td className="p-3 text-muted-foreground">{tx.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transaction Dialog */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inventory.newTransaction')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('common.type')}</Label>
              <Select value={txForm.transactionType} onValueChange={(v) => setTxForm((prev) => ({ ...prev, transactionType: v }))}>
                <SelectTrigger><SelectValue placeholder={t('common.type')} /></SelectTrigger>
                <SelectContent>
                  {Object.values(TransactionType).map((tt) => (
                    <SelectItem key={tt} value={tt}>{t(`transactions.${tt}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('inventory.toPersonId')}</Label>
              <Input value={txForm.toPersonId} onChange={(e) => setTxForm((prev) => ({ ...prev, toPersonId: e.target.value }))} placeholder={t('common.optional')} />
            </div>
            <div>
              <Label>{t('inventory.toProjectId')}</Label>
              <Input value={txForm.toProjectId} onChange={(e) => setTxForm((prev) => ({ ...prev, toProjectId: e.target.value }))} placeholder={t('common.optional')} />
            </div>
            <div>
              <Label>{t('common.notes')}</Label>
              <Textarea value={txForm.notes} onChange={(e) => setTxForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreateTx} disabled={!txForm.transactionType || createTx.isPending}>
              {createTx.isPending ? t('common.saving') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
