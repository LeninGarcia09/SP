# BizOps Platform — Project Status & Context

> **Purpose:** Quick-reference for AI agents resuming work on this project.
> **Last updated:** 2026-07-22
> **Full spec:** See `CLAUDE.md` in this same directory for complete data model, RBAC, API conventions.

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
- [x] Azure Bicep IaC templates (8 modules: ACR, PostgreSQL, Key Vault, Log Analytics, App Insights, Container App Env, Container App, Static Web App)
- [x] Bicep parameter files (dev, prod)
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

---

## Infrastructure Files

| File/Directory | Purpose |
|---|---|
| `apps/api/Dockerfile` | Multi-stage Docker build for API |
| `.dockerignore` | Docker build exclusions |
| `infrastructure/bicep/main.bicep` | Main Bicep orchestrator |
| `infrastructure/bicep/modules/` | 8 Bicep modules (ACR, PostgreSQL, etc.) |
| `infrastructure/bicep/parameters/` | dev.bicepparam, prod.bicepparam |
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
| `docker-compose.yml` | Postgres 16 + Redis 7 (local dev) |
| `packages/shared/src/types/` | Shared TypeScript interfaces |
| `packages/shared/src/schemas/` | Shared Zod validation schemas |
| `apps/api/src/database/data-source.ts` | TypeORM CLI DataSource |
| `apps/api/src/modules/` | NestJS modules (users, projects, tasks, health, personnel, inventory) |
| `apps/web/src/lib/api/index.ts` | Typed API client |
| `apps/web/src/hooks/` | React Query hook files |
| `apps/web/src/pages/` | Page components |

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

- `docker-compose` (V1 CLI) doesn't exist — must use `docker compose` (V2) or full path
- `docker-compose.yml` has obsolete `version` attribute (warning only, not breaking)
- Shared package uses CommonJS output — Vite handles CJS via pre-bundling
- Force push was used to overwrite unrelated legacy content on remote
- All services are stubs — they return empty/mock data until DB is connected
