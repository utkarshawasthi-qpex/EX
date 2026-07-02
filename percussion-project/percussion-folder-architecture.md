# Percussion Project — Repository & PRD Folder Architecture
**Stack:** Next.js 14 · TypeScript · Tailwind CSS  
**Last Updated:** June 2026

---

## Philosophy

Two parallel trees live in this repo:

- `/docs` — All product documentation (PRDs, feature specs, module overviews). Cursor reads these for context before building.
- `/src` (or `/app`) — All code. Mirrors the docs structure so any engineer can navigate both trees identically.

The rule: **every feature that gets built must have a PRD file first.** Cursor is instructed to read the PRD before writing code.

---

## Full Repository Structure

```
percussion-project/
│
├── docs/                                  ← All PRDs and product specs (Cursor reads these)
│   │
│   ├── _shared/                           ← Cross-project shared specs
│   │   ├── OVERVIEW.md                    ← Project overview, goals, tech stack, conventions
│   │   ├── DESIGN_SYSTEM.md               ← Color tokens, typography, spacing, component rules
│   │   ├── DATA_MODELS.md                 ← Shared TypeScript types: Employee, Survey, Rule, etc.
│   │   └── CONVENTIONS.md                 ← Naming conventions, file structure rules, PR checklist
│   │
│   ├── lifecycle-surveys/                 ← PROJECT 1
│   │   ├── MODULE_OVERVIEW.md             ← What Lifecycle Surveys is, who uses it, all modules listed
│   │   │
│   │   ├── 01-survey-creation/
│   │   │   ├── MODULE.md                  ← Module purpose, user personas, all features listed
│   │   │   ├── survey-list.PRD.md
│   │   │   ├── create-survey-flow.PRD.md
│   │   │   ├── template-library.PRD.md
│   │   │   ├── survey-builder-markers.PRD.md
│   │   │   ├── survey-builder-questions.PRD.md
│   │   │   ├── branching-logic.PRD.md
│   │   │   ├── multilingual-settings.PRD.md
│   │   │   ├── screener-page.PRD.md
│   │   │   ├── survey-preview.PRD.md
│   │   │   └── survey-settings.PRD.md
│   │   │
│   │   ├── 02-lifecycle-rules/
│   │   │   ├── MODULE.md
│   │   │   ├── rules-list.PRD.md
│   │   │   ├── rule-builder-trigger.PRD.md
│   │   │   ├── rule-builder-delay.PRD.md
│   │   │   ├── rule-builder-survey-link.PRD.md
│   │   │   ├── rule-builder-audience.PRD.md
│   │   │   ├── rule-builder-review.PRD.md
│   │   │   ├── rule-detail-view.PRD.md
│   │   │   └── rule-audit-log.PRD.md
│   │   │
│   │   ├── 03-employee-roster/
│   │   │   ├── MODULE.md
│   │   │   ├── employee-list.PRD.md
│   │   │   ├── add-employee.PRD.md
│   │   │   ├── bulk-import.PRD.md
│   │   │   ├── employee-profile.PRD.md
│   │   │   ├── custom-fields.PRD.md
│   │   │   └── employee-filter.PRD.md
│   │   │
│   │   ├── 04-distribution/
│   │   │   ├── MODULE.md
│   │   │   ├── deployment-scheduler.PRD.md
│   │   │   ├── email-invitation-builder.PRD.md
│   │   │   ├── sms-distribution.PRD.md
│   │   │   ├── slack-distribution.PRD.md
│   │   │   ├── reminder-configuration.PRD.md
│   │   │   ├── email-delivery-status.PRD.md
│   │   │   └── deployment-by-groups.PRD.md
│   │   │
│   │   ├── 05-analytics/
│   │   │   ├── MODULE.md
│   │   │   ├── analytics-dashboard.PRD.md
│   │   │   ├── heatmap.PRD.md
│   │   │   ├── trend-analysis.PRD.md
│   │   │   ├── enps-widget.PRD.md
│   │   │   ├── driver-analysis.PRD.md
│   │   │   ├── text-analysis.PRD.md
│   │   │   ├── sentiment-analysis.PRD.md
│   │   │   ├── scorecard.PRD.md
│   │   │   ├── response-rate.PRD.md
│   │   │   ├── survey-comparison.PRD.md
│   │   │   ├── single-question-deepdive.PRD.md
│   │   │   └── notes-widget.PRD.md
│   │   │
│   │   ├── 06-dashboards/
│   │   │   ├── MODULE.md
│   │   │   ├── create-dashboard.PRD.md
│   │   │   ├── dashboard-filters.PRD.md
│   │   │   ├── dashboard-sharing.PRD.md
│   │   │   ├── global-dashboard.PRD.md
│   │   │   ├── dynamic-public-sharing.PRD.md
│   │   │   ├── ppt-export.PRD.md
│   │   │   └── manage-dashboard.PRD.md
│   │   │
│   │   └── 07-integrations-admin/
│   │       ├── MODULE.md
│   │       ├── hris-integration.PRD.md
│   │       ├── ftp-sync.PRD.md
│   │       ├── portal-settings.PRD.md
│   │       ├── access-rules.PRD.md
│   │       ├── benchmarking-config.PRD.md
│   │       ├── account-settings.PRD.md
│   │       └── webhooks-config.PRD.md
│   │
│   ├── 360/                               ← PROJECT 2
│   │   ├── MODULE_OVERVIEW.md
│   │   │
│   │   ├── 01-survey-builder/
│   │   │   ├── MODULE.md
│   │   │   ├── survey-list.PRD.md
│   │   │   ├── create-survey-flow.PRD.md
│   │   │   ├── standard-assessment-library.PRD.md
│   │   │   ├── competency-framework.PRD.md
│   │   │   ├── question-bank.PRD.md
│   │   │   ├── rating-scale-config.PRD.md
│   │   │   ├── introductory-text.PRD.md
│   │   │   ├── display-configuration.PRD.md
│   │   │   ├── display-labels.PRD.md
│   │   │   └── survey-preview.PRD.md
│   │   │
│   │   ├── 02-participants-raters/
│   │   │   ├── MODULE.md
│   │   │   ├── subject-list.PRD.md
│   │   │   ├── add-subjects.PRD.md
│   │   │   ├── rater-assignment.PRD.md
│   │   │   ├── rater-nomination-workflow.PRD.md
│   │   │   ├── rater-status-tracker.PRD.md
│   │   │   ├── automated-reminders.PRD.md
│   │   │   └── external-rater-invite.PRD.md
│   │   │
│   │   ├── 03-deployment/
│   │   │   ├── MODULE.md
│   │   │   ├── deployment-configuration.PRD.md
│   │   │   ├── email-invitation-builder.PRD.md
│   │   │   ├── deployment-launch.PRD.md
│   │   │   ├── progress-tracking.PRD.md
│   │   │   └── manual-invite-resend.PRD.md
│   │   │
│   │   ├── 04-analytics-reports/
│   │   │   ├── MODULE.md
│   │   │   ├── individual-report.PRD.md
│   │   │   ├── gap-analysis.PRD.md
│   │   │   ├── priority-model.PRD.md
│   │   │   ├── open-text-report.PRD.md
│   │   │   ├── comparative-view.PRD.md
│   │   │   ├── survey-comparison.PRD.md
│   │   │   ├── presentation-text-config.PRD.md
│   │   │   ├── branded-pdf-export.PRD.md
│   │   │   └── ppt-export.PRD.md
│   │   │
│   │   ├── 05-admin-dashboard/
│   │   │   ├── MODULE.md
│   │   │   ├── program-list.PRD.md
│   │   │   ├── program-health-overview.PRD.md
│   │   │   ├── permissions-management.PRD.md
│   │   │   └── folder-management.PRD.md
│   │   │
│   │   └── 06-settings/
│   │       ├── MODULE.md
│   │       ├── category-header-config.PRD.md
│   │       ├── anonymity-settings.PRD.md
│   │       ├── branding-config.PRD.md
│   │       └── consultancy-partner-mode.PRD.md
│   │
│   └── empower/                           ← PROJECT 3
│       ├── MODULE_OVERVIEW.md
│       │
│       ├── 01-home-dashboard/
│       │   ├── MODULE.md
│       │   ├── home-view.PRD.md
│       │   ├── my-tasks-panel.PRD.md
│       │   ├── notifications.PRD.md
│       │   └── quick-action-bar.PRD.md
│       │
│       ├── 02-initiatives/
│       │   ├── MODULE.md
│       │   ├── initiative-list.PRD.md
│       │   ├── create-initiative.PRD.md
│       │   ├── initiative-detail.PRD.md
│       │   ├── edit-initiative.PRD.md
│       │   ├── initiative-status.PRD.md
│       │   ├── upstream-downstream.PRD.md
│       │   └── initiative-search-filter.PRD.md
│       │
│       ├── 03-tasks/
│       │   ├── MODULE.md
│       │   ├── task-list.PRD.md
│       │   ├── create-task.PRD.md
│       │   ├── task-detail.PRD.md
│       │   ├── task-status.PRD.md
│       │   ├── task-assignment.PRD.md
│       │   └── my-tasks-global.PRD.md
│       │
│       ├── 04-notes/
│       │   ├── MODULE.md
│       │   ├── notes-panel.PRD.md
│       │   ├── add-note.PRD.md
│       │   └── notes-history.PRD.md
│       │
│       ├── 05-ideation/
│       │   ├── MODULE.md
│       │   ├── ideation-home.PRD.md
│       │   ├── submit-idea.PRD.md
│       │   ├── idea-list-voting.PRD.md
│       │   ├── ideation-insights.PRD.md
│       │   ├── promote-idea.PRD.md
│       │   └── ai-content-moderation.PRD.md
│       │
│       ├── 06-conversations/
│       │   ├── MODULE.md
│       │   ├── conversations-list.PRD.md
│       │   ├── conversation-thread.PRD.md
│       │   ├── start-conversation.PRD.md
│       │   └── ai-moderation-flag.PRD.md
│       │
│       ├── 07-analytics/
│       │   ├── MODULE.md
│       │   ├── analytics-dashboard.PRD.md
│       │   ├── initiative-progress-chart.PRD.md
│       │   ├── owner-performance.PRD.md
│       │   ├── survey-linkage-report.PRD.md
│       │   └── export.PRD.md
│       │
│       └── 08-admin-settings/
│           ├── MODULE.md
│           ├── empower-settings.PRD.md
│           ├── admin-panel.PRD.md
│           ├── goal-management.PRD.md
│           └── integrations-config.PRD.md
│
├── src/                                   ← All application code (mirrors docs structure)
│   ├── app/                               ← Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx                       ← Root redirect to /lifecycle
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── lifecycle/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── surveys/
│   │   │   ├── rules/
│   │   │   ├── roster/
│   │   │   ├── distribution/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── 360/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── surveys/
│   │   │   ├── participants/
│   │   │   ├── deployment/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   └── empower/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── initiatives/
│   │       ├── tasks/
│   │       ├── ideation/
│   │       ├── conversations/
│   │       ├── analytics/
│   │       └── settings/
│   │
│   ├── components/
│   │   ├── ui/                            ← Design system primitives (Phase 0)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   │
│   │   ├── shared/                        ← Shared layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── AppShell.tsx
│   │   │
│   │   └── modules/                       ← Feature-specific components
│   │       ├── lifecycle/
│   │       ├── 360/
│   │       └── empower/
│   │
│   ├── data/
│   │   └── mock/
│   │       ├── employees.ts
│   │       ├── surveys.ts
│   │       ├── lifecycleRules.ts
│   │       ├── initiatives.ts
│   │       └── raters.ts
│   │
│   ├── lib/
│   │   └── mockDb.ts
│   │
│   └── types/
│       └── index.ts
│
├── public/
│   └── assets/
│       └── qp-logo.svg
│
├── docs-central-prd.md                    ← Your existing central PRD (keep as-is, will be superseded by /docs tree)
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── package.json
```

