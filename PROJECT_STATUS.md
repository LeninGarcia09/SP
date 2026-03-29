# BizOps Platform — Project Status & Context

> **Purpose:** Quick-reference for AI agents resuming work on this project.
> **Last updated:** 2025-07-25
> **Full spec:** See `CLAUDE.md` in this same directory for complete data model, RBAC, API conventions.
> **Sales module spec:** See `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md` (~3500 lines)

---

## Git Status

| Item | Value |
|---|---|
| Remote | `origin` → https://github.com/LeninGarcia09/SP.git |
| Branch | `main` |

---

## Phase Completion

### Phase 1 — Core Platform ✅
- [x] Monorepo scaffold (npm workspaces: `packages/shared`, `apps/api`, `apps/web`)
- [x] Shared TypeScript types + Zod schemas for all entities
- [x] NestJS backend: all modules, entities, controllers, services, TypeORM, JWT auth
- [x] React frontend: all pages, Layout, Tailwind + shadcn/ui, Zustand, React Query
- [x] Docker Compose: Postgres 16 + Redis 7
- [x] Full API client layer + React Query hooks
- [x] CRUD operations, data tables, pagination, status badges

### Phase 2 — Extended Features ✅
- [x] Programs, Opportunities, Skills, Capacity Planning modules
- [x] Gantt chart (embedded in ProjectDetail and ProgramDetail)
- [x] Full i18n (Spanish/English) with react-i18next + language switcher
- [x] TelNub branding, logo, favicon, "Sistema Operaciones de Negocio"
- [x] Collapsible sidebar groups (Programs, Sales, Personnel)
- [x] Detail pages, form dialogs, modals for all entities

### Phase 3 — Deployment Infrastructure ✅
- [x] API Dockerfile (multi-stage, node:20-alpine, non-root user)
- [x] .dockerignore
- [x] Azure Bicep IaC templates (8 modules: ACR, PostgreSQL Flexible Server, Key Vault, Log Analytics, App Insights, Container App Env, Container App, Static Web App)
- [x] Bicep parameter files (dev, prod) — dev-deploy.json gitignored (secrets cleared)
- [x] GitHub Actions CI/CD (4 workflows: CI, Deploy API, Deploy Web, Deploy Infrastructure)
- [x] Static Web App config (SPA routing, security headers)
- [x] Vite production build (basicSsl conditional on dev only)
- [x] Deployment guide (`infrastructure/DEPLOYMENT.md`)
- [x] Docker build tested locally (43s, clean build)

### Phase 4 — Production Hardening ✅
- [x] Structured request logging middleware (HTTP method, URL, status, duration)
- [x] System health check endpoint (`GET /api/v1/system/health` — DB + cache checks)
- [x] Rate limiting via `@nestjs/throttler` (100 req/min)
- [x] Application Insights SDK (auto-collect requests, performance, exceptions, dependencies)
- [x] Redis caching layer (`@nestjs/cache-manager` + `@keyv/redis`, in-memory fallback)
- [x] Auth store (Zustand) with user info, token management, logout
- [x] Logout button + user display in header
- [x] Unit tests: RAG engine (20 tests) + Roles guard (6 tests) — 26 total, all passing
- [x] E2E tests: Auth, System Health, Projects CRUD, Tasks, Users, Inventory, Validation — 16 tests, all passing
- [x] JWT strategy bug fix (`req.user.sub` not populated — added `sub` field to validate return)
- [x] Dev-login endpoint updated to allow `test` environment (for E2E test runner)
- [x] CI workflow updated with test step
- [x] Environment validation updated (APPLICATIONINSIGHTS_CONNECTION_STRING, REDIS_URL)
- [ ] Azure AD full MSAL integration (requires tenant config — deferred)
- [ ] Production monitoring & alerting dashboards (deferred)

### Phase 5 — CI/CD Pipeline ✅
- [x] Azure Service Principal (`bizops-github-actions`) with Contributor role on resource group
- [x] Key Vault Secrets Officer role for user (read secrets via `az keyvault`)
- [x] 10 GitHub Actions secrets configured (AZURE_CREDENTIALS, ACR_*, CONTAINER_APP_NAME, SWA token, API_BASE_URL, DB_ADMIN_PASSWORD, JWT_SECRET)
- [x] CI workflow passing — build shared + API + web, unit tests
- [x] Deploy API workflow passing — Docker build → ACR push → Container App update
- [x] Deploy Web workflow passing — npm build → Azure Static Web Apps deploy
- [x] Deploy Infrastructure workflow available (Bicep validate + deploy)
- [x] `workflow_dispatch` trigger added to CI for manual runs
- [x] `VITE_API_BASE_URL` env var added to CI web build step

