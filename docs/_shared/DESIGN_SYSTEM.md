# Percussion Project — Design System
> Cursor must read this file before writing any component or page.
> This project uses **Wick UI** (`@npm-questionpro/wick-ui-lib`) — QuestionPro's official React design system.
> Never build custom UI primitives. Never use shadcn/ui, MUI, or any other component library.
> Always import from `@npm-questionpro/wick-ui-lib`.

---

## Setup (already done in Phase 0)

```tsx
// src/app/layout.tsx — import Wick UI styles globally
import '@npm-questionpro/wick-ui-lib/dist/style.css'
```

---

## Full Component Inventory

All available components from Wick UI:

| Import Name | Use For |
|---|---|
| `WuButton` | All buttons |
| `WuInput` | Text inputs |
| `WuModal`, `WuModalContent`, `WuModalHeader`, `WuModalFooter`, `WuModalClose` | Dialogs and modals |
| `WuDataTable` | Feature-rich data tables (sorting, pagination, selection) |
| `WuTable` | Simple tables |
| `WuSelect` | Dropdown selects |
| `WuChip` | Status badges, tags, chips |
| `WuHeading` | Heading text rendering |
| `WuText` | Body text rendering |
| `WuSidebar`, `WuSidebarContent`, `WuSidebarFooter`, `WuSidebarGroup`, `WuSidebarItem`, `WuSidebarMenu`, `WuSidebarTrigger`, `WuSidebarCollapsibleMenu` | Left navigation |
| `WuAccordion` (from `accordion`) | Expandable sections |
| `WuCard` (from `card`) | Card containers |
| `WuCheckbox` (from `checkbox`) | Checkboxes |
| `WuCombobox` (from `combobox`) | Searchable dropdowns |
| `WuDrawer` (from `drawer`) | Side panels / drawers |
| `WuLoader` (from `loader`) | Loading spinners |
| `WuPagination` (from `pagination`) | Pagination controls |
| `WuPopover` (from `popover`) | Popovers |
| `WuRadio` (from `radio`) | Radio buttons |
| `WuTab` (from `tab`) | Tab navigation |
| `WuTextarea` (from `textarea`) | Multi-line text input |
| `WuToast` (from `toast`) | Toast notifications |
| `WuToggle` (from `toggle`) | Toggle switches |
| `WuTooltip` (from `tooltip`) | Tooltips |
| `WuStepper` (from `stepper`) | Multi-step flows |
| `WuCalendar` (from `calendar`) | Date picker |
| `WuTimePicker` (from `timePicker`) | Time picker |
| `WuMonthPicker` (from `monthPicker`) | Month picker |
| `WuAppHeader` (from `appHeader`) | Top header bar |
| `WuNavbar` (from `navbar`) | Navigation bar |
| `WuFooter` (from `footer`) | Footer |
| `WuFormGroup` (from `formGroup`) | Form field wrapper with label |
| `WuScrollArea` (from `scrollArea`) | Scrollable containers |
| `WuSpotlight` (from `spotlight`) | Search spotlight / command palette |
| `WuSwitcher` (from `switcher`) | Toggle switcher |
| `WuStackedCard` (from `stackedCard`) | Stacked card layouts |
| `WuActivityLog` (from `activityLog`) | Activity/audit log display |
| `WuCopyToClipboard` (from `copyToClipboard`) | Copy to clipboard button |
| `WuHelpButton` (from `helpButton`) | Help/info button |
| `WuVirtualScroll` (from `virtualScroll`) | Virtualized lists |
| `WuSurveySelect` (from `surveySelect`) | Survey-specific select |
| `WuDrilldown` (from `drilldown`) | Drilldown navigation |
| `WuListbox` (from `listbox`) | Listbox input |
| `WuMenuIcon` (from `menuIcon`) | Menu icon button |
| `WuMenu` (from `menu`) | Dropdown menu |
| `CHART_COLOR_SYSTEM` | Chart color tokens |

---

## Import Pattern

Always import from the top-level package:

```tsx
import {
  WuButton,
  WuInput,
  WuModal,
  WuModalContent,
  WuModalHeader,
  WuModalFooter,
  WuModalClose,
  WuChip,
  WuSelect,
  WuDataTable,
  WuHeading,
  WuText,
  WuSidebar,
  WuSidebarContent,
  WuSidebarGroup,
  WuSidebarItem,
  WuSidebarMenu,
} from '@npm-questionpro/wick-ui-lib'

// Icons from separate package
import { SomeIcon } from '@npm-questionpro/wick-ui-icon'
```

