import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInventoryItems,
  fetchInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  fetchInventoryTransactions,
  createInventoryTransaction,
} from '../lib/api';
import type { PaginationParams } from '../lib/api';

// ─── Items ───

export function useInventoryItems(params?: PaginationParams) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => fetchInventoryItems(params),
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => fetchInventoryItem(id),
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      updateInventoryItem(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inventory', variables.id] });
    },
  });
}

// ─── Transactions ───

export function useInventoryTransactions(itemId: string) {
  return useQuery({
    queryKey: ['inventory', itemId, 'transactions'],
    queryFn: () => fetchInventoryTransactions(itemId),
    enabled: !!itemId,
  });
}

export function useCreateInventoryTransaction(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createInventoryTransaction(itemId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', itemId, 'transactions'] });
      qc.invalidateQueries({ queryKey: ['inventory', itemId] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
