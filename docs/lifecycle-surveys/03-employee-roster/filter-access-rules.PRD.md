# PRD: Filter Access Rules

Module: Lifecycle Surveys — Employee Roster / Portal Permissions
Route: `/lifecycle/roster` → Portal → Permissions
Primary user: HR Admin

## Problem this solves

By default every employee can use every dashboard and tab filter. Admins need to limit which filters a person can apply, without writing a separate rule per dashboard. The limit should follow the signed-in user onto every dashboard they create or that is shared with them.

## Goals

- Limit dashboard filters by who the viewer is, not by which dashboard they opened.
- Reuse named people groups already created on Employee Filters.
- Make Filter access rules unusable until at least one employee group exists, so admins are not stranded in an empty Add rule form.

## Non-goals

- Dashboard-specific filter rules
- Creating a new employee filter inside the Add rule modal
- Importing filter access rules
- Applying these rules to public anonymous share links

## Terminology

- **Employee group** — A saved filter on Employees → Employee Filters (named conditions such as “HR employees”).
- **Filter access rule** — A named permission that maps employee groups to allowed dashboard filters.
- **Filter group** — One row inside a rule: pick an employee group, then pick allowed filters.
- **Allowed filters** — The dashboard/tab filter fields that matching employees may use: Department, Location, Level, Tenure.
- **Data access rule** — A different card on the same page. It controls *which employees’ results* a user can see, not which filters they can use.

## Where it lives

- Configure: Manage Employee List → Portal → Permissions → Filter access rules.
- Prerequisite catalog: Employees → Employee Filters.
- Enforced on: dashboard filters and tab filters for dashboards the user creates or that are shared with them.

```text
Employees → Employee Filters     create named employee groups
        ↓
Portal → Permissions             add a filter access rule
        ↓
Dashboard / tab filters          matching users only see allowed filters
```

## Filter access rules list

Card title: `Filter access rules`

Help: `By default everyone can use every dashboard and tab filter. Add a rule to limit filters for matching employees on every dashboard they create or that is shared with them.`

### When saved employee groups exist

- Primary action: `+ Add rule`
- No Import action
- Table columns:
  - `#`
  - `Rule name` (sortable; click opens Edit rule)
  - `Filter groups` (saved filter name → allowed filter labels)
  - Actions: edit pencil, delete
- If there are groups but no rules yet: `No data to display. Learn more`

### Empty state (no employee groups)

Hide `+ Add rule`.

- Title: `No employee groups`
- Description: `To add an access rule for dashboard filters, create an employee group first.`
- CTA: `Go to Employee Filters` — switches to Employees → Employee Filters

## Add / Edit rule

Modal title: `Add rule` or `Edit rule`

- `Rule name` — required
- Section: `Filter groups`
- `+ Add filter group` appends another group
- Footer: `Cancel`, `Save`

Each filter group card:

- Heading: `Filter group 1`, `Filter group 2`, …
- `Saved filter` — single select of names from Employee Filters
- After a saved filter is chosen: `Allowed filters` multi-select
- Edit pencil — opens the Employee Filter editor for that saved filter (changes the shared employee group)
- Remove — only when more than one filter group exists

### Validation

- `Rule name is required`
- `Add at least one filter group`
- `Each filter group needs a saved filter`
- `Each filter group needs at least one allowed filter`
- `Select a saved filter first` if edit is clicked with no saved filter chosen

Success toasts: `Filter access rule added` / `Filter access rule updated`. Delete confirms, then `Filter access rule` deleted.

## Allowed filters

- `department` — Department
- `location` — Location
- `level` — Level
- `tenure` — Tenure

These are the only fields a rule can grant. They map 1:1 to dashboard and tab filter fields.

## Matching

1. Take the signed-in employee from the roster.
2. For each filter group, evaluate the **current** saved Employee Filter (not a stale snapshot if the filter was edited later).
3. Collect every matching filter group across every rule.
4. Union their allowed filter IDs.
5. If the union is empty (nobody matched): show every dashboard filter.
6. HR Admin who is not impersonating: unrestricted (all filters).

Applies to dashboard-level and tab-level filters on in-app dashboards the user owns or that were shared with them. Does not apply to public anonymous share-link viewers.

## Prototype implementation

- UI: `src/components/employees/PortalPermissionsPage.tsx`, `src/components/employees/AccessRuleModal.tsx`
- Matching: `src/lib/portalAccess.ts` (`getAccessibleFilterIds`, `getVisibleDashboardFilterFields`)
- Mock types: `src/data/mock-portal-settings.ts`
- Persistence: portal settings and roster saved filters in localStorage (prototype only)
- The catalog page is still labeled `Employee Filters`; empty-state copy says `employee groups`

## Acceptance checklist

- With no saved Employee Filters, Filter access rules shows the empty state and does not show `+ Add rule`.
- `Go to Employee Filters` opens Employees → Employee Filters.
- After at least one saved filter exists, `+ Add rule` opens Filter group 1 with a saved-filter picker.
- Saving a rule requires a name, a saved filter per group, and at least one allowed filter per group.
- A matching viewer only sees granted filters on dashboards they create or that are shared with them.
- An unmatched viewer still sees all filters.
- HR Admin (not impersonating) still sees all filters.
- Rule row edit and delete work. Filter group edit updates the shared Employee Filter.
- There is no Import action on Filter access rules.
- Public share-link filter UI is unchanged.