---

## Component Usage Reference

### WuButton
```tsx
import { WuButton } from '@npm-questionpro/wick-ui-lib'

<WuButton variant="primary" onClick={handler}>Create Initiative</WuButton>
<WuButton variant="secondary">Cancel</WuButton>
<WuButton variant="ghost">View Details</WuButton>
<WuButton variant="destructive">Delete</WuButton>
<WuButton variant="primary" disabled>Disabled</WuButton>
<WuButton variant="primary" size="sm">Small</WuButton>
<WuButton variant="primary" size="lg">Large</WuButton>
```

### WuInput
```tsx
import { WuInput } from '@npm-questionpro/wick-ui-lib'

<WuInput placeholder="Search employees..." />
<WuInput type="email" placeholder="name@company.com" />
<WuInput type="password" placeholder="Password" />
<WuInput disabled placeholder="Disabled" />
```

### WuFormGroup
Wrap every input with WuFormGroup to get label + helper text + error state:
```tsx
import { WuFormGroup, WuInput } from '@npm-questionpro/wick-ui-lib'

<WuFormGroup label="Email Address" required error="This field is required">
  <WuInput type="email" placeholder="name@company.com" />
</WuFormGroup>

<WuFormGroup label="Department" helperText="Select the employee's department">
  <WuSelect options={deptOptions} />
</WuFormGroup>
```

### WuSelect
```tsx
import { WuSelect } from '@npm-questionpro/wick-ui-lib'

type DepartmentOption = {
  value: string
  label: string
}

const options: DepartmentOption[] = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product' },
]

<WuSelect
  data={options}
  accessorKey={{ value: 'value', label: 'label' }}
  placeholder="Select department"
  value={selectedValue}
  onSelect={(value: unknown) => {
    const selected = value as DepartmentOption
    setSelectedValue(selected)
  }}
/>
```

### WuChip
Used for all status badges, tags, and labels:
```tsx
import { WuChip } from '@npm-questionpro/wick-ui-lib'

<WuChip variant="primary" color="success">Active</WuChip>
<WuChip variant="primary" color="warning">Paused</WuChip>
<WuChip variant="primary" color="danger">Overdue</WuChip>
<WuChip variant="primary">In Progress</WuChip>
<WuChip variant="secondary">Draft</WuChip>
<WuChip variant="secondary">Archived</WuChip>
```

Status → variant mapping for this project:
| Status | WuChip variant | WuChip color |
|---|---|---|
| Active / Live | `primary` | `success` |
| Completed | `primary` | `success` |
| In Progress | `primary` | — |
| Draft | `secondary` | — |
| Paused | `primary` | `warning` |
| Overdue | `primary` | `danger` |
| Archived | `secondary` | — |

### WuModal
```tsx
import {
  WuModal,
  WuModalContent,
  WuModalHeader,
  WuModalFooter,
  WuModalClose,
  WuButton
} from '@npm-questionpro/wick-ui-lib'

<WuModal open={isOpen} onOpenChange={setIsOpen}>
  <WuModalContent size="md">
    <WuModalHeader title="Create Initiative" />
    <div className="p-6">
      {/* form content */}
    </div>
    <WuModalFooter>
      <WuModalClose asChild>
        <WuButton variant="secondary">Cancel</WuButton>
      </WuModalClose>
      <WuButton variant="primary" onClick={handleSave}>Save</WuButton>
    </WuModalFooter>
  </WuModalContent>
</WuModal>
```

### WuDataTable
Use for all feature-rich tables (sortable, paginated, selectable rows):
```tsx
import { WuDataTable } from '@npm-questionpro/wick-ui-lib'
import type { IWuDataTableProps, IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'

const columns: IWuTableColumnDef<Initiative>[] = [
  { accessorKey: 'title', header: 'Initiative' },
  { accessorKey: 'status', header: 'Status',
    cell: ({ row }) => <WuChip variant="primary">{row.original.status}</WuChip>
  },
  { accessorKey: 'ownerId', header: 'Owner' },
  { accessorKey: 'dueDate', header: 'Due Date' },
]

<WuDataTable
  columns={columns}
  data={initiatives}
  pagination={{ pageSize: 20 }}
/>
```

