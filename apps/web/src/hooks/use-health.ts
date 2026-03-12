import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchHealthHistory,
  triggerHealthCalculation,
  overrideHealth,
} from '../lib/api';

export function useHealthHistory(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'health'],
    queryFn: () => fetchHealthHistory(projectId),
    enabled: !!projectId,
  });
}

export function useTriggerHealth(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => triggerHealthCalculation(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'health'] });
    },
  });
}

export function useOverrideHealth(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { overallRag: string; overrideReason: string }) =>
      overrideHealth(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'health'] });
    },
  });
}
