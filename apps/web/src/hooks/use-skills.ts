import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSkills,
  fetchSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  fetchPersonSkills,
  assignPersonSkill,
  updatePersonSkill,
  removePersonSkill,
} from '../lib/api';
import type { PaginationParams } from '../lib/api';

// ─── Skills Catalog ───

export function useSkills(params?: PaginationParams) {
  return useQuery({
    queryKey: ['skills', params],
    queryFn: () => fetchSkills(params),
  });
}

export function useSkill(id: string) {
  return useQuery({
    queryKey: ['skills', id],
    queryFn: () => fetchSkill(id),
    enabled: !!id,
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSkill,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      updateSkill(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['skills'] });
      qc.invalidateQueries({ queryKey: ['skills', variables.id] });
    },
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSkill,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

// ─── Person Skills ───

export function usePersonSkills(personId: string) {
  return useQuery({
    queryKey: ['personnel', personId, 'skills'],
    queryFn: () => fetchPersonSkills(personId),
    enabled: !!personId,
  });
}

export function useAssignPersonSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ personId, ...body }: { personId: string } & Record<string, unknown>) =>
      assignPersonSkill(personId, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['personnel', variables.personId, 'skills'] });
    },
  });
}

export function useUpdatePersonSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ personId, skillId, ...body }: { personId: string; skillId: string } & Record<string, unknown>) =>
      updatePersonSkill(personId, skillId, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['personnel', variables.personId, 'skills'] });
    },
  });
}

export function useRemovePersonSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ personId, skillId }: { personId: string; skillId: string }) =>
      removePersonSkill(personId, skillId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['personnel', variables.personId, 'skills'] });
    },
  });
}
