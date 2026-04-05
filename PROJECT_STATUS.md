# BizOps Platform — Project Status

> **Purpose:** Quick-reference for developers and AI agents working on this project.
> **Last updated:** 2026-04-04
> **Repository:** https://github.com/LeninGarcia09/SP
> **Full spec:** See `CLAUDE.md` for complete data model, RBAC, API conventions, coding standards.
> **Sales module spec:** See `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md` (~3500 lines, 7 waves)

---

## For New Developers

**Start here:**
1. Read this file for overall status and what's done vs. what's next
2. Read `CLAUDE.md` for the full technical spec (data model, RBAC, API design, coding standards)
3. Read `CONTRIBUTING.md` for local setup and development workflow
4. Read `infrastructure/DEPLOYMENT.md` for Azure deployment details

**Ask Copilot/Claude:** _"Read CLAUDE.md, PROJECT_STATUS.md, and CONTRIBUTING.md, then tell me the current state of the project and what's next."_

---

## Live Deployment

| Component | Resource | URL |
|---|---|---|
| API | Azure Container Apps (`api-bizops-dev`) | `https://api-bizops-dev.graysand-3ab24a81.eastus.azurecontainerapps.io` |
| Frontend | Azure Static Web Apps (`swa-bizops-dev`) | `https://yellow-moss-027665410.1.azurestaticapps.net` |
| Database | PostgreSQL Flexible Server (`pg-flex-bizops-dev`) | Burstable B1ms, PG 16, 32GB |
| Cache | Azure Cache for Redis | Basic C0 |
| Registry | ACR (`acrbizops5zqydpn5lftdy`) | `acrbizops5zqydpn5lftdy.azurecr.io` |
| Key Vault | `kv-bizops5zqydpn5lftd` | Stores db-password, jwt-secret |
| Resource Group | `rg-bizops-dev2` | East US |
| Swagger Docs | API auto-docs | `https://api-bizops-dev.graysand-3ab24a81.eastus.azurecontainerapps.io/api/docs` |

**Health check:** `GET /api/v1/system/health` → `{ database: "ok", cache: "ok" }`

---

## Git Info

| Item | Value |
|---|---|
| Remote | `origin` → https://github.com/LeninGarcia09/SP.git |
| Branch | `main` |
| Latest commit | `082e356` (2026-04-04) |

---

## Phase Completion Summary

### ✅ Core Platform (Phases 1–7) — COMPLETE

| Phase | Description | Status |
|---|---|---|
| 1 | Core Platform (monorepo, all modules, CRUD, Docker Compose) | ✅ |
| 2 | Extended Features (Programs, Gantt, i18n EN/ES, TelNub branding) | ✅ |
| 3 | Deployment Infrastructure (Dockerfile, Bicep IaC, GitHub Actions CI/CD) | ✅ |
| 4 | Production Hardening (logging, rate limiting, App Insights, Redis, 46 tests) | ✅ |
| 5 | CI/CD Pipeline (Service Principal, 10 GitHub Secrets, 4 workflows) | ✅ |
| 5.5 | Deployment Hardening (Flexible Server migration, health probes, secret rotation) | ✅ |
| 6 | Azure AD Multi-Tenant & Graph (3 tenants, 11 RBAC roles, Graph integration) | ✅ |
| 7 | Full Azure Deployment (Container Apps + Static Web Apps + Flexible Server) | ✅ |

### ✅ Enhancement Waves — Hours, Cost & Resource Management — COMPLETE

| Wave | Description | Status |
|---|---|---|
| 1 | Hours Tracking (task hours UI, summary endpoint, labor cost calc) | ✅ |
| 2 | Full Cost Management (CostEntry CRUD, approve/reject, budget notifications) | ✅ |
| 3 | Analytics & Forecasting (EAC/ETC/VAC/CPI, burn charts, task timers, resource finder) | ✅ |
| 3.5 | Deliverables & Task Cost (work packages, per-task costRate override) | ✅ |
| 5 | UI/UX Enhancement (dashboard overhaul, KPI cards, Recharts charts, view toggles) | ✅ |

**Wave 4 (Approvals & Leave)** — deferred, not started.

### ✅ Additional Phases (8–18) — COMPLETE

