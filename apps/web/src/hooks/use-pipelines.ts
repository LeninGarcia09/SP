import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPipelines,
  fetchPipeline,
  createPipeline,
  updatePipeline,
  deletePipeline,
  fetchPipelineStages,
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
} from '../lib/api';
import type { PaginationParams } from '../lib/api';

export function usePipelines(params?: PaginationParams) {
  return useQuery({
    queryKey: ['pipelines', params],
    queryFn: () => fetchPipelines(params),
  });
}

export function usePipeline(id: string) {
  return useQuery({
    queryKey: ['pipelines', id],
    queryFn: () => fetchPipeline(id),
    enabled: !!id,
  });
}

export function useCreatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPipeline,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

export function useUpdatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      updatePipeline(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['pipelines'] });
      qc.invalidateQueries({ queryKey: ['pipelines', variables.id] });
    },
  });
}

export function useDeletePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePipeline,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

export function usePipelineStages(pipelineId: string) {
  return useQuery({
    queryKey: ['pipelines', pipelineId, 'stages'],
    queryFn: () => fetchPipelineStages(pipelineId),
    enabled: !!pipelineId,
  });
}

export function useCreatePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pipelineId, ...body }: { pipelineId: string } & Record<string, unknown>) =>
      createPipelineStage(pipelineId, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['pipelines', variables.pipelineId, 'stages'] });
      qc.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

export function useUpdatePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, ...body }: { stageId: string } & Record<string, unknown>) =>
      updatePipelineStage(stageId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}

export function useDeletePipelineStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePipelineStage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });
}
