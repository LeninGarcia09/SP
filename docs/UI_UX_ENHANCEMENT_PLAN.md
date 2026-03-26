# UI/UX Enhancement Plan — BizOps CRM Platform

> Based on analysis of Salesforce Lightning, HubSpot, Monday.com, Dynamics 365, ClickUp, Jira, and Asana UI patterns.

---

## Executive Summary

The current UI is functional but basic — flat KPI cards, plain tables, and minimal data visualization. This plan transforms the platform into a modern, data-rich CRM that matches the sophistication of enterprise tools while maintaining fast load times and clean design.

**Priority:** Dashboard → Projects → Programs (highest user impact first)

---

## Phase 1: Dashboard Overhaul

### Current State
- 4 plain KPI cards (active projects, total projects, personnel, inventory)
- 5-row recent projects table
- No charts, no activity feed, no quick actions

### Target State (Inspired by Salesforce Lightning Home + HubSpot Dashboard)

**Row 1 — Welcome & Quick Actions**
- Greeting with user name and current date
- Quick action buttons: New Project, New Opportunity, New Task

**Row 2 — Enhanced KPI Cards (6 cards, 3×2 grid on desktop)**
- Active Projects (with trend: +N this month)
- Pipeline Value (sum of open opportunity estimated values)
- Total Budget (sum of all active project budgets)
- Budget Utilization (% of total budget spent, with progress ring)
- Open Tasks (count of non-DONE tasks across all projects)
- Team Utilization (% of personnel with active assignments)

Each card: icon, metric value, label, trend indicator (↑/↓/—), subtle color coding

**Row 3 — Charts Section (2-column grid)**
- Left: Project Status Distribution (Donut chart — PLANNING/ACTIVE/ON_HOLD/COMPLETED/CANCELLED)
- Right: Budget Overview (Horizontal bar chart — top 5 projects by budget, showing budget vs actual)

**Row 4 — Tables Section (2-column grid)**
- Left: My Tasks / Upcoming Deadlines (tasks due within 7 days, sorted by urgency)
- Right: Recent Activity (latest created/updated projects and opportunities)

**Row 5 — Opportunity Pipeline (full-width)**
- Horizontal funnel/stage view: IDENTIFIED → QUALIFYING → PROPOSAL → NEGOTIATION → WON
- Count + total value per stage

---

## Phase 2: Projects List Enhancement

### Current State
- Simple search + 7-column table with pagination
- No view modes, no filters, no status quick-filter

### Target State (Inspired by Monday.com Board Views + ClickUp)

**Header Row:**
- Title + count badge
- View toggle: Table | Cards | Kanban (persisted in localStorage)
- Status filter tabs: All | Active | Planning | On Hold | Completed
- Search input + New Project button

**Table View (enhanced):**
- Better status badges with colored dots
- Budget column with mini progress bar (actual/budget)
- Health RAG indicator column (colored circle)
- Sortable column headers (click to sort)

**Card View:**
- Grid of project cards (3 per row on desktop, 1 on mobile)
- Each card: name, code, status badge, budget bar, health indicator, project lead avatar, date range

**Kanban View:**
- Columns: Planning, Active, On Hold, Completed, Cancelled
- Draggable project cards between columns (updates status via API)
- Card shows: name, code, budget, lead

---

## Phase 3: Programs List Enhancement

### Current State
- Simple search + 6-column table with pagination
- No visual indicators, no portfolio overview

### Target State (Inspired by Dynamics 365 Portfolio Manager)

**Portfolio Summary Row (above the table):**
- 4 KPI cards: Total Programs, Active, Total Budget (sum), Total Actual (sum with % bar)

**Enhanced Table:**
- Better status badges
- Budget column with mini progress bar
- Project count column (number of linked projects)
- Health summary (mini dots showing RAG of linked projects)

**Status filter tabs:** All | Active | Planning | On Hold | Completed

---

## Implementation Order

1. Dashboard translation keys (en.json + es.json)
2. Add Tabs shadcn/ui component
3. Dashboard page rewrite
4. Projects page enhancement (table view + status tabs + cards)
5. Programs page enhancement (summary cards + status tabs)
6. Kanban view for Projects (Phase 2B — separate PR)

---

## Design Tokens

- KPI card borders: `border-l-4 border-l-{color}` for left accent
- Trend up: `text-green-600`, Trend down: `text-red-600`, Neutral: `text-muted-foreground`
- Chart colors: Blue-600 (primary), Green-500, Yellow-500, Red-500, Gray-400
- Card hover: `hover:shadow-md transition-shadow`
- Skeleton loading states for all data-dependent sections
