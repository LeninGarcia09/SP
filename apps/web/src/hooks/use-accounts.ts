import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAccounts,
  fetchAccount,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../lib/api';
import type { PaginationParams } from '../lib/api';

export function useAccounts(params?: PaginationParams) {
  return useQuery({
    queryKey: ['accounts', params],
    queryFn: () => fetchAccounts(params),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ['accounts', id],
    queryFn: () => fetchAccount(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      updateAccount(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['accounts', variables.id] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
