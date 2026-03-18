import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,
  fetchProjectMembers,
  addProjectMember,
  removeProjectMember,
  fetchProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
  fetchProjectHoursSummary,
} from '../lib/api';
import type { PaginationParams } from '../lib/api';

export function useProjects(params?: PaginationParams) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => fetchProjects(params),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      updateProject(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['projects', variables.id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// ─── Members ───

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: !!projectId,
  });
}

export function useAddProjectMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, ...body }: { projectId: string; userId: string; role?: string }) =>
      addProjectMember(projectId, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['projects', variables.projectId, 'members'] });
    },
  });
}

export function useRemoveProjectMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeProjectMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// ─── Notes ───

export function useProjectNotes(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'notes'],
    queryFn: () => fetchProjectNotes(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProjectNote(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: string; isPinned?: boolean }) =>
      createProjectNote(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'notes'] });
    },
  });
}

export function useUpdateProjectNote(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, ...body }: { noteId: string; content?: string; isPinned?: boolean }) =>
      updateProjectNote(noteId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'notes'] });
    },
  });
}

export function useDeleteProjectNote(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProjectNote,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'notes'] });
    },
  });
}

// ─── Hours Summary ───

export function useProjectHoursSummary(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'hours-summary'],
    queryFn: () => fetchProjectHoursSummary(projectId),
    enabled: !!projectId,
  });
}
