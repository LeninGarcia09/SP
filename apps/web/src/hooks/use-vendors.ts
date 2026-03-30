import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVendors,
  fetchVendor,
  createVendor,
  updateVendor,
  deleteVendor,
} from '../lib/api';
import type { PaginationParams } from '../lib/api';

export function useVendors(params?: PaginationParams) {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: () => fetchVendors(params),
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: () => fetchVendor(id),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      updateVendor(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['vendors'] });
      qc.invalidateQueries({ queryKey: ['vendors', variables.id] });
    },
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
}
