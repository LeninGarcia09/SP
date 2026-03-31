import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchActivities,
  fetchActivity,
  createActivity,
  fetchEntityActivities,
  createEntityActivity,
  fetchUpcomingActivities,
  fetchOverdueActivities,
  fetchActivityTemplates,
  fetchActivityTemplate,
  createActivityTemplate,
  updateActivityTemplate,
  deleteActivityTemplate,
  type PaginationParams,
} from '../lib/api';

// ─── Activities ───

export function useActivities(params?: PaginationParams & { opportunityId?: string; accountId?: string; contactId?: string; type?: string }) {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => fetchActivities(params),
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ['activities', id],
    queryFn: () => fetchActivity(id),
    enabled: !!id,
  });
}

export function useEntityActivities(
  entityType: 'opportunities' | 'accounts' | 'contacts',
  entityId: string,
  params?: PaginationParams,
) {
  return useQuery({
    queryKey: ['activities', entityType, entityId, params],
    queryFn: () => fetchEntityActivities(entityType, entityId, params),
    enabled: !!entityId,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createActivity(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useCreateEntityActivity(entityType: 'opportunities' | 'accounts' | 'contacts', entityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createEntityActivity(entityType, entityId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpcomingActivities() {
  return useQuery({
    queryKey: ['activities', 'upcoming'],
    queryFn: fetchUpcomingActivities,
  });
}

export function useOverdueActivities() {
  return useQuery({
    queryKey: ['activities', 'overdue'],
    queryFn: fetchOverdueActivities,
  });
}

// ─── Activity Templates ───

export function useActivityTemplates(params?: PaginationParams) {
  return useQuery({
    queryKey: ['activity-templates', params],
    queryFn: () => fetchActivityTemplates(params),
  });
}

export function useActivityTemplate(id: string) {
  return useQuery({
    queryKey: ['activity-templates', id],
    queryFn: () => fetchActivityTemplate(id),
    enabled: !!id,
  });
}

export function useCreateActivityTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createActivityTemplate(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-templates'] });
    },
  });
}

export function useUpdateActivityTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      updateActivityTemplate(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-templates'] });
    },
  });
}

export function useDeleteActivityTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteActivityTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-templates'] });
    },
  });
}