### WuHeading / WuText
Use for all text rendering — never use raw `<p>`, `<h1>`, `<span>` for content text:
```tsx
import { WuHeading, WuText } from '@npm-questionpro/wick-ui-lib'

<WuHeading size="xl">Page Title</WuHeading>
<WuHeading size="lg">Section Heading</WuHeading>
<WuHeading size="md">Subsection</WuHeading>
<WuText size="lg">Body text</WuText>
<WuText size="md">Secondary body text</WuText>
<WuText size="sm">Caption / label</WuText>
```

### WuSidebar (Navigation)
```tsx
import {
  WuSidebar,
  WuSidebarContent,
  WuSidebarGroup,
  WuSidebarItem,
  WuSidebarMenu,
  WuSidebarTrigger,
  WuSidebarCollapsibleMenu,
} from '@npm-questionpro/wick-ui-lib'

<WuSidebar>
  <WuSidebarContent>
    <WuSidebarGroup>
      <WuSidebarMenu>
        <WuSidebarItem href="/lifecycle" active={pathname.startsWith('/lifecycle')}>
          Lifecycle Surveys
        </WuSidebarItem>
        <WuSidebarItem href="/360" active={pathname.startsWith('/360')}>
          360 Feedback
        </WuSidebarItem>
        <WuSidebarItem href="/empower" active={pathname.startsWith('/empower')}>
          Empower
        </WuSidebarItem>
      </WuSidebarMenu>
    </WuSidebarGroup>
  </WuSidebarContent>
</WuSidebar>
```

### WuTab
```tsx
import { WuTab } from '@npm-questionpro/wick-ui-lib'

<WuTab
  tabs={[
    { id: 'overview', label: 'Overview', content: <OverviewPanel /> },
    { id: 'tasks', label: 'Tasks', content: <TasksPanel /> },
    { id: 'notes', label: 'Notes', content: <NotesPanel /> },
  ]}
  defaultValue="overview"
/>
```

### WuToast
```tsx
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'

const { showToast } = useWuShowToast()

showToast({ message: 'Survey created successfully.', variant: 'success' })
showToast({ message: 'Something went wrong.', variant: 'error' })
```

`WuToast` requires a host mounted once at the app root. The toast host is already mounted in `AppShell.tsx` — do not mount it again in feature components. Just call `useWuShowToast()` directly wherever a toast is needed.

### WuLoader
```tsx
import { WuLoader } from '@npm-questionpro/wick-ui-lib'

// Full page loading
<WuLoader size="lg" />

// Inline loading
<WuLoader size="sm" />
```

### WuStepper
`WuStepper` is a numeric step indicator, not a full multi-step navigation component with content slots. Use it for the visual step indicator, then manually render the current step's content based on local state.

`WuStepper` renders as a numeric increment control, NOT a breadcrumb/progress indicator — do not use it for multi-step modal flows. Use a custom breadcrumb pattern instead (see `CreateSurveyModal.tsx` for reference implementation). For multi-step modals, place the breadcrumb in the modal footer bar. Keep Back as a secondary button beside the primary action button on the right. If a step has a title and search/filter control above a scrollable list, keep that title/search block sticky so only the list content scrolls.
```tsx
import { WuStepper } from '@npm-questionpro/wick-ui-lib'

const [step, setStep] = useState(1)

<WuStepper min={1} max={2} step={1} value={step} readonly onChange={setStep} />

{step === 1 ? <ChooseMethodStep /> : <NameSurveyStep />}
```

### WuPagination
```tsx
import { WuPagination } from '@npm-questionpro/wick-ui-lib'

<WuPagination
  total={totalItems}
  pageSize={20}
  currentPage={page}
  onChange={setPage}
/>
```

### WuTextarea
```tsx
import { WuTextarea } from '@npm-questionpro/wick-ui-lib'

<WuFormGroup label="Description">
  <WuTextarea placeholder="Describe the initiative..." rows={4} />
</WuFormGroup>
```

### WuToggle
```tsx
import { WuToggle } from '@npm-questionpro/wick-ui-lib'

<WuToggle
  checked={isEnabled}
  onChange={setIsEnabled}
  label="Enable SMS distribution"
/>
```

### WuCheckbox
```tsx
import { WuCheckbox } from '@npm-questionpro/wick-ui-lib'

<WuCheckbox
  checked={isSelected}
  onChange={setIsSelected}
  label="Send reminder on Day 3"
/>
```

