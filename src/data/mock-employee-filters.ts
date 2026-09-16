import type { DirectoryCustomField } from '@/data/mock-custom-fields'
import {
  getEmployeeDisplayName,
  getEmployeeFieldValue,
  type DirectoryEmployee,
} from '@/data/mock-employee-directory'

export type FilterFieldKind = 'select' | 'text'
export type FilterJoin = 'AND' | 'OR'

export type FilterSelectOption = {
  value: string
  label: string
}

export type EmployeeFilterCondition = {
  id: string
  fieldId: string
  operator: string
  value: string
}

export type EmployeeFilterGroup = {
  id: string
  joinWithPrevious: FilterJoin
  conditions: EmployeeFilterCondition[]
}

export type EmployeeFilterPreset = {
  id: string
  name: string
  groups: EmployeeFilterGroup[]
}

export type EmployeeFilterField = {
  id: string
  label: string
  kind: FilterFieldKind
  options?: FilterSelectOption[]
}

export const TEXT_OPERATOR_OPTIONS: FilterSelectOption[] = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'does_not_contain', label: 'does not contain' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
]

export const JOIN_OPTIONS: FilterSelectOption[] = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' },
]

export const EMPLOYEE_STATUS_FILTER_OPTIONS: FilterSelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'terminated', label: 'Terminated' },
]

