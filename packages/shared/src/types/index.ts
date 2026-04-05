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
  // Wave 2 fields
  pipelineId: string | null;
  stageId: string | null;
  currentStage?: PipelineStage | null;
  accountId: string | null;
  primaryContactId: string | null;
  type: OpportunityType | null;
  priority: Priority | null;
  weightedValue: number;
  actualCloseDate: string | null;
  forecastCategory: ForecastCategory | null;
  healthScore: number;
  healthStatus: DealHealth | null;
  nextStep: string | null;
  nextStepDueDate: string | null;
  lostReason: string | null;
  leadSource: string | null;
  sourceLeadId: string | null;
  pushCount: number;
  stageChangedAt: string | null;
  daysInCurrentStage: number;
  lastActivityAt: string | null;
  daysSinceLastActivity: number;
  tags: string[] | null;
  // Relations
  stakeholders?: OpportunityStakeholder[];
  teamMembers?: OpportunityTeamMember[];
  lineItems?: OpportunityLineItem[];
  competitors?: OpportunityCompetitor[];
  // Core
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

// ─── Sales / CRM Module (Wave 1) ───

export enum AccountType {
  PROSPECT = 'PROSPECT',
  CUSTOMER = 'CUSTOMER',
  PARTNER = 'PARTNER',
  COMPETITOR = 'COMPETITOR',
  VENDOR = 'VENDOR',
  OTHER = 'OTHER',
}

export enum AccountTier {
  ENTERPRISE = 'ENTERPRISE',
  MID_MARKET = 'MID_MARKET',
  SMB = 'SMB',
  STARTUP = 'STARTUP',
}

