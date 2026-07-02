# Percussion Project — Conventions
> Cursor must read this file before writing any code.  
> These rules apply to every session, every file, every component.

---

## File Naming

| What | Convention | Example |
|---|---|---|
| Page files | `page.tsx` (Next.js standard) | `src/app/lifecycle/surveys/page.tsx` |
| Layout files | `layout.tsx` | `src/app/lifecycle/layout.tsx` |
| UI components | `PascalCase.tsx` | `Button.tsx`, `InitiativeList.tsx` |
| Module components | `PascalCase.tsx` in `/modules/[product]/` | `SurveyCard.tsx` |
| Shared layout | `PascalCase.tsx` in `/shared/` | `Sidebar.tsx` |
| Mock data | `camelCase.ts` | `employees.ts` |
| Types | Single file | `src/types/index.ts` |
| Utilities | `camelCase.ts` | `mockDb.ts`, `utils.ts` |
| PRD files | `kebab-case.PRD.md` | `create-initiative.PRD.md` |
| Module docs | `MODULE.md` (uppercase) | `MODULE.md` |

---

## Component Rules

**One component per file.** Never put two exported components in one file.

**Props interface always above the component:**
```tsx
interface InitiativeCardProps {
  initiative: Initiative
  onEdit: (id: ID) => void
}

export function InitiativeCard({ initiative, onEdit }: InitiativeCardProps) { ... }
```

**Named exports only.** Never use default exports for components (except `page.tsx` and `layout.tsx` which Next.js requires as default).
```tsx
// ✅ correct
export function Button({ ... }: ButtonProps) { ... }

// ❌ wrong
export default function Button() { ... }
```

**Every component handles three states:**
1. `loading` — show `<LoadingSkeleton />`, never show empty content
2. `empty` — show `<EmptyState />` with appropriate message and CTA
3. `populated` — show actual data

```tsx
if (loading) return <LoadingSkeleton rows={5} />
if (data.length === 0) return <EmptyState headline="No initiatives yet" ... />
return <Table ... />
```

---

## Imports

**Always use the `@/` alias**, never relative paths:
```tsx
// ✅ correct
import { WuButton } from '@npm-questionpro/wick-ui-lib'
import { mockEmployees } from '@/data/mock/employees'
import type { Employee } from '@/types'

// ❌ wrong
import { Button } from '@/components/Button'
```

**Import order:**
1. React and Next.js
2. Third-party libraries (`lucide-react`, `date-fns`, etc.)
3. Internal types (`@/types`)
4. Internal components (`@/components/...`)
5. Internal data / lib (`@/data/...`, `@/lib/...`)

---

## TypeScript Rules

**No `any`.** If the type is unknown, use `unknown` and narrow it.

**All props must be typed.** No implicit `any` props.

**Use types from `/src/types/index.ts` only.** Never define a new interface inside a component file. If a new type is needed, add it to `index.ts` first.

**Use `ID` for all id fields:**
```ts
import type { ID } from '@/types'
const id: ID = 'emp_001'
```

---

## Mock Data Rules

**All data comes from `/src/data/mock/`.** Never hardcode data inside a component.

**Use `mockDb.ts` helpers for filtering, sorting, pagination:**
```ts
import { getEmployees, getEmployeeById } from '@/lib/mockDb'

const employees = getEmployees({ department: 'Engineering', status: 'active' })
const emp = getEmployeeById('emp_001')
```

**Never mutate mock data.** Mock data arrays are read-only. For create/edit/delete actions, use React state to simulate mutations — never push to the source array.
```tsx
// ✅ correct: simulate create with local state
const [initiatives, setInitiatives] = useState(mockInitiatives)
const handleCreate = (newItem: Initiative) => setInitiatives(prev => [newItem, ...prev])

// ❌ wrong
mockInitiatives.push(newItem)
```

---

## State Management

**No global state library (no Redux, no Zustand).** Use React `useState` and `useContext` only.

**Keep state as local as possible.** Only lift state when two sibling components genuinely need to share it.

**Server Components vs Client Components:**
- Default to Server Components for pages that just display data
- Add `'use client'` only when the component uses `useState`, `useEffect`, event handlers, or browser APIs
- Never add `'use client'` to a page that doesn't need it

---

## Tailwind Rules

**Use the `cn()` utility for conditional classes:**
```tsx
import { cn } from '@/lib/utils'
<div className={cn('base', isActive && 'active', variant === 'ghost' && 'ghost')} />
```

**Never use inline `style={{}}` for colors or spacing** that could be expressed in Tailwind classes.

**Responsive breakpoints:** Use `sm:` for mobile adjustments. Design for desktop-first (min 1280px viewport assumed for HR admin tools).

---

## Cursor Session Rules

Every Cursor session must follow these rules exactly:

1. **Read before building.** At the start of every session, read:
   - `docs/_shared/DESIGN_SYSTEM.md`
   - `docs/_shared/DATA_MODELS.md`
   - `docs/_shared/CONVENTIONS.md`
   - The relevant `MODULE.md`
   - The specific `feature.PRD.md`

2. **One PRD per session.** Never build more than one PRD's worth of work in a single session.

3. **Never modify `_shared` files.** If a type or component is missing, flag it — don't invent a workaround.

4. **Run the acceptance check** at the end of every session before marking it done.

5. **Never break existing files.** If a session requires editing an existing component, make the smallest possible change. Do not refactor files not related to the current task.

---

## Date Formatting

Use `date-fns` for all date formatting. Never use `new Date().toLocaleDateString()`.
```ts
import { format, formatDistanceToNow } from 'date-fns'

format(new Date(employee.hireDate), 'MMM d, yyyy')        // 'Apr 15, 2023'
formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })  // '3 days ago'
```

---

## Error Handling in Components

Wrap data-fetching hooks or mockDb calls in try/catch where the data source could fail:
```tsx
try {
  const data = getInitiatives({ status: 'active' })
  setInitiatives(data)
} catch (err) {
  setError('Failed to load initiatives.')
}
```

Always show a meaningful error state, never a blank screen.