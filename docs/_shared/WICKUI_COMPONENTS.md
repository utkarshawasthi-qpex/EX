# WickUI Component Reference

> Generated from the installed packages in `node_modules`, not from documentation.
> Every prop signature below was read out of the shipped `.d.ts` files, so it matches
> the exact versions this project builds against.
>
> **Where this disagrees with `DESIGN_SYSTEM.md`, this file is correct.** See
> [Corrections to DESIGN_SYSTEM.md](#corrections-to-design_systemmd) at the end.

---

## Installed packages (with versions)

| Package | Declared in `package.json` | Installed |
|---|---|---|
| `@npm-questionpro/wick-ui-lib` | `^1.51.0` | 1.51.0 |
| `@npm-questionpro/wick-ui-icon` | `^9.2.1` | 9.2.1 |
| `@npm-questionpro/wick-ui-editor` | `^0.14.3` | — (installed, not used anywhere in `src/`) |

`wick-ui-lib` depends on `wick-ui-icon >= 9.2.0` as a peer, so the two versions must stay compatible.

---

## How to import

There are exactly two import styles, and choosing the wrong one breaks the build.

### Components — always dynamic, always `ssr: false`

```tsx
import dynamic from 'next/dynamic'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
```

Every one of the 47 dynamic import sites in `src/` uses this exact shape. A static
component import will fail server rendering.

### Hooks and types — always static

Hooks cannot be dynamically imported, and types are erased at compile time.

```tsx
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { IWuTableColumnDef, IWuTabItem } from '@npm-questionpro/wick-ui-lib'
```

A search of `src/` confirms the split holds today: every static import from
`wick-ui-lib` is either `useWuShowToast` or a type-only import.

### The WuTable / WuDataTable generic cast

Dynamic import erases the generic parameter, so cast at the JSX boundary only.
Keep the `columns` array itself strongly typed so cell renderers stay checked.

```tsx
const columns: IWuTableColumnDef<EmpowerInitiativeRecord>[] = [...]

<WuDataTable
  data={initiatives as unknown[]}
  columns={columns as unknown as IWuTableColumnDef<unknown>[]}
/>
```

---

## Component catalogue

Props below are the real interfaces. Anything extending a DOM element also accepts
that element's native attributes (`className`, `onClick`, `disabled`, and so on).

### Currently used in this codebase

#### WuButton — `IWuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`

| Prop | Type |
|---|---|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'rounded' \| 'link' \| 'iconOnly'` |
| `size` | `'md' \| 'sm' \| 'mobile'` |
| `color` | `'primary' \| 'upgrade' \| 'error' \| 'neutral'` |
| `Icon` | `React.ReactNode` |
| `iconPosition` | `'left' \| 'right'` |
| `floating`, `disabled`, `loading`, `selected` | `boolean` |
| `dir` | `'rtl' \| 'ltr'` |

There is no `ghost` or `destructive` variant and no `lg` size. For a destructive
action use `color="error"`.

```tsx
<WuButton variant="primary" onClick={() => setCreateOpen(true)}>+ New initiative</WuButton>
<WuButton variant="secondary" onClick={handleClose}>Cancel</WuButton>
<WuButton variant="primary" color="error" onClick={handleDelete}>Delete</WuButton>
```

#### WuInput — `IWuInputProps extends Input.Props` (Base UI input)

| Prop | Type |
|---|---|
| `Label` | `React.ReactNode` — capital L |
| `labelPosition` | `'left' \| 'top' \| 'right' \| 'bottom'` |
| `Icon` | `React.ReactNode` |
| `iconPosition` | `'left' \| 'right'` |
| `variant` | `'flat' \| 'outlined' \| 'standard' \| 'table' \| 'title'` |
| `readonly`, `invalid` | `boolean` |

```tsx
<WuInput variant="outlined" placeholder="Search initiatives..." value={search}
  onChange={(e) => setSearch(e.target.value)} className="mb-4 w-72" />
```

#### WuFormGroup — `IWuFormGroupProps extends React.HTMLAttributes<HTMLDivElement>`

| Prop | Type |
|---|---|
| `Input` | `React.ReactNode` — **required**, passed as a prop, not as children |
| `Label` | `React.ReactNode` |
| `Error` | `React.ReactNode` |
| `Hint` | `React.ReactNode` |
| `labelPosition` | `'left' \| 'top'` |

The field goes in the `Input` prop. Wrapping a child does nothing.

```tsx
<WuFormGroup Label="Title" Input={<WuInput value={title} onChange={(e) => setTitle(e.target.value)} />} />
```

Companion exports: `WuLabel`, `WuInputHint`, `WuInputError`.

#### WuSelect — `IWuSelectProps<T>`

| Prop | Type |
|---|---|
| `data` | `T[]` — **required** |
| `accessorKey` | `{ value: string; label: string }` — **required** |
| `value` / `defaultValue` | `T \| T[] \| null` — the whole option object, not a primitive |
| `onSelect` | `(value: T \| T[]) => void` |
| `multiple` | `boolean` |
| `variant` | `'flat' \| 'outlined'` |
| `placeholder`, `Label`, `labelPosition`, `Header`, `CustomTrigger` | — |
| `selectAll` | `{ enable: boolean; label?: string; includeDisabled?: boolean; triggerText?: string }` |
| `maxHeight`, `maxContentWidth`, `virtualizedThreshold`, `hasGroup`, `selectedToTop` | — |

```tsx
type SelectOption = { value: string; label: string }

<WuSelect
  data={INITIATIVE_TYPE_OPTIONS}
  accessorKey={{ value: 'value', label: 'label' }}
  value={type}
  onSelect={(v) => setType(v as SelectOption)}
  variant="outlined"
/>
```

#### WuChip — `IWuChipProps extends React.HTMLAttributes<HTMLElement>`

| Prop | Type |
|---|---|
| `variant` | `'primary' \| 'secondary'` |
| `size` | `'sm' \| 'md' \| 'lg'` |
| `shape` | `'default' \| 'rounded'` |
| `color` | `'success' \| 'warning' \| 'danger'` |
| `disabled`, `selected` | `boolean` |
| `onClose` | `() => void` — renders a dismiss affordance |

```tsx
<WuChip size="sm">{progressLabel(initiative.progress)}</WuChip>
```

#### WuModal family — `IWuModalProps`

`size` belongs on `WuModal`, not on `WuModalContent`: `sm` = 400px, `md` = 600px, `lg` = 1200px.

| Prop | Type |
|---|---|
| `open` | `boolean` |
| `onOpenChange` | `(open: boolean) => void` |
| `size` | `'sm' \| 'md' \| 'lg'` |
| `variant` | `'action' \| 'critical' \| 'upgrade'` |
| `Trigger` | `React.ReactNode` |
| `hideCloseButton`, `preventClickOutside`, `allowExternalPortals` | `boolean` |
| `maxWidth`, `maxHeight` | `string` |

Sub-components: `WuModalHeader`, `WuModalContent`, `WuModalFooter` all take plain
`div` props and render children. `WuModalClose` takes `IWuButtonProps`.
`WuModalHeader` has no `title` prop — put the title in its children.

```tsx
<WuModal open={open} onOpenChange={onOpenChange} size="md">
  <WuModalHeader>Create Initiative</WuModalHeader>
  <WuModalContent {...preventModalDismiss}>{/* fields */}</WuModalContent>
  <WuModalFooter>
    <div className="flex w-full justify-end gap-2">
      <WuButton variant="secondary" onClick={() => onOpenChange(false)}>Cancel</WuButton>
      <WuButton variant="primary" onClick={handleCreate}>Create</WuButton>
    </div>
  </WuModalFooter>
</WuModal>
```

#### WuDataTable — `IWuDataTableProps<T>` / WuTable — `IWuTableProps<T>`

Both take `data: T[]` and `columns: IWuTableColumnDef<T>[]`. `WuDataTable` adds
callback-driven sorting; `WuTable` takes static `pagination` and `filterText` instead.

Shared props: `variant` (`'unstyled' | 'striped' | 'bordered'`), `size`
(`'compact' | 'default'`), `caption`, `isLoading`, `rowSelection`, `stickyHeader`,
`maxHeight`, `hideHeader`, `isRowExpandable`, `tableLayout` (`'fixed' | 'auto'`),
`virtualization`, `HeaderAction`, `CustomLoader`, `NoDataContent`.

- `WuDataTable.sort`: `{ enabled: boolean; onSort: (sort) => void; defaultSort? }`
- `WuTable.sort`: `{ enabled?: boolean; defaultSort?: ColumnSort }`
- `WuTable.pagination`: `{ pageIndex: number; pageSize: number }`

`IWuTableColumnDef<Data>` extends TanStack's `ColumnDef<Data>` and requires
`accessorKey`, plus optional `filterable`, `headerAlign`, `cellAlign`, `sticky`
(`'left' | 'right'`), `columns`, and `expandableRowContent`.

```tsx
const columns: IWuTableColumnDef<EmpowerInitiativeRecord>[] = [
  { accessorKey: 'title', header: 'Initiative',
    cell: ({ row }) => <a href={`/empower/initiatives/${row.original.id}`}>{row.original.title}</a> },
  { accessorKey: 'type', header: 'Type', cell: ({ row }) => initiativeTypeLabel(row.original.type) },
]
```

Use `NoDataContent` for empty states rather than branching around the table.

#### Typography — WuText, WuHeading, WuSubtext, WuDisplay, WuIcon

| Component | Props |
|---|---|
| `WuText` | `size?: 'sm' \| 'md' \| 'lg'`, `as?: 'p' \| 'div' \| 'span'` |
| `WuSubtext` | `size?: 'sm' \| 'md' \| 'lg'`, `as?: 'p' \| 'div' \| 'span'` |
| `WuHeading` | `size?: 'sm' \| 'md' \| 'lg' \| 'xl'` |
| `WuDisplay` | `size?: 'md' \| 'lg'`, `as?: 'h1' \| 'h2' \| 'h3' \| 'h4' \| 'div'` |
| `WuIcon` | `icon: IWuIcons` — a union of the built-in icon class names |

```tsx
<WuText size="sm" as="p" className="font-medium">Link survey data (optional)</WuText>
```

#### WuCard — `IWuCardProps extends React.HTMLAttributes<HTMLDivElement>`

Only extra prop is `rounded?: boolean`. Companions: `WuCardHeader`, `WuCardFooter`.

```tsx
<WuCard rounded className="...">
  <WuCardHeader><WuHeading size="sm">{title}</WuHeading></WuCardHeader>
  <div>{children}</div>
</WuCard>
```

#### WuTab — `IWuTabProps`

| Prop | Type |
|---|---|
| `items` | `IWuTabItem[]` — **required** |
| `defaultValue` / `value` | `string` |
| `onValueChange` | `(value: string) => void` |
| `orientation` | `'horizontal' \| 'vertical'` |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` |
| `enableAnimation` | `boolean` |

`IWuTabItem` is `{ value: string; Trigger: React.ReactNode; Content: React.ReactNode }` —
capitalised `Trigger`/`Content`, not `label`/`content`.

```tsx
const tabs: IWuTabItem[] = [{ value: 'overview', Trigger: 'Overview', Content: <OverviewPanel /> }]
<WuTab items={tabs} defaultValue="overview" />
```

#### WuTextarea — `IWuTextareaProps extends React.TextareaHTMLAttributes`

`Label`, `variant` (`'flat' | 'outlined'`), `labelPosition` (`'left' | 'top' | 'right'`), `readonly`.

#### Sidebar family

| Component | Notable props |
|---|---|
| `WuSidebar` | `Sidebar: React.ReactNode` (**required**), `children`, `defaultOpen`, `open`, `onOpenChange` |
| `WuSidebarGroup` | `label: string` (**required**) |
| `WuSidebarItem` | `Icon: React.ReactNode` (**required**), `isActive?: boolean` |
| `WuSidebarCollapsibleMenu` | `Title`, `Icon`, `children` (all required) |
| `WuSidebarContent`, `WuSidebarFooter`, `WuSidebarMenu`, `WuSidebarTrigger` | pass-through |
| `useWuSidebar` | hook — static import |

#### Toast — `useWuShowToast` + `WuToast`

`IWuToastOptions` is `{ variant?: 'success' | 'warning' | 'error' | 'info'; duration?: number; message?: string }`.

The `WuToast` host is already mounted once in `AppShell.tsx`. Never mount it again —
just call the hook.

```tsx
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'

const { showToast } = useWuShowToast()
showToast({ variant: 'success', message: 'Initiative created' })
```

#### Menu family

`WuMenu`, `WuMenuItem`, `WuMenuItemGroup`, `WuMenuCheckboxItem`, `WuMenuRadioItem`,
`WuMenuSeparatorItem`, `WuSubMenu`. Used today for row action menus.

#### WuAppHeaderSearch

Part of the `appHeader` module; used in `ExHeaderSearch.tsx`.

---

### Available but not yet used

All of these are exported from the package root and can be dynamically imported the
same way. Read the matching `.d.ts` under
`node_modules/@npm-questionpro/wick-ui-lib/dist/src/components/<module>/` before using
one — do not guess prop names.

| Component(s) | Module | Types |
|---|---|---|
| `WuAccordion` | `accordion` | `IWuAccordionProps`, `IWuAccordionSingleProps`, `IWuAccordionMultipleProps`, `IAccordionItemType` |
| `WuActivityLog` | `activityLog` | `IWuActivityLogProps` |
| `WuAppHeader`, `WuAppHeaderBar`, `WuAppHeaderAccount`, `WuAppHeaderHelp`, `WuAppHeaderMenu`, `WuTruncatedLabel` | `appHeader` | `IWuAppHeaderProps`, `IWuAppHeaderAccount`, `IWuAppHeaderHelpMenu`, `IWuAppHeaderMenuItem` |
| `WuDatePicker`, `WuDateRangePicker`, `WuCalender` *(note the spelling)* | `calendar` | `IWuDatePickerProps`, `IWuDateRangePickerProps` |
| `WuCheckbox` | `checkbox` | `IWuCheckboxProps` — `Label`, `partial`, `onChange: (e: boolean) => void` |
| `WuCombobox` | `combobox` | `IWuComboboxProps`, `IWuComboboxOption`, `IWuComboboxItem`, `IWuComboboxGroup`, `IWuComboboxDivider` |
| `WuCopyToClipboard` | `copyToClipboard` | `IWuCopyToClipboardProps` |
| `WuDrawer`, `WuDrawerClose` | `drawer` | `IWuDrawerProps` |
| `WuDrilldown` | `drilldown` | `IWuDrilldownProps`, `IWuDrilldownItem`, `IWuDrilldownTitle`, … |
| `WuFooter` | `footer` | `IWuFooterProps` |
| `WuHelpButton` | `helpButton` | `IWuHelpButtonProps` |
| `WuListbox` | `listbox` | `IWuListboxProps`, `IWuChipProp` |
| `WuLoader` | `loader` | `IWuLoaderProps` — `size`, `color`, `message`, `variant: 'spinner' \| 'dots'` |
| `WuMenuIcon` | `menuIcon` | `IWuMenuIconProps` |
| `WuMonthPicker` | `monthPicker` | `IWuMonthPickerProps` |
| `WuPrimaryNavbar`, `WuSecondaryNavbar` | `navbar` | `IWuPrimaryNavbarProps`, `IWuSecondaryNavbarProps` |
| `WuPagination` | `pagination` | `IWuPaginationProps` |
| `WuPopover`, `WuPopoverClose` | `popover` | `IWuPopoverProps` |
| `WuRadioGroup` | `radio` | `IWuRadioGroupProps`, `IWuRadioOption` |
| `WuScrollArea` | `scrollArea` | — |
| `WuSpotlight` | `spotlight` | `IWuSpotlightProps` |
| `WuStackedCard`, `WuStackedCardOverlay`, `calculatePosition` | `stackedCard` | `IWuStackedCardProps`, `IWuStackedCardOverlayProps` |
| `WuStepper` | `stepper` | `IWuStepperProps` |
| `WuSurveySelect`, `WuSurveyItem`, `WuSurveyList`, `WuSurveySource`, `WuSharedSurvey` | `surveySelect` | `IWuSurveySelectProps`, … |
| `WuSwitcher` | `switcher` | `IWuSwitcherProps`, `IWuSwitcherOption` |
| `WuTimePicker` | `timePicker` | `IWuTimePickerProps` |
| `WuToggle` | `toggle` | `IWuToggleProps` — `Label`, `onChange: (e: boolean) => void` |
| `WuTooltip` | `tooltip` | `IWuTooltipProps` — `content`, `position`, `showArrow` |
| `WuVirtualScroll` | `virtualScroll` | `IWuVirtualScrollProps` |
| `WuSubtext`, `WuDisplay`, `WuIcon` | `typography` | `IWuIcons` |
| `useTranslation`, `useTranslationsContext`, `WuTranslationProvider`, `WuTranslationContext` | `useTranslation` | `ITranslateFn`, `IWuTranslationContextType` |
| `CHART_COLOR_SYSTEM` | `docs/ui/colorSystem` | `{ [palette: string]: { [shade: string]: string } }` |

The table module also re-exports TanStack's `Cell`, `Column`, `Row`, and `RowData` types.

---

## Icon system

Icons are **CSS classes, not React components.** `@npm-questionpro/wick-ui-icon`
exports only a stylesheet and font files — there is nothing to import from it in
TypeScript, and a search of `src/` confirms zero module imports from that package.

```tsx
<span className="wc-analytics text-base leading-none" aria-hidden />
<span className={cn(item.icon, 'w-4 shrink-0 text-center')} aria-hidden />
```

Prefixes are `wc-` (custom QuestionPro), `wm-` (Material), and `wp-`. The stylesheet
ships **3,858** icon classes. There is no exported list in a readable format, so
verify a class exists before using it:

```powershell
rg --no-ignore -N "^\.(wm|wc)-your-guess" node_modules/@npm-questionpro/wick-ui-icon/dist/wu-icon.css
```

Guessing icon names is the single most common failure — several plausible-sounding
classes (`wc-list`, `wc-group`, `wc-bar-chart`, `wc-chat`, `wc-gear`) do **not** exist.

### Icon classes currently used in this codebase

`wc-admin`, `wc-analytics`, `wc-balancing`, `wc-categories`, `wc-data-import`,
`wc-downloads`, `wc-employees-list`, `wc-file-type-ppt`, `wc-home`, `wc-settings`,
`wc-templates`, `wm-360`, `wm-account-tree`, `wm-add`, `wm-add-circle`,
`wm-admin-panel-settings`, `wm-app-emp`, `wm-apps`, `wm-arrow-back`,
`wm-arrow-drop-down`, `wm-assignment`, `wm-bar-chart`, `wm-check-circle`,
`wm-download`, `wm-edit`, `wm-error-outline`, `wm-filter-alt`, `wm-flag`,
`wm-folder-data`, `wm-format-list-bulleted`, `wm-forum`, `wm-groups`, `wm-home`,
`wm-keyboard-arrow-left`, `wm-keyboard-arrow-right`, `wm-lightbulb`, `wm-list`,
`wm-menu`, `wm-mic`, `wm-more-vert`, `wm-person`, `wm-play-circle-outline`,
`wm-search`, `wm-search-off`, `wm-send`, `wm-settings`, `wm-share`

`WuIcon` from the typography module wraps a constrained `IWuIcons` union, but the
codebase uses raw `<span className="...">` everywhere; stay consistent with that.

---

## CSS setup

Both stylesheets are imported once, globally, in `src/app/layout.tsx`:

```tsx
import '@npm-questionpro/wick-ui-lib/dist/style.css'
import '@npm-questionpro/wick-ui-icon/dist/wu-icon.css'
import './globals.css'
```

Never re-import them in a feature file.

### Tokens

`style.css` defines 223 CSS custom properties. Most are Tailwind internals (`--tw-*`);
the meaningful WickUI ones fall into these groups:

| Group | Examples | Use for |
|---|---|---|
| Brand blues | `--wu-blue-p`, `--wu-blue-q`, `--wu-blue-deep`, `--wu-blue-soft`, `--wu-blue-focus` | Primary brand colour |
| Chrome | `--wu-blue-sidebar`, `--wu-blue-sidebar-hover`, `--wu-blue-switcher`, `--wu-gray-switcher` | Nav and header surfaces |
| Greys | `--wu-gray-10`, `--wu-gray-20`, `--wu-gray-25`, `--wu-gray-40`, `--wu-gray-subtle`, `--wu-gray-lead`, `--wu-gray-footer`, `--wu-gray-notification` | Text and borders |
| Status | `--wu-green-deep/soft`, `--wu-red-deep/soft`, `--wu-orange-deep/soft`, `--wu-yellow-deep/soft`, `--wu-maroon` | Success, error, warning |
| Sentiment | `--wu-sentiment-positive`, `--wu-sentiment-slightly-positive`, `--wu-sentiment-neutral`, `--wu-sentiment-slightly-negative`, `--wu-sentiment-negative`, `--wu-sentiment-no-sentiment` | Text analytics |
| NPS | `--wu-nps-promoter`, `--wu-nps-passive`, `--wu-nps-detractor` | NPS breakdowns |
| Chart scales | `--wu-qualitative-1..16`, `--wu-{blue,green,orange,red}-sequential-1..16`, `--wu-{blue,red}-divergent-1..8`, `--wu-divergent-neutral` | Data visualisation |
| Component-scoped | `--btn-*`, `--chip-bg`, `--wu-modal-inner-radius`, `--wu-row-overlay` | Internal; do not override |

For charts, prefer the typed export over raw variables:

```tsx
import { CHART_COLOR_SYSTEM } from '@npm-questionpro/wick-ui-lib'
```

### Token syntax

Tokens hold **space-separated RGB triplets, not hex strings**, so they must be wrapped:

```css
color: rgb(var(--wu-blue-p));
background: rgb(var(--wu-blue-p) / 0.1);   /* alpha variant */
```

`var(--wu-blue-p)` on its own resolves to `27 135 230`, which is not a valid colour and
renders as nothing.

### The `wu-` utility layer

`style.css` also ships a full Tailwind build under the `wu-` prefix, so in most cases you
can skip the variables entirely. `EmpowerWidgetCard.tsx` already uses this
(`wu-flex`, `wu-flex-col`).

Colour utilities include `wu-bg-blue-p`, `wu-bg-blue-q`, `wu-bg-blue-sidebar`,
`wu-bg-blue-soft`, `wu-bg-blue-switcher`, `wu-bg-gray-10/20/25/40`, `wu-bg-gray-lead`,
`wu-bg-gray-subtle`, `wu-bg-green-soft`, `wu-bg-orange-soft`, and the matching
`wu-text-blue-p`, `wu-text-blue-q`, `wu-text-blue-deep`, `wu-text-gray-lead`,
`wu-text-gray-subtle`, `wu-text-gray-footer` set. Opacity variants exist too
(`wu-bg-blue-p/10`, `/15`, `/20`).

Typography utilities are also provided: `wu-text-display-1/2`, `wu-text-body-1/2/3`,
`wu-text-btn-1/2/3`.

### Project palette → WickUI token mapping

Screens currently hard-code hexes via Tailwind arbitrary values. Use the token column
instead for new work. Only the primary blue is an exact match — the rest are the nearest
available, so check the rendered result before bulk-replacing anything.

| Project hex | Role | WickUI token | Token value | Fidelity |
|---|---|---|---|---|
| `#1B87E6` | Primary / links / active | `--wu-blue-p` · `wu-bg-blue-p` | `#1B87E6` | **exact** |
| `#1B2E4A` | Navy headings, nav text | `--wu-blue-q` | `#1B3380` | approximate — WickUI's navy is bluer |
| `#F4F6F9` | Page background | `--wu-blue-sidebar` | `#EEF3FB` | approximate — or `--wu-gray-10` (`#F5F5F5`) for a neutral |
| `#FFFFFF` | Card / panel | plain white | — | exact |
| `#E5E7EB` | Borders, dividers | `--wu-gray-25` | `#E8E8E8` | close |
| `#374151` | Body text | `--wu-gray-lead` | `#545E6B` | approximate — token is lighter |
| `#6B7280` | Muted / secondary text | `--wu-gray-lead` | `#545E6B` | close |
| `#9CA3AF` | Subtle / placeholder | `--wu-gray-subtle` | `#9B9B9B` | close |
| `#16A34A` | Success | `--wu-green-deep` | `#227700` | approximate — token is more saturated |
| `#D97706` | Warning | `--wu-yellow-deep` | `#9F6000` | approximate — `--wu-orange-deep` (`#F58300`) is brighter |
| `#DC2626` | Danger / overdue | `--wu-red-deep` | `#CC0000` | close |

Do not invent token names. `--wu-primary`, `--wu-navy`, `--wu-page-bg`, `--wu-border`,
`--wu-text-body`, `--wu-text-muted`, `--wu-success`, `--wu-warning`, and `--wu-danger`
**do not exist** and will silently resolve to nothing.

Plain Tailwind stays available for layout, spacing, and flex/grid. Do not use it to
rebuild anything WickUI already provides.

---

## Rules for every prompt

1. **Use `WuButton`** — never a raw `<button className="...">` for an action control.
2. **Use `WuModal`** with `WuModalHeader` / `WuModalContent` / `WuModalFooter` — never a hand-rolled overlay div.
3. **Use `WuDataTable` or `WuTable`** for tabular data, driven by a `columns` array. There are no row or cell components to compose by hand.
4. **Use `WuTab`** with a single `items` array. There is no `WuTabs` / `WuTabPanel` pair.
5. **Use `WuSelect`** with `data` + `accessorKey` — never a raw `<select>` and never `<option>` children.
6. **Use `WuInput` / `WuTextarea`**, wrapped in `WuFormGroup` via its `Input` prop, for every form field.
7. **Use `WuMenu` / `WuMenuItem`** for dropdown menus. There is no `WuDropdown`.
8. **Use `WuChip`** for status pills and tags. There is no `WuBadge`.
9. **Use `WuLoader`** for spinners. There is no `WuSpinner` or `WuProgress`.
10. **Icons are CSS classes**, written as `<span className="wc-… " aria-hidden />`. Verify every class against `wu-icon.css` before using it — never guess.
11. **Never import a component statically** from `wick-ui-lib`; always `dynamic(..., { ssr: false })`. Hooks and types are the only static imports.
12. **Never import `lucide-react`** for an icon the WickUI font already provides.
13. **Prefer WickUI tokens or `wu-` colour utilities** over new hard-coded hexes, using the mapping table above.
14. If WickUI has no component for a need, check `src/components/ui/` and `src/components/shared/` for an existing in-house one before building anything new.

---

## Corrections to DESIGN_SYSTEM.md

`docs/_shared/DESIGN_SYSTEM.md` predates the installed version and contains several
signatures that do not compile. Where the two disagree, trust this file.

| Topic | DESIGN_SYSTEM.md says | Actually |
|---|---|---|
| Imports | Static `import { WuButton } from '...'` | Components must be `dynamic(..., { ssr: false })` |
| Icons | `import { SomeIcon } from '@npm-questionpro/wick-ui-icon'` | Package exports no components — CSS classes only |
| `WuButton` | `variant="ghost"`, `variant="destructive"`, `size="lg"` | Variants are `primary\|secondary\|outline\|rounded\|link\|iconOnly`; sizes `md\|sm\|mobile`; use `color="error"` for destructive |
| `WuFormGroup` | `label` prop, field as children | `Label` prop, field passed via required `Input` prop |
| `WuFormGroup` | `required`, `helperText`, `error` | `Hint` and `Error`; no `required` |
| `WuModal` | `size` on `WuModalContent` | `size` on `WuModal` |
| `WuModalHeader` | `title="..."` prop | Renders children |
| `WuTab` | `tabs={[{ id, label, content }]}` | `items={[{ value, Trigger, Content }]}` |
| `WuSelect` | `options={...}` | `data={...}` plus required `accessorKey` |
| `WuDataTable` | `pagination={{ pageSize: 20 }}` | `WuDataTable` has no `pagination`; `WuTable` takes `{ pageIndex, pageSize }` |
| `WuCheckbox` / `WuToggle` | `label`, `onChange(value)` | `Label`, `onChange: (e: boolean) => void` |
| `WuCalendar` | `WuCalendar` | Exported as `WuCalender`; prefer `WuDatePicker` / `WuDateRangePicker` |
| `WuAccordion` / `WuActivityLog` / `WuSpotlight` / `WuPagination` | Specific prop shapes shown | Unverified — read the `.d.ts` before use |

## Components that do not exist

These names get suggested regularly and are **not** in the package. Verified by searching
every `.d.ts` in `wick-ui-lib@1.51.0`. Use the replacement instead.

| Does not exist | Use instead |
|---|---|
| `WuDropdown`, `WuDropdownItem` | `WuMenu`, `WuMenuItem` |
| `WuBadge` | `WuChip` |
| `WuSpinner` | `WuLoader` |
| `WuProgress` | none — no progress component ships |
| `WuAlert` | none — compose with `WuCard` / `WuChip` |
| `WuAvatar` | none exported — render initials in a styled `span` |
| `WuTabs`, `WuTabPanel` | `WuTab` with an `items` array |
| `WuTableRow`, `WuTableCell`, `WuTableHeader` | `WuDataTable` / `WuTable` with `columns` (`WuTableHeader` exists internally but is not exported) |

## Icon classes that do not exist

Also regularly suggested, also absent from `wu-icon.css`: `wc-initiatives`,
`wc-conversations`, `wc-add`, `wc-delete`, `wc-chevron-down`, `wc-chevron-right`,
`wc-filter`, `wc-close`, `wc-check`, `wc-search`, `wc-team`, `wc-ideation`, `wc-list`,
`wc-group`, `wc-bar-chart`, `wc-chat`, `wc-gear`.

Most have a `wm-` equivalent instead — `wm-add`, `wm-search`, `wm-edit`, `wm-list`,
`wm-groups`, `wm-bar-chart`, `wm-forum`, `wm-settings`. The icon stylesheet path is
`@npm-questionpro/wick-ui-icon/dist/wu-icon.css`; there is no `dist/style.css` in that
package.
