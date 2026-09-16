export type CustomFieldKey = string

export type CustomFieldDisplayType = 'radio_horizontal' | 'radio_vertical' | 'dropdown'

export type DirectoryCustomField = {
  key: CustomFieldKey
  title: string
  fieldType: 'single_select'
  scaleLibrary: string
  displayType: CustomFieldDisplayType
  options: string[]
  surveyCustomVariable: string
  visible?: boolean
}

export const FIELD_TYPE_OPTIONS = [{ value: 'single_select', label: 'Single Select' }]

export const SCALE_LIBRARY_OPTIONS = [
  { value: '', label: '-Select-' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'satisfaction', label: 'Satisfaction' },
  { value: 'frequency', label: 'Frequency' },
]

export const DISPLAY_TYPE_OPTIONS = [
  { value: 'radio_horizontal', label: 'Radio Button Horizontal' },
  { value: 'radio_vertical', label: 'Radio Button Vertical' },
  { value: 'dropdown', label: 'Dropdown' },
]

export const SURVEY_CUSTOM_VARIABLE_OPTIONS = [
  { value: 'none', label: 'None' },
  ...Array.from({ length: 250 }, (_, index) => {
    const value = String(index + 1)
    return { value, label: value }
  }),
]

export function createFieldKey(title: string, existing: DirectoryCustomField[]): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'field'
  const used = new Set(existing.map((field) => field.key))
  if (!used.has(base)) return base
  let index = 2
  let key = `${base}_${index}`
  while (used.has(key)) {
    index += 1
    key = `${base}_${index}`
  }
  return key
}

export function createBlankCustomField(): DirectoryCustomField {
  return {
    key: '',
    title: '',
    fieldType: 'single_select',
    scaleLibrary: '',
    displayType: 'radio_horizontal',
    options: [],
    surveyCustomVariable: 'none',
    visible: true,
  }
}

export function isCustomFieldVisible(field: DirectoryCustomField) {
  return field.visible !== false
}

export function getVisibleCustomFields(fields: DirectoryCustomField[]) {
  return fields.filter(isCustomFieldVisible)
}

export function reorderVisibleCustomFields(
  fields: DirectoryCustomField[],
  visibleKeysInOrder: string[],
): DirectoryCustomField[] {
  const byKey = new Map(fields.map((field) => [field.key, field]))
  const visible = visibleKeysInOrder
    .map((key) => byKey.get(key))
    .filter((field): field is DirectoryCustomField => Boolean(field))
  let nextVisible = 0
  return fields.map((field) => {
    if (!isCustomFieldVisible(field)) return field
    const replacement = visible[nextVisible]
    nextVisible += 1
    return replacement ?? field
  })
}

export const DEFAULT_DIRECTORY_CUSTOM_FIELDS: DirectoryCustomField[] = [
  {
    key: 'department',
    title: 'Department',
    fieldType: 'single_select',
    scaleLibrary: '',
    displayType: 'radio_horizontal',
    options: [
      'Engineering',
      'Product',
      'Sales',
      'HR',
      'Operations',
      'Accounting/Finance/Tax/Treasury',
      'Business Development/Sales',
      'Client Services/Delivery',
      'Marketing',
      'Legal',
    ],
    surveyCustomVariable: 'none',
    visible: true,
  },
  {
    key: 'location',
    title: 'Location',
    fieldType: 'single_select',
    scaleLibrary: '',
    displayType: 'dropdown',
    options: ['San Francisco', 'Austin', 'Remote', 'New York', 'London'],
    surveyCustomVariable: 'none',
    visible: true,
  },
]
