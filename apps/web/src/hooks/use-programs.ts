import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPrograms,
  fetchProgram,
  createProgram,
  updateProgram,
  deleteProgram,
} from '../lib/api';
import type { PaginationParams } from '../lib/api';

export function usePrograms(params?: PaginationParams) {
  return useQuery({
    queryKey: ['programs', params],
    queryFn: () => fetchPrograms(params),
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ['programs', id],
    queryFn: () => fetchProgram(id),
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProgram,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      updateProgram(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['programs'] });
      qc.invalidateQueries({ queryKey: ['programs', variables.id] });
    },
  });
}

export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}
