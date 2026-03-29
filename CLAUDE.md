# CLAUDE.md — Business Operations Platform
> Master context file for Claude Code. Read this at the start of every session.

---

## 1. Project Identity

**Product:** Business Operations Platform (internal tool)
**Stack:** React + TypeScript (frontend) · NestJS + TypeScript (backend) · PostgreSQL · Azure
**Repo layout:** Monorepo — `apps/web`, `apps/api`, `packages/shared` (npm workspaces)
**Phase:** Core platform complete; Sales/CRM module expansion in progress (see §8 for scope)
**Multi-tenant:** Yes — Azure AD multi-org with tenant-scoped data isolation
**Solo developer** — full-stack ownership of frontend, backend, and infrastructure.

---

## 2. Tech Stack — Exact Versions & Decisions

### Frontend (`apps/web`)
| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build | Vite |
| Routing | React Router v6 |
| State | Zustand (global) + React Query (server state) |
| UI components | shadcn/ui + Tailwind CSS |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| HTTP client | Axios with interceptors |
| Auth | MSAL.js (Microsoft Authentication Library) |

### Backend (`apps/api`)
| Layer | Choice |
|---|---|
| Framework | NestJS 10 + TypeScript 5 |
| ORM | TypeORM |
| Database | PostgreSQL 16 |
| Auth | Passport.js + Azure AD (OIDC) + JWT |
| Validation | class-validator + class-transformer |
| API docs | Swagger (auto-generated) |
| Queue | Azure Service Bus |
| Cache | Redis (Azure Cache for Redis) |

### Infrastructure (Azure)
| Service | Purpose |
|---|---|
| Azure AD (Entra ID) | Identity, RBAC, SSO |
| Azure Container Apps | Backend hosting |
| Azure Static Web Apps | Frontend hosting |
| Azure Database for PostgreSQL Flexible Server | Primary DB |
| Azure Cache for Redis | Session + query cache |
| Azure Service Bus | Async messaging |
| Azure Blob Storage | File attachments |
| Azure Key Vault | Secrets management |
| Azure Application Insights | Monitoring + logging |

---

## 3. Repository Structure

```
bizops-platform/
├── apps/
│   ├── web/                        # React + TypeScript frontend
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   │   ├── ui/             # shadcn/ui base components
│   │   │   │   ├── shared/         # Reusable business components
│   │   │   │   ├── projects/       # Project-specific components
│   │   │   │   ├── programs/       # Program components
│   │   │   │   ├── tasks/          # Task components
│   │   │   │   ├── personnel/      # Personnel components
│   │   │   │   ├── inventory/      # Inventory components
│   │   │   │   └── opportunities/  # Opportunity components
│   │   │   ├── hooks/              # React Query hooks (one per module)
│   │   │   ├── i18n/               # Internationalization (EN + ES)
│   │   │   ├── lib/                # Axios instance, MSAL config, utils
│   │   │   ├── pages/              # Route-level page components
│   │   │   ├── store/              # Zustand stores
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                        # NestJS backend
│       ├── src/
│       │   ├── auth/               # Azure AD + JWT strategy (multi-tenant)
│       │   ├── common/             # Guards, interceptors, decorators, middleware
│       │   ├── config/             # ConfigModule setup, env validation
│       │   ├── database/           # TypeORM config, migrations
│       │   ├── modules/
│       │   │   ├── users/
│       │   │   ├── projects/
│       │   │   ├── tasks/
│       │   │   ├── programs/
│       │   │   ├── opportunities/  # Basic CRUD (being expanded — see §4b)
│       │   │   ├── health/         # RAG engine
│       │   │   ├── personnel/
│       │   │   ├── skills/
│       │   │   ├── inventory/
│       │   │   ├── costs/          # Cost entries + forecasting
│       │   │   ├── deliverables/
│       │   │   ├── notifications/
│       │   │   └── admin/          # Microsoft Graph, tenant management
│       │   └── main.ts
│       ├── test/
│       ├── migrations/
│       └── package.json
│
├── packages/
│   └── shared/                     # Shared TypeScript types & Zod schemas
│       ├── src/
│       │   ├── types/
│       │   └── schemas/
│       └── package.json
│
├── infrastructure/
│   ├── bicep/                      # Azure Bicep IaC templates (8 modules)
│   │   ├── main.bicep
│   │   ├── modules/
│   │   └── parameters/
│   ├── scripts/                    # Setup & deployment scripts
│   └── DEPLOYMENT.md               # Full deployment guide
│
├── docs/
│   ├── SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md  # Sales module spec (~3500 lines)
│   ├── ENHANCEMENT_PLAN_HOURS_COST_RESOURCES.md   # Hours/Cost/Resource plan
│   └── UI_UX_ENHANCEMENT_PLAN.md                  # Dashboard & UI modernization
│
├── scripts/
│   └── seed.ts                     # Database seeding
│
├── .github/
│   └── workflows/                  # CI/CD (GitHub Actions)
│
├── docker-compose.yml              # Local dev: Postgres + Redis
├── CLAUDE.md                       # ← You are here
├── PROJECT_STATUS.md               # Phase completion tracker
└── package.json                    # Root workspace config
```

