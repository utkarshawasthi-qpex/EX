# Action planning (Employee Experience portal)

Action planning lives **only** in the analytics portal under `/lifecycle/analytics/action-plans`. There is no separate Empower product.

## Competitive analysis coverage (v1 prototype)

| Pattern | Status |
|---------|--------|
| Initiative → tasks hierarchy | Done |
| Focus anchor (marker / block / category / question) | Done |
| Task-based plan completion | Done (`computeActionPlanProgress`) |
| Required task due dates | Done |
| Status: active / completed / closed / cancelled | Done |
| Guided create (3-step) from dashboard **Take action** | Done (scorecard &lt;75% favorable; driver **Priority focus**) |
| Guided create from Summary recommendations | Done (`CreateActionPlanModal`) |
| Suggestion library (Qualtrics-style seed) | Done (`actionSuggestions.ts`) |
| AI/heuristic task suggestions on create | Done (`CreateInitiativeModal` step 3) |
| Nudges + weekly cap + auto-unsubscribe | Done (`PortalNudgeCenter`, Glint-style) |
| Post-close Action Feedback (Culture Amp) | Done (optional on complete/close) |
| Three-tier collaboration | Done (Collaborators tab) |
| Admin adoption funnel | Done (Portal Admin) |
| Similar focus clusters (Glint overview) | Done (Admin section) |
| Employee team suggestions (Peakon) | Deferred v1.5 |
| Admin guidance editor per question | Deferred v2 (seed file only) |
| Jira / Teams delivery | Out of scope |

## Routes

| Route | Purpose |
|-------|---------|
| `/lifecycle/analytics/action-plans` | Overview |
| `/lifecycle/analytics/action-plans/list` | Full list |
| `/lifecycle/analytics/action-plans/[id]` | Detail |
| `/lifecycle/analytics/action-plans/my-tasks` | Assignee inbox |
| `/lifecycle/analytics/action-plans/analytics` | Goals & contributors |

## Entry points

- Portal sidebar: **Action planning** (home + open tasks on same page)
- Dashboard scorecard / driver analysis: **Take action** (skips Source step; context from current dashboard)
- Summary widget: **Create action plan** (data-focused guided flow)
- **+ New initiative** on Action planning home: **Custom** or **Use template** only (no AI wizard)
- **AI-assisted create**: **AI Summary** widget (2-step: initiative details → tasks) and dashboard **Take action** (2-step)
- Header: **Nudges** (bell)

## Source step (manager-led create)

| Entry | Source step? | What is stored on `dataFocus` |
|-------|----------------|-------------------------------|
| Widget **Take action** | No | Dashboard name + focus label + favorability |
| **AI Summary → new action plan** | No (focus from recommendation) | Summary / survey snapshot on `dataFocus` |
| **+ New initiative → Custom** | No | `null` (Source column shows —); tasks added on detail page |
| **+ New initiative → Use template** | No | `null`; initiative created with template tasks |

Focus topics after dashboard selection: weak **scorecard** markers (&lt;75% favorable) and **driver** priority-focus metrics first, then lowest EX survey categories as fallback (`dashboardFocusAreas.ts`).

## Data (prototype)

`src/lib/empowerIntegration/storage.ts`, `src/types/empowerIntegration.ts`, `src/lib/actionPlans/nudges.ts`, `src/lib/actionPlans/createSources.ts`
