import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTasks,
  fetchTask,
  createTask,
  updateTask,
  deleteTask,
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
    },
  });
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(projectId, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
    },
  });
}