---

## 4. Data Model — Core Entities

> **Note:** For the full Sales/CRM entity specifications, see `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md`.

### 4a. Users & Access
```typescript
// User (synced from Azure AD)
User {
  id: uuid PK
  azureAdOid: string UNIQUE       // Azure AD Object ID
  tenantId: string                // Azure AD Tenant ID (multi-tenant isolation)
  email: string UNIQUE
  displayName: string
  role: UserRole                  // enum — see §5
  departmentId: uuid FK
  isActive: boolean
  createdAt, updatedAt: timestamp
}

// Department
Department {
  id: uuid PK
  name: string
  managerId: uuid FK → User
}
```

### 4b. Projects & Tasks
```typescript
Project {
  id: uuid PK
  tenantId: string                // Multi-tenant isolation
  code: string UNIQUE             // e.g. "PROJ-2024-001"
  name: string
  description: text
  status: ProjectStatus           // PLANNING | ACTIVE | ON_HOLD | COMPLETED | CANCELLED
  startDate, endDate: date
  budget: decimal(15,2)
  costRate: decimal(10,2)         // Labor cost per hour
  programId: uuid FK → Program nullable
  projectLeadId: uuid FK → User
  createdBy: uuid FK → User
  metadata: jsonb default {}      // Custom/dynamic fields (JSONB — indexed with GIN)
  createdAt, updatedAt: timestamp
}

Task {
  id: uuid PK
  projectId: uuid FK → Project
  title: string
  description: text
  status: TaskStatus              // TODO | IN_PROGRESS | BLOCKED | DONE
  priority: Priority              // LOW | MEDIUM | HIGH | CRITICAL
  assigneeId: uuid FK → User nullable
  dueDate: date nullable
  estimatedHours: decimal(6,2)
  actualHours: decimal(6,2)
  parentTaskId: uuid FK nullable  // subtask support
  createdAt, updatedAt: timestamp
}

Program {
  id: uuid PK
  tenantId: string
  code: string UNIQUE
  name: string
  description: text
  status: ProgramStatus
  startDate, endDate: date
  budget: decimal(15,2)
  managerId: uuid FK → User
  createdAt, updatedAt: timestamp
}
```

### 4c. Cost Management
```typescript
CostEntry {
  id: uuid PK
  tenantId: string
  projectId: uuid FK → Project
  category: CostCategory          // LABOR | MATERIALS | EQUIPMENT | SUBCONTRACTOR | TRAVEL | OTHER
  description: string
  amount: decimal(15,2)
  date: date
  status: CostStatus              // DRAFT | SUBMITTED | APPROVED | REJECTED
  submittedById: uuid FK → User
  approvedById: uuid FK → User nullable
  createdAt, updatedAt: timestamp
}
```

