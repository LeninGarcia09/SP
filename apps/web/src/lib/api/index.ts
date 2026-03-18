import { api } from '../axios';
import type {
  ApiResponse,
  PaginationMeta,
  Project,
  ProjectHoursSummary,
  CostEntry,
  CostSummary,
  Task,
  TaskActivity,
  ProjectHealthSnapshot,
  ProjectNote,
  Person,
  ProjectAssignment,
  ProjectMember,
  InventoryItem,
  InventoryTransaction,
  User,
  Notification,
  Skill,
  PersonSkill,
  Program,
  Opportunity,
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

export async function fetchUsers(params?: PaginationParams) {
  const { data } = await api.get<{ data: User[]; meta: PaginationMeta }>('/users', { params });
  return data;
}

export async function fetchUser(id: string) {
  const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
  return data;
}

export async function updateUserRole(id: string, role: string) {
  const { data } = await api.patch<ApiResponse<User>>(`/users/${id}/role`, { role });
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

// ─── Project Members ───

export async function fetchProjectMembers(projectId: string) {
  const { data } = await api.get<ApiResponse<ProjectMember[]>>(`/projects/${projectId}/members`);
  return data;
}

export async function addProjectMember(projectId: string, body: { userId: string; role?: string }) {
  const { data } = await api.post<ApiResponse<ProjectMember>>(`/projects/${projectId}/members`, body);
  return data;
}

export async function updateProjectMemberRole(memberId: string, body: { role: string }) {
  const { data } = await api.patch<ApiResponse<ProjectMember>>(`/projects/members/${memberId}`, body);
  return data;
}

export async function removeProjectMember(memberId: string) {
  await api.delete(`/projects/members/${memberId}`);
}

// ─── Project Notes ───

export async function fetchProjectNotes(projectId: string) {
  const { data } = await api.get<ApiResponse<ProjectNote[]>>(`/projects/${projectId}/notes`);
  return data;
}

export async function fetchProjectHoursSummary(projectId: string) {
  const { data } = await api.get<ApiResponse<ProjectHoursSummary>>(`/projects/${projectId}/hours-summary`);
  return data;
}

export async function createProjectNote(projectId: string, body: { content: string; isPinned?: boolean }) {
  const { data } = await api.post<ApiResponse<ProjectNote>>(`/projects/${projectId}/notes`, body);
  return data;
}

export async function updateProjectNote(noteId: string, body: { content?: string; isPinned?: boolean }) {
  const { data } = await api.patch<ApiResponse<ProjectNote>>(`/projects/notes/${noteId}`, body);
  return data;
}

export async function deleteProjectNote(noteId: string) {
  await api.delete(`/projects/notes/${noteId}`);
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

export async function fetchTaskActivities(projectId: string, taskId: string) {
  const { data } = await api.get<ApiResponse<TaskActivity[]>>(`/projects/${projectId}/tasks/${taskId}/activities`);
  return data;
}

export async function addTaskComment(projectId: string, taskId: string, comment: string) {
  const { data } = await api.post<ApiResponse<TaskActivity>>(`/projects/${projectId}/tasks/${taskId}/comments`, { comment });
  return data;
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

export async function fetchAllActiveAssignments() {
  const { data } = await api.get<ApiResponse<ProjectAssignment[]>>('/assignments');
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

export async function importInventoryExcel(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ApiResponse<{ imported: number; skipped: number; errors: string[] }>>('/inventory/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ─── Notifications ───

export async function fetchNotifications() {
  const { data } = await api.get<ApiResponse<Notification[]>>('/notifications');
  return data;
}

export async function fetchUnreadCount() {
  const { data } = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
  return data;
}

export async function markNotificationRead(id: string, isRead: boolean) {
  const { data } = await api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`, { isRead });
  return data;
}

export async function markAllNotificationsRead() {
  await api.post('/notifications/mark-all-read');
}

export async function deleteNotification(id: string) {
  await api.delete(`/notifications/${id}`);
}

// ─── Skills Catalog ───

export async function fetchSkills(params?: PaginationParams) {
  const { data } = await api.get<{ data: Skill[]; meta: PaginationMeta }>('/skills', { params });
  return data;
}

export async function fetchSkill(id: string) {
  const { data } = await api.get<ApiResponse<Skill>>(`/skills/${id}`);
  return data;
}

export async function createSkill(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Skill>>('/skills', body);
  return data;
}

export async function updateSkill(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<Skill>>(`/skills/${id}`, body);
  return data;
}

export async function deleteSkill(id: string) {
  await api.delete(`/skills/${id}`);
}

// ─── Person Skills ───

export async function fetchPersonSkills(personId: string) {
  const { data } = await api.get<ApiResponse<PersonSkill[]>>(`/personnel/${personId}/skills`);
  return data;
}

export async function assignPersonSkill(personId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<PersonSkill>>(`/personnel/${personId}/skills`, body);
  return data;
}

export async function updatePersonSkill(personId: string, skillId: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<PersonSkill>>(`/personnel/${personId}/skills/${skillId}`, body);
  return data;
}

export async function removePersonSkill(personId: string, skillId: string) {
  await api.delete(`/personnel/${personId}/skills/${skillId}`);
}

// ─── Programs ───

export async function fetchPrograms(params?: PaginationParams) {
  const { data } = await api.get<{ data: Program[]; meta: PaginationMeta }>('/programs', { params });
  return data;
}

export async function fetchProgram(id: string) {
  const { data } = await api.get<ApiResponse<Program>>(`/programs/${id}`);
  return data;
}

export async function createProgram(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Program>>('/programs', body);
  return data;
}

export async function updateProgram(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<Program>>(`/programs/${id}`, body);
  return data;
}

export async function deleteProgram(id: string) {
  await api.delete(`/programs/${id}`);
}

// ─── Opportunities ───

export async function fetchOpportunities(params?: PaginationParams) {
  const { data } = await api.get<{ data: Opportunity[]; meta: PaginationMeta }>('/opportunities', { params });
  return data;
}

export async function fetchOpportunity(id: string) {
  const { data } = await api.get<ApiResponse<Opportunity>>(`/opportunities/${id}`);
  return data;
}

export async function createOpportunity(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Opportunity>>('/opportunities', body);
  return data;
}

export async function updateOpportunity(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<Opportunity>>(`/opportunities/${id}`, body);
  return data;
}

export async function deleteOpportunity(id: string) {
  await api.delete(`/opportunities/${id}`);
}

export async function convertOpportunity(id: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Project>>(`/opportunities/${id}/convert`, body);
  return data;
}

// ─── Cost Entries ───

export async function fetchCostEntries(projectId: string) {
  const { data } = await api.get<ApiResponse<CostEntry[]>>(`/projects/${projectId}/costs`);
  return data;
}

export async function createCostEntry(projectId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<CostEntry>>(`/projects/${projectId}/costs`, body);
  return data;
}

export async function updateCostEntry(projectId: string, costId: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<CostEntry>>(`/projects/${projectId}/costs/${costId}`, body);
  return data;
}

export async function deleteCostEntry(projectId: string, costId: string) {
  await api.delete(`/projects/${projectId}/costs/${costId}`);
}

export async function submitCostEntry(costId: string) {
  const { data } = await api.post<ApiResponse<CostEntry>>(`/costs/${costId}/submit`);
  return data;
}

export async function approveCostEntry(costId: string) {
  const { data } = await api.post<ApiResponse<CostEntry>>(`/costs/${costId}/approve`);
  return data;
}

export async function rejectCostEntry(costId: string, reason?: string) {
  const { data } = await api.post<ApiResponse<CostEntry>>(`/costs/${costId}/reject`, { reason });
  return data;
}

export async function transferCostEntry(costId: string, targetProjectId: string, reason?: string) {
  const { data } = await api.post<ApiResponse<CostEntry>>(`/costs/${costId}/transfer`, { targetProjectId, reason });
  return data;
}

export async function fetchCostSummary(projectId: string) {
  const { data } = await api.get<ApiResponse<CostSummary>>(`/projects/${projectId}/cost-summary`);
  return data;
}