| Phase | Description | Status |
|---|---|---|
| 8 | Production Stability & E2E Testing (auto-migration, Playwright 15 tests) | ✅ |
| 9 | Seed Data & Bug Fixes (idempotent seed for 13 modules, 5 bug fixes) | ✅ |
| 10 | Mobile UI & Responsive Design (PWA, collapsible sidebar, responsive tables) | ✅ |
| 11 | Enhanced Task Management (activity log, comments, status tracking) | ✅ |
| 12 | Task Fields & Assignment UX (startDate, completedDate, searchable Combobox) | ✅ |
| 13 | Project Detail Simplification (team members table, simplified task form) | ✅ |
| 14 | Personnel Search Fix (include all personnel in Combobox) | ✅ |
| 15 | Combobox Portal Rendering (createPortal to body, no dialog clipping) | ✅ |
| 16 | API Limit Fix (200→100 pagination) | ✅ |
| 17 | Combobox Styling Fix (solid backgrounds, theme-safe) | ✅ |
| 18 | Combobox Click Selection Fix (Radix DismissableLayer workaround) | ✅ |

### Sales/CRM Module Enhancement — 4 of 7 Waves COMPLETE

> **Full spec:** `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md`
> Transforms basic Opportunities CRUD into a full B2B CRM platform.

| Wave | Description | Status | Key Commit |
|---|---|---|---|
| 1 | **Foundation** — Accounts, Contacts, Pipelines | ✅ | `49a8db9` |
| 2 | **Enhanced Opportunities** — Products, Stakeholders, Line Items, Competitors | ✅ | `7ecc305` |
| 2.5 | **Vendors & Products Pages** — Vendor entity, product-vendor linking | ✅ | `6af936d` |
| 3 | **Activities & Timeline** — Polymorphic activities, templates, quick-log | ✅ | (same deploy) |
| 4 | **Leads & Conversion** — Lead entity, BANT scoring, atomic conversion wizard | ✅ | `885c96a` |
| 5 | **Quoting** — Quote + line items, versioning, PDF generation | 🔲 Not started | — |
| 6 | **Forecasting & Analytics** — Pipeline analytics, revenue forecasting, KPIs | 🔲 Not started | — |
| 7 | **Sales Automation** — Workflow rules, assignment rules, sequences, cron jobs | 🔲 Not started | — |

### ❌ Deferred Items
- Azure AD full MSAL integration (requires tenant config)
- Production monitoring & alerting dashboards
- Enhancement Wave 4 — Approvals & Leave (time entry approval, leave tracking)

---

## What's Next — Remaining Work

### Sales/CRM Wave 5 — Quoting
- Quote + QuoteLineItem entities + migration
- Quote CRUD + versioning + status workflow (DRAFT → SENT → ACCEPTED/REJECTED/EXPIRED)
- Quote PDF generation
- Frontend: Quote builder, preview, send
- Shared types + Zod schemas

### Sales/CRM Wave 6 — Forecasting & Analytics
- Pipeline analytics (conversion rates, velocity, stage duration)
- Revenue forecasting (weighted pipeline, historical trends)
- Sales dashboard with KPIs
- Frontend: Analytics pages, forecast charts

### Sales/CRM Wave 7 — Sales Automation Engine (22 items)
- Event bus architecture (triggers → conditions → actions → logging)
- WorkflowRule entity + CRUD + execution engine
- AssignmentRule entity (round-robin, load-balanced, criteria-based)
- Sequence entity + enrollment + step execution
- 8 cron jobs (stale deals, follow-up reminders, sequence steps, etc.)
- Frontend: Workflow rule builder, sequence editor, assignment config

---

## Development Build Order (per feature)

Always follow this order:
1. **Shared types + Zod schemas** (`packages/shared`)
2. **Database entity + migration** (`apps/api`)
3. **Service + Controller + DTOs** (`apps/api`)
4. **API integration + React Query hooks** (`apps/web`)
5. **UI components + pages** (`apps/web`)

---

## Infrastructure & CI/CD

### GitHub Actions Workflows

| Workflow | File | Trigger |
|---|---|---|
| CI | `.github/workflows/ci.yml` | Push/PR to `main` + manual |
| Deploy API | `.github/workflows/deploy-api.yml` | Push to `apps/api/` on `main` + manual |
| Deploy Web | `.github/workflows/deploy-web.yml` | Push to `apps/web/` on `main` + manual |
| Deploy Infra | `.github/workflows/deploy-infra.yml` | Manual only |

### GitHub Secrets (10 configured)

