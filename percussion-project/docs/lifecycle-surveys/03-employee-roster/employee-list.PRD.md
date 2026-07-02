# PRD: Employee Roster

Module: Lifecycle Surveys — Employee Roster
Route: `/lifecycle/roster`

## Problem this solves
HR Admins need a central place to manage employee data, search employee records, segment by department/status/location, and add or import employee records for lifecycle survey targeting.

## Page Header

- Title: `Employee Roster`
- Subtitle: `Manage your employee data and segments`
- Actions:
  - `Import Employees` secondary button
  - `Add Employee` primary button

## Filters

- Search input filters by employee full name or email in real time
- Department filter with `All` plus unique departments from mock employees
- Status filter: All, Active, Inactive, On Leave, Terminated
- Location filter with `All` plus unique locations from mock employees

## Employee Table

Use `WuDataTable` with:

- Checkbox bulk select
- Employee avatar initials, full name, and email
- Department
- Location
- Job Title
- Hire Date formatted `MMM d, yyyy`
- Status chip:
  - active = success
  - inactive = neutral/secondary
  - on_leave = warning
  - terminated = danger
- Actions menu:
  - View Profile
  - Edit
  - Deactivate
  - Remove

Pagination uses `WuPagination` with page size 10.

## Add Employee Modal

Create `src/components/modules/lifecycle/AddEmployeeModal.tsx`.

Fields:

- First Name, required
- Last Name, required
- Email, required
- Department, required
- Location, required
- Job Title, required
- Hire Date, required
- Manager, optional
- Status, required

On save:

- Validate required fields
- Add employee to local state
- Show success toast
- Close modal

## Import Employees Modal

Create `src/components/modules/lifecycle/ImportEmployeesModal.tsx`.

Shows:

- Drag and drop area: `Drop CSV or Excel file here`
- Download template link, console placeholder
- Cancel and Upload buttons

## Profile Route Placeholder

Create `/lifecycle/roster/[id]` placeholder route so employee names can link to profiles.

## Acceptance Check

- `/lifecycle/roster` loads with 25 employees
- Search, department, status, and location filters work
- Add employee modal validates and adds a record
- Import modal opens with drag/drop placeholder
- Status chips display correct visual states
- Employee names link to `/lifecycle/roster/[id]`
- `npx tsc --noEmit` passes