### WuTooltip
```tsx
import { WuTooltip } from '@npm-questionpro/wick-ui-lib'

<WuTooltip content="Response rate is calculated based on sent invitations">
  <InfoIcon className="w-4 h-4 text-gray-400" />
</WuTooltip>
```

### WuDrawer
Use for side panels (filters, detail views):
```tsx
import { WuDrawer } from '@npm-questionpro/wick-ui-lib'

<WuDrawer open={isOpen} onOpenChange={setIsOpen} title="Filter Employees" side="right">
  {/* filter form content */}
</WuDrawer>
```

### WuAccordion
```tsx
import { WuAccordion } from '@npm-questionpro/wick-ui-lib'

<WuAccordion
  items={[
    { id: 'section1', title: 'Competency 1', content: <QuestionList /> },
    { id: 'section2', title: 'Competency 2', content: <QuestionList /> },
  ]}
/>
```

### WuCalendar / WuTimePicker / WuMonthPicker
```tsx
import { WuCalendar, WuTimePicker, WuMonthPicker } from '@npm-questionpro/wick-ui-lib'

<WuCalendar selected={date} onSelect={setDate} />
<WuTimePicker value={time} onChange={setTime} />
<WuMonthPicker value={month} onChange={setMonth} />
```

### WuActivityLog
Use for initiative activity log, rule audit log, employee lifecycle event log:
```tsx
import { WuActivityLog } from '@npm-questionpro/wick-ui-lib'

<WuActivityLog
  entries={[
    { id: '1', user: 'Sarah J.', action: 'Created initiative', timestamp: '2025-06-01T10:00:00Z' },
    { id: '2', user: 'Mark T.', action: 'Changed status to In Progress', timestamp: '2025-06-02T14:30:00Z' },
  ]}
/>
```

### WuSpotlight
Use for global search:
```tsx
import { WuSpotlight } from '@npm-questionpro/wick-ui-lib'

<WuSpotlight
  open={spotlightOpen}
  onOpenChange={setSpotlightOpen}
  items={searchableItems}
  onSelect={handleSelect}
/>
```

---

## Icons

Use `@npm-questionpro/wick-ui-icon` exclusively. Never use lucide-react or any other icon library.

`@npm-questionpro/wick-ui-icon` does not export React icon components. It ships CSS and font files. Import the icon stylesheet once globally in `src/app/layout.tsx`, then use icon class names directly in markup.

```tsx
import '@npm-questionpro/wick-ui-icon/dist/wu-icon.css'
```

Icon classes use the prefixes `wc-`, `wm-`, or `wp-`:
```tsx
<span className="wm-add-circle text-3xl" aria-hidden />
<i className="wc-analytics" aria-hidden />
```

Check `node_modules/@npm-questionpro/wick-ui-icon/dist/wu-icon.css` or the Wick UI Storybook for the full class list.

---

## Colors

Wick UI injects CSS variables via its stylesheet. Use these for any custom styling not covered by Wick UI components.

For charts and data visualizations, use `CHART_COLOR_SYSTEM`:
```tsx
import { CHART_COLOR_SYSTEM } from '@npm-questionpro/wick-ui-lib'

// CHART_COLOR_SYSTEM is an object: { [palette: string]: { [shade: string]: string } }
// Use for recharts, custom SVGs, or any visualization component
```

For Tailwind classes on layout and spacing, continue using Tailwind utilities directly.

---

## DO NOT

- ❌ Do not build custom Button, Input, Modal, Table, Select, Badge components
- ❌ Do not import from `@radix-ui/*` directly — Wick UI wraps these already
- ❌ Do not use `lucide-react` — use `@npm-questionpro/wick-ui-icon`
- ❌ Do not use shadcn/ui components
- ❌ Do not define color tokens manually — use Wick UI CSS variables

---

## Phase 0 Impact

Because Wick UI provides all primitives, the `/src/components/ui/` folder is no longer needed for custom-built components. Instead:

```
src/components/
  shared/          ← Sidebar.tsx, TopBar.tsx, AppShell.tsx (compose Wick UI components)
  modules/         ← Feature components (use Wick UI components internally)
```

Do not create individual primitive files (Button.tsx, Input.tsx, etc.) — import directly from Wick UI.