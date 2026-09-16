export type EmployeeImportFormatField = {
  label: string
  required?: boolean
  examples?: string[]
}

import { DEFAULT_DIRECTORY_CUSTOM_FIELDS, type DirectoryCustomField } from '@/data/mock-custom-fields'

const CORE_IMPORT_FIELDS: EmployeeImportFormatField[] = [
  { label: 'Email Address', required: true },
  { label: 'First Name' },
  { label: 'Last Name' },
  { label: 'Country Code' },
  { label: 'Phone' },
  { label: 'Supervisor / Manager Unique Field' },
  { label: 'Alternate Email Address' },
  { label: 'Start Date (MM/DD/YYYY)' },
  { label: 'Employee Status' },
  { label: 'End Date (MM/DD/YYYY)' },
  { label: 'Language' },
]

const TRAILING_IMPORT_FIELDS: EmployeeImportFormatField[] = [
  {
    label: 'Level',
    examples: [
      'C-Suite/Exec',
      'Senior Vice President/Vice President',
      'Associate Vice President/Senior Director',
      'Director',
      'Senior Manager',
    ],
  },
  {
    label: 'Status',
    examples: [
      'Regular Full-Time',
      'Regular Part-Time',
      'Temporary Full-Time',
      'Temporary Part-Time',
      'Intern',
    ],
  },
  { label: 'test', examples: [] },
  { label: 'Time Zone' },
  { label: 'Password' },
]

export function getEmployeeImportFormatFields(
  customFields: DirectoryCustomField[] = DEFAULT_DIRECTORY_CUSTOM_FIELDS,
): EmployeeImportFormatField[] {
  const catalogFields = customFields.map((field) => ({
    label: field.title,
    examples: field.options.slice(0, 5),
  }))
  return [...CORE_IMPORT_FIELDS, ...catalogFields, ...TRAILING_IMPORT_FIELDS]
}

export const EMPLOYEE_IMPORT_FORMAT_FIELDS = getEmployeeImportFormatFields()

export function getEmployeeImportFormatText(
  customFields: DirectoryCustomField[] = DEFAULT_DIRECTORY_CUSTOM_FIELDS,
): string {
  const labels = getEmployeeImportFormatFields(customFields).map((field) =>
    field.required ? `${field.label}*` : field.label,
  )
  return `Format: ${labels.join(', ')}`
}
