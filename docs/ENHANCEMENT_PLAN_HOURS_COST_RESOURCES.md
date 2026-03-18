# Enhancement Plan: Hours, Cost & Resource Management

> **Date:** March 17, 2026
> **Author:** Solo dev — BizOps Platform
> **Scope:** Three pillars — Hours Management, Cost Management, Resources Management
> **Approach:** Incremental phases building on the existing solid data model foundation

---

## Executive Summary

The current platform has a **strong data foundation** — Task entity already has `estimatedHours`/`actualHours`, Project has `budget`/`actualCost`/`costRate`, and Personnel has full assignment/allocation tracking with a 90-day capacity Gantt. However, the **frontend UI lags behind**: hours fields aren't exposed in task forms, cost tracking is manual-only, and resource utilization lacks drill-down.

This plan brings the platform to parity with modern PM tools (Jira, Monday.com, ClickUp, Dynamics 365 Project Operations) through 4 implementation waves.

---

## Current State Summary

| Feature | DB | API | Frontend | Gap Level |
|---------|:--:|:---:|:--------:|:---------:|
| Task estimated/actual hours | ✅ | ✅ | ❌ | **Critical** |
| Project budget/actualCost | ✅ | ✅ | ✅ | Minor |
| Cost rate (hours→$) | ✅ | ✅ | ❌ | Medium |
| Hours→Cost auto-calculation | ✅ (RAG engine) | ✅ | ❌ | Medium |
| Personnel registry | ✅ | ✅ | ✅ | Complete |
| Project assignments | ✅ | ✅ | ✅ | Complete |
| Capacity planning (90-day) | ✅ | ✅ | ✅ | Complete |
| Time entry / timesheets | ❌ | ❌ | ❌ | **Critical** |
| Cost breakdown by resource | ❌ | ❌ | ❌ | **Critical** |
| Cost forecasting (EAC/ETC) | ❌ | ❌ | ❌ | Medium |
| Utilization reports | ❌ | ❌ | ❌ | Medium |
| Leave/availability tracking | ❌ | ❌ | ❌ | Low |

---

## Industry Benchmark: What Leading Tools Do

### Hours Management
| Feature | Jira | Monday.com | ClickUp | Dynamics 365 | **Our Plan** |
|---------|:----:|:----------:|:-------:|:------------:|:------------:|
| Task-level time logging | ✅ | ✅ | ✅ | ✅ | Wave 1 |
| Weekly timesheet view | ✅ | ✅ | ✅ | ✅ | Wave 2 |
| Timer (start/stop) | ❌ | ✅ | ✅ | ❌ | Wave 3 |
| Time approval workflow | ✅ | ❌ | ❌ | ✅ | Wave 4 |
| Estimate vs actual comparison | ✅ | ✅ | ✅ | ✅ | Wave 1 |
| Hours rollup (task→project) | ✅ | ✅ | ✅ | ✅ | Wave 1 |

### Cost Management
| Feature | Jira (Tempo) | Monday.com | ClickUp | Dynamics 365 | **Our Plan** |
|---------|:------------:|:----------:|:-------:|:------------:|:------------:|
| Budget vs actual tracking | ✅ | ✅ | ✅ | ✅ | Exists (enhance) |
| Hours × rate auto-calculation | ✅ | ✅ | ❌ | ✅ | Wave 1 |
| Cost breakdown by resource | ✅ | ✅ | ❌ | ✅ | Wave 2 |
| Cost breakdown by task | ✅ | ❌ | ❌ | ✅ | Wave 2 |
| Forecasting (EAC/ETC/VAC) | ✅ | ❌ | ❌ | ✅ | Wave 3 |
| Burn-down/burn-up charts | ✅ | ✅ | ✅ | ✅ | Wave 3 |
| Multi-currency | ❌ | ❌ | ❌ | ✅ | Out of scope |

### Resource Management
| Feature | Jira (Tempo) | Monday.com | ClickUp | Dynamics 365 | **Our Plan** |
|---------|:------------:|:----------:|:-------:|:------------:|:------------:|
| Allocation % per project | ✅ | ✅ | ❌ | ✅ | Exists |
| Capacity planning board | ✅ | ✅ | ❌ | ✅ | Exists |
| Utilization rate (%) | ✅ | ✅ | ❌ | ✅ | Wave 2 |
| Over-allocation alerts | ✅ | ✅ | ❌ | ✅ | Wave 2 |
| Skills-based matching | ❌ | ✅ | ❌ | ✅ | Wave 3 |
| Leave/absence tracking | ✅ | ❌ | ❌ | ✅ | Wave 4 |
| Resource leveling | ❌ | ❌ | ❌ | ✅ | Out of scope |