export interface Account {
  id: string;
  tenantId: string | null;
  code: string;
  name: string;
  legalName: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  type: AccountType;
  tier: AccountTier | null;
  annualRevenue: number | null;
  employeeCount: number | null;
  ownerId: string;
  parentAccountId: string | null;
  source: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export enum ContactChannel {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  IN_PERSON = 'IN_PERSON',
  VIDEO = 'VIDEO',
}

export enum ContactType {
  PRIMARY = 'PRIMARY',
  BILLING = 'BILLING',
  TECHNICAL = 'TECHNICAL',
  EXECUTIVE = 'EXECUTIVE',
  OTHER = 'OTHER',
}

export enum ContactInfluence {
  DECISION_MAKER = 'DECISION_MAKER',
  INFLUENCER = 'INFLUENCER',
  CHAMPION = 'CHAMPION',
  BLOCKER = 'BLOCKER',
  END_USER = 'END_USER',
  EVALUATOR = 'EVALUATOR',
  ECONOMIC_BUYER = 'ECONOMIC_BUYER',
}

export interface Contact {
  id: string;
  tenantId: string | null;
  code: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  jobTitle: string | null;
  department: string | null;
  accountId: string;
  reportsToId: string | null;
  preferredChannel: ContactChannel;
  timezone: string | null;
  language: string;
  type: ContactType;
  influence: ContactInfluence | null;
  lastContactedAt: string | null;
  lastActivityAt: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export enum ForecastCategory {
  PIPELINE = 'PIPELINE',
  BEST_CASE = 'BEST_CASE',
  COMMIT = 'COMMIT',
  CLOSED = 'CLOSED',
  OMITTED = 'OMITTED',
}

export interface SalesPipeline {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stages?: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  tenantId: string | null;
  pipelineId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  defaultProbability: number;
  forecastCategory: ForecastCategory;
  isClosed: boolean;
  isWon: boolean;
  requiredFields: string[];
  checklist: Record<string, unknown>[];
  daysExpected: number | null;
  autoActions: Record<string, unknown>[];
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Sales / CRM Module (Wave 2) ───

export enum OpportunityType {
  NEW_BUSINESS = 'NEW_BUSINESS',
  EXISTING_BUSINESS = 'EXISTING_BUSINESS',
  RENEWAL = 'RENEWAL',
  EXPANSION = 'EXPANSION',
  UPSELL = 'UPSELL',
}

export enum DealHealth {
  HEALTHY = 'HEALTHY',
  AT_RISK = 'AT_RISK',
  STALLED = 'STALLED',
  CRITICAL = 'CRITICAL',
}

export enum StakeholderRole {
  DECISION_MAKER = 'DECISION_MAKER',
  INFLUENCER = 'INFLUENCER',
  CHAMPION = 'CHAMPION',
  BLOCKER = 'BLOCKER',
  EVALUATOR = 'EVALUATOR',
  ECONOMIC_BUYER = 'ECONOMIC_BUYER',
  TECHNICAL_BUYER = 'TECHNICAL_BUYER',
  END_USER = 'END_USER',
  LEGAL = 'LEGAL',
  PROCUREMENT = 'PROCUREMENT',
}

export enum StakeholderInfluence {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum StakeholderSentiment {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
  UNKNOWN = 'UNKNOWN',
}

export enum TeamMemberRole {
  OWNER = 'OWNER',
  CO_OWNER = 'CO_OWNER',
  SALES_ENGINEER = 'SALES_ENGINEER',
  SOLUTION_ARCHITECT = 'SOLUTION_ARCHITECT',
  ACCOUNT_MANAGER = 'ACCOUNT_MANAGER',
  EXECUTIVE_SPONSOR = 'EXECUTIVE_SPONSOR',
  SUBJECT_MATTER_EXPERT = 'SUBJECT_MATTER_EXPERT',
}

export enum ProductCategory {
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  LICENSE = 'LICENSE',
  CONSULTING = 'CONSULTING',
  TRAINING = 'TRAINING',
  SUPPORT = 'SUPPORT',
  OTHER = 'OTHER',
}

export enum RecurringInterval {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
}

export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum CompetitorStatus {
  ACTIVE = 'ACTIVE',
  WON_AGAINST = 'WON_AGAINST',
  LOST_TO = 'LOST_TO',
  WITHDRAWN = 'WITHDRAWN',
}

export enum VendorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface Vendor {
  id: string;
  tenantId: string | null;
  code: string;
  name: string;
  legalName: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  contactPerson: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  status: VendorStatus;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId: string | null;
  code: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  family: string | null;
  vendorId: string | null;
  vendor?: Vendor;
  unitPrice: number;
  currency: string;
  unit: string;
  isRecurring: boolean;
  recurringInterval: RecurringInterval | null;
  minQuantity: number;
  maxDiscount: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityStakeholder {
  id: string;
  opportunityId: string;
  contactId: string;
  role: StakeholderRole;
  influence: StakeholderInfluence;
  sentiment: StakeholderSentiment;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: Contact;
}

export interface OpportunityTeamMember {
  id: string;
  opportunityId: string;
  userId: string;
  role: TeamMemberRole;
  createdAt: string;
  user?: User;
}

export interface OpportunityLineItem {
  id: string;
  opportunityId: string;
  productId: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  serviceStartDate: string | null;
  serviceEndDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface OpportunityCompetitor {
  id: string;
  opportunityId: string;
  competitorName: string;
  competitorAccountId: string | null;
  strengths: string | null;
  weaknesses: string | null;
  threatLevel: ThreatLevel;
  status: CompetitorStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealHealthScore {
  score: number;
  status: DealHealth;
  factors: {
    recentActivity: number;
    stakeholderCoverage: number;
    nextStepDefined: number;
    closeDateValid: number;
    hasValue: number;
    contactEngagement: number;
  };
  penalties: {
    noRecentActivity: number;
    closeDatePast: number;
    noStakeholders: number;
    stageRotting: number;
    closeDatePushed: number;
  };
}

// ─── Activities & Timeline ───

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  TASK = 'TASK',
  STAGE_CHANGE = 'STAGE_CHANGE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  SYSTEM = 'SYSTEM',
}

export enum ActivityStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Activity {
  id: string;
  tenantId: string | null;
  type: ActivityType;
  subtype: string | null;
  subject: string;
  description: string | null;
  opportunityId: string | null;
  accountId: string | null;
  contactId: string | null;
  leadId: string | null;
  status: ActivityStatus | null;
  priority: Priority | null;
  dueDate: string | null;
  completedAt: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  duration: number | null;
  outcome: string | null;
  assignedToId: string | null;
  isAutomated: boolean;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
}

export interface ActivityTemplate {
  id: string;
  tenantId: string | null;
  name: string;
  type: ActivityType;
  subjectTemplate: string;
  descriptionTemplate: string | null;
  defaultDuration: number | null;
  defaultMetadata: Record<string, unknown>;
  defaultDaysFromNow: number;
  category: string | null;
  isActive: boolean;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Sales / CRM Module (Wave 4 — Leads) ───

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  ENGAGED = 'ENGAGED',
  QUALIFIED = 'QUALIFIED',
  UNQUALIFIED = 'UNQUALIFIED',
  CONVERTED = 'CONVERTED',
}

export enum LeadSource {
  WEB_FORM = 'WEB_FORM',
  REFERRAL = 'REFERRAL',
  EVENT = 'EVENT',
  COLD_OUTREACH = 'COLD_OUTREACH',
  PARTNER = 'PARTNER',
  SOCIAL = 'SOCIAL',
  AD_CAMPAIGN = 'AD_CAMPAIGN',
  INBOUND_CALL = 'INBOUND_CALL',
  OTHER = 'OTHER',
}

export enum LeadRating {
  HOT = 'HOT',
  WARM = 'WARM',
  COLD = 'COLD',
}

export interface Lead {
  id: string;
  tenantId: string | null;
  code: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  companyName: string;
  industry: string | null;
  companySize: string | null;
  website: string | null;
  status: LeadStatus;
  source: LeadSource;
  rating: LeadRating;
  score: number;
  ownerId: string | null;
  assignedAt: string | null;
  budget: number | null;
  authority: string | null;
  need: string | null;
  timeline: string | null;
  convertedAt: string | null;
  convertedAccountId: string | null;
  convertedContactId: string | null;
  convertedOpportunityId: string | null;
  convertedBy: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  notes: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadConvertPayload {
  createAccount: boolean;
  existingAccountId?: string;
  accountName?: string;
  accountIndustry?: string;
  accountWebsite?: string;
  accountType?: AccountType;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactJobTitle?: string;
  createOpportunity: boolean;
  opportunityName?: string;
  estimatedValue?: number;
  expectedCloseDate?: string;
  pipelineId?: string;
}

export interface LeadConvertResult {
  lead: Lead;
  account: Account;
  contact: Contact;
  opportunity?: Opportunity;
}

export interface LeadStats {
  byStatus: Array<{ status: LeadStatus; count: number }>;
  bySource: Array<{ source: LeadSource; count: number }>;
  byRating: Array<{ rating: LeadRating; count: number }>;
  total: number;
  convertedCount: number;
  conversionRate: number;
}

// ─── Quotes (Wave 5) ───

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface Quote {
  id: string;
  tenantId: string;
  code: string;
  opportunityId: string;
  accountId: string | null;
  contactId: string | null;
  status: QuoteStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  issueDate: string;
  expirationDate: string;
  acceptedAt: string | null;
  isSynced: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  terms: string | null;
  notes: string | null;
  customerNotes: string | null;
  preparedBy: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  opportunity?: Opportunity;
  account?: Account;
  contact?: Contact;
  lineItems?: QuoteLineItem[];
}

export interface QuoteLineItem {
  id: string;
  quoteId: string;
  productId: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  serviceStartDate: string | null;
  serviceEndDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface QuoteStats {
  byStatus: Array<{ status: QuoteStatus; count: number }>;
  total: number;
  totalValue: number;
  avgValue: number;
}
