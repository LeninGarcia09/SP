import { z } from 'zod';
import {
  ProjectStatus,
  TaskStatus,
  Priority,
  TaskActivityType,
  ProjectMemberRole,
  AssetCategory,
  ItemStatus,
  TransactionType,
  AssignmentStatus,
  UserRole,
  NotificationType,
  SkillCategory,
  ProficiencyLevel,
  ProgramStatus,
  OpportunityStatus,
  OpportunityStage,
  AccountType,
  AccountTier,
  ContactChannel,
  ContactType,
  ContactInfluence,
  ForecastCategory,
  OpportunityType,
  DealHealth,
  StakeholderRole,
  StakeholderInfluence,
  StakeholderSentiment,
  TeamMemberRole,
  ProductCategory,
  RecurringInterval,
  ThreatLevel,
  CompetitorStatus,
  VendorStatus,
} from '../types/index.js';

// ─── Project Schemas ───

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(''),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  startDate: z.string().date(),
  endDate: z.string().date(),
  budget: z.number().nonnegative().default(0),
  actualCost: z.number().nonnegative().default(0),
  costRate: z.number().nonnegative().default(0),
  projectLeadId: z.string().uuid(),
  metadata: z.record(z.unknown()).default({}),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;

// ─── Task Schemas ───

export const createTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).default(''),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  assigneeId: z.string().uuid().nullable().default(null),
  dueDate: z.string().date().nullable().default(null),
  estimatedHours: z.number().nonnegative().nullable().default(null),
  parentTaskId: z.string().uuid().nullable().default(null),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .extend({
    actualHours: z.number().nonnegative().nullable().optional(),
  });

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

// ─── Task Comment Schema ───

export const createTaskCommentSchema = z.object({
  comment: z.string().min(1).max(5000),
});

export type CreateTaskCommentDto = z.infer<typeof createTaskCommentSchema>;

// ─── Project Note Schemas ───

export const createProjectNoteSchema = z.object({
  content: z.string().min(1).max(10000),
  metadata: z.record(z.unknown()).default({}),
  isPinned: z.boolean().default(false),
});

export const updateProjectNoteSchema = createProjectNoteSchema.partial();

export type CreateProjectNoteDto = z.infer<typeof createProjectNoteSchema>;
export type UpdateProjectNoteDto = z.infer<typeof updateProjectNoteSchema>;

// ─── Project Member Schemas ───

export const addProjectMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(ProjectMemberRole).default(ProjectMemberRole.MEMBER),
});

export type AddProjectMemberDto = z.infer<typeof addProjectMemberSchema>;

// ─── Person Schemas ───

export const createPersonSchema = z.object({
  employeeId: z.string().max(50).nullable().default(null),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  jobTitle: z.string().min(1).max(200),
  departmentId: z.string().uuid(),
  assignmentStatus: z.nativeEnum(AssignmentStatus).default(AssignmentStatus.ON_BENCH),
  startDate: z.string().date(),
  skills: z.array(z.string()).default([]),
  availabilityNotes: z.string().max(2000).nullable().default(null),
});

export const updatePersonSchema = createPersonSchema.partial();

export type CreatePersonDto = z.infer<typeof createPersonSchema>;
export type UpdatePersonDto = z.infer<typeof updatePersonSchema>;

// ─── Project Assignment Schemas ───