---

## Implementation Plan

### Wave 1 — Hours Tracking Foundation ⭐ (Priority: Critical)

**Goal:** Enable users to log and view hours on tasks, with automatic project-level rollups.

#### 1.1 Task Hours UI in ProjectDetail

**Frontend changes — [ProjectDetail.tsx](apps/web/src/pages/ProjectDetail.tsx):**
- Add `estimatedHours` and `actualHours` fields to the Task Form Dialog
- Add hours columns to the Task Table (estimated | actual | variance)
- Show hours progress bar: `actualHours / estimatedHours` with color coding
- Add inline editing for `actualHours` (quick log without opening dialog)

**No backend changes needed** — Task entity, DTO, and API already support both fields.

#### 1.2 Quick Time Log on Task Cards

**New component — `TimeLogInput`:**
- Compact input shown on task row/card: `[+]` button → popover with hours input + date + note
- Submits via `PATCH /tasks/:id` updating `actualHours` (additive)
- Optional: log as activity entry in task activity log

**Backend change — [tasks.service.ts](apps/api/src/modules/tasks/tasks.service.ts):**
- Track `actualHours` changes in activity log (currently skipped)
- Emit notification when task hours exceed estimate by >20%

#### 1.3 Project Hours Summary Card

**Frontend — ProjectDetail.tsx info cards section:**
- New card: **Hours** showing `totalEstimated | totalActual | variance`
- Rollup: sum of all task `estimatedHours` and `actualHours` for the project

**Backend — [projects.service.ts](apps/api/src/modules/projects/projects.service.ts):**
- New endpoint: `GET /api/v1/projects/:id/hours-summary`
- Returns: `{ totalEstimated, totalActual, variance, completionPercent, taskCount }`
- Query: `SELECT SUM(estimated_hours), SUM(actual_hours) FROM tasks WHERE project_id = :id`

#### 1.4 Automatic Cost from Hours

**Backend — RAG engine enhancement ([rag.engine.ts](apps/api/src/modules/health/rag.engine.ts)):**
- Already has fallback: `actualCost = sum(task.actualHours) * costRate` — ensure this is robust
- Add computed `laborCost` to project detail response

**Frontend — ProjectDetail.tsx:**
- Show "Labor Cost" alongside "Actual Cost" in project info cards
- Tooltip: "Calculated from task hours × project cost rate ($X/hr)"

#### Data Model Changes
```
None — all fields already exist in Task entity and Project entity.
```

#### API Changes
```
GET /api/v1/projects/:id/hours-summary    (NEW)
  Response: { totalEstimated, totalActual, variance, completionPercent, taskBreakdown[] }
```

---

### Wave 2 — Timesheet & Cost Breakdown (Priority: High)

**Goal:** Weekly timesheet view, cost breakdown by resource/task, utilization metrics.

#### 2.1 TimeEntry Entity (NEW)

Replace the per-task `actualHours` increment model with proper time entries for audit trail.

**New entity — `TimeEntry`:**
```typescript
TimeEntry {
  id: uuid PK
  personId: uuid FK → Person
  projectId: uuid FK → Project
  taskId: uuid FK → Task (nullable — for non-task project work)
  date: date                          // The work day
  hours: decimal(5,2)                 // Hours worked (0.25 increments)
  description: text nullable          // Work description / notes
  category: TimeCategory              // REGULAR | OVERTIME | TRAVEL | ADMIN
  status: TimeEntryStatus             // DRAFT | SUBMITTED | APPROVED | REJECTED
  submittedAt: timestamp nullable
  approvedById: uuid FK → User nullable
  approvedAt: timestamp nullable
  createdAt, updatedAt: timestamp
}

enum TimeCategory { REGULAR, OVERTIME, TRAVEL, ADMIN }
enum TimeEntryStatus { DRAFT, SUBMITTED, APPROVED, REJECTED }
```

**Indexes:**
- `(personId, date)` — for timesheet queries
- `(projectId, date)` — for project cost rollups
- `(taskId)` — for task hours rollup
- `(status)` — for approval queues

#### 2.2 Weekly Timesheet Page (NEW)

**New page — `/timesheets`:**
- Grid layout: rows = projects/tasks, columns = Mon–Sun
- Cell = hours input (decimal, 0.25 increments)
- Row totals and column totals
- Submit button → sets status to SUBMITTED
- Copy from previous week button

