// ─── User & Access ───

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATIONS_DIRECTOR = 'OPERATIONS_DIRECTOR',
  DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER',
  PROGRAM_MANAGER = 'PROGRAM_MANAGER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  TEAM_MEMBER = 'TEAM_MEMBER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  HR_MANAGER = 'HR_MANAGER',
  SALES_EXECUTIVE = 'SALES_EXECUTIVE',
}

export interface User {
  id: string;
  azureAdOid: string;
  email: string;
  displayName: string;
  role: UserRole;
  departmentId: string | null;
  isActive: boolean;
  jobTitle: string | null;
  phone: string | null;
  tenantId: string | null;
  m365SyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  managerId: string | null;
}

// ─── Admin / M365 Integration ───

/** M365 tenant user (from Microsoft Graph) */
export interface TenantUser {
  id: string;
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
  jobTitle: string | null;
  department: string | null;
  mobilePhone: string | null;
  accountEnabled: boolean;
}

/** App role assignment on the Enterprise Application */
export interface AppRoleAssignment {
  id: string;
  principalId: string;
  principalDisplayName: string;
  appRoleId: string;
  appRoleName: string | null;
  createdDateTime: string | null;
}

/** Available app role definition */
export interface AppRoleDefinition {
  id: string;
  displayName: string;
  value: string;
  description: string;
}

/** Request to assign a role to a user */
export interface AssignRoleRequest {
  userId: string;
  appRoleValue: string;
}

/** Request to sync one or more M365 users into the CRM */
export interface SyncUsersRequest {
  userIds: string[];
}