export const LEVEL_FILTER_OPTIONS: FilterSelectOption[] = [
  { value: 'Individual Contributor', label: 'Individual Contributor' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Director', label: 'Director' },
  { value: 'Senior VP/VP', label: 'Senior VP/VP' },
  { value: 'C-Suite/Exec', label: 'C-Suite/Exec' },
]

export const APPLY_NEW_PRESET_ID = 'apply-new'

function nextId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function createFilterCondition(
  fieldId = 'status',
  operator = 'is',
  value = '',
): EmployeeFilterCondition {
  return { id: nextId('cond'), fieldId, operator, value }
}

export function createFilterGroup(
  conditions: EmployeeFilterCondition[] = [createFilterCondition('status', 'is', 'active')],
  joinWithPrevious: FilterJoin = 'AND',
): EmployeeFilterGroup {
  return { id: nextId('group'), joinWithPrevious, conditions }
}

export function createDefaultFilterGroups(): EmployeeFilterGroup[] {
  return [
    createFilterGroup([createFilterCondition('status', 'is', 'active')]),
    createFilterGroup([createFilterCondition('nameOrEmail', 'is', '')], 'AND'),
  ]
}

export function cloneFilterGroups(groups: EmployeeFilterGroup[]): EmployeeFilterGroup[] {
  return groups.map((group) => ({
    ...group,
    id: nextId('group'),
    conditions: group.conditions.map((condition) => ({
      ...condition,
      id: nextId('cond'),
    })),
  }))
}

export function getEmployeeFilterFields(params: {
  customFields: DirectoryCustomField[]
  languageOptions: FilterSelectOption[]
  managerOptions: FilterSelectOption[]
}): EmployeeFilterField[] {
  const catalogFields = params.customFields.map((field) => ({
    id: field.key,
    label: field.title,
    kind: 'select' as const,
    options: field.options.map((option) => ({ value: option, label: option })),
  }))

  return [
    { id: 'status', label: 'Employee Status', kind: 'select', options: EMPLOYEE_STATUS_FILTER_OPTIONS },
    { id: 'nameOrEmail', label: 'Full Name or Email', kind: 'text' },
    { id: 'email', label: 'Email Address', kind: 'text' },
    ...catalogFields,
    { id: 'language', label: 'Language', kind: 'select', options: params.languageOptions },
    { id: 'level', label: 'Level', kind: 'select', options: LEVEL_FILTER_OPTIONS },
    { id: 'manager', label: 'Manager', kind: 'select', options: params.managerOptions },
  ]
}

export const DEFAULT_SAVED_FILTERS: EmployeeFilterPreset[] = [
  {
    id: 'hr-employees',
    name: 'HR employees',
    groups: [createFilterGroup([createFilterCondition('department', 'is', 'HR')])],
  },
  {
    id: 'active-employees',
    name: 'Active employees',
    groups: [createFilterGroup([createFilterCondition('status', 'is', 'active')])],
  },
  {
    id: 'on-leave',
    name: 'On leave',
    groups: [createFilterGroup([createFilterCondition('status', 'is', 'on_leave')])],
  },
  {
    id: 'san-francisco',
    name: 'San Francisco',
    groups: [createFilterGroup([createFilterCondition('location', 'is', 'San Francisco')])],
  },
]

export function getEmployeeFilterPresets(
  savedFilters: EmployeeFilterPreset[] = DEFAULT_SAVED_FILTERS,
): EmployeeFilterPreset[] {
  return [
    { id: APPLY_NEW_PRESET_ID, name: 'Apply New', groups: createDefaultFilterGroups() },
    ...savedFilters,
  ]
}

const OPERATOR_LABELS: Record<string, string> = {
  is: 'is',
  is_not: 'is not',
  contains: 'contains',
  does_not_contain: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
}

export function hasActiveFilterConditions(groups: EmployeeFilterGroup[]): boolean {
  return groups.some((group) => group.conditions.some((condition) => condition.value.trim() !== ''))
}

export function parseEmployeeFilterGroups(raw: unknown): EmployeeFilterGroup[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((group, index) => {
    if (typeof group !== 'object' || group === null) return []
    const record = group as Record<string, unknown>
    const conditions: EmployeeFilterCondition[] = Array.isArray(record.conditions)
      ? record.conditions.flatMap((condition, conditionIndex) => {
          if (typeof condition !== 'object' || condition === null) return []
          const item = condition as Record<string, unknown>
          if (typeof item.fieldId !== 'string' || typeof item.operator !== 'string') return []
          return [
            {
              id: typeof item.id === 'string' ? item.id : `cond_${index}_${conditionIndex}`,
              fieldId: item.fieldId,
              operator: item.operator,
              value: typeof item.value === 'string' ? item.value : '',
            },
          ]
        })
      : []
    return [
      {
        id: typeof record.id === 'string' ? record.id : `group_${index}`,
        joinWithPrevious: record.joinWithPrevious === 'OR' ? 'OR' : 'AND',
        conditions,
      },
    ]
  })
}

export function summarizeFilterGroups(
  groups: EmployeeFilterGroup[],
  fields: EmployeeFilterField[] = [],
): string {
  const parts: string[] = []
  groups.forEach((group, groupIndex) => {
    const active = group.conditions.filter((condition) => condition.value.trim())
    if (active.length === 0) return
    const groupText = active
      .map((condition) => {
        const field = fields.find((item) => item.id === condition.fieldId)
        const label = field?.label ?? condition.fieldId
        const valueLabel =
          field?.options?.find((option) => option.value === condition.value)?.label ?? condition.value
        const operator = OPERATOR_LABELS[condition.operator] ?? condition.operator
        return `${label} ${operator} ${valueLabel}`
      })
      .join(' and ')
    if (groupIndex === 0 || parts.length === 0) {
      parts.push(groupText)
      return
    }
    parts.push(`${group.joinWithPrevious.toLowerCase()} ${groupText}`)
  })
  return parts.join(' ') || 'No criteria'
}

function compareText(actual: string, operator: string, expected: string) {
  const a = actual.trim().toLowerCase()
  const e = expected.trim().toLowerCase()
  switch (operator) {
    case 'is_not':
      return a !== e
    case 'contains':
      return a.includes(e)
    case 'does_not_contain':
      return !a.includes(e)
    case 'starts_with':
      return a.startsWith(e)
    case 'ends_with':
      return a.endsWith(e)
    default:
      return a === e
  }
}

function conditionValue(employee: DirectoryEmployee, fieldId: string) {
  return getEmployeeFieldValue(employee, fieldId)
}

function matchesCondition(
  employee: DirectoryEmployee,
  condition: EmployeeFilterCondition,
) {
  if (!condition.value.trim()) return true
  if (condition.fieldId === 'nameOrEmail') {
    const name = getEmployeeDisplayName(employee)
    const email = employee.email
    if (condition.operator === 'is_not' || condition.operator === 'does_not_contain') {
      return (
        compareText(name, condition.operator, condition.value) &&
        compareText(email, condition.operator, condition.value)
      )
    }
    return (
      compareText(name, condition.operator, condition.value) ||
      compareText(email, condition.operator, condition.value)
    )
  }
  const actual = conditionValue(employee, condition.fieldId)
  if (condition.fieldId === 'manager') {
    return condition.operator === 'is_not'
      ? actual !== condition.value
      : actual === condition.value
  }
  if (condition.operator === 'is' || condition.operator === 'is_not') {
    return compareText(actual, condition.operator, condition.value)
  }
  return compareText(actual, condition.operator, condition.value)
}

function matchesGroup(
  employee: DirectoryEmployee,
  group: EmployeeFilterGroup,
) {
  const active = group.conditions.filter((condition) => condition.value.trim())
  if (active.length === 0) return true
  return active.every((condition) => matchesCondition(employee, condition))
}

export function employeeMatchesFilterGroups(
  employee: DirectoryEmployee,
  groups: EmployeeFilterGroup[],
) {
  if (groups.length === 0) return true
  return groups.reduce((matched, group, index) => {
    const groupMatch = matchesGroup(employee, group)
    if (index === 0) return groupMatch
    return group.joinWithPrevious === 'OR' ? matched || groupMatch : matched && groupMatch
  }, true)
}
