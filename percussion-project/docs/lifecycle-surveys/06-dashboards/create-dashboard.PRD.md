# PRD: Create Dashboard

Module: Lifecycle Surveys — Dashboards
Route: `Create dashboard` modal from `/lifecycle/analytics`

## Problem this solves
HR Admins need a quick way to create a dashboard shell and open it immediately for widget configuration.

## Modal
Simple WickUI modal containing:

- `WuInput`: Dashboard name, required
- `WuSelect`: Access level, Private / Custom / Global
- Footer: Cancel and Create buttons

## Behavior

On create:

- Validate that Dashboard name is not empty
- Add dashboard to local dashboards state
- Navigate to `/lifecycle/analytics/[id]`

New dashboard shape:

- access from selection
- author email: `sarah.johnson@questionpro.com`
- createdAt current timestamp
- one empty tab named `Tab 1`

## Dashboard Canvas Shell
Create `src/app/lifecycle/analytics/[id]/page.tsx` as a client component.

Layout:

- Analytics portal shell provides icon sidebar
- Main header with back arrow, dashboard name, hierarchy based rule link, help icon, add/filter/download icons
- Active filters row below header when filters are active
- Scrollable widget canvas
- Bottom tab bar with tab menu actions and add tab button

Canvas behavior:

- Empty tabs show centered empty state and Add widget CTA
- Populated tabs render placeholder widget cards with correct width
- Filter icon opens filter panel with Department multi-select, Apply, and Clear
- Add tab creates a new empty tab
- Tab menu supports rename, duplicate, delete

## Acceptance Check

- `/lifecycle/analytics/[id]` loads dashboard canvas
- Empty tab state renders
- Populated tab widget placeholders render full/half widths
- Filter chips show/hide from filter panel
- Add/rename/duplicate/delete tab interactions work locally
- `npx tsc --noEmit` passes