**Timesheet API:**
```
GET    /api/v1/time-entries?personId=&weekOf=2026-03-16    (returns week's entries)
POST   /api/v1/time-entries                                (create single entry)
POST   /api/v1/time-entries/bulk                           (create/update batch for a week)
PATCH  /api/v1/time-entries/:id                            (update entry)
DELETE /api/v1/time-entries/:id                             (only if DRAFT status)
POST   /api/v1/time-entries/submit?weekOf=2026-03-16       (bulk submit week)
```

#### 2.3 Cost Breakdown Dashboard

**New section in ProjectDetail — "Cost Breakdown" tab:**

| View | Description |
|------|-------------|
| By Resource | Table: person name, role, hours, rate, cost — sorted by cost desc |
| By Task | Table: task title, estimated hours, actual hours, labor cost |
| By Week | Bar chart: weekly cost stacked by resource (Recharts) |

**Backend — new endpoint:**
```
GET /api/v1/projects/:id/cost-breakdown
  Query: ?groupBy=resource|task|week&from=&to=
  Response: { groups: [{ name, hours, cost, percentage }], total: { hours, cost } }
```

**Calculation:**
- Per resource: `SUM(time_entries.hours) * person_cost_rate` (or project `costRate` as fallback)
- Per task: `SUM(time_entries.hours WHERE task_id = X) * costRate`
- Per week: `SUM(time_entries.hours WHERE date BETWEEN week_start AND week_end) * costRate`

#### 2.4 Person Cost Rate (NEW field)

**Entity change — Person entity:**
```typescript
// Add to Person entity
costRate: decimal(10,2) nullable  // Person-specific hourly cost rate
billRate: decimal(10,2) nullable  // Person-specific hourly billing rate (future use)
```

**Priority waterfall for cost calculation:**
1. Person `costRate` (if set) — most specific
2. Project `costRate` (if set) — project-level default
3. `0` — no cost tracking

#### 2.5 Utilization Report

**New page — `/reports/utilization`:**
- Table: person | available hours (based on capacity - leave) | logged hours | utilization %
- Color coding: <60% = Red (underutilized), 60-85% = Green (optimal), >85% = Amber (at risk)
- Filters: department, date range, project
- Chart: utilization trend over time (Recharts line chart)

**Backend:**
```
GET /api/v1/reports/utilization?from=&to=&departmentId=
  Response: { persons: [{ id, name, availableHours, loggedHours, utilizationPercent }] }
```

**Available hours formula:** `workdays_in_period × standard_hours_per_day (8)` (subtract leave in Wave 4)

#### 2.6 Over-Allocation Alerts

**Backend — [personnel.service.ts](apps/api/src/modules/personnel/personnel.service.ts):**
- On assignment create/update: check if person's total `allocationPercent` exceeds 100%
- If yes: return warning in response (not blocking) + create notification
- New notification type: `OVER_ALLOCATION`

**Frontend — CapacityPlanning.tsx:**
- Highlight over-allocated cells in RED with tooltip showing breakdown
- Click to see conflicting assignments

#### Data Model Changes
```sql
-- New table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  task_id UUID REFERENCES tasks(id),
  date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
  description TEXT,
  category VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  submitted_at TIMESTAMP,
  approved_by_id UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(person_id, project_id, task_id, date, category)
);

-- New columns on persons
ALTER TABLE persons ADD COLUMN cost_rate DECIMAL(10,2);
ALTER TABLE persons ADD COLUMN bill_rate DECIMAL(10,2);
```

#### API Changes
```
GET    /api/v1/time-entries                               (list with filters)
POST   /api/v1/time-entries                               (create)
POST   /api/v1/time-entries/bulk                          (batch create/update)
PATCH  /api/v1/time-entries/:id                           (update)
DELETE /api/v1/time-entries/:id                            (delete draft only)
POST   /api/v1/time-entries/submit                        (bulk submit)

GET    /api/v1/projects/:id/cost-breakdown                (cost breakdown)
GET    /api/v1/reports/utilization                        (utilization report)
```

---

### Wave 3 — Analytics & Forecasting (Priority: Medium)

**Goal:** Cost forecasting, burn charts, timer, skills matching.

#### 3.1 Cost Forecasting (EAC / ETC / VAC)

Following Dynamics 365 Project Operations methodology:

**Formulas:**
```
EAC (Estimate at Completion) = Actual Cost + ETC
ETC (Estimate to Complete)   = Remaining Hours × Cost Rate
Remaining Hours              = Total Estimated Hours - Total Actual Hours
VAC (Variance at Completion) = Budget - EAC
CPI (Cost Performance Index) = Budget / EAC
```