---

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| PRD files | `kebab-case.PRD.md` | `create-initiative.PRD.md` |
| Module overview files | `MODULE.md` (uppercase) | `MODULE.md` |
| Component files | `PascalCase.tsx` | `InitiativeList.tsx` |
| Page files | `page.tsx` (Next.js convention) | `page.tsx` |
| Mock data files | `camelCase.ts` | `employees.ts` |
| Types | `PascalCase` interfaces | `Employee`, `LifecycleRule` |
| Routes | `kebab-case` | `/lifecycle/rules`, `/empower/initiatives` |

---

## How Cursor Uses This Structure

Before building any component, Cursor should be instructed to:
1. Read the relevant `MODULE.md` — understand the module's purpose and scope
2. Read the specific `feature.PRD.md` — understand exactly what to build
3. Read `docs/_shared/DESIGN_SYSTEM.md` — apply correct tokens and components
4. Read `docs/_shared/DATA_MODELS.md` — use correct TypeScript types

This means every Cursor prompt will start with:
```
Read the following files before writing any code:
- docs/_shared/DESIGN_SYSTEM.md
- docs/_shared/DATA_MODELS.md
- docs/[project]/[module]/MODULE.md
- docs/[project]/[module]/[feature].PRD.md
Then build: [specific task]
```