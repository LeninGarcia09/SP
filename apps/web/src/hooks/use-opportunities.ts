import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOpportunities,
  fetchOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  convertOpportunity,
} from '../lib/api';
import type { PaginationParams } from '../lib/api';

export function useOpportunities(params?: PaginationParams) {
  return useQuery({
    queryKey: ['opportunities', params],
    queryFn: () => fetchOpportunities(params),
  });
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: ['opportunities', id],
    queryFn: () => fetchOpportunity(id),
    enabled: !!id,
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOpportunity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      updateOpportunity(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['opportunities', variables.id] });
    },
  });
}

export function useDeleteOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteOpportunity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

export function useConvertOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      convertOpportunity(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['opportunities', variables.id] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
