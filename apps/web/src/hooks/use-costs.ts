import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCostEntries,
  createCostEntry,
  updateCostEntry,
  deleteCostEntry,
  submitCostEntry,
  approveCostEntry,
  rejectCostEntry,
  transferCostEntry,
  fetchCostSummary,
} from '../lib/api';

export function useCostEntries(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'costs'],
    queryFn: () => fetchCostEntries(projectId),
    enabled: !!projectId,
  });
}

export function useCostSummary(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'cost-summary'],
    queryFn: () => fetchCostSummary(projectId),
    enabled: !!projectId,
  });
}

export function useCreateCostEntry(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createCostEntry(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'costs'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'cost-summary'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useUpdateCostEntry(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ costId, ...body }: { costId: string } & Record<string, unknown>) =>
      updateCostEntry(projectId, costId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'costs'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'cost-summary'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useDeleteCostEntry(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (costId: string) => deleteCostEntry(projectId, costId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'costs'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'cost-summary'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useSubmitCostEntry(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (costId: string) => submitCostEntry(costId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'costs'] });
    },
  });
}

export function useApproveCostEntry(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (costId: string) => approveCostEntry(costId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'costs'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'cost-summary'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useRejectCostEntry(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ costId, reason }: { costId: string; reason?: string }) =>
      rejectCostEntry(costId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'costs'] });
    },
  });
}

export function useTransferCostEntry(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ costId, targetProjectId, reason }: { costId: string; targetProjectId: string; reason?: string }) =>
      transferCostEntry(costId, targetProjectId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'costs'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'cost-summary'] });
    },
  });
}
