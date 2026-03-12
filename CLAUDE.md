# CLAUDE.md — Business Operations Platform
> Master context file for Claude Code. Read this at the start of every session.

---

## 1. Project Identity

**Product:** Business Operations Platform (internal tool)
**Stack:** React + TypeScript (frontend) · NestJS + TypeScript (backend) · PostgreSQL · Azure
**Repo layout:** Monorepo — `apps/web`, `apps/api`, `packages/shared` (npm workspaces)
**Phase:** Phase 1 of 4 (see §8 for scope)
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
│   │   │   │   └── shared/         # Reusable business components
│   │   │   ├── features/           # Feature-sliced modules
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   ├── tasks/
│   │   │   │   ├── health-dashboard/
│   │   │   │   ├── personnel/
│   │   │   │   └── inventory/
│   │   │   ├── hooks/              # Shared custom hooks
│   │   │   ├── lib/                # Axios instance, MSAL config, utils
│   │   │   ├── pages/              # Route-level page components
│   │   │   ├── store/              # Zustand stores
│   │   │   ├── types/              # Frontend-only TypeScript types
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── api/                        # NestJS backend
│       ├── src/
│       │   ├── auth/               # Azure AD + JWT strategy
│       │   ├── common/             # Guards, interceptors, decorators, pipes
│       │   ├── config/             # ConfigModule setup, env validation
│       │   ├── database/           # TypeORM config, migrations
│       │   ├── modules/
│       │   │   ├── users/
│       │   │   ├── projects/
│       │   │   ├── tasks/
│       │   │   ├── health/         # RAG engine
│       │   │   ├── personnel/
│       │   │   └── inventory/
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
│   ├── bicep/                      # Azure Bicep IaC templates
│   │   ├── main.bicep
│   │   ├── modules/
│   │   └── parameters/
│   └── scripts/                    # Setup & deployment scripts
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── decisions/                  # ADRs (Architecture Decision Records)
│
├── .github/
│   └── workflows/                  # CI/CD (GitHub Actions)
│
├── docker-compose.yml              # Local dev: Postgres + Redis
├── CLAUDE.md                       # ← You are here
└── README.md
```

---

## 4. Data Model — Phase 1 Entities

### Users & Access
```typescript
// User (synced from Azure AD)
User {
  id: uuid PK
  azureAdOid: string UNIQUE       // Azure AD Object ID
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

### Projects & Tasks
```typescript
Project {
  id: uuid PK
  code: string UNIQUE             // e.g. "PROJ-2024-001"
  name: string
  description: text
  status: ProjectStatus           // PLANNING | ACTIVE | ON_HOLD | COMPLETED | CANCELLED
  startDate, endDate: date
  budget: decimal(15,2)
  programId: uuid FK nullable     // Phase 2: Program entity
  projectLeadId: uuid FK → User
  createdBy: uuid FK → User
  metadata: jsonb default {}      // Custom/dynamic fields per project (JSONB — indexed with GIN)
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

ProjectMember {
  id: uuid PK
  projectId: uuid FK → Project
  userId: uuid FK → User
  role: ProjectMemberRole         // LEAD | MEMBER | OBSERVER
  joinedAt: timestamp
}

ProjectNote {
  id: uuid PK
  projectId: uuid FK → Project
  authorId: uuid FK → User
  content: text                   // Free-form note/comment
  metadata: jsonb default {}      // Optional structured data (tags, linked tasks, etc.)
  isPinned: boolean default false
  createdAt, updatedAt: timestamp
}
```

### Health Dashboard
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

### Personnel
```typescript
Person {
  id: uuid PK
  userId: uuid FK → User nullable   // null = external contractor not in AD
  employeeId: string UNIQUE nullable
  firstName, lastName: string
  email: string UNIQUE
  jobTitle: string
  departmentId: uuid FK → Department
  assignmentStatus: AssignmentStatus  // ON_PROJECT | ON_OPPORTUNITY | ON_OPERATIONS | ON_BENCH
  startDate: date
  skills: string[]                   // Phase 2: separate Skills table
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

### Inventory
```typescript
InventoryItem {
  id: uuid PK
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
}
```

**Permission matrix (Phase 1):**

| Resource | GLOBAL_LEAD | BIZ_OPS_MGR | RESOURCE_MGR | PROGRAM_MGR | PROJECT_LEAD | PERSONNEL | INVENTORY_MGR |
|---|---|---|---|---|---|---|---|
| Projects (all) | CRUD | R | R | R (assigned) | CRUD (own) | R (own) | R |
| Tasks | CRUD | R | R | R (assigned) | CRUD (own) | RU (own) | - |
| RAG override | ✓ | ✓ | - | - | - | - | - |
| Personnel | CRUD | CRUD | RU (dept) | R | R | R (self) | - |
| Assignments | CRUD | CRUD | RU (dept) | R | - | - | - |
| Inventory | CRUD | R | R | R | R | R | CRUD |
| User mgmt | CRUD | R | - | - | - | - | - |

Guards: `@Roles(...roles)` decorator on every controller endpoint. `RolesGuard` checks `request.user.role`.

---

## 6. API Design Conventions

### Base URL
- Local: `http://localhost:3000/api/v1`
- Production: `https://api.bizops.[domain]/api/v1`

### Route structure
```
GET    /api/v1/projects                    List (paginated)
POST   /api/v1/projects                    Create
GET    /api/v1/projects/:id                Get one
PATCH  /api/v1/projects/:id                Update (partial)
DELETE /api/v1/projects/:id                Soft delete

GET    /api/v1/projects/:id/tasks          Nested resource
GET    /api/v1/projects/:id/health         RAG snapshot history
POST   /api/v1/projects/:id/health/trigger Manual RAG recalculation
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

## 8. Phase 1 Scope — What's IN and OUT

### ✅ IN SCOPE (Phase 1 — 6 weeks)
1. Azure AD authentication + RBAC (all 8 roles)
2. User management (sync from Azure AD)
3. Project CRUD + project membership
4. Task management (create, assign, status, priority, subtasks)
5. Project Health Dashboard — RAG engine with Schedule + Budget sub-RAGs
6. Personnel Registry (people records, assignment status)
7. Resource Assignment Board (basic — assign person to project)
8. Inventory Registry — SKU catalog, check-in/out, Excel import
9. Basic notifications (in-app only)

### ❌ OUT OF SCOPE (Phase 2+)
- Gantt chart / timeline view
- Opportunity-to-Project Conversion Wizard
- SharePoint / Microsoft Graph integration
- Microsoft Purview sensitivity labels
- WhatsApp AI agent
- AI Project Intelligence features
- Mobile QR code check-in/out
- Capacity planning (90-day view)
- Vehicle management module
- DocuSign integration
- Multi-language (Spanish)

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
- Phase 1 scope only — don't implement Phase 2+ features proactively

When writing migrations:
- Name format: `{timestamp}-{description}.ts` (TypeORM generates the timestamp)
- Always include `down()` method for rollback
- Never drop columns — add nullable columns and migrate data instead

When writing tests:
- Unit tests for RAG engine logic (every calculation rule)
- Integration tests for auth guards
- E2E tests for critical paths: login, create project, assign task
