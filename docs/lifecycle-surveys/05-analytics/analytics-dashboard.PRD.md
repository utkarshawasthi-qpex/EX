# PRD: Analytics Dashboard

Module: Lifecycle Surveys — Analytics
Route: `/lifecycle/analytics`

## Problem this solves
HR Admins need a dashboard landing page that mirrors the real QuestionPro analytics area, lists existing dashboards, and lets users open or create dashboard canvases.

## Mock Data
Add dashboard analytics types to `src/types/index.ts`:

- `DashboardAccess`
- `WidgetType`
- `DashboardWidget`
- `DashboardTab`
- `Dashboard`

Create `src/data/mock/dashboards.ts` exporting `mockDashboards` with four real-product-style dashboards:

1. `New dashboard`
2. `New test`
3. `test`
4. `PPT Export`

Add `getDashboards()` and `getDashboardById(id)` to `src/lib/mockDb.ts`.

## Dashboards List Page
Create `src/app/lifecycle/analytics/page.tsx` as a client component.

Layout:

- Analytics portal shell provides left sidebar navigation
- Main content area with page title and `+ New dashboard`

Table columns:

- Checkbox bulk select
- Dashboard name as blue clickable link; home dashboard has home icon
- Author email
- Access inline `WuSelect` with Private / Custom / Global; custom access shows pencil icon
- Created On formatted like `Jun, 12 2026`
- Delete icon column

Interactions:

- Dashboard name navigates to `/lifecycle/analytics/[id]`
- Access select updates local dashboard state
- New dashboard opens create dashboard modal
- Empty state offers create dashboard CTA

## Acceptance Check

- `/lifecycle/analytics` shows four dashboards
- Dashboard names navigate to canvas pages
- Access can be changed locally
- Create Dashboard modal can add a dashboard and navigate to it
- `npx tsc --noEmit` passes
