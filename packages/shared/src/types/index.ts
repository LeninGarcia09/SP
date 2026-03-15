// ─── User & Access ───

export enum UserRole {
  GLOBAL_LEAD = 'GLOBAL_LEAD',
  BIZ_OPS_MANAGER = 'BIZ_OPS_MANAGER',
  RESOURCE_MANAGER = 'RESOURCE_MANAGER',
  PROGRAM_MANAGER = 'PROGRAM_MANAGER',
  PROJECT_LEAD = 'PROJECT_LEAD',
  PROJECT_PERSONNEL = 'PROJECT_PERSONNEL',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  HR_ADMIN = 'HR_ADMIN',
}

export interface User {
  id: string;
  azureAdOid: string;
  email: string;
  displayName: string;
  role: UserRole;
  departmentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  managerId: string | null;
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
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  parentTaskId: string | null;
  createdAt: string;
  updatedAt: string;
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
  PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED',
  RAG_STATUS_CHANGED = 'RAG_STATUS_CHANGED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  NOTE_ADDED = 'NOTE_ADDED',
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
