import { api } from '../axios';
import type {
  ApiResponse,
  PaginationMeta,
  Project,
  ProjectHoursSummary,
  CostEntry,
  CostSummary,
  CostForecast,
  BurnChartData,
  ResourceMatchResult,
  Task,
  TaskActivity,
  TaskCostBreakdown,
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
  DeliverableSummary,
  TenantUser,
  AppRoleAssignment,
  AppRoleDefinition,
  Account,
  Contact,
  SalesPipeline,
  PipelineStage,
  Product,
  OpportunityStakeholder,
  OpportunityTeamMember,
  OpportunityLineItem,
  OpportunityCompetitor,
  Vendor,
  Activity,
  ActivityTemplate,
  Lead,
  LeadConvertPayload,
  LeadConvertResult,
  LeadStats,
} from '@telnub/shared';

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

export async function fetchDeletedProjects() {
  const { data } = await api.get<{ data: Project[] }>('/projects/deleted');
  return data;
}

export async function restoreProject(id: string) {
  const { data } = await api.patch<ApiResponse<Project>>(`/projects/deleted/${id}/restore`);
  return data;
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

export async function fetchDeletedPrograms() {
  const { data } = await api.get<{ data: Program[] }>('/programs/deleted');
  return data;
}

export async function restoreProgram(id: string) {
  const { data } = await api.patch<ApiResponse<Program>>(`/programs/deleted/${id}/restore`);
  return data;
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

// ─── Opportunity Stage Change ───

export async function changeOpportunityStage(id: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Opportunity>>(`/opportunities/${id}/stage`, body);
  return data;
}

// ─── Opportunity Stakeholders ───

export async function fetchStakeholders(opportunityId: string) {
  const { data } = await api.get<ApiResponse<OpportunityStakeholder[]>>(`/opportunities/${opportunityId}/stakeholders`);
  return data;
}

export async function addStakeholder(opportunityId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<OpportunityStakeholder>>(`/opportunities/${opportunityId}/stakeholders`, body);
  return data;
}

export async function updateStakeholder(stakeholderId: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<OpportunityStakeholder>>(`/opportunities/stakeholders/${stakeholderId}`, body);
  return data;
}

export async function removeStakeholder(stakeholderId: string) {
  await api.delete(`/opportunities/stakeholders/${stakeholderId}`);
}

// ─── Opportunity Team Members ───

export async function fetchTeamMembers(opportunityId: string) {
  const { data } = await api.get<ApiResponse<OpportunityTeamMember[]>>(`/opportunities/${opportunityId}/team`);
  return data;
}

export async function addTeamMember(opportunityId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<OpportunityTeamMember>>(`/opportunities/${opportunityId}/team`, body);
  return data;
}

export async function updateTeamMember(memberId: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<OpportunityTeamMember>>(`/opportunities/team/${memberId}`, body);
  return data;
}

export async function removeTeamMember(memberId: string) {
  await api.delete(`/opportunities/team/${memberId}`);
}

// ─── Opportunity Line Items ───

export async function fetchLineItems(opportunityId: string) {
  const { data } = await api.get<ApiResponse<OpportunityLineItem[]>>(`/opportunities/${opportunityId}/line-items`);
  return data;
}

export async function addLineItem(opportunityId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<OpportunityLineItem>>(`/opportunities/${opportunityId}/line-items`, body);
  return data;
}

export async function updateLineItem(itemId: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<OpportunityLineItem>>(`/opportunities/line-items/${itemId}`, body);
  return data;
}

export async function removeLineItem(itemId: string) {
  await api.delete(`/opportunities/line-items/${itemId}`);
}

// ─── Opportunity Competitors ───

export async function fetchCompetitors(opportunityId: string) {
  const { data } = await api.get<ApiResponse<OpportunityCompetitor[]>>(`/opportunities/${opportunityId}/competitors`);
  return data;
}

export async function addCompetitor(opportunityId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<OpportunityCompetitor>>(`/opportunities/${opportunityId}/competitors`, body);
  return data;
}

export async function updateCompetitor(competitorId: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<OpportunityCompetitor>>(`/opportunities/competitors/${competitorId}`, body);
  return data;
}

export async function removeCompetitor(competitorId: string) {
  await api.delete(`/opportunities/competitors/${competitorId}`);
}

// ─── Products ───

export async function fetchProducts(params?: PaginationParams) {
  const { data } = await api.get<{ data: Product[]; meta: PaginationMeta }>('/products', { params });
  return data;
}

export async function fetchProduct(id: string) {
  const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return data;
}

export async function createProduct(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Product>>('/products', body);
  return data;
}

export async function updateProduct(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<Product>>(`/products/${id}`, body);
  return data;
}

export async function deleteProduct(id: string) {
  await api.delete(`/products/${id}`);
}

// ─── Vendors ───

export async function fetchVendors(params?: PaginationParams) {
  const { data } = await api.get<{ data: Vendor[]; meta: PaginationMeta }>('/vendors', { params });
  return data;
}

export async function fetchVendor(id: string) {
  const { data } = await api.get<ApiResponse<Vendor>>(`/vendors/${id}`);
  return data;
}

export async function createVendor(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Vendor>>('/vendors', body);
  return data;
}

export async function updateVendor(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<Vendor>>(`/vendors/${id}`, body);
  return data;
}

export async function deleteVendor(id: string) {
  await api.delete(`/vendors/${id}`);
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

// ─── Cost Forecasting & Burn Data (Wave 3) ───

export async function fetchCostForecast(projectId: string) {
  const { data } = await api.get<ApiResponse<CostForecast>>(`/projects/${projectId}/cost-forecast`);
  return data;
}

export async function fetchBurnData(projectId: string, metric: 'hours' | 'cost' = 'hours') {
  const { data } = await api.get<ApiResponse<BurnChartData>>(`/projects/${projectId}/burn-data`, { params: { metric } });
  return data;
}

// ─── Resource Matching (Wave 3) ───

export async function fetchResourceMatches(skills: string[], minAllocation?: number, availableFrom?: string) {
  const params: Record<string, string> = { skills: skills.join(',') };
  if (minAllocation !== undefined) params.minAllocation = String(minAllocation);
  if (availableFrom) params.availableFrom = availableFrom;
  const { data } = await api.get<ApiResponse<ResourceMatchResult>>('/personnel/match', { params });
  return data;
}

// ─── Deliverables ───

export async function fetchDeliverables(projectId: string) {
  const { data } = await api.get<ApiResponse<DeliverableSummary[]>>(`/projects/${projectId}/deliverables`);
  return data;
}

export async function createDeliverable(projectId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<DeliverableSummary>>(`/projects/${projectId}/deliverables`, body);
  return data;
}

export async function updateDeliverable(projectId: string, id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<DeliverableSummary>>(`/projects/${projectId}/deliverables/${id}`, body);
  return data;
}

export async function deleteDeliverable(projectId: string, id: string) {
  await api.delete(`/projects/${projectId}/deliverables/${id}`);
}

export async function fetchDeliverableTaskCosts(projectId: string, deliverableId: string) {
  const { data } = await api.get<ApiResponse<TaskCostBreakdown[]>>(`/projects/${projectId}/deliverables/${deliverableId}/task-costs`);
  return data;
}

// ─── Task Cost Breakdown ───

export async function fetchTaskCostBreakdowns(projectId: string) {
  const { data } = await api.get<ApiResponse<TaskCostBreakdown[]>>(`/projects/${projectId}/task-costs`);
  return data;
}

// ─── Admin / M365 Integration ───

export async function fetchAllowedTenants() {
  const { data } = await api.get<ApiResponse<{ id: string; displayName: string }[]>>('/admin/tenants');
  return data;
}

export async function fetchTenantUsers(tenantId?: string) {
  const params = tenantId ? { tenantId } : {};
  const { data } = await api.get<ApiResponse<TenantUser[]>>('/admin/tenant-users', { params });
  return data;
}

// ─── Leads ───

export async function fetchLeads(params?: PaginationParams & { status?: string; source?: string; rating?: string; ownerId?: string }) {
  const { data } = await api.get<{ data: Lead[]; meta: PaginationMeta }>('/leads', { params });
  return data;
}

export async function fetchLead(id: string) {
  const { data } = await api.get<ApiResponse<Lead>>(`/leads/${id}`);
  return data;
}

export async function createLead(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Lead>>('/leads', body);
  return data;
}

export async function updateLead(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<Lead>>(`/leads/${id}`, body);
  return data;
}

export async function deleteLead(id: string) {
  await api.delete(`/leads/${id}`);
}

export async function convertLead(id: string, body: LeadConvertPayload) {
  const { data } = await api.post<ApiResponse<LeadConvertResult>>(`/leads/${id}/convert`, body);
  return data;
}

export async function qualifyLead(id: string) {
  const { data } = await api.post<ApiResponse<Lead>>(`/leads/${id}/qualify`);
  return data;
}

export async function disqualifyLead(id: string) {
  const { data } = await api.post<ApiResponse<Lead>>(`/leads/${id}/disqualify`);
  return data;
}

export async function fetchLeadStats() {
  const { data } = await api.get<ApiResponse<LeadStats>>('/leads/stats');
  return data;
}

export async function fetchAppRoles() {
  const { data } = await api.get<ApiResponse<AppRoleDefinition[]>>('/admin/app-roles');
  return data;
}

export async function fetchRoleAssignments() {
  const { data } = await api.get<ApiResponse<AppRoleAssignment[]>>('/admin/role-assignments');
  return data;
}

export async function assignAppRole(userId: string, appRoleValue: string) {
  const { data } = await api.post<ApiResponse<AppRoleAssignment>>('/admin/role-assignments', { userId, appRoleValue });
  return data;
}

export async function removeAppRoleAssignment(assignmentId: string) {
  const { data } = await api.delete<ApiResponse<{ removed: boolean }>>(`/admin/role-assignments/${assignmentId}`);
  return data;
}

export async function syncUsers(userIds: string[], tenantId?: string) {
  const { data } = await api.post<ApiResponse<{ synced: number; failed: number; errors?: { userId: string; error: string }[] }>>('/admin/sync-users', { userIds, tenantId });
  return data;
}

export async function fetchCrmUsers() {
  const { data } = await api.get<ApiResponse<User[]>>('/admin/crm-users');
  return data;
}

// ─── Accounts ───

export async function fetchAccounts(params?: PaginationParams) {
  const { data } = await api.get<{ data: Account[]; meta: PaginationMeta }>('/accounts', { params });
  return data;
}

export async function fetchAccount(id: string) {
  const { data } = await api.get<ApiResponse<Account>>(`/accounts/${id}`);
  return data;
}

export async function createAccount(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Account>>('/accounts', body);
  return data;
}

export async function updateAccount(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<Account>>(`/accounts/${id}`, body);
  return data;
}

export async function deleteAccount(id: string) {
  await api.delete(`/accounts/${id}`);
}

// ─── Contacts ───

export async function fetchContacts(params?: PaginationParams) {
  const { data } = await api.get<{ data: Contact[]; meta: PaginationMeta }>('/contacts', { params });
  return data;
}

export async function fetchContact(id: string) {
  const { data } = await api.get<ApiResponse<Contact>>(`/contacts/${id}`);
  return data;
}

export async function createContact(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Contact>>('/contacts', body);
  return data;
}

export async function updateContact(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<Contact>>(`/contacts/${id}`, body);
  return data;
}

export async function deleteContact(id: string) {
  await api.delete(`/contacts/${id}`);
}

// ─── Pipelines ───

export async function fetchPipelines(params?: PaginationParams) {
  const { data } = await api.get<{ data: SalesPipeline[]; meta: PaginationMeta }>('/pipelines', { params });
  return data;
}

export async function fetchPipeline(id: string) {
  const { data } = await api.get<ApiResponse<SalesPipeline>>(`/pipelines/${id}`);
  return data;
}

export async function createPipeline(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<SalesPipeline>>('/pipelines', body);
  return data;
}

export async function updatePipeline(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<SalesPipeline>>(`/pipelines/${id}`, body);
  return data;
}

export async function deletePipeline(id: string) {
  await api.delete(`/pipelines/${id}`);
}

export async function fetchPipelineStages(pipelineId: string) {
  const { data } = await api.get<ApiResponse<PipelineStage[]>>(`/pipelines/${pipelineId}/stages`);
  return data;
}

export async function createPipelineStage(pipelineId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<PipelineStage>>(`/pipelines/${pipelineId}/stages`, body);
  return data;
}

export async function updatePipelineStage(stageId: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<PipelineStage>>(`/pipelines/stages/${stageId}`, body);
  return data;
}

export async function deletePipelineStage(stageId: string) {
  await api.delete(`/pipelines/stages/${stageId}`);
}

// ─── Activities ───

export async function fetchActivities(params?: PaginationParams & { opportunityId?: string; accountId?: string; contactId?: string; type?: string }) {
  const { data } = await api.get<{ data: Activity[]; meta: PaginationMeta }>('/activities', { params });
  return data;
}

export async function fetchActivity(id: string) {
  const { data } = await api.get<ApiResponse<Activity>>(`/activities/${id}`);
  return data;
}

export async function createActivity(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Activity>>('/activities', body);
  return data;
}

export async function fetchEntityActivities(entityType: 'opportunities' | 'accounts' | 'contacts', entityId: string, params?: PaginationParams) {
  const { data } = await api.get<{ data: Activity[]; meta: PaginationMeta }>(`/${entityType}/${entityId}/activities`, { params });
  return data;
}

export async function createEntityActivity(entityType: 'opportunities' | 'accounts' | 'contacts', entityId: string, body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Activity>>(`/${entityType}/${entityId}/activities`, body);
  return data;
}

export async function fetchUpcomingActivities() {
  const { data } = await api.get<ApiResponse<Activity[]>>('/activities/upcoming');
  return data;
}

export async function fetchOverdueActivities() {
  const { data } = await api.get<ApiResponse<Activity[]>>('/activities/overdue');
  return data;
}

// ─── Activity Templates ───

export async function fetchActivityTemplates(params?: PaginationParams) {
  const { data } = await api.get<{ data: ActivityTemplate[]; meta: PaginationMeta }>('/activity-templates', { params });
  return data;
}

export async function fetchActivityTemplate(id: string) {
  const { data } = await api.get<ApiResponse<ActivityTemplate>>(`/activity-templates/${id}`);
  return data;
}

export async function createActivityTemplate(body: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<ActivityTemplate>>('/activity-templates', body);
  return data;
}

export async function updateActivityTemplate(id: string, body: Record<string, unknown>) {
  const { data } = await api.patch<ApiResponse<ActivityTemplate>>(`/activity-templates/${id}`, body);
  return data;
}

export async function deleteActivityTemplate(id: string) {
  await api.delete(`/activity-templates/${id}`);
}
