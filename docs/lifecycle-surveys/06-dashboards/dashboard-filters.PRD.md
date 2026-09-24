# PRD: Allowed filters per dashboard

Module: Lifecycle Surveys — Dashboards
Routes: Create dashboard on `/lifecycle/analytics`; dashboard canvas `/lifecycle/analytics/[id]`; shared link `/share/[slug]`
Primary user: Dashboard owner (HR Admin)

## Problem this solves

Every dashboard shows the same filter menu: Department, Location, Level, and Tenure. A location report does not need Level and Tenure, and a leadership view should not invite filters the author never intended. The owner needs to decide, on that dashboard, which filters viewers can use.

This is a property of the dashboard, not of the person viewing it. Everyone who opens the dashboard sees the same filter menu.

## Goals

- Let the owner choose which filter dimensions appear on a dashboard.
- Default to all four dimensions so existing dashboards and a normal create do not change.
- Apply the same menu to dashboard filters, tab filters, and shared links for that dashboard.
- Drop any active filter whose dimension is no longer allowed.

## Non-goals

- Portal Filter access rules. Those limit filters by who the viewer is. Analytics does not apply them in this pass.
- Different filter menus for different viewers of the same dashboard.
- Per-share-link filter menus. A shared link uses the dashboard’s allowed filters.
- Adding new filter dimensions beyond Department, Location, Level, and Tenure.
- Changing which employees’ results a viewer can see. That remains Data access rules.

## Terminology

- **Allowed filters** — The dimensions viewers may use on this dashboard.
- **Filter dimension** — One of Department, Location, Level, Tenure.
- **Dashboard filters** — Filters applied across the dashboard.
- **Tab filters** — Filters applied on the active tab. They use the same allowed dimensions.
- **Data access rule** — Controls which employees’ results a user can see. Separate from allowed filters.

## Dimensions

| Dimension | Values |
|---|---|
| Department | Engineering, HR, Sales, Marketing, Product, Finance, Operations |
| Location | Mumbai, Bangalore, Delhi, Remote, US |
| Level | IC, Manager, Senior Manager, Director, VP, C-Suite |
| Tenure | <1 year, 1–3 years, 3–5 years, >5 years |

## Where it lives

```text
Create dashboard          Allowed filters (collapsed)
        ↓
Dashboard canvas          filter menu shows only allowed dimensions
        ↓
Share                     owner opens Allowed filters… to change them
        ↓
Shared link               same dimensions, when the link allows filters
```

## Create dashboard

Section title: `Allowed filters`

Collapsed by default. Collapsed copy:

- All four selected: `All filter dimensions are available by default.`
- A subset selected: `Custom selection configured.` with badge `Custom`

Actions: `Configure` to expand, `Hide` to collapse.

Expanded helper: `Uncheck any filters to hide them from the filter menu on this dashboard.`

Checkboxes, two columns: Department, Location, Level, Tenure. All four start checked.

Save rules:

- Section left collapsed: dashboard has no custom scope. Viewers get all four dimensions.
- Section expanded and all four checked: same as no custom scope.
- Section expanded and a subset checked: only those dimensions are allowed.
- Section expanded and none checked: block create. Error: `Select at least one filter dimension.`

Primary create fields stay dashboard name and Global dashboard. Allowed filters is optional configuration.

## Edit allowed filters

Who: the dashboard owner only.

Where: Share modal, below the link list. Link label: `Allowed filters…`

Opening it closes Share and opens a modal.

Modal title: `Allowed filters`

Helper: `Choose which filters viewers can use on this dashboard.`

Same four checkboxes. Footer: `Cancel`, `Save`.

Save with none checked: `Select at least one filter dimension.`

Save with all four checked: clear the custom scope so the dashboard behaves as the default.

Save with a subset: persist those ids. Toast: `Allowed filters updated`.

## Viewing a dashboard

The filter button opens a menu that lists only the allowed dimensions. Dashboard filters and tab filters share that list.

Sections are collapsed until a dimension has an active value.

If a saved filter uses a dimension that is no longer allowed, that filter is removed. If no dimensions are allowed, the filter button is hidden.

Dashboards with no saved scope, including dashboards created before this feature, show all four dimensions.

Example: `New test` allows Location only. Its filter menu shows Location and nothing else.

## Shared links

A shared link does not have its own dimension list. It uses the dashboard’s allowed filters.

The filter control on the share page appears only when the link allows dynamic dashboard filters and the dashboard still has at least one allowed dimension.

## What this does not change

- Filter access rules on Portal → Permissions stay in the product, but they do not change the analytics filter menu.
- Data access rules still limit whose results appear.
- Applying a filter still slices widget data and still respects anonymity thresholds.