### Phase 5.5 — Deployment Hardening ✅ (2026-03-23)
- [x] Migrated PostgreSQL from Container App (EmptyDir, non-persistent) to **Flexible Server** (pg-flex-bizops-dev, Burstable B1ms, 32GB, PG 16)
- [x] Created `bizops_dev` database on Flexible Server with UTF-8/en_US.utf8 collation
- [x] Enabled `uuid-ossp` extension (allowlisted via `azure.extensions` param + CREATE EXTENSION)
- [x] Added health probes to API Container App (Startup 5s/10 retries, Liveness 30s/3 retries, Readiness 10s/3 retries) on `/api/v1/system/health`
- [x] Rotated DB password (32-char alphanumeric) — updated in Flexible Server, Key Vault, Container App, GitHub Secrets
- [x] Rotated JWT secret (48-char) — updated in Key Vault, Container App, GitHub Secrets
- [x] Cleared plaintext credentials from `dev-deploy.json`, added to `.gitignore`
- [x] Updated Bicep IaC: `main.bicep` now uses `postgres.bicep` module (Flexible Server), removed PG Container App resource, added `healthProbePath` param, `DATABASE_SSL=true`, `sslmode=require`
- [x] Deleted old `pg-bizops-dev` Container App
- [x] Deleted unused `storage.bicep` module
- [x] Removed temporary `AllowMyIP` firewall rule
- [x] Verified: API healthy (database=ok, cache=ok), single revision 0000033 running
- [x] Committed + pushed: `12b95ee` → `main`

### Enhancement Waves — Hours, Cost & Resource Management

#### Wave 1 — Hours Tracking Foundation ✅
- [x] Task hours UI (estimatedHours/actualHours) in ProjectDetail task form + table
- [x] Hours progress bar on task rows with overrun coloring
- [x] `GET /projects/:id/hours-summary` endpoint with rollup
- [x] Project Hours Summary card in ProjectDetail
- [x] Hours-overrun notification (>20% over)
- [x] Automatic labor cost from hours × project costRate

#### Wave 2 — Full Cost Management Module ✅
- [x] CostEntry entity + migration (cost_entries table with indexes)
- [x] CostsModule: full CRUD + submit/approve/reject/transfer workflow
- [x] Cost summary endpoint with category/month breakdowns
- [x] Project actualCost computed from entries + labor
- [x] Budget threshold notifications (80%, 100%)
- [x] Frontend: cost summary cards, category breakdown, cost entries table
- [x] Frontend: add/edit cost dialog, reject dialog, transfer dialog

#### Wave 3 — Analytics & Forecasting ✅
- [x] Cost Forecasting (EAC/ETC/VAC/CPI) — `GET /projects/:id/cost-forecast`
- [x] Burn-Down chart — `GET /projects/:id/burn-data?metric=hours|cost`
- [x] Skills-Based Resource Matching — `GET /personnel/match?skills=&minAllocation=`
- [x] Start/Stop Timer — localStorage-based, per-task timer with auto-log on stop
- [x] ActiveTimerBar in layout header (shows running timer globally)
- [x] CostForecastCard component with EAC/ETC/VAC/CPI display + progress bar
- [x] BurnChart component with Recharts (hours/cost toggle, ideal vs actual lines)
- [x] ResourceFinder dialog with skill search + allocation filter
- [x] TaskTimerButton on each task row (start/stop with elapsed display)
- [x] i18n translations for forecast, burnChart, timer, resourceFinder (EN + ES)

#### Wave 4 — Approvals & Leave (Not Started)
- [ ] Time entry approval workflow (DRAFT → SUBMITTED → APPROVED/REJECTED)
- [ ] Leave/absence tracking entity + API
- [ ] Approval queue page
- [ ] Capacity planning leave integration