export const createAssignmentSchema = z.object({
  personId: z.string().uuid(),
  projectId: z.string().uuid(),
  role: z.string().min(1).max(100),
  allocationPercent: z.number().int().min(0).max(100),
  startDate: z.string().date(),
  endDate: z.string().date().nullable().default(null),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentDto = z.infer<typeof updateAssignmentSchema>;

// ─── Inventory Schemas ───

export const createInventoryItemSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().default(null),
  category: z.nativeEnum(AssetCategory),
  serialNumber: z.string().max(100).nullable().default(null),
  location: z.string().max(200).nullable().default(null),
  purchaseDate: z.string().date().nullable().default(null),
  purchaseCost: z.number().nonnegative().nullable().default(null),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export type CreateInventoryItemDto = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemDto = z.infer<typeof updateInventoryItemSchema>;

export const createInventoryTransactionSchema = z.object({
  itemId: z.string().uuid(),
  transactionType: z.nativeEnum(TransactionType),
  fromPersonId: z.string().uuid().nullable().default(null),
  toPersonId: z.string().uuid().nullable().default(null),
  fromProjectId: z.string().uuid().nullable().default(null),
  toProjectId: z.string().uuid().nullable().default(null),
  notes: z.string().max(2000).nullable().default(null),
});

export type CreateInventoryTransactionDto = z.infer<typeof createInventoryTransactionSchema>;

// ─── User Schemas ───

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;

// ─── RAG Override Schema ───

export const ragOverrideSchema = z.object({
  overallRag: z.enum(['GREEN', 'AMBER', 'RED']),
  overrideReason: z.string().min(20).max(1000),
});

export type RagOverrideDto = z.infer<typeof ragOverrideSchema>;

// ─── Pagination Schema ───

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
  search: z.string().optional(),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

// ─── Notification Schemas ───

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  relatedEntityType: z.string().max(50).nullable().default(null),
  relatedEntityId: z.string().uuid().nullable().default(null),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;

// ─── Skill Schemas ───

export const createSkillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.nativeEnum(SkillCategory),
  description: z.string().max(500).nullable().default(null),
});

export const updateSkillSchema = createSkillSchema.partial();

export type CreateSkillDto = z.infer<typeof createSkillSchema>;
export type UpdateSkillDto = z.infer<typeof updateSkillSchema>;

export const assignSkillSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: z.nativeEnum(ProficiencyLevel).default(ProficiencyLevel.BEGINNER),
  yearsOfExperience: z.number().nonnegative().nullable().default(null),
  notes: z.string().max(500).nullable().default(null),
});

export const updatePersonSkillSchema = z.object({
  proficiency: z.nativeEnum(ProficiencyLevel).optional(),
  yearsOfExperience: z.number().nonnegative().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export type AssignSkillDto = z.infer<typeof assignSkillSchema>;
export type UpdatePersonSkillDto = z.infer<typeof updatePersonSkillSchema>;

// ─── Program Schemas ───

export const createProgramSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(''),
  status: z.nativeEnum(ProgramStatus).default(ProgramStatus.PLANNING),
  startDate: z.string().date(),
  endDate: z.string().date().nullable().default(null),
  budget: z.number().nonnegative().default(0),
  managerId: z.string().uuid(),
  metadata: z.record(z.unknown()).default({}),
});

export const updateProgramSchema = createProgramSchema.partial();

export type CreateProgramDto = z.infer<typeof createProgramSchema>;
export type UpdateProgramDto = z.infer<typeof updateProgramSchema>;

// ─── Opportunity Schemas ───

export const createOpportunitySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(''),
  status: z.nativeEnum(OpportunityStatus).default(OpportunityStatus.IDENTIFIED),
  stage: z.nativeEnum(OpportunityStage).default(OpportunityStage.SEED),
  estimatedValue: z.number().nonnegative().default(0),
  probability: z.number().min(0).max(100).default(0),
  expectedCloseDate: z.string().date().nullable().default(null),
  clientName: z.string().min(1).max(200),
  clientContact: z.string().max(200).nullable().default(null),
  ownerId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const updateOpportunitySchema = createOpportunitySchema.partial();

export type CreateOpportunityDto = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityDto = z.infer<typeof updateOpportunitySchema>;

export const convertOpportunitySchema = z.object({
  projectName: z.string().min(1).max(200),
  projectCode: z.string().min(1).max(50),
  projectLeadId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  budget: z.number().nonnegative().optional(),
  programId: z.string().uuid().nullable().optional(),
});

export type ConvertOpportunityDto = z.infer<typeof convertOpportunitySchema>;

// ─── Sales / CRM Module (Wave 1) ───

export const createAccountSchema = z.object({
  name: z.string().min(1).max(200),
  legalName: z.string().max(200).nullable().optional(),
  industry: z.string().max(100).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email().nullable().optional(),
  addressLine1: z.string().max(200).nullable().optional(),
  addressLine2: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  type: z.nativeEnum(AccountType).default(AccountType.PROSPECT),
  tier: z.nativeEnum(AccountTier).nullable().optional(),
  annualRevenue: z.number().nonnegative().nullable().optional(),
  employeeCount: z.number().int().nonnegative().nullable().optional(),
  ownerId: z.string().uuid().optional(),
  parentAccountId: z.string().uuid().nullable().optional(),
  source: z.string().max(100).nullable().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export const createContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  mobilePhone: z.string().max(50).nullable().optional(),
  jobTitle: z.string().max(200).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  accountId: z.string().uuid(),
  reportsToId: z.string().uuid().nullable().optional(),
  preferredChannel: z.nativeEnum(ContactChannel).default(ContactChannel.EMAIL),
  timezone: z.string().max(50).nullable().optional(),
  language: z.string().max(10).default('en'),
  type: z.nativeEnum(ContactType).default(ContactType.OTHER),
  influence: z.nativeEnum(ContactInfluence).nullable().optional(),
  linkedinUrl: z.string().max(500).nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export const updateContactSchema = createContactSchema.partial();

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export const createPipelineSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
});