### 4d. Health Dashboard
```typescript
ProjectHealthSnapshot {
  id: uuid PK
  projectId: uuid FK → Project
  snapshotDate: date
  overallRag: RagStatus           // GREEN | AMBER | RED | BLUE | GRAY
  scheduleRag: RagStatus
  budgetRag: RagStatus
  autoCalculated: boolean
  overrideReason: text nullable   // required if manually set
  overrideBy: uuid FK → User nullable
  createdAt: timestamp
}

// RAG calculation is always server-side. Client never sets RAG directly.
// Calculation triggers: task status change, budget update, snapshot schedule (daily at 02:00)
```

### 4e. Personnel & Assignments
```typescript
Person {
  id: uuid PK
  tenantId: string
  userId: uuid FK → User nullable   // null = external contractor not in AD
  employeeId: string UNIQUE nullable
  firstName, lastName: string
  email: string UNIQUE
  jobTitle: string
  departmentId: uuid FK → Department
  assignmentStatus: AssignmentStatus  // ON_PROJECT | ON_OPPORTUNITY | ON_OPERATIONS | ON_BENCH
  startDate: date
  skills: string[]                   // Also linked via Skills module
  availabilityNotes: text nullable
  createdAt, updatedAt: timestamp
}

ProjectAssignment {
  id: uuid PK
  personId: uuid FK → Person
  projectId: uuid FK → Project
  role: string
  allocationPercent: int            // 0–100
  startDate, endDate: date nullable
  isActive: boolean
}
```

### 4f. Inventory
```typescript
InventoryItem {
  id: uuid PK
  tenantId: string
  sku: string UNIQUE
  name: string
  description: text nullable
  category: AssetCategory         // TOOL_EQUIPMENT | CONSUMABLE | VEHICLE | SOFTWARE_LICENSE
  status: ItemStatus              // AVAILABLE | CHECKED_OUT | MAINTENANCE | RETIRED
  serialNumber: string nullable
  location: string nullable
  purchaseDate: date nullable
  purchaseCost: decimal(12,2) nullable
  assignedToPersonId: uuid FK → Person nullable
  assignedToProjectId: uuid FK → Project nullable
  createdAt, updatedAt: timestamp
}

InventoryTransaction {
  id: uuid PK
  itemId: uuid FK → InventoryItem
  transactionType: TransactionType  // CHECK_OUT | CHECK_IN | TRANSFER | MAINTENANCE | RETIREMENT
  fromPersonId: uuid FK → Person nullable
  toPersonId: uuid FK → Person nullable
  fromProjectId: uuid FK → Project nullable
  toProjectId: uuid FK → Project nullable
  performedById: uuid FK → User
  notes: text nullable
  transactionDate: timestamp
  // NO updatedAt — this table is APPEND-ONLY (immutable audit log)
}
```

### 4g. Sales & CRM Module (In Progress — 7 Waves)

> **Full spec:** `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md`

The Sales module transforms the basic Opportunities CRUD into a full B2B CRM platform. Key entities:

