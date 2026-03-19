import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTasks,
  fetchTask,
  createTask,
  updateTask,
  deleteTask,
  fetchTaskActivities,
  addTaskComment,
} from '../lib/api';

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: () => fetchTasks(projectId),
    enabled: !!projectId,
  });
}

export function useTask(projectId: string, taskId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks', taskId],
    queryFn: () => fetchTask(projectId, taskId),
    enabled: !!projectId && !!taskId,
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createTask(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'hours-summary'] });
      qc.invalidateQueries({ queryKey: ['deliverables', projectId] });
      qc.invalidateQueries({ queryKey: ['task-costs', projectId] });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...body }: { taskId: string } & Record<string, unknown>) =>
      updateTask(projectId, taskId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'hours-summary'] });
      qc.invalidateQueries({ queryKey: ['deliverables', projectId] });
      qc.invalidateQueries({ queryKey: ['task-costs', projectId] });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(projectId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'hours-summary'] });
      qc.invalidateQueries({ queryKey: ['deliverables', projectId] });
      qc.invalidateQueries({ queryKey: ['task-costs', projectId] });
    },
  });
}

export function useTaskActivities(projectId: string, taskId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks', taskId, 'activities'],
    queryFn: () => fetchTaskActivities(projectId, taskId),
    enabled: !!projectId && !!taskId,
  });
}

export function useAddTaskComment(projectId: string, taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (comment: string) => addTaskComment(projectId, taskId, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'tasks', taskId, 'activities'] });
    },
  });
}
