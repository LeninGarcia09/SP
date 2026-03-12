import { api } from '../axios';
import type {
  ApiResponse,
  PaginationMeta,
  Project,
  Task,
  ProjectHealthSnapshot,
  Person,
  ProjectAssignment,
  InventoryItem,
  InventoryTransaction,
  User,
} from '@bizops/shared';

// ─── Query Params ───

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
}

// ─── Users ───

export async function fetchUsers() {
  const { data } = await api.get<ApiResponse<User[]>>('/users');
  return data;
}

export async function fetchUser(id: string) {
  const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
  return data;
}

// ─── Projects ───

export async function fetchProjects(params?: PaginationParams) {
  const { data } = await api.get<{ data: Project[]; meta: PaginationMeta }>('/projects', { params });
  return data;
}

export async function fetchProject(id: string) {
  const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
  return data;
}

export async function createProject(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Project>>('/projects', body);
  return data;
}

export async function updateProject(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<Project>>(`/projects/${id}`, body);
  return data;
}

export async function deleteProject(id: string) {
  await api.delete(`/projects/${id}`);
}

// ─── Tasks ───

export async function fetchTasks(projectId: string) {
  const { data } = await api.get<ApiResponse<Task[]>>(`/projects/${projectId}/tasks`);
  return data;
}

export async function fetchTask(projectId: string, taskId: string) {
  const { data } = await api.get<ApiResponse<Task>>(`/projects/${projectId}/tasks/${taskId}`);
  return data;
}

export async function createTask(projectId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, body);
  return data;
}

export async function updateTask(projectId: string, taskId: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<Task>>(`/projects/${projectId}/tasks/${taskId}`, body);
  return data;
}

export async function deleteTask(projectId: string, taskId: string) {
  await api.delete(`/projects/${projectId}/tasks/${taskId}`);
}

// ─── Health ───

export async function fetchHealthHistory(projectId: string) {
  const { data } = await api.get<ApiResponse<ProjectHealthSnapshot[]>>(`/projects/${projectId}/health`);
  return data;
}

export async function triggerHealthCalculation(projectId: string) {
  const { data } = await api.post<ApiResponse<ProjectHealthSnapshot>>(`/projects/${projectId}/health/trigger`);
  return data;
}

export async function overrideHealth(projectId: string, body: { overallRag: string; overrideReason: string }) {
  const { data } = await api.post<ApiResponse<ProjectHealthSnapshot>>(`/projects/${projectId}/health/override`, body);
  return data;
}

// ─── Personnel ───

export async function fetchPersonnel(params?: PaginationParams) {
  const { data } = await api.get<{ data: Person[]; meta: PaginationMeta }>('/personnel', { params });
  return data;
}

export async function fetchPerson(id: string) {
  const { data } = await api.get<ApiResponse<Person>>(`/personnel/${id}`);
  return data;
}

export async function createPerson(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Person>>('/personnel', body);
  return data;
}

export async function updatePerson(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<Person>>(`/personnel/${id}`, body);
  return data;
}

// ─── Assignments ───

export async function fetchAssignmentsByPerson(personId: string) {
  const { data } = await api.get<ApiResponse<ProjectAssignment[]>>(`/personnel/${personId}/assignments`);
  return data;
}

export async function fetchAssignmentsByProject(projectId: string) {
  const { data } = await api.get<ApiResponse<ProjectAssignment[]>>(`/projects/${projectId}/assignments`);
  return data;
}

export async function createAssignment(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<ProjectAssignment>>('/assignments', body);
  return data;
}

export async function updateAssignment(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<ProjectAssignment>>(`/assignments/${id}`, body);
  return data;
}

// ─── Inventory ───

export async function fetchInventoryItems(params?: PaginationParams) {
  const { data } = await api.get<{ data: InventoryItem[]; meta: PaginationMeta }>('/inventory', { params });
  return data;
}

export async function fetchInventoryItem(id: string) {
  const { data } = await api.get<ApiResponse<InventoryItem>>(`/inventory/${id}`);
  return data;
}

export async function createInventoryItem(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<InventoryItem>>('/inventory', body);
  return data;
}

export async function updateInventoryItem(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<InventoryItem>>(`/inventory/${id}`, body);
  return data;
}

export async function fetchInventoryTransactions(itemId: string) {
  const { data } = await api.get<ApiResponse<InventoryTransaction[]>>(`/inventory/${itemId}/transactions`);
  return data;
}

export async function createInventoryTransaction(itemId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<InventoryTransaction>>(`/inventory/${itemId}/transactions`, body);
  return data;
}