`AZURE_CREDENTIALS`, `AZURE_RESOURCE_GROUP`, `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`, `CONTAINER_APP_NAME`, `AZURE_STATIC_WEB_APPS_API_TOKEN`, `API_BASE_URL`, `DB_ADMIN_PASSWORD`, `JWT_SECRET`

### Azure Resources

| Resource | Name | Details |
|---|---|---|
| Resource Group | `rg-bizops-dev2` | East US |
| PostgreSQL | `pg-flex-bizops-dev` | Flexible Server, Burstable B1ms, PG 16, 32GB, SSL required |
| Container App | `api-bizops-dev` | Health probes (Startup/Liveness/Readiness), auto-migration on boot |
| Static Web App | `swa-bizops-dev` | Central US, SPA routing configured |
| ACR | `acrbizops5zqydpn5lftdy` | Docker images built via `az acr build --platform linux/amd64` |
| Key Vault | `kv-bizops5zqydpn5lftd` | Stores `db-password`, `jwt-secret` |
| App Insights | Connected | Auto-collect requests, exceptions, dependencies |
| Redis | Azure Cache for Redis | Basic C0, used for caching layer |

> **ARM64 Note:** Dev machine is Windows ARM64. **Never use local `docker build`** for deployment — always use `az acr build --platform linux/amd64` to build on ACR.

---

## Key File Locations

| File | Purpose |
|---|---|
| `CLAUDE.md` | **Full project spec** — data model (all entities), RBAC (11 roles), API conventions, RAG engine, coding standards |
| `CONTRIBUTING.md` | **New developer onboarding** — local setup, workflow, conventions |
| `PROJECT_STATUS.md` | Phase completion tracker (this file) |
| `docs/SALES_OPPORTUNITIES_MODULE_ENHANCEMENT.md` | Sales/CRM module spec (~3500 lines, 7 waves) |
| `docs/ENHANCEMENT_PLAN_HOURS_COST_RESOURCES.md` | Hours/Cost/Resource management plan |
| `docs/UI_UX_ENHANCEMENT_PLAN.md` | Dashboard & UI modernization plan |
| `infrastructure/DEPLOYMENT.md` | Azure deployment guide with secrets reference |
| `docker-compose.yml` | Postgres 16 + Redis 7 (local dev) |
| `packages/shared/src/types/` | Shared TypeScript interfaces |
| `packages/shared/src/schemas/` | Shared Zod validation schemas |
| `apps/api/src/database/data-source.ts` | TypeORM CLI DataSource |
| `apps/api/src/modules/` | NestJS feature modules (20+ modules) |
| `apps/web/src/lib/api/index.ts` | Typed API client (Axios) |
| `apps/web/src/hooks/` | React Query hook files (one per module) |
| `apps/web/src/pages/` | Page components |
| `apps/web/src/components/` | Reusable components (ui/, shared/, feature-specific/) |

---

## Test Coverage

| Category | Count | Framework |
|---|---|---|
| API Unit Tests | 30 | Jest (RAG engine 24 + Roles guard 6) |
| API E2E Tests | 16 | Jest (Auth, Health, Projects CRUD, Tasks, Users, Inventory, Validation) |
| Frontend E2E Tests | 15 | Playwright (Chromium — auth, dashboard, nav, CRUD, i18n) |
| **Total** | **61** | |

---

## Quick Start

```powershell
# 1. Clone and install
git clone https://github.com/LeninGarcia09/SP.git
cd SP
npm install

# 2. Start local services (Postgres 16 + Redis 7)
docker compose up -d

# 3. Build shared package first
npm run build:shared

# 4. Start backend (auto-runs migrations)
cd apps/api
cp .env.example .env      # Configure DB, Redis, JWT settings
npm run start:dev          # → http://localhost:3000/api/docs (Swagger)

# 5. Start frontend (new terminal)
cd apps/web
cp .env.example .env      # Set VITE_API_BASE_URL=http://localhost:3000/api/v1
npm run dev                # → https://localhost:5173
```

---

## Environment Defaults (Local Dev)

| Setting | Value |
|---|---|
| Node.js | ≥ 22.0.0 (24.6.0 recommended) |
| Database | `postgresql://bizops:bizops_dev_password@localhost:5432/bizops_dev` |
| Redis | `redis://localhost:6379` |
| API prefix | `api/v1` |
| CORS | `localhost:5173` |
| Swagger | `http://localhost:3000/api/docs` |
| Frontend | `https://localhost:5173` (HTTPS via basicSsl plugin) |

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