#### Wave 5 — UI/UX Enhancement ✅
- [x] Dashboard overhaul: 6 KPI cards with trend indicators, Recharts donut (project status distribution), budget vs actual bar chart, opportunity pipeline funnel, recent projects table with progress bars
- [x] Projects list: status filter tabs (All/Active/Planning/On Hold/Completed/Cancelled), table/cards view toggle (persisted in localStorage), enhanced table with budget progress bars + colored status dots, card view with budget bars
- [x] Programs list: portfolio summary cards (total/active/budget/actual with progress bars), status filter tabs, enhanced table with budget utilization column
- [x] New UI components: Tabs (context-based), Progress bar (with custom indicator colors)
- [x] Full i18n for all new dashboard/projects/programs keys (EN + ES)
- [x] UI/UX Enhancement Plan document (`docs/UI_UX_ENHANCEMENT_PLAN.md`)
- [x] Dashboard resilient error handling: `allFailed` shows full error, `partialError` shows amber warning, renders available data gracefully

### Phase 6 — Azure AD Multi-Tenant & Graph ✅
- [x] Azure AD multi-tenant authentication (8+ iterations, multi-org app registration)
- [x] Multi-tenant data isolation (17 entities, 12 services, `tenantId` on all queries)
- [x] Microsoft Graph integration (client secret, `User.Read.All` + `Organization.Read.All`)
- [x] Graph multi-tenant: tenant selector on Admin page, cross-tenant user enumeration
- [x] 3 tenants configured: VS Enterprise (`bad76ac5`), sitec.solutions (`bd208e59`), garsal.org (`5814ad12`)
- [x] RBAC expanded to 11 roles (added ADMIN, OPERATIONS_DIRECTOR, SALES_EXECUTIVE)

### Phase 7 — Full Azure Deployment ✅
- [x] API deployed to Azure Container Apps (`api-bizops-dev`, image via `az acr build --platform linux/amd64`)
- [x] Frontend deployed to Azure Static Web Apps (`swa-bizops-dev`)
- [x] Health check confirmed: database=ok, cache=ok
- [x] API URL: `https://api-bizops-dev.graysand-3ab24a81.eastus.azurecontainerapps.io`
- [x] Frontend URL: `https://yellow-moss-027665410.1.azurestaticapps.net`

### Sales/CRM Module Enhancement — 7 Waves (Not Started)

> **Full spec:** `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md`
> Transforms basic Opportunities CRUD into a full B2B CRM platform.
> Best-of: Salesforce, HubSpot, Dynamics 365, Pipedrive, Close, Freshsales.

#### Wave 1 — Foundation (Not Started)
- [ ] Account entity + migration + CRUD service/controller
- [ ] Contact entity + migration + CRUD service/controller
- [ ] SalesPipeline + PipelineStage entities + configuration UI
- [ ] Shared types + Zod schemas for Account, Contact, Pipeline
- [ ] Frontend: Account list/detail pages, Contact management
- [ ] Frontend: Pipeline configuration page

#### Wave 2 — Enhanced Opportunity (Not Started)
- [ ] Opportunity entity enhancement (add accountId, pipelineId, stageId, line items)
- [ ] OpportunityStakeholder entity (role, influence, sentiment mapping)
- [ ] Product + OpportunityLineItem entities
- [ ] Pipeline Kanban board (drag-drop stage changes)
- [ ] Opportunity detail page overhaul (stakeholder map, line items table)
- [ ] Migration: existing opportunities → new schema

#### Wave 3 — Activities & Timeline (Not Started — 20 items)
- [ ] Activity entity (polymorphic: call, email, meeting, note, task)
- [ ] Activity CRUD + timeline endpoints
- [ ] Activity templates + sequences
- [ ] Reminders + due date notifications
- [ ] Deal Health scoring
- [ ] Frontend: Activity timeline UI, log activity dialogs
- [ ] Frontend: Reminder management

#### Wave 4 — Leads & Conversion (Not Started)
- [ ] Lead entity + scoring
- [ ] Lead CRUD + status workflow
- [ ] Lead conversion (transactional: lead → account + contact + opportunity)
- [ ] Frontend: Lead list, detail, conversion wizard

#### Wave 5 — Quoting (Not Started)
- [ ] Quote + QuoteLineItem entities
- [ ] Quote CRUD + versioning + status workflow
- [ ] Quote PDF generation
- [ ] Frontend: Quote builder, preview, send

#### Wave 6 — Forecasting & Analytics (Not Started)
- [ ] Pipeline analytics (conversion rates, velocity, stage duration)
- [ ] Revenue forecasting (weighted pipeline, historical trends)
- [ ] Sales dashboard with KPIs
- [ ] Frontend: Analytics pages, forecast charts

