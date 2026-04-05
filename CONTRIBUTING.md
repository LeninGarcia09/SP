# Contributing to BizOps Platform

> Quick-start guide for new developers joining the project.
> For full technical spec (data model, RBAC, API design), see `CLAUDE.md`.
> For project status and what's done vs. next, see `PROJECT_STATUS.md`.

---

## Prerequisites

- **Node.js ≥ 22** (24.x recommended) — [download](https://nodejs.org/)
- **Docker Desktop** with Docker Compose V2 — [download](https://www.docker.com/products/docker-desktop/)
- **Git**
- **VS Code** (recommended) with extensions: ESLint, Prettier, Tailwind CSS IntelliSense

Optional (for Azure deployment):
- **Azure CLI** — `az login` for authentication
- Azure subscription with Contributor access

---

## Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/LeninGarcia09/SP.git
cd SP
npm install
```

### 2. Start Local Services

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on `localhost:5432` (user: `bizops`, password: `bizops_dev_password`, db: `bizops_dev`)
- **Redis 7** on `localhost:6379` (no password)

### 3. Configure Environment

```bash
# Backend
cd apps/api
cp .env.example .env
# Edit .env — defaults work for local dev with Docker Compose

# Frontend (new terminal)
cd apps/web
cp .env.example .env
# VITE_API_BASE_URL can be left empty (Vite proxy handles it)
```

### 4. Build Shared Package (required first)

```bash
# From project root
npm run build:shared
```

The shared package (`packages/shared`) contains TypeScript types and Zod schemas used by both backend and frontend. **You must build it before starting either app.**

### 5. Start Backend

```bash
cd apps/api
npm run start:dev
```

- API runs at `http://localhost:3000`
- Swagger docs at `http://localhost:3000/api/docs`
- All API routes prefixed with `/api/v1/`
- **Migrations run automatically on startup** — no manual migration step needed

### 6. Start Frontend

```bash
cd apps/web
npm run dev
```

- Frontend runs at `https://localhost:5173` (HTTPS via basicSsl plugin in dev)
- Uses Vite proxy to forward `/api` requests to `localhost:3000`

### 7. Seed Data (Optional)

```bash
# From project root
npx tsx scripts/seed.ts
```

Seeds all 13 modules with sample data: skills, programs, projects, tasks, personnel, opportunities, inventory, etc. The script is idempotent — safe to run multiple times.

---

## Project Structure

```
SP/
├── packages/shared/        # Shared TypeScript types + Zod schemas (build first!)
├── apps/api/               # NestJS backend (REST API)
├── apps/web/               # React frontend (Vite + Tailwind + shadcn/ui)
├── infrastructure/         # Azure Bicep IaC + deployment scripts
├── docs/                   # Feature specs and enhancement plans
├── scripts/                # Seed data and utilities
├── CLAUDE.md               # Full technical spec (data model, RBAC, API design)
├── PROJECT_STATUS.md       # Phase completion tracker
└── CONTRIBUTING.md         # This file
```

### Key Directories

| Directory | What's Inside |
|---|---|
| `packages/shared/src/types/` | All TypeScript interfaces (User, Project, Task, Account, Lead, etc.) |
| `packages/shared/src/schemas/` | Zod validation schemas |
| `apps/api/src/modules/` | NestJS feature modules (20+ modules: projects, tasks, accounts, leads, etc.) |
| `apps/api/src/database/migrations/` | TypeORM migrations (auto-run on startup) |
| `apps/web/src/pages/` | Route-level page components |
| `apps/web/src/components/` | UI components (shadcn/ui in `ui/`, feature-specific in named folders) |
| `apps/web/src/hooks/` | React Query hooks (one file per module, e.g. `use-accounts.ts`) |
| `apps/web/src/lib/api/` | Typed Axios API client |
| `apps/web/src/i18n/` | Internationalization (English + Spanish) |

---

## Development Workflow

### Build Order for New Features

Always follow this order:
1. **Shared types + Zod schemas** — `packages/shared/src/types/` and `schemas/`
2. **Database entity + migration** — `apps/api/src/modules/<feature>/`
3. **Service + Controller + DTOs** — `apps/api/src/modules/<feature>/`
4. **React Query hooks** — `apps/web/src/hooks/use-<feature>.ts`
5. **UI components + pages** — `apps/web/src/components/<feature>/` and `pages/`

### Creating a New Module (Backend)

```bash
cd apps/api

# 1. Create module directory under src/modules/<name>/
# 2. Add entity, service, controller, module, DTOs
# 3. Generate migration:
npm run migration:generate -- src/database/migrations/<MigrationName>

# Migrations auto-run on next `npm run start:dev`
```

### Creating Database Migrations

```bash
cd apps/api
npm run migration:generate -- src/database/migrations/<DescriptiveName>
```

Rules:
- Always include a `down()` method for rollback
- Never drop columns — add nullable columns and migrate data instead
- All new entities **must** include `tenantId` for multi-tenant isolation

### Running Tests

```bash
# API unit tests (30 tests — RAG engine + Roles guard)
cd apps/api
npm test

# API E2E tests (16 tests — requires Postgres + Redis running)
cd apps/api
npm run test:e2e

# Frontend E2E tests (15 tests — requires API + frontend running)
cd apps/web
npm run test:e2e
```

---

## Coding Conventions

### TypeScript
- `"strict": true` — no `any`, use `unknown` + type guards
- Prefer `interface` for object shapes, `type` for unions/aliases
- All async functions must handle errors

### Backend (NestJS)
- One module per domain feature
- DTOs with `class-validator` decorators for all request/response bodies
- `@ApiProperty()` on all DTOs for Swagger auto-docs
- Services contain business logic — controllers are thin
- Every endpoint needs `@Roles(...)` guard for RBAC (see `CLAUDE.md` §5 for role matrix)
- All queries must filter by `tenantId` for multi-tenant isolation

### Frontend (React)
- React Query for all API calls — no raw `useEffect` for data fetching
- Zustand for global state (auth, UI preferences)
- Zod schemas for form validation
- shadcn/ui for base components, Tailwind for styling
- i18n: all user-facing strings must be in `i18n/en.json` and `i18n/es.json`

### Git
- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`
- Commit style: Conventional Commits (`feat: add quote builder`, `fix: lead conversion race condition`)

---

## Multi-Tenant Architecture

Every entity has a `tenantId` column. Every service filters by `tenantId` from the JWT token. This ensures complete data isolation between organizations.

**Example query pattern:**
```typescript
async findAll(tenantId: string): Promise<Project[]> {
  return this.projectRepo.find({ where: { tenantId } });
}
```

---

## RBAC (Role-Based Access Control)

11 roles defined in `CLAUDE.md` §5. Key ones:
- `GLOBAL_LEAD` — Full access to everything
- `ADMIN` — Azure AD tenant management, Graph API
- `SALES_EXECUTIVE` — Sales pipeline, opportunities, accounts
- `PROJECT_LEAD` — Assigned projects and their tasks
- `PROJECT_PERSONNEL` — Own tasks only

Every controller endpoint must use `@Roles(...)` decorator.

---

## Authentication

### Local Development
The API has a **dev-login endpoint** that issues JWT tokens without Azure AD. When `NODE_ENV=development`, you can authenticate via Swagger at `/api/docs`.

### Production
Uses Azure AD (Entra ID) with multi-tenant support. Frontend uses MSAL.js, backend validates tokens via Passport.js + JWKS.

---

## Azure Deployment

See `infrastructure/DEPLOYMENT.md` for the full guide. Summary:

| Component | Azure Service | Deployment |
|---|---|---|
| API | Container Apps | GitHub Actions → ACR build → Container App update |
| Frontend | Static Web Apps | GitHub Actions → Vite build → SWA deploy |
| Database | PostgreSQL Flexible Server | Bicep IaC |
| Cache | Azure Cache for Redis | Bicep IaC |
| Secrets | Key Vault | Manual or Bicep |

**Important:** Dev machine is ARM64. Never use `docker build` locally for deployment images. Always use `az acr build --platform linux/amd64`.

### CI/CD Workflows

| Workflow | Trigger | What It Does |
|---|---|---|
| CI | Push/PR to `main` | Build all packages, run unit tests |
| Deploy API | Push to `apps/api/` or manual | Docker build on ACR → deploy to Container App |
| Deploy Web | Push to `apps/web/` or manual | Vite build → deploy to Static Web App |
| Deploy Infra | Manual only | Validate + deploy Bicep templates |

---

## Current State & What's Next

See `PROJECT_STATUS.md` for the full breakdown. In short:

**Done:** Core platform (20+ modules), Azure deployment, CI/CD, multi-tenant auth, cost tracking, Sales/CRM waves 1–4 (Accounts, Contacts, Pipelines, Products, Vendors, Opportunities, Activities, Leads).

**Next:** Sales/CRM Wave 5 (Quoting), Wave 6 (Forecasting/Analytics), Wave 7 (Automation Engine). See `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md` for the full spec.

---

## Asking AI for Help

When using Copilot or Claude on this project, prompt with:

> _"Read CLAUDE.md, PROJECT_STATUS.md, and CONTRIBUTING.md to understand the project. Then [your question]."_

The AI will have full context on the data model, RBAC rules, API conventions, what's been built, and what's next.

---

## Useful Commands

```bash
# Root
npm install                    # Install all workspace dependencies
npm run build                  # Build shared + API + web
npm run build:shared           # Build shared types package only

# Backend (from apps/api/)
npm run start:dev              # Start with hot reload
npm test                       # Unit tests
npm run test:e2e               # E2E tests (needs Docker services)
npm run migration:generate -- src/database/migrations/MyMigration
npm run migration:run          # Run pending migrations manually
npm run migration:revert       # Revert last migration

# Frontend (from apps/web/)
npm run dev                    # Dev server with HMR
npm run build                  # Production build
npm run test:e2e               # Playwright E2E tests
npm run test:e2e:ui            # Playwright with UI

# Docker
docker compose up -d           # Start Postgres + Redis
docker compose down            # Stop services
docker compose logs -f         # Tail logs

# Seed data (from root)
npx tsx scripts/seed.ts
```
