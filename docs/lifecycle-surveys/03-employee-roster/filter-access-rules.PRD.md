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

- **Employee group** — A named people definition on Employees → Employee Filters (conditions such as “HR employees”).
- **Filter access rule** — A named permission that maps employee groups to allowed dashboard filters.
- **Applies to** — One row inside a rule: pick an employee group, then pick allowed filters.
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

### When employee groups exist

- Primary action: `+ Add rule`
- No Import action
- Table columns:
  - `#`
  - `Rule name` (sortable; click opens Edit rule)
  - `Applies to` (employee group name → allowed filter labels)
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
- Section: `Applies to`
- `+ Add people` appends another row
- Footer: `Cancel`, `Save`

Each Applies to card:

- No numbered heading — the card has two fields
- `Employee group` — single select of names from Employee Filters
- After an employee group is chosen: `Allowed filters` multi-select
- Remove — only when more than one row exists (`Remove people`)

### Validation

- `Rule name is required` (under Rule name)
- `Select an employee group` (under Employee group)
- `Select at least one allowed filter` (under Allowed filters)

Success toasts: `Filter access rule added` / `Filter access rule updated`. Delete confirms, then `Filter access rule` deleted.

## Allowed filters

- `department` — Department
- `location` — Location
- `level` — Level
- `tenure` — Tenure

These are the only fields a rule can grant. They map 1:1 to dashboard and tab filter fields.

## Matching

1. Take the signed-in employee from the roster.
2. For each Applies to row, evaluate the **current** employee group (not a stale snapshot if the group was edited later).
3. Collect every matching row across every rule.
4. Union their allowed filter IDs.
5. If the union is empty (nobody matched): show every dashboard filter.
6. HR Admin who is not impersonating: unrestricted (all filters).

Applies to dashboard-level and tab-level filters on in-app dashboards the user owns or that were shared with them. Does not apply to public anonymous share-link viewers.

## Deleting an employee group

Delete is blocked while the group is on any Filter access rule.

- Modal title: `Can't delete employee group`
- Body lists the rule names that use the group
- CTA: `Go to Filter access rules` — switches to Portal → Permissions
- After the group is removed from every rule, delete works as today (`Delete filter?` / removed from the Apply New dropdown)
- A missing employee group (already-orphaned data) matches nobody and shows as `Missing employee group` on the rule row

## Prototype implementation

- UI: `src/components/employees/PortalPermissionsPage.tsx`, `src/components/employees/AccessRuleModal.tsx`
- Matching: `src/lib/portalAccess.ts` (`getAccessibleFilterIds`, `getVisibleDashboardFilterFields`)
- Mock types: `src/data/mock-portal-settings.ts`
- Persistence: portal settings and roster employee groups in localStorage (prototype only)
- The catalog page is still labeled `Employee Filters`; rule UI says `employee group`

## Acceptance checklist

- With no saved Employee Filters, Filter access rules shows the empty state and does not show `+ Add rule`.
- `Go to Employee Filters` opens Employees → Employee Filters.
- After at least one employee group exists, `+ Add rule` opens Applies to with an employee group picker.
- Saving a rule requires a name, an employee group per row, and at least one allowed filter per row.
- A matching viewer only sees granted filters on dashboards they create or that are shared with them.
- An unmatched viewer still sees all filters.
- HR Admin (not impersonating) still sees all filters.
- Rule row edit and delete work. Changing an employee group on Employee Filters updates matching.
- There is no Import action on Filter access rules.
- Public share-link filter UI is unchanged.
- Deleting an employee group used by a Filter access rule is blocked and lists those rule names.