#### Wave 7 — Sales Automation Engine (Not Started — 22 items)
- [ ] Event bus architecture (4-layer: triggers → conditions → actions → logging)
- [ ] WorkflowRule entity + CRUD + execution engine
- [ ] AssignmentRule entity (round-robin, load-balanced, criteria-based)
- [ ] Sequence entity + enrollment + step execution
- [ ] 8 cron jobs (stale deals, follow-up reminders, sequence steps, etc.)
- [ ] Frontend: Workflow rule builder, sequence editor, assignment config

---

## Infrastructure Files

| File/Directory | Purpose |
|---|---|
| `apps/api/Dockerfile` | Multi-stage Docker build for API |
| `.dockerignore` | Docker build exclusions |
| `infrastructure/bicep/main.bicep` | Main Bicep orchestrator (Flexible Server, Container App w/ probes, Redis, SWA) |
| `infrastructure/bicep/modules/` | 7 Bicep modules (ACR, PostgreSQL Flexible Server, Key Vault, Log Analytics, App Insights, Container App Env, Container App) |
| `infrastructure/bicep/parameters/` | dev.bicepparam, prod.bicepparam (dev-deploy.json gitignored) |
| `infrastructure/scripts/deploy-infra.sh` | CLI deployment script |
| `infrastructure/DEPLOYMENT.md` | Full deployment guide with secrets reference |
| `.github/workflows/ci.yml` | Build & check on every PR/push |
| `.github/workflows/deploy-api.yml` | Build Docker → push ACR → deploy Container App |
| `.github/workflows/deploy-web.yml` | Build Vite → deploy Static Web App |
| `.github/workflows/deploy-infra.yml` | Validate & deploy Bicep templates |
| `apps/web/public/staticwebapp.config.json` | SPA routing + security headers |

---

## Quick Start Commands

```powershell
# 1. Start Docker containers
docker compose up -d

# 2. Backend
cd apps/api
npm run start:dev         # → http://localhost:3000/api/docs (Swagger)

# 3. Frontend
cd apps/web
npm run dev               # → https://localhost:5173

# 4. Build Docker image locally
docker build -f apps/api/Dockerfile -t bizops-api:local .
```

---

## Key File Locations

| File | Purpose |
|---|---|
| `CLAUDE.md` | **Full project spec** — data model, RBAC, API design, RAG engine |
| `PROJECT_STATUS.md` | Phase completion tracker (this file) |
| `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md` | Sales/CRM module spec (~3500 lines, 7 waves) |
| `docs/ENHANCEMENT_PLAN_HOURS_COST_RESOURCES.md` | Hours/Cost/Resource management plan |
| `docs/UI_UX_ENHANCEMENT_PLAN.md` | Dashboard & UI modernization plan |
| `docker-compose.yml` | Postgres 16 + Redis 7 (local dev) |
| `packages/shared/src/types/` | Shared TypeScript interfaces |
| `packages/shared/src/schemas/` | Shared Zod validation schemas |
| `apps/api/src/database/data-source.ts` | TypeORM CLI DataSource |
| `apps/api/src/modules/` | NestJS modules (13 feature modules) |
| `apps/web/src/lib/api/index.ts` | Typed API client |
| `apps/web/src/hooks/` | React Query hook files (one per module) |
| `apps/web/src/pages/` | Page components |
| `infrastructure/DEPLOYMENT.md` | Azure deployment guide |

---

## Environment

- **OS:** Windows ARM64
- **Node:** v24.6.0 · npm 11.5.2
- **Docker Desktop:** v29.2.1 (WSL2 backend)
- **DB creds:** user=bizops, password=bizops_dev_password, db=bizops_dev, port=5432
- **Redis:** port 6379, no password
- **API:** prefix `api/v1`, CORS for localhost:5173, Swagger at `/api/docs`
- **Frontend:** strict TypeScript, Vite dev with HTTPS (basicSsl)

---

## Important Notes

- `docker compose` (V2 syntax) — not `docker-compose`
- Shared package uses CommonJS output — Vite handles CJS via pre-bundling
- All services are multi-tenant isolated — `tenantId` on all entities and queries
- ARM64 dev machine (Windows ARM) — always use `az acr build --platform linux/amd64` for Docker builds (never local `docker build` for deployment)
- Azure resources in `rg-bizops-dev2` (eastus), subscription `c885843e-7631-4f4e-9f1a-5d1a49d3d2a1`
- ACR: `acrbizops5zqydpn5lftdy.azurecr.io`
- `InventoryTransaction` is append-only — never UPDATE or DELETE
- Sales module enhancement plan is ~3500 lines — read `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md` for full spec