```typescript
// Wave 1 — Foundation
Account {
  id: uuid PK
  tenantId: string
  name: string
  industry: string nullable
  website: string nullable
  type: AccountType               // PROSPECT | CUSTOMER | PARTNER | VENDOR | COMPETITOR | OTHER
  status: AccountStatus           // ACTIVE | INACTIVE | CHURNED
  annualRevenue: decimal nullable
  employeeCount: int nullable
  address, city, state, country: string nullable
  ownerId: uuid FK → User
  parentAccountId: uuid FK → Account nullable  // Account hierarchy
  createdAt, updatedAt: timestamp
}

Contact {
  id: uuid PK
  tenantId: string
  accountId: uuid FK → Account
  firstName, lastName: string
  email: string
  phone: string nullable
  jobTitle: string nullable
  department: string nullable
  isPrimary: boolean default false
  doNotContact: boolean default false
  ownerId: uuid FK → User
  createdAt, updatedAt: timestamp
}

SalesPipeline {
  id: uuid PK
  tenantId: string
  name: string                    // e.g. "Enterprise Pipeline", "SMB Pipeline"
  isDefault: boolean
  isActive: boolean
  stages: PipelineStage[]         // Ordered stages with win probability
}

PipelineStage {
  id: uuid PK
  pipelineId: uuid FK → SalesPipeline
  name: string                    // e.g. "Qualification", "Proposal", "Negotiation"
  displayOrder: int
  winProbability: int             // 0-100
  stageCategory: StageCategory    // OPEN | WON | LOST
}

// Wave 2 — Enhanced Opportunity
Opportunity {
  // Enhanced from existing — adds pipeline, account, contacts, line items
  id: uuid PK
  tenantId: string
  accountId: uuid FK → Account
  pipelineId: uuid FK → SalesPipeline
  currentStageId: uuid FK → PipelineStage
  primaryContactId: uuid FK → Contact nullable
  name, description: string
  amount: decimal(15,2)           // Weighted pipeline value
  probability: int                // Current win probability
  expectedCloseDate: date
  actualCloseDate: date nullable
  lostReason: string nullable
  ownerId: uuid FK → User
  source: LeadSource              // INBOUND | OUTBOUND | REFERRAL | PARTNER | EVENT | OTHER
  createdAt, updatedAt: timestamp
}

OpportunityStakeholder {
  id: uuid PK
  opportunityId: uuid FK → Opportunity
  contactId: uuid FK → Contact
  role: StakeholderRole           // DECISION_MAKER | CHAMPION | INFLUENCER | EVALUATOR | BLOCKER | END_USER
  influence: InfluenceLevel       // HIGH | MEDIUM | LOW
  sentiment: Sentiment            // STRONG_POSITIVE | POSITIVE | NEUTRAL | NEGATIVE | UNKNOWN
}

Product {
  id: uuid PK
  tenantId: string
  name, sku: string
  description: text nullable
  category: string
  unitPrice: decimal(15,2)
  currency: string default 'USD'
  isActive: boolean
}

OpportunityLineItem {
  id: uuid PK
  opportunityId: uuid FK → Opportunity
  productId: uuid FK → Product
  quantity: decimal
  unitPrice, discount: decimal
  totalPrice: decimal             // computed
}

// Wave 3 — Activities & Timeline
Activity {
  id: uuid PK
  tenantId: string
  type: ActivityType              // CALL | EMAIL | MEETING | NOTE | TASK
  subject: string
  description: text nullable
  status: ActivityStatus          // PLANNED | COMPLETED | CANCELLED
  dueDate: datetime nullable
  completedDate: datetime nullable
  duration: int nullable          // minutes
  outcome: string nullable
  ownerId: uuid FK → User
  // Polymorphic — linked to account, contact, opportunity, or lead
  accountId: uuid FK nullable
  contactId: uuid FK nullable
  opportunityId: uuid FK nullable
  leadId: uuid FK nullable
  createdAt, updatedAt: timestamp
}

// Wave 4 — Leads & Conversion
Lead {
  id: uuid PK
  tenantId: string
  firstName, lastName: string
  email: string
  company: string nullable
  jobTitle: string nullable
  source: LeadSource
  status: LeadStatus              // NEW | CONTACTED | QUALIFIED | UNQUALIFIED | CONVERTED
  score: int default 0            // Lead scoring
  ownerId: uuid FK → User
  convertedAccountId: uuid FK nullable
  convertedContactId: uuid FK nullable
  convertedOpportunityId: uuid FK nullable
  convertedAt: datetime nullable
  createdAt, updatedAt: timestamp
}

// Wave 5 — Quoting
Quote {
  id: uuid PK
  tenantId: string
  opportunityId: uuid FK → Opportunity
  quoteNumber: string UNIQUE
  status: QuoteStatus             // DRAFT | SENT | ACCEPTED | REJECTED | EXPIRED
  validUntil: date
  subtotal, discount, tax, total: decimal(15,2)
  terms: text nullable
  preparedById: uuid FK → User
  lineItems: QuoteLineItem[]
  createdAt, updatedAt: timestamp
}

// Wave 7 — Sales Automation
WorkflowRule {
  id: uuid PK
  tenantId: string
  name: string
  entityType: string              // 'opportunity' | 'lead' | 'account' | 'contact'
  triggerEvent: string            // 'create' | 'update' | 'stage_change' | 'field_change'
  conditions: jsonb               // Rule conditions
  actions: jsonb                  // Actions to execute
  isActive: boolean
  executionOrder: int
}

Sequence {
  id: uuid PK
  tenantId: string
  name: string
  description: text nullable
  status: SequenceStatus          // DRAFT | ACTIVE | PAUSED | ARCHIVED
  steps: SequenceStep[]           // Ordered steps with delays/conditions
}

AssignmentRule {
  id: uuid PK
  tenantId: string
  name: string
  entityType: string
  criteria: jsonb                 // Matching criteria
  assignmentMethod: string        // ROUND_ROBIN | LOAD_BALANCED | SPECIFIC_USER
  isActive: boolean
}
```

