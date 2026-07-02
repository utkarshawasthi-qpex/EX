# PRD: Survey List Page

Module: Lifecycle Surveys — Survey Creation
Route: /lifecycle/surveys

## Problem this solves
HR Admins need a single place to see all lifecycle surveys, their status, response rates, and take action on them.

## Primary persona
HR Admin

## What to build — src/app/lifecycle/surveys/page.tsx

### Page Header
- Title: "Surveys" (WuTypography variant h1)
- Subtitle: "Manage your lifecycle survey instruments"
- Primary action button: "Create Survey" (WuButton variant primary)
  clicking it does nothing yet (console.log placeholder)

### Filters bar (below header)
- Search input (WuInput) — filters survey list by title in real time
- Status filter (WuSelect) — options: All, Active, Draft, Paused, Closed, Archived. Filters list in real time.

### Survey list (WuDataTable)
Columns:
- Name: survey title, clickable (console.log for now)
- Type: WuChip showing survey type (onboarding=info, exit=danger, pulse=neutral, engagement=success, lifecycle=info)
- Status: WuChip with correct variant per DESIGN_SYSTEM.md
- Responses: responseCount formatted as number
- Response Rate: responseRate formatted as "XX%" with a simple progress indicator
- Last Updated: updatedAt formatted as "MMM d, yyyy" using date-fns
- Actions: three-dot menu (WuMenu) with options: Edit, Duplicate, Archive — all console.log for now

Data: import getSurveys from @/lib/mockDb
Apply search and status filters to the data before passing to table.

## States
- Loading: WuLoader centered in content area
- Empty (no surveys match filter): WuTypography showing "No surveys found" with a clear filters suggestion
- Populated: WuDataTable with pagination (pageSize: 10)

'use client' directive required.
Export as default export (Next.js page requirement).

## Acceptance check
- Page loads at /lifecycle/surveys without errors
- All 6 mock surveys appear in the table
- Search filter works in real time
- Status filter works in real time
- All three states render correctly
- run npx tsc --noEmit — zero errors
