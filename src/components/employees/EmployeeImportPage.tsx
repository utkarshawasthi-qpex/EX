'use client'

import { useMemo, useRef, useState, type DragEvent } from 'react'
import dynamic from 'next/dynamic'
import { format, isValid, parse } from 'date-fns'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { cn } from '@/lib/utils'
import { EmployeeImportFormatModal } from '@/components/employees/EmployeeImportFormatModal'
import type { DirectoryCustomField } from '@/data/mock-custom-fields'
import { getEmployeeDisplayName, setEmployeeFieldValue, type DirectoryEmployee } from '@/data/mock-employee-directory'
import { getEmployeeImportFormatText } from '@/data/mock-employee-import-format'
import type { EmployeeStatus } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
  { ssr: false },
)

const MAX_IMPORT_ROWS = 100

type EmployeeImportPageProps = {
  employees: DirectoryEmployee[]
  customFields?: DirectoryCustomField[]
  onAddEmployees: (employees: DirectoryEmployee[]) => void
}

const IMPORT_METHODS = [
  { id: 'manual', label: 'Manual import' },
  { id: 'excel', label: 'Bulk import - Excel' },
] as const

const BULK_IMPORT_STEPS = [
  'Download the import template',
  'Add your contacts in correct format',
  'Upload your file',
] as const

type ImportMethod = (typeof IMPORT_METHODS)[number]['id']


function splitCsvLine(line: string) {
  return line.split(',').map((part) => part.trim().replace(/^"|"$/g, ''))
}

function parseImportDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const parsed = parse(trimmed, 'MM/dd/yyyy', new Date())
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : undefined
}

function parseEmployeeStatus(value: string): EmployeeStatus {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_')
  if (normalized === 'inactive') return 'inactive'
  if (normalized === 'on_leave') return 'on_leave'
  if (normalized === 'terminated') return 'terminated'
  return 'active'
}

function phoneCountryFromCode(code: string) {
  const digits = code.replace(/[^\d]/g, '')
  if (digits === '91') return 'IN'
  if (digits === '44') return 'GB'
  return 'US'
}

function formatImportedPhone(countryCode: string, phone: string) {
  const number = phone.trim()
  if (!number && !countryCode.trim()) return ''
  if (number.startsWith('+')) return number
  const digits = countryCode.replace(/[^\d]/g, '')
  const prefix = digits === '91' ? '+91' : digits === '44' ? '+44' : digits ? `+${digits}` : '+1'
  return number ? `${prefix} ${number}` : prefix
}