---

## 5. RBAC — Roles & Permissions

```typescript
enum UserRole {
  GLOBAL_LEAD         // Full platform access
  BIZ_OPS_MANAGER     // All resources, capacity, assignments
  RESOURCE_MANAGER    // Own department/team
  PROGRAM_MANAGER     // Assigned programs (multi-project)
  PROJECT_LEAD        // Assigned projects
  PROJECT_PERSONNEL   // Own tasks only
  INVENTORY_MANAGER   // All inventory/assets
  HR_ADMIN            // HR records + salary (RESTRICTED scope)
  ADMIN               // Azure AD tenant management, Graph API
  OPERATIONS_DIRECTOR // Cross-functional visibility
  SALES_EXECUTIVE     // Sales pipeline, opportunities, accounts
}
```

**Permission matrix — Core Platform:**

| Resource | GLOBAL_LEAD | BIZ_OPS_MGR | RESOURCE_MGR | PROGRAM_MGR | PROJECT_LEAD | PERSONNEL | INVENTORY_MGR |
|---|---|---|---|---|---|---|---|
| Projects (all) | CRUD | R | R | R (assigned) | CRUD (own) | R (own) | R |
| Tasks | CRUD | R | R | R (assigned) | CRUD (own) | RU (own) | - |
| RAG override | ✓ | ✓ | - | - | - | - | - |
| Personnel | CRUD | CRUD | RU (dept) | R | R | R (self) | - |
| Assignments | CRUD | CRUD | RU (dept) | R | - | - | - |
| Inventory | CRUD | R | R | R | R | R | CRUD |
| User mgmt | CRUD | R | - | - | - | - | - |
| Cost entries | CRUD | CRUD | R | R (assigned) | CRUD (own) | R (own) | - |

**Permission matrix — Sales/CRM Module:**

| Resource | GLOBAL_LEAD | BIZ_OPS_MGR | SALES_EXECUTIVE | PROJECT_LEAD | PERSONNEL |
|---|---|---|---|---|---|
| Accounts | CRUD | CRUD | CRUD (own) | R | R |
| Contacts | CRUD | CRUD | CRUD (own accts) | R | - |
| Opportunities | CRUD | CRUD | CRUD (own) | R | - |
| Leads | CRUD | CRUD | CRUD (own) | - | - |
| Quotes | CRUD | CRUD | CRUD (own opps) | R | - |
| Activities | CRUD | CRUD | CRUD (own) | R (own) | R (own) |
| Pipelines/Stages | CRUD | CRUD | R | R | - |
| Products | CRUD | CRUD | R | R | - |
| Workflow Rules | CRUD | CRUD | R | - | - |
| Assignment Rules | CRUD | CRUD | - | - | - |

