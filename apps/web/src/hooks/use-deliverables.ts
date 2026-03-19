import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDeliverables,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
  fetchDeliverableTaskCosts,
  fetchTaskCostBreakdowns,
} from '../lib/api';

export function useDeliverables(projectId: string | undefined) {
  return useQuery({
    queryKey: ['deliverables', projectId],
    queryFn: () => fetchDeliverables(projectId!),
    enabled: !!projectId,
    select: (res) => res.data,
  });
}

export function useCreateDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createDeliverable(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliverables', projectId] });
    },
  });
}

export function useUpdateDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) =>
      updateDeliverable(projectId, id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliverables', projectId] });
    },
  });
}

export function useDeleteDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDeliverable(projectId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliverables', projectId] });
    },
  });
}

export function useDeliverableTaskCosts(projectId: string, deliverableId: string | undefined) {
  return useQuery({
    queryKey: ['deliverable-task-costs', projectId, deliverableId],
    queryFn: () => fetchDeliverableTaskCosts(projectId, deliverableId!),
    enabled: !!deliverableId,
    select: (res) => res.data,
  });
}

export function useTaskCostBreakdowns(projectId: string | undefined) {
  return useQuery({
    queryKey: ['task-costs', projectId],
    queryFn: () => fetchTaskCostBreakdowns(projectId!),
    enabled: !!projectId,
    select: (res) => res.data,
  });
}