// ─── Projects ───

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: number;
  actualCost: number;
  costRate: number;
  programId: string | null;
  projectLeadId: string;
  createdBy: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export enum ProjectMemberRole {
  LEAD = 'LEAD',
  MEMBER = 'MEMBER',
  OBSERVER = 'OBSERVER',
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: string;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  authorId: string;
  content: string;
  metadata: Record<string, unknown>;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Tasks ───

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
  createdById: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  parentTaskId: string | null;
  deliverableId: string | null;
  costRate: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Deliverables ───

export enum DeliverableStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Deliverable {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  budget: number;
  startDate: string | null;
  dueDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverableSummary extends Deliverable {
  taskCount: number;
  completedTaskCount: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  laborCost: number;
  directCost: number;
  totalCost: number;
}

export interface TaskCostBreakdown {
  taskId: string;
  taskTitle: string;
  estimatedHours: number;
  actualHours: number;
  costRate: number;
  laborCost: number;
  directCosts: number;
  totalCost: number;
}

// ─── Task Activity (Audit Log) ───

export enum TaskActivityType {
  CREATED = 'CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  DUE_DATE_CHANGED = 'DUE_DATE_CHANGED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  UPDATED = 'UPDATED',
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  activityType: TaskActivityType;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  comment: string | null;
  createdAt: string;
}

// ─── Health Dashboard ───

export enum RagStatus {
  GREEN = 'GREEN',
  AMBER = 'AMBER',
  RED = 'RED',
  BLUE = 'BLUE',
  GRAY = 'GRAY',
}

export interface ProjectHealthSnapshot {
  id: string;
  projectId: string;
  snapshotDate: string;
  overallRag: RagStatus;
  scheduleRag: RagStatus;
  budgetRag: RagStatus;
  autoCalculated: boolean;
  overrideReason: string | null;
  overrideBy: string | null;
  createdAt: string;
}

// ─── Personnel ───

export enum AssignmentStatus {
  ON_PROJECT = 'ON_PROJECT',
  ON_OPPORTUNITY = 'ON_OPPORTUNITY',
  ON_OPERATIONS = 'ON_OPERATIONS',
  ON_BENCH = 'ON_BENCH',
}

export interface Person {
  id: string;
  userId: string | null;
  employeeId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  departmentId: string;
  assignmentStatus: AssignmentStatus;
  startDate: string;
  skills: string[];
  availabilityNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAssignment {
  id: string;
  personId: string;
  projectId: string;
  role: string;
  allocationPercent: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

// ─── Inventory ───

export enum AssetCategory {
  TOOL_EQUIPMENT = 'TOOL_EQUIPMENT',
  CONSUMABLE = 'CONSUMABLE',
  VEHICLE = 'VEHICLE',
  SOFTWARE_LICENSE = 'SOFTWARE_LICENSE',
}

export enum ItemStatus {
  AVAILABLE = 'AVAILABLE',
  CHECKED_OUT = 'CHECKED_OUT',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: AssetCategory;
  status: ItemStatus;
  serialNumber: string | null;
  location: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  assignedToPersonId: string | null;
  assignedToProjectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum TransactionType {
  CHECK_OUT = 'CHECK_OUT',
  CHECK_IN = 'CHECK_IN',
  TRANSFER = 'TRANSFER',
  MAINTENANCE = 'MAINTENANCE',
  RETIREMENT = 'RETIREMENT',
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  transactionType: TransactionType;
  fromPersonId: string | null;
  toPersonId: string | null;
  fromProjectId: string | null;
  toProjectId: string | null;
  performedById: string;
  notes: string | null;
  transactionDate: string;
}

// ─── Notifications ───

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_OVERDUE = 'TASK_OVERDUE',
  TASK_COMMENT = 'TASK_COMMENT',
  PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED',
  RAG_STATUS_CHANGED = 'RAG_STATUS_CHANGED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  NOTE_ADDED = 'NOTE_ADDED',
  HOURS_OVERRUN = 'HOURS_OVERRUN',
  COST_SUBMITTED = 'COST_SUBMITTED',
  COST_APPROVED = 'COST_APPROVED',
  COST_REJECTED = 'COST_REJECTED',
  BUDGET_THRESHOLD = 'BUDGET_THRESHOLD',
  GENERAL = 'GENERAL',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  createdAt: string;
}

// ─── Skills ───

export enum SkillCategory {
  TECHNICAL = 'TECHNICAL',
  MANAGEMENT = 'MANAGEMENT',
  DOMAIN = 'DOMAIN',
  SOFT_SKILL = 'SOFT_SKILL',
  CERTIFICATION = 'CERTIFICATION',
}

export enum ProficiencyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string | null;
  createdAt: string;
}

export interface PersonSkill {
  id: string;
  personId: string;
  skillId: string;
  proficiency: ProficiencyLevel;
  yearsOfExperience: number | null;
  notes: string | null;
  skill?: Skill;
}

// ─── Programs ───

export enum ProgramStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ProgramStatus;
  startDate: string;
  endDate: string | null;
  budget: number;
  managerId: string;
  createdBy: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  projects?: Project[];
  totalBudget?: number;
  totalActualCost?: number;
}

// ─── Opportunities ───

export enum OpportunityStatus {
  IDENTIFIED = 'IDENTIFIED',
  QUALIFYING = 'QUALIFYING',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
  CONVERTED = 'CONVERTED',
}

export enum OpportunityStage {
  SEED = 'SEED',
  EARLY = 'EARLY',
  GROWTH = 'GROWTH',
  EXPANSION = 'EXPANSION',
  MATURE = 'MATURE',
}

export interface Opportunity {
  id: string;
  code: string;
  name: string;
  description: string;
  status: OpportunityStatus;
  stage: OpportunityStage;
  estimatedValue: number;
  probability: number;
  expectedCloseDate: string | null;
  clientName: string;
  clientContact: string | null;
  ownerId: string;
  convertedProjectId: string | null;
  convertedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Project Hours Summary ───

export interface ProjectHoursSummary {
  totalEstimatedHours: number;
  totalActualHours: number;
  variance: number;
  completionPercent: number;
  taskCount: number;
  tasksWithEstimates: number;
  tasksWithActuals: number;
  laborCost: number;
}

// ─── Cost Entries ───

export enum CostCategory {
  VENDOR_SERVICE = 'VENDOR_SERVICE',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL',
  EQUIPMENT_PURCHASE = 'EQUIPMENT_PURCHASE',
  MATERIALS = 'MATERIALS',
  SOFTWARE_LICENSE = 'SOFTWARE_LICENSE',
  TRAVEL = 'TRAVEL',
  ACCOMMODATION = 'ACCOMMODATION',
  MEALS = 'MEALS',
  PER_DIEM = 'PER_DIEM',
  UTILITIES = 'UTILITIES',
  INSURANCE = 'INSURANCE',
  PERMITS_FEES = 'PERMITS_FEES',
  TRAINING = 'TRAINING',
  TAX = 'TAX',
  CONTINGENCY = 'CONTINGENCY',
  OTHER = 'OTHER',
}

export enum CostEntryStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface CostEntry {
  id: string;
  projectId: string;
  taskId: string | null;
  category: CostCategory;
  description: string;
  vendor: string | null;
  amount: number;
  currency: string;
  date: string;
  invoiceRef: string | null;
  status: CostEntryStatus;
  submittedById: string;
  approvedById: string | null;
  approvedAt: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CostSummary {
  totalBudget: number;
  totalCostEntries: number;
  laborCost: number;
  totalActualCost: number;
  variance: number;
  burnPercent: number;
  byCategory: Array<{
    category: CostCategory;
    count: number;
    total: number;
    percentage: number;
  }>;
  byMonth: Array<{
    month: string;
    total: number;
  }>;
}

// ─── API Response Envelope ───

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ─── Cost Forecasting (Wave 3) ───

export interface CostForecast {
  budget: number;
  actualCost: number;
  laborCost: number;
  eac: number;   // Estimate at Completion
  etc: number;   // Estimate to Complete
  vac: number;   // Variance at Completion
  cpi: number;   // Cost Performance Index
  remainingHours: number;
  totalEstimated: number;
  totalActual: number;
  projectedOverrun: boolean;
  projectedCompletionCost: number;
}

// ─── Burn Chart Data (Wave 3) ───

export interface BurnChartData {
  dates: string[];
  ideal: number[];
  actual: number[];
  scope: number[];
}

// ─── Skills-Based Resource Matching (Wave 3) ───

export interface ResourceMatch {
  person: Person;
  matchScore: number;
  currentAllocation: number;
  availablePercent: number;
  matchedSkills: string[];
}

export interface ResourceMatchResult {
  matches: ResourceMatch[];
}