Guards: `@Roles(...roles)` decorator on every controller endpoint. `RolesGuard` checks `request.user.role`. Multi-tenant: `TenantGuard` ensures data isolation via `tenantId` on all queries.

---

## 6. API Design Conventions

### Base URL
- Local: `http://localhost:3000/api/v1`
- Production: `https://api.bizops.[domain]/api/v1`

### Route structure
```
# Core Platform
GET    /api/v1/projects                    List (paginated)
POST   /api/v1/projects                    Create
GET    /api/v1/projects/:id                Get one
PATCH  /api/v1/projects/:id                Update (partial)
DELETE /api/v1/projects/:id                Soft delete

GET    /api/v1/projects/:id/tasks          Nested resource
GET    /api/v1/projects/:id/health         RAG snapshot history
POST   /api/v1/projects/:id/health/trigger Manual RAG recalculation
GET    /api/v1/projects/:id/hours-summary  Hours rollup
GET    /api/v1/projects/:id/cost-forecast  EAC/ETC/VAC/CPI
GET    /api/v1/projects/:id/burn-data      Burn-down chart data

# Sales/CRM Module (planned — 7 waves)
GET    /api/v1/accounts                    Accounts list
POST   /api/v1/accounts                    Create account
GET    /api/v1/accounts/:id/contacts       Contacts for account
POST   /api/v1/contacts                    Create contact
GET    /api/v1/pipelines                   Sales pipelines
POST   /api/v1/pipelines                   Create pipeline
GET    /api/v1/opportunities               Opportunities list
POST   /api/v1/opportunities               Create opportunity
PATCH  /api/v1/opportunities/:id/stage     Move to pipeline stage
GET    /api/v1/opportunities/:id/activities Activity timeline
POST   /api/v1/leads                       Create lead
POST   /api/v1/leads/:id/convert           Convert lead → account + contact + opportunity
GET    /api/v1/quotes                      Quotes list
POST   /api/v1/quotes                      Create quote
POST   /api/v1/quotes/:id/send             Send quote
```

### Response envelope
```typescript
// Success
{ data: T, meta?: PaginationMeta }

// Error
{ error: { code: string, message: string, details?: unknown } }

// Paginated
{ data: T[], meta: { total: number, page: number, limit: number, totalPages: number } }
```

### Standard query params
`?page=1&limit=25&sortBy=createdAt&order=DESC&search=term`

---

## 7. Environment Variables

### Backend (`apps/api/.env`)
```env
# App
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/bizops_dev
DATABASE_SSL=false

# Redis
REDIS_URL=redis://localhost:6379

# Azure AD
AZURE_AD_TENANT_ID=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_AUDIENCE=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=8h

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=attachments

# Azure Service Bus
AZURE_SERVICE_BUS_CONNECTION_STRING=

# App Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=
```