export const updatePipelineSchema = createPipelineSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;

export const createPipelineStageSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0),
  defaultProbability: z.number().int().min(0).max(100),
  forecastCategory: z.nativeEnum(ForecastCategory).default(ForecastCategory.PIPELINE),
  isClosed: z.boolean().default(false),
  isWon: z.boolean().default(false),
  requiredFields: z.array(z.string()).default([]),
  checklist: z.array(z.record(z.unknown())).default([]),
  daysExpected: z.number().int().min(0).nullable().optional(),
  autoActions: z.array(z.record(z.unknown())).default([]),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).nullable().optional(),
});

export const updatePipelineStageSchema = createPipelineStageSchema.partial();

export type CreatePipelineStageInput = z.infer<typeof createPipelineStageSchema>;
export type UpdatePipelineStageInput = z.infer<typeof updatePipelineStageSchema>;

// ─── Sales / CRM Module (Wave 2) ───

// Product
export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  category: z.nativeEnum(ProductCategory).default(ProductCategory.SERVICE),
  family: z.string().max(100).nullable().optional(),
  vendorId: z.string().uuid().nullable().optional(),
  unitPrice: z.number().nonnegative().default(0),
  currency: z.string().max(3).default('USD'),
  unit: z.string().max(50).default('unit'),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.nativeEnum(RecurringInterval).nullable().optional(),
  minQuantity: z.number().int().min(1).default(1),
  maxDiscount: z.number().min(0).max(100).default(0),
  metadata: z.record(z.unknown()).default({}),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Opportunity Stakeholder