**Backend — new endpoint:**
```
GET /api/v1/projects/:id/cost-forecast
  Response: {
    budget, actualCost, laborCost,
    eac, etc, vac, cpi,
    remainingHours, totalEstimated, totalActual,
    projectedOverrun: boolean,
    projectedCompletionCost: number
  }
```

**Frontend — ProjectDetail "Forecast" card:**
- Show EAC, ETC, VAC with color indicators
- CPI gauge: green (>1 = under budget), red (<1 = over budget)
- Progress bar: actual cost → EAC → budget

#### 3.2 Burn-Down / Burn-Up Charts

**New component — `BurnChart`:**
- X axis: project timeline (start → end date)
- Y axis: hours or cost
- Lines:
  - **Ideal burn-down:** linear from total estimate to 0
  - **Actual burn-down:** remaining hours over time
  - **Burn-up:** cumulative actual hours vs total scope

**Data source:** Aggregate `time_entries` by date, compute running totals.

**Backend:**
```
GET /api/v1/projects/:id/burn-data?metric=hours|cost
  Response: { 
    dates: string[], 
    ideal: number[], 
    actual: number[], 
    scope: number[] 
  }
```

#### 3.3 Start/Stop Timer

**Frontend-only feature (stored locally until stopped):**
- Timer button on task card/detail
- Uses `localStorage` to persist running timer across page refreshes
- On stop: creates time entry with calculated duration
- Shows active timer in top nav bar

**Component — `TaskTimer`:**
```tsx
// State: { taskId, projectId, startedAt } stored in localStorage
// On stop: POST /api/v1/time-entries with hours = (now - startedAt) / 3600
// Visual: floating pill in navbar showing "⏱ TaskName: 2h 15m [Stop]"
```

#### 3.4 Skills-Based Resource Matching

**Enhancement to existing skills system:**

The platform already has a Skills module (`apps/api/src/modules/skills/`). Enhance it for matching.

**New endpoint:**
```
GET /api/v1/personnel/match?skills=react,typescript&minAllocation=50&availableFrom=2026-04-01
  Response: { matches: [{ person, matchScore, currentAllocation, availablePercent, matchedSkills }] }
```

**Frontend — resource finder in ProjectDetail:**
- "Find Team Members" button
- Input: required skills (multi-select from skills list) + availability window
- Shows ranked list of matching personnel with allocation status
- One-click "Assign to Project" action

#### Data Model Changes
```
None — uses existing entities + new computed endpoints.
```

#### API Changes
```
GET /api/v1/projects/:id/cost-forecast         (NEW)
GET /api/v1/projects/:id/burn-data             (NEW)
GET /api/v1/personnel/match                    (NEW)
```

---

### Wave 4 — Approvals & Leave (Priority: Low)

**Goal:** Time entry approval workflow, leave/absence management.

#### 4.1 Time Approval Workflow

**Approval flow:**
```
DRAFT → SUBMITTED → APPROVED / REJECTED
                        ↑
                   (approver = project lead or resource manager)
```

**Backend:**
```
GET  /api/v1/time-entries/pending-approval?approverId=     (entries awaiting my approval)
POST /api/v1/time-entries/:id/approve                      (approve entry)
POST /api/v1/time-entries/:id/reject                       (reject with reason)
POST /api/v1/time-entries/bulk-approve                     (batch approve)
```

**Frontend — Approval Queue page (`/approvals`):**
- Table: person | project | task | date | hours | status | actions
- Bulk select + approve/reject
- Filter by project, person, week
- Notification to submitter on approve/reject

**RBAC:**
- `GLOBAL_LEAD`, `BIZ_OPS_MANAGER`: approve any
- `PROJECT_LEAD`: approve entries on own projects
- `RESOURCE_MANAGER`: approve entries from own department

#### 4.2 Leave/Absence Tracking

**New entity — `LeaveEntry`:**
```typescript
LeaveEntry {
  id: uuid PK
  personId: uuid FK → Person
  leaveType: LeaveType          // VACATION | SICK | PERSONAL | HOLIDAY | TRAINING
  startDate: date
  endDate: date
  hours: decimal(5,2) nullable  // For partial-day leave
  status: LeaveStatus           // PENDING | APPROVED | REJECTED | CANCELLED
  approvedById: uuid FK → User nullable
  notes: text nullable
  createdAt, updatedAt: timestamp
}
```

**Impact on capacity planning:**
- Utilization available hours: subtract approved leave days
- Capacity Gantt: show leave blocks as hatched/grayed out
- Over-allocation check: factor in leave periods