### Frontend (`apps/web/.env`)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_AZURE_AD_TENANT_ID=
VITE_AZURE_AD_CLIENT_ID=
VITE_AZURE_AD_REDIRECT_URI=http://localhost:5173
```

---

## 8. Completed & Current Scope

### ✅ COMPLETED — Core Platform
1. Azure AD multi-tenant authentication + RBAC (11 roles, 3 tenants)
2. Multi-tenant data isolation (17 entities, `tenantId` on all queries)
3. Microsoft Graph integration (User.Read.All, Organization.Read.All, tenant management)
4. User management (sync from Azure AD via Graph)
5. Project CRUD + project membership + Gantt chart
6. Task management (create, assign, status, priority, subtasks, hours tracking)
7. Project Health Dashboard — RAG engine with Schedule + Budget sub-RAGs
8. Personnel Registry (people records, assignment status, skills-based matching)
9. Resource Assignment Board
10. Inventory Registry — SKU catalog, check-in/out
11. Programs module (multi-project portfolio management)
12. Opportunities module (basic CRUD — being enhanced)
13. Cost Management — full cost entries + submit/approve/reject + forecasting (EAC/ETC/VAC/CPI)
14. Hours tracking + burn-down charts + task timers
15. Basic notifications (in-app)
16. Full i18n (Spanish/English)
17. Dashboard: 6 KPI cards, Recharts charts, opportunity funnel, project tables
18. Azure deployment — API (Container Apps) + Frontend (Static Web Apps)
19. CI/CD (GitHub Actions — 4 workflows)
20. Production hardening (rate limiting, App Insights, Redis cache, health probes)

### 🔨 IN PROGRESS — Sales/CRM Module Enhancement (7 Waves)

> **Full spec:** `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md`

Transforms the basic Opportunities module into a full B2B CRM platform. Best-of features from Salesforce, HubSpot, Dynamics 365, Pipedrive, Close, and Freshsales.

| Wave | Focus | Status |
|---|---|---|
| 1 | Accounts, Contacts, Pipeline Configuration | Not started |
| 2 | Enhanced Opportunity, Stakeholders, Line Items, Kanban Board | Not started |
| 3 | Activities & Timeline, Deal Health, Reminders (20 items) | Not started |
| 4 | Leads & Conversion | Not started |
| 5 | Quoting | Not started |
| 6 | Forecasting & Analytics | Not started |
| 7 | Sales Automation Engine (22 items) | Not started |

### ❌ OUT OF SCOPE
- Commission tracking / revenue recognition (tracked at project/program level)
- Opportunity-to-Project Conversion Wizard
- SharePoint / Microsoft Purview integration
- WhatsApp AI agent
- AI Project Intelligence features
- Mobile QR code check-in/out
- Vehicle management module
- DocuSign integration
- Time entry approval workflow + leave tracking (planned separately)

---

## 9. Developer Ownership — Solo Developer

Single developer owns all layers: frontend, backend, infrastructure, and shared packages.

**Priority order for building features:**
1. Shared types + Zod schemas (`packages/shared`)
2. Database entity + migration (`apps/api`)
3. Service + Controller + DTOs (`apps/api`)
4. API integration + React Query hooks (`apps/web`)
5. UI components + pages (`apps/web`)

This ensures the API contract is always defined before UI work begins.

---

## 10. RAG Engine Logic (Server-Side Only)

The RAG engine runs on the backend. Clients NEVER calculate or set RAG directly.

### Trigger events
- Task status changed to BLOCKED or DONE
- Task due date passed with status not DONE
- Budget field updated on Project
- Daily cron job at 02:00 UTC

### Calculation rules (Phase 1 — Schedule + Budget only)

**Schedule RAG:**
```
GREEN  → < 5% tasks overdue
AMBER  → 5–20% tasks overdue OR any CRITICAL task overdue
RED    → > 20% tasks overdue OR project end date passed with status ACTIVE
BLUE   → All tasks DONE, project marked COMPLETED
GRAY   → Project in PLANNING status (not yet started)
```

**Budget RAG (requires budget field on Project):**
```
GREEN  → actual spend ≤ 90% of budget
AMBER  → actual spend 90–100% of budget
RED    → actual spend > 100% of budget (over budget)
GRAY   → no budget set
```

**Overall RAG** = worst of all active sub-RAGs (RED beats AMBER beats GREEN).

### Manual override
- Only `GLOBAL_LEAD` and `BIZ_OPS_MANAGER` can override.
- `overrideReason` is REQUIRED (min 20 characters).
- Override is logged with who, when, from/to status, and reason.
- Override expires after 7 days → auto-recalculates.

---

## 11. Coding Standards

### TypeScript
- Strict mode ON (`"strict": true` in tsconfig)
- No `any` — use `unknown` + type guards if needed
- Prefer `interface` for object shapes, `type` for unions/aliases
- All async functions must handle errors (no silent promise rejections)

### NestJS conventions
- One module per domain feature
- DTOs for all request/response bodies (class-validator decorators)
- Services contain business logic — controllers are thin
- Use `@ApiProperty()` on all DTOs for Swagger
- Repository pattern via TypeORM repositories injected into services

### React conventions
- Feature-sliced directory structure (see §3)
- Components: PascalCase files, named exports
- Hooks: camelCase files starting with `use`
- React Query for all API calls — no raw `useEffect` for data fetching
- Zod schemas for all form validation (shared from `packages/shared` where possible)

### Git workflow
- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`
- Commit style: Conventional Commits (`feat: add RAG engine`, `fix: task overdue calc`)
- PRs require review before merging to `main`
- `main` = always deployable