export const createStakeholderSchema = z.object({
  contactId: z.string().uuid(),
  role: z.nativeEnum(StakeholderRole).default(StakeholderRole.INFLUENCER),
  influence: z.nativeEnum(StakeholderInfluence).default(StakeholderInfluence.MEDIUM),
  sentiment: z.nativeEnum(StakeholderSentiment).default(StakeholderSentiment.UNKNOWN),
  isPrimary: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

export const updateStakeholderSchema = createStakeholderSchema.partial();

export type CreateStakeholderInput = z.infer<typeof createStakeholderSchema>;
export type UpdateStakeholderInput = z.infer<typeof updateStakeholderSchema>;

// Opportunity Team Member
export const createTeamMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(TeamMemberRole).default(TeamMemberRole.OWNER),
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial();

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;

// Opportunity Line Item
export const createLineItemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
  discount: z.number().min(0).max(100).default(0),
  serviceStartDate: z.string().date().nullable().optional(),
  serviceEndDate: z.string().date().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateLineItemSchema = createLineItemSchema.partial();

export type CreateLineItemInput = z.infer<typeof createLineItemSchema>;
export type UpdateLineItemInput = z.infer<typeof updateLineItemSchema>;

// Opportunity Competitor
export const createCompetitorSchema = z.object({
  competitorName: z.string().min(1).max(200),
  competitorAccountId: z.string().uuid().nullable().optional(),
  strengths: z.string().nullable().optional(),
  weaknesses: z.string().nullable().optional(),
  threatLevel: z.nativeEnum(ThreatLevel).default(ThreatLevel.MEDIUM),
  status: z.nativeEnum(CompetitorStatus).default(CompetitorStatus.ACTIVE),
  notes: z.string().nullable().optional(),
});

export const updateCompetitorSchema = createCompetitorSchema.partial();

export type CreateCompetitorInput = z.infer<typeof createCompetitorSchema>;
export type UpdateCompetitorInput = z.infer<typeof updateCompetitorSchema>;

// Enhanced Opportunity (Wave 2 fields)
export const updateOpportunityEnhancedSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  accountId: z.string().uuid().nullable().optional(),
  primaryContactId: z.string().uuid().nullable().optional(),
  estimatedValue: z.number().nonnegative().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().date().nullable().optional(),
  type: z.nativeEnum(OpportunityType).optional(),
  priority: z.nativeEnum(Priority).optional(),
  leadSource: z.string().max(100).nullable().optional(),
  nextStep: z.string().max(500).nullable().optional(),
  nextStepDueDate: z.string().date().nullable().optional(),
  lostReason: z.string().max(500).nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateOpportunityEnhancedInput = z.infer<typeof updateOpportunityEnhancedSchema>;

// Stage change DTO
export const changeStageSchema = z.object({
  stageId: z.string().uuid(),
  probability: z.number().min(0).max(100).optional(),
  lostReason: z.string().max(500).optional(),
  actualCloseDate: z.string().date().optional(),
});

export type ChangeStageInput = z.infer<typeof changeStageSchema>;

// Vendor
export const createVendorSchema = z.object({
  name: z.string().min(1).max(200),
  legalName: z.string().max(200).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email().max(200).nullable().optional(),
  contactPerson: z.string().max(200).nullable().optional(),
  addressLine1: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  status: z.nativeEnum(VendorStatus).default(VendorStatus.ACTIVE),
  notes: z.string().max(2000).nullable().optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

// ─── Activities ───

import { ActivityType, ActivityStatus, LeadStatus, LeadSource, LeadRating } from '../types';

export const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  subtype: z.string().max(50).nullable().optional(),
  subject: z.string().min(1).max(500),
  description: z.string().max(5000).nullable().optional(),
  opportunityId: z.string().uuid().nullable().optional(),
  accountId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  status: z.nativeEnum(ActivityStatus).nullable().optional(),
  priority: z.nativeEnum(Priority).nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
  startTime: z.string().datetime({ offset: true }).nullable().optional(),
  endTime: z.string().datetime({ offset: true }).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  duration: z.number().int().min(0).nullable().optional(),
  outcome: z.string().max(100).nullable().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const createActivityTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(ActivityType),
  subjectTemplate: z.string().min(1).max(500),
  descriptionTemplate: z.string().max(5000).nullable().optional(),
  defaultDuration: z.number().int().min(0).nullable().optional(),
  defaultMetadata: z.record(z.unknown()).optional(),
  defaultDaysFromNow: z.number().int().min(0).default(1),
  category: z.string().max(50).nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateActivityTemplateSchema = createActivityTemplateSchema.partial();

export type CreateActivityTemplateInput = z.infer<typeof createActivityTemplateSchema>;
export type UpdateActivityTemplateInput = z.infer<typeof updateActivityTemplateSchema>;

// ─── Leads (Wave 4) ───

export const createLeadSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(200).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  jobTitle: z.string().max(200).nullable().optional(),
  companyName: z.string().min(1).max(200),
  industry: z.string().max(100).nullable().optional(),
  companySize: z.string().max(50).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  source: z.nativeEnum(LeadSource).default(LeadSource.OTHER),
  rating: z.nativeEnum(LeadRating).default(LeadRating.WARM),
  score: z.number().int().min(0).max(100).default(0),
  ownerId: z.string().uuid().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  authority: z.string().max(200).nullable().optional(),
  need: z.string().max(5000).nullable().optional(),
  timeline: z.string().max(100).nullable().optional(),
  nextFollowUpAt: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export const updateLeadSchema = createLeadSchema.partial();

export const convertLeadSchema = z.object({
  createAccount: z.boolean(),
  existingAccountId: z.string().uuid().optional(),
  accountName: z.string().max(200).optional(),
  accountIndustry: z.string().max(100).optional(),
  accountWebsite: z.string().max(500).optional(),
  accountType: z.nativeEnum(AccountType).optional(),
  contactFirstName: z.string().max(100).optional(),
  contactLastName: z.string().max(100).optional(),
  contactEmail: z.string().email().max(200).optional(),
  contactPhone: z.string().max(50).optional(),
  contactJobTitle: z.string().max(200).optional(),
  createOpportunity: z.boolean(),
  opportunityName: z.string().max(200).optional(),
  estimatedValue: z.number().nonnegative().optional(),
  expectedCloseDate: z.string().date().optional(),
  pipelineId: z.string().uuid().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