#### Data Model Changes
```sql
CREATE TABLE leave_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id),
  leave_type VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours DECIMAL(5,2),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  approved_by_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### API Changes
```
GET    /api/v1/leave-entries                 (list with filters)
POST   /api/v1/leave-entries                 (create)
PATCH  /api/v1/leave-entries/:id             (update)
POST   /api/v1/leave-entries/:id/approve     (approve)
POST   /api/v1/leave-entries/:id/reject      (reject)
GET    /api/v1/personnel/:id/availability    (availability considering leave)

GET    /api/v1/time-entries/pending-approval (approval queue)
POST   /api/v1/time-entries/:id/approve      (approve time entry)
POST   /api/v1/time-entries/:id/reject       (reject time entry)
POST   /api/v1/time-entries/bulk-approve     (batch approve)
```

---

## Implementation Sequence & Effort

| Wave | Name | New Entities | New Endpoints | New Pages | Estimated Complexity |
|:----:|------|:------------:|:-------------:|:---------:|:--------------------:|
| **1** | Hours Foundation | 0 | 1 | 0 (modify existing) | Low |
| **2** | Timesheet & Cost Breakdown | 1 (TimeEntry) + 2 columns | 8 | 2 (Timesheet, Utilization) | High |
| **3** | Analytics & Forecasting | 0 | 3 | 0 (new components) | Medium |
| **4** | Approvals & Leave | 1 (LeaveEntry) | 7 | 2 (Approvals, Leave) | Medium |

### Recommended Build Order (per CLAUDE.md §9):

**For each feature:**
1. Shared types + Zod schemas (`packages/shared`)
2. Database entity + migration (`apps/api`)
3. Service + Controller + DTOs (`apps/api`)
4. API integration + React Query hooks (`apps/web`)
5. UI components + pages (`apps/web`)

---

## Wave 1 Detailed Task Breakdown (Ready to Implement)

### Backend (0 DB changes, 1 new endpoint)
- [ ] Add hours-summary endpoint to ProjectsController
- [ ] Add `actualHours` change tracking in TasksService activity log
- [ ] Add hours-overrun notification (>20% over estimate)

### Shared Types
- [ ] Add `ProjectHoursSummary` interface to shared types
- [ ] Add `HoursSummaryResponse` type

### Frontend
- [ ] Add `estimatedHours` and `actualHours` fields to Task Form Dialog
- [ ] Add hours columns to Task Table (with variance calculation)
- [ ] Add hours progress indicator on task rows
- [ ] Add Project Hours Summary card to ProjectDetail info section
- [ ] Create `useProjectHoursSummary` React Query hook
- [ ] Add inline time log popover component on task rows

---

## Key Design Decisions

### 1. Time Entries vs Direct Hours Update
- **Wave 1:** Use direct `actualHours` field on Task (simple, no new entities)
- **Wave 2:** Introduce `TimeEntry` entity for granular tracking (who logged what and when)
- Migration path: `task.actualHours` becomes a computed field (`SUM(time_entries.hours WHERE task_id = X)`)

### 2. Cost Rate Hierarchy
```
Person costRate > Project costRate > 0 (no cost)
```
This allows person-specific rates (senior vs junior) while falling back to project defaults.

### 3. Timesheet vs Task-Level Logging
Both paradigms supported:
- **Task-level:** Quick log from task card (Wave 1)
- **Timesheet:** Weekly grid view for bulk entry (Wave 2)
Both create the same `TimeEntry` records.

### 4. Approval Flow
- Approval is optional in Wave 2 (all entries auto-approved)
- Wave 4 introduces formal approval workflow
- RAG calculation uses all entries regardless of status (conservative — shows real spend)

### 5. Hours RAG (Proposed Enhancement)
Add a third RAG dimension based on hours:
```
GREEN  → actual hours ≤ 90% of estimated
AMBER  → actual hours 90–110% of estimated
RED    → actual hours > 110% of estimated
GRAY   → no estimates set
```
Overall RAG = worst of (schedule, budget, hours).

---

## Out of Scope (Intentionally Excluded)

| Feature | Reason |
|---------|--------|
| Multi-currency | Complexity vs. value — single currency sufficient for internal tool |
| Resource leveling algorithm | Enterprise feature — over-allocation alerts sufficient |
| Gantt chart integration | Separate existing feature (GanttChart.tsx) |
| AI-powered estimates | Phase 3+ consideration |
| Mobile time logging | PWA already supports mobile — responsive UI sufficient |
| Integration with external billing (QuickBooks, SAP) | Internal tool — not needed |
| Earned Value Management (EVM) | Complex PM methodology — CPI/SPI from Wave 3 is sufficient |