---

## 12. Local Dev Setup

```bash
# 1. Start local services
docker-compose up -d          # Postgres + Redis

# 2. Backend
cd apps/api
cp .env.example .env          # Fill in values
npm install
npm run migration:run
npm run start:dev             # http://localhost:3000

# 3. Frontend
cd apps/web
cp .env.example .env          # Fill in Azure AD values
npm install
npm run dev                   # http://localhost:5173

# 4. Swagger API docs
# http://localhost:3000/api/docs
```

---

## 13. Key Files to Know

| File | Purpose |
|---|---|
| `apps/api/src/auth/azure-ad.strategy.ts` | Validates Azure AD tokens |
| `apps/api/src/common/guards/roles.guard.ts` | RBAC enforcement |
| `apps/api/src/modules/health/rag.engine.ts` | RAG calculation logic |
| `apps/api/src/database/migrations/` | All DB schema changes |
| `apps/web/src/lib/axios.ts` | Axios instance + auth interceptor |
| `apps/web/src/lib/msal.ts` | MSAL config + token acquisition |
| `packages/shared/src/types/` | Shared TypeScript interfaces |
| `packages/shared/src/schemas/` | Shared Zod validation schemas |
| `infrastructure/bicep/main.bicep` | Azure resource definitions |
| `docker-compose.yml` | Local dev services |

---

## 14. What Claude Code Should Know

When helping with this codebase, always:
- Check `packages/shared` before creating new types — shared types live there
- Follow the response envelope format (§6) for all API responses
- Respect the RBAC matrix (§5) — every endpoint needs a `@Roles()` guard
- Never put RAG calculation logic on the frontend
- `InventoryTransaction` is append-only — never generate UPDATE or DELETE on that table
- Use TypeORM migrations for schema changes — never `synchronize: true` in production
- All secrets go through Azure Key Vault in production (local `.env` only for dev)
- All new entities MUST include `tenantId` for multi-tenant isolation
- Refer to `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md` for full Sales module specs

When building Sales/CRM module:
- Follow the wave order (1→7) — each wave builds on the previous
- Build order per wave: shared types → API entity/migration → service/controller → hooks → UI (§9)
- All sales entities are tenant-scoped (`tenantId` on every query)
- Opportunity entity is being enhanced, not replaced — migrate existing data
- Activities are polymorphic (link to account, contact, opportunity, or lead)
- Pipeline stages have ordered `displayOrder` — use `@AfterLoad` or query ORDER BY
- Lead conversion is a transactional operation (creates account + contact + opportunity atomically)

When writing migrations:
- Name format: `{timestamp}-{description}.ts` (TypeORM generates the timestamp)
- Always include `down()` method for rollback
- Never drop columns — add nullable columns and migrate data instead

When writing tests:
- Unit tests for RAG engine logic (every calculation rule)
- Integration tests for auth guards
- E2E tests for critical paths: login, create project, assign task
