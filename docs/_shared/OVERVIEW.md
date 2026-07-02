# Percussion Project — Overview
**Product:** QuestionPro EX Platform Replica  
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Mock JSON data  
**Status:** In active development

---

## What This Project Is

This is a functional replica of the QuestionPro EX (Employee Experience) platform, built module by module in Cursor. It covers three products:

| Product | Path | Purpose |
|---|---|---|
| Lifecycle Surveys | `/lifecycle` | Automate survey deployment across the employee lifecycle |
| Empower 360 | `/360` | Multi-rater leadership assessments and reports |
| Empower EX | `/empower` | Action planning: turn survey insights into initiatives and tasks |

---

## Architecture Decisions

**No backend.** All data comes from `/src/data/mock/`. Components read from mock data files via helper functions in `/src/lib/mockDb.ts`. Never fetch from an API. Never use localStorage or sessionStorage.

**App Router only.** All pages live under `/src/app/`. No Pages Router. Use `layout.tsx` for shared layouts per product section.

**One component = one file.** Never combine two unrelated components in one file.

**Design system is the source of truth.** Never define a color, spacing value, or component style inline. Always import UI primitives directly from `@npm-questionpro/wick-ui-lib`. See `DESIGN_SYSTEM.md`.

**Types are shared.** All TypeScript interfaces live in `/src/types/index.ts`. Never define a type inside a component file.

---

## Routing Structure

```
/                    → redirects to /lifecycle
/login               → Login page
/lifecycle           → Lifecycle Surveys home
/lifecycle/surveys   → Survey list and builder
/lifecycle/rules     → Lifecycle Rules Engine
/lifecycle/roster    → Employee Roster
/lifecycle/distribution → Survey Distribution
/lifecycle/analytics → Analytics Portal
/lifecycle/settings  → Admin & Settings
/360                 → Empower 360 home
/360/surveys         → 360 Survey Builder
/360/participants    → Participant & Rater Management
/360/deployment      → Deployment
/360/reports         → Analytics & Reports
/360/settings        → Settings & Config
/empower             → Empower EX home
/empower/initiatives → Initiatives
/empower/tasks       → My Tasks (global)
/empower/ideation    → Ideation
/empower/conversations → Conversations
/empower/analytics   → Empower Analytics
/empower/settings    → Admin & Settings
```

---

## Key Personas

| Persona | Role | Primary product |
|---|---|---|
| HR Admin | Configures surveys, rules, manages roster, views all data | All three |
| Manager | Views team results, manages tasks and initiatives | Empower EX, Lifecycle |
| Employee | Responds to surveys, submits ideas, views own 360 report | Lifecycle, 360, Ideation |
| Executive | Read-only dashboards, org-wide trends | Lifecycle Analytics |
| Initiative Owner | Manages assigned initiatives and tasks | Empower EX |
| Rater | Completes 360 assessments for assigned subjects | Empower 360 |

---

## Folder Reference

```
/docs              → All PRDs and specs (read before building)
/src/app           → Next.js pages (App Router)
/src/components/shared → Sidebar, TopBar, AppShell (compose WickUI primitives)
/src/components/modules → Feature-specific components per product
/src/data/mock     → All mock data
/src/lib           → Utility functions (mockDb, cn, etc.)
/src/types         → Shared TypeScript interfaces
```