export function EmployeeImportPage({
  employees,
  customFields = [],
  onAddEmployees,
}: EmployeeImportPageProps) {
  const { showToast } = useWuShowToast()
  const [method, setMethod] = useState<ImportMethod>('manual')
  const [rowsText, setRowsText] = useState('')
  const [excelFileName, setExcelFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [formatOpen, setFormatOpen] = useState(false)
  const excelInputRef = useRef<HTMLInputElement>(null)

  function acceptExcelFile(file?: File) {
    if (!file) return
    setExcelFileName(file.name)
    showToast({ message: `${file.name} selected`, variant: 'success' })
  }

  function handleExcelDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setIsDragging(false)
    acceptExcelFile(event.dataTransfer.files[0])
  }

  function handleImportEmployees() {
    if (!excelFileName) {
      showToast({ message: 'Select an Excel file to import', variant: 'error' })
      return
    }
    showToast({ message: 'Employees imported from Excel', variant: 'success' })
    setExcelFileName('')
  }
  const existingEmails = useMemo(
    () => new Set(employees.map((employee) => employee.email.toLowerCase())),
    [employees],
  )

  function handleAddEmployees() {
    const lines = rowsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      showToast({ message: 'Enter at least one employee email', variant: 'error' })
      return
    }
    if (lines.length > MAX_IMPORT_ROWS) {
      showToast({ message: `You can import a maximum of ${MAX_IMPORT_ROWS} rows`, variant: 'error' })
      return
    }

    const seen = new Set(existingEmails)
    const created: DirectoryEmployee[] = []
    let skipped = 0

    lines.forEach((line, index) => {
      const columns = splitCsvLine(line)
      const email = (columns[0] ?? '').trim()
      if (!email || !email.includes('@')) {
        skipped += 1
        return
      }
      if (seen.has(email.toLowerCase())) {
        skipped += 1
        return
      }
      seen.add(email.toLowerCase())

      const firstName = columns[1] ?? ''
      const lastName = columns[2] ?? ''
      const countryCode = columns[3] ?? ''
      const phone = columns[4] ?? ''
      const supervisor = columns[5] ?? ''
      const alternateEmail = columns[6] ?? ''
      const startDate = parseImportDate(columns[7] ?? '') ?? format(new Date(), 'yyyy-MM-dd')
      const employeeStatus = parseEmployeeStatus(columns[8] ?? 'active')
      const endDate = parseImportDate(columns[9] ?? '')
      const language = columns[10] || 'English'
      const catalogStart = 11
      const trailingStart = catalogStart + customFields.length
      const level = columns[trailingStart] ?? ''
      const customStatus = columns[trailingStart + 1] ?? ''
      const testField = columns[trailingStart + 2] ?? ''
      const timeZone = columns[trailingStart + 3] ?? ''

      const supervisorMatch = [...employees, ...created].find(
        (employee) =>
          employee.email.toLowerCase() === supervisor.trim().toLowerCase() ||
          getEmployeeDisplayName(employee).toLowerCase() === supervisor.trim().toLowerCase(),
      )

      let imported: DirectoryEmployee = {
        id: `emp_import_${Date.now()}_${index}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        department: '',
        location: '',
        jobTitle: '',
        jobLevel: level.trim() || undefined,
        hireDate: startDate,
        terminationDate: endDate,
        status: employeeStatus,
        managerId: supervisorMatch?.id,
        phone: formatImportedPhone(countryCode, phone),
        phoneCountry: phoneCountryFromCode(countryCode),
        language,
        survey360Count: 0,
        alternateEmail: alternateEmail.trim() || undefined,
        timeZone: timeZone.trim() || undefined,
        customFields: {
          ...(customStatus ? { status: customStatus } : {}),
          ...(testField ? { test: testField } : {}),
        },
      }
      customFields.forEach((field, fieldIndex) => {
        imported = setEmployeeFieldValue(
          imported,
          field.key,
          (columns[catalogStart + fieldIndex] ?? '').trim(),
        )
      })
      created.push(imported)
    })

    if (created.length === 0) {
      showToast({
        message: skipped > 0 ? 'No new employees added. Check emails and duplicates.' : 'No valid employees to add',
        variant: 'error',
      })
      return
    }

    onAddEmployees(created)
    setRowsText('')
    showToast({
      message:
        skipped > 0
          ? `${created.length} employees added, ${skipped} skipped`
          : `${created.length} employees added`,
      variant: 'success',
    })
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <aside className="w-52 shrink-0 border-r border-gray-200 bg-gray-50 py-3">
        {IMPORT_METHODS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              'block w-full border-l-[3px] px-4 py-2.5 text-left text-sm',
              method === item.id
                ? 'border-blue-600 bg-gray-100 font-medium text-blue-700'
                : 'border-transparent text-gray-700 hover:bg-gray-100',
            )}
            onClick={() => setMethod(item.id)}
          >
            {item.label}
          </button>
        ))}
      </aside>

      <div className="min-w-0 flex-1 px-8 py-6">
        {method === 'manual' ? (
          <>
            <div className="mb-5 flex items-center gap-2">
              <WuHeading size="sm">Manual import</WuHeading>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800"
                aria-label="Help"
                onClick={() =>
                  showToast({
                    message: 'Paste one employee per line. Email address is required.',
                    variant: 'info',
                  })
                }
              >
                <span className="wm-help text-lg leading-none" aria-hidden />
              </button>
            </div>

            <div className="w-full">
              <WuTextarea
                rows={10}
                value={rowsText}
                onChange={(event) => setRowsText(event.target.value)}
                placeholder="alex.rivera@questionpro.example, Alex, Rivera, 1, 415 555 0140"
                className="w-full"
              />
            </div>
            <WuText size="sm" as="p" className="mt-2 text-left text-gray-500">
              Enter one row per line (Max of 100)
            </WuText>

            <WuText size="sm" as="p" className="mt-4 text-gray-600">
              {getEmployeeImportFormatText(customFields)}
            </WuText>
            <WuText size="sm" as="p" className="mt-1 text-gray-600">
              Required fields: Employee Email Address
            </WuText>

            <div className="mt-5">
              <WuButton onClick={handleAddEmployees}>Add employees</WuButton>
            </div>
          </>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-2">
              <WuHeading size="sm">Bulk import - Excel</WuHeading>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800"
                aria-label="Help"
                onClick={() =>
                  showToast({
                    message: 'Upload an Excel file using the employee import template.',
                    variant: 'info',
                  })
                }
              >
                <span className="wm-help text-lg leading-none" aria-hidden />
              </button>
            </div>
            <div className="max-w-[720px] rounded-lg border border-gray-200 bg-white p-6">
              <div className="grid grid-cols-1 items-start gap-x-12 gap-y-6 sm:grid-cols-[minmax(0,1fr)_200px]">
                <div>
                  <p className="text-[15px] font-semibold leading-6 text-gray-900">
                    To import contacts from file
                  </p>
                  <ol className="mt-5 space-y-3">
                    {BULK_IMPORT_STEPS.map((step, index) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">
                          {index + 1}
                        </span>
                        <span className="text-sm leading-5 text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    className="mt-5 text-sm font-medium text-blue-700 hover:underline"
                    onClick={() => setFormatOpen(true)}
                  >
                    Import format
                  </button>
                </div>

                <button
                  type="button"
                  className={cn(
                    'flex h-[200px] w-full flex-col items-center justify-center rounded-md border border-dashed px-3 text-center transition-colors',
                    isDragging || excelFileName
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40',
                  )}
                  onClick={() => excelInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleExcelDrop}
                >
                  <span className="wc-data-import text-3xl text-gray-400" aria-hidden />
                  <span className="mt-3 px-1 text-sm leading-5 text-gray-700">
                    {excelFileName ? (
                      <span className="line-clamp-3 break-all font-medium">{excelFileName}</span>
                    ) : (
                      <>
                        Drag your file here or{' '}
                        <span className="font-medium text-blue-700">browse</span>
                      </>
                    )}
                  </span>
                </button>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(event) => {
                    acceptExcelFile(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-5">
                <WuButton onClick={handleImportEmployees}>Import employees</WuButton>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
                  onClick={() =>
                    showToast({ message: 'Employee import template downloaded', variant: 'success' })
                  }
                >
                  <span className="wm-download text-base" aria-hidden />
                  Download import template
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <EmployeeImportFormatModal
        open={formatOpen}
        onOpenChange={setFormatOpen}
        customFields={customFields}
      />
    </div>
  )
}
