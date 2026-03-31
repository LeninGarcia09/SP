import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOpportunities,
  fetchOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  convertOpportunity,
  changeOpportunityStage,
  fetchStakeholders,
  addStakeholder,
  updateStakeholder,
  removeStakeholder,
  fetchTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  fetchLineItems,
  addLineItem,
  updateLineItem,
  removeLineItem,
  fetchCompetitors,
  addCompetitor,
  updateCompetitor,
  removeCompetitor,
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

// ─── Stage Change ───

export function useChangeStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      changeOpportunityStage(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['opportunities', variables.id] });
    },
  });
}

// ─── Stakeholders ───

export function useStakeholders(opportunityId: string) {
  return useQuery({
    queryKey: ['opportunities', opportunityId, 'stakeholders'],
    queryFn: () => fetchStakeholders(opportunityId),
    enabled: !!opportunityId,
  });
}

export function useAddStakeholder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ opportunityId, ...body }: { opportunityId: string } & Record<string, unknown>) =>
      addStakeholder(opportunityId, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'stakeholders'] });
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId] });
    },
  });
}

export function useUpdateStakeholder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, opportunityId, ...body }: { id: string; opportunityId: string } & Record<string, unknown>) =>
      updateStakeholder(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'stakeholders'] });
    },
  });
}

export function useRemoveStakeholder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, opportunityId: _oppId }: { id: string; opportunityId: string }) =>
      removeStakeholder(id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'stakeholders'] });
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId] });
    },
  });
}

// ─── Team Members ───

export function useTeamMembers(opportunityId: string) {
  return useQuery({
    queryKey: ['opportunities', opportunityId, 'team'],
    queryFn: () => fetchTeamMembers(opportunityId),
    enabled: !!opportunityId,
  });
}

export function useAddTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ opportunityId, ...body }: { opportunityId: string } & Record<string, unknown>) =>
      addTeamMember(opportunityId, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'team'] });
    },
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, opportunityId, ...body }: { id: string; opportunityId: string } & Record<string, unknown>) =>
      updateTeamMember(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'team'] });
    },
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, opportunityId: _oppId }: { id: string; opportunityId: string }) =>
      removeTeamMember(id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'team'] });
    },
  });
}

// ─── Line Items ───

export function useLineItems(opportunityId: string) {
  return useQuery({
    queryKey: ['opportunities', opportunityId, 'line-items'],
    queryFn: () => fetchLineItems(opportunityId),
    enabled: !!opportunityId,
  });
}

export function useAddLineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ opportunityId, ...body }: { opportunityId: string } & Record<string, unknown>) =>
      addLineItem(opportunityId, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'line-items'] });
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId] });
    },
  });
}

export function useUpdateLineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, opportunityId, ...body }: { id: string; opportunityId: string } & Record<string, unknown>) =>
      updateLineItem(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'line-items'] });
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId] });
    },
  });
}

export function useRemoveLineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, opportunityId: _oppId }: { id: string; opportunityId: string }) =>
      removeLineItem(id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'line-items'] });
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId] });
    },
  });
}

// ─── Competitors ───

export function useCompetitors(opportunityId: string) {
  return useQuery({
    queryKey: ['opportunities', opportunityId, 'competitors'],
    queryFn: () => fetchCompetitors(opportunityId),
    enabled: !!opportunityId,
  });
}

export function useAddCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ opportunityId, ...body }: { opportunityId: string } & Record<string, unknown>) =>
      addCompetitor(opportunityId, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'competitors'] });
    },
  });
}

export function useUpdateCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, opportunityId, ...body }: { id: string; opportunityId: string } & Record<string, unknown>) =>
      updateCompetitor(id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'competitors'] });
    },
  });
}

export function useRemoveCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, opportunityId: _oppId }: { id: string; opportunityId: string }) =>
      removeCompetitor(id),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['opportunities', variables.opportunityId, 'competitors'] });
    },
  });
}
