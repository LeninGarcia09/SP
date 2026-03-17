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
  ownerId: z.string().uuid(),
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
