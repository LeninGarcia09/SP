import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPersonnel,
  fetchPerson,
  createPerson,
  updatePerson,
  fetchAssignmentsByPerson,
  fetchAssignmentsByProject,
  fetchAllActiveAssignments,
  createAssignment,
  updateAssignment,
  fetchResourceMatches,
} from '../lib/api';
import type { PaginationParams } from '../lib/api';

// ─── Persons ───

export function usePersonnel(params?: PaginationParams) {
  return useQuery({
    queryKey: ['personnel', params],
    queryFn: () => fetchPersonnel(params),
  });
}

export function usePerson(id: string) {
  return useQuery({
    queryKey: ['personnel', id],
    queryFn: () => fetchPerson(id),
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPerson,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personnel'] });
    },
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      updatePerson(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['personnel'] });
      qc.invalidateQueries({ queryKey: ['personnel', variables.id] });
    },
  });
}

// ─── Assignments ───

export function useAssignmentsByPerson(personId: string) {
  return useQuery({
    queryKey: ['personnel', personId, 'assignments'],
    queryFn: () => fetchAssignmentsByPerson(personId),
    enabled: !!personId,
  });
}

export function useAssignmentsByProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'assignments'],
    queryFn: () => fetchAssignmentsByProject(projectId),
    enabled: !!projectId,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personnel'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      updateAssignment(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personnel'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useAllActiveAssignments() {
  return useQuery({
    queryKey: ['assignments', 'active'],
    queryFn: () => fetchAllActiveAssignments(),
  });
}

// ─── Wave 3: Skills-Based Resource Matching ───

export function useResourceMatches(skills: string[], minAllocation?: number, availableFrom?: string) {
  return useQuery({
    queryKey: ['personnel', 'match', skills, minAllocation, availableFrom],
    queryFn: () => fetchResourceMatches(skills, minAllocation, availableFrom),
    enabled: skills.length > 0,
  });
}
