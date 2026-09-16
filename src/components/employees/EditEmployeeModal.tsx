'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { preventModalDismiss } from '@/lib/modalProps'
import type { DirectoryCustomField } from '@/data/mock-custom-fields'
import {
  getEmployeeFieldValue,
  setEmployeeFieldValue,
  type DirectoryEmployee,
} from '@/data/mock-employee-directory'
import type { EmployeeStatus } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuDatePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuDatePicker })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuFormGroup })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalClose = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalClose })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalContent })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalFooter })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)

type SelectOption = {
  value: string
  label: string
}

const SELECT_PLACEHOLDER: SelectOption = { value: '', label: '-Select-' }

const EMPLOYEE_STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'terminated', label: 'Terminated' },
]

const LEVEL_OPTIONS: SelectOption[] = [
  SELECT_PLACEHOLDER,
  { value: 'Individual Contributor', label: 'Individual Contributor' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Director', label: 'Director' },
  { value: 'Senior VP/VP', label: 'Senior VP/VP' },
  { value: 'C-Suite/Exec', label: 'C-Suite/Exec' },
]

const CUSTOM_STATUS_OPTIONS: SelectOption[] = [
  SELECT_PLACEHOLDER,
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Intern', label: 'Intern' },
]

const TIMEZONE_OPTIONS: SelectOption[] = [
  SELECT_PLACEHOLDER,
  { value: 'Pacific Time', label: 'Pacific Time' },
  { value: 'Mountain Time', label: 'Mountain Time' },
  { value: 'Central Time', label: 'Central Time' },
  { value: 'Eastern Time', label: 'Eastern Time' },
  { value: 'GMT', label: 'GMT' },
  { value: 'India Standard Time', label: 'India Standard Time' },
]

const MEMBER_STATUS_OPTIONS: SelectOption[] = [
  SELECT_PLACEHOLDER,
  { value: 'Active', label: 'Active' },
  { value: 'Unsubscribed', label: 'Unsubscribed' },
  { value: 'Bounced', label: 'Bounced' },
]

const PHONE_COUNTRIES: SelectOption[] = [
  { value: 'US', label: '🇺🇸' },
  { value: 'IN', label: '🇮🇳' },
  { value: 'GB', label: '🇬🇧' },
]

const PHONE_PREFIX: Record<string, string> = {
  US: '+1',
  IN: '+91',
  GB: '+44',
}

type EditEmployeeModalProps = {
  employee: DirectoryEmployee | null
  employees: DirectoryEmployee[]
  customFields?: DirectoryCustomField[]
  onOpenChange: (open: boolean) => void
  onSave: (employee: DirectoryEmployee) => void
}

function optionFrom(options: SelectOption[], value?: string) {
  return options.find((option) => option.value === value) ?? options[0] ?? SELECT_PLACEHOLDER
}

function countryFromPhone(phone: string, fallback?: string) {
  if (fallback) return fallback
  if (phone.startsWith('+91')) return 'IN'
  if (phone.startsWith('+44')) return 'GB'
  return 'US'
}

function nationalPhoneNumber(phone: string) {
  return phone.replace(/^\+91\s*/, '').replace(/^\+44\s*/, '').replace(/^\+1\s*/, '')
}

function formatPhone(country: string, number: string) {
  const prefix = PHONE_PREFIX[country] ?? '+1'
  const national = nationalPhoneNumber(number).trim()
  return national ? `${prefix} ${national}` : prefix
}

function nextCustomFields(
  existing: Record<string, string> | undefined,
  status: string,
  test: string,
) {
  const next: Record<string, string> = { ...existing }
  if (status) next.status = status
  else delete next.status
  if (test) next.test = test
  else delete next.test
  return Object.keys(next).length > 0 ? next : undefined
}

function FormSelect({
  options,
  value,
  onChange,
}: {
  options: SelectOption[]
  value: SelectOption
  onChange: (option: SelectOption) => void
}) {
  return (
    <WuSelect
      data={options}
      accessorKey={{ value: 'value', label: 'label' }}
      value={value}
      onSelect={(selected) => {
        const option = (Array.isArray(selected) ? selected[0] : selected) as SelectOption | null
        if (option) onChange(option)
      }}
      variant="outlined"
    />
  )
}

export function EditEmployeeModal({
  employee,
  employees,
  customFields = [],
  onOpenChange,
  onSave,
}: EditEmployeeModalProps) {
  const { showToast } = useWuShowToast()
  const [email, setEmail] = useState('')
  const [alternateEmail, setAlternateEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneCountry, setPhoneCountry] = useState<SelectOption>(PHONE_COUNTRIES[0])
  const [phone, setPhone] = useState('')
  const [supervisor, setSupervisor] = useState<SelectOption>(SELECT_PLACEHOLDER)
  const [hireDate, setHireDate] = useState('')
  const [employeeStatus, setEmployeeStatus] = useState<SelectOption>(EMPLOYEE_STATUS_OPTIONS[0])
  const [catalogValues, setCatalogValues] = useState<Record<string, SelectOption>>({})
  const [level, setLevel] = useState<SelectOption>(SELECT_PLACEHOLDER)
  const [customStatus, setCustomStatus] = useState<SelectOption>(SELECT_PLACEHOLDER)
  const [testField, setTestField] = useState('')
  const [timeZone, setTimeZone] = useState<SelectOption>(SELECT_PLACEHOLDER)
  const [memberStatus, setMemberStatus] = useState<SelectOption>(SELECT_PLACEHOLDER)
  const [isAdmin, setIsAdmin] = useState(false)

  const supervisorOptions = useMemo(
    () => [
      SELECT_PLACEHOLDER,
      ...employees
        .filter((item) => item.id !== employee?.id)
        .map((item) => ({ value: item.id, label: item.email })),
    ],
    [employee?.id, employees],
  )

  const catalogOptions = useMemo(() => {
    const optionsByKey: Record<string, SelectOption[]> = {}
    customFields.forEach((field) => {
      const used = employees.map((item) => getEmployeeFieldValue(item, field.key))
      const seen = new Set<string>()
      const options: SelectOption[] = [SELECT_PLACEHOLDER]
      ;[...field.options, ...used].forEach((value) => {
        if (!value || seen.has(value)) return
        seen.add(value)
        options.push({ value, label: value })
      })
      optionsByKey[field.key] = options
    })
    return optionsByKey
  }, [customFields, employees])

  useEffect(() => {
    if (!employee) return
    setEmail(employee.email)
    setAlternateEmail(employee.alternateEmail ?? '')
    setFirstName(employee.firstName)
    setLastName(employee.lastName)
    setPhoneCountry(optionFrom(PHONE_COUNTRIES, countryFromPhone(employee.phone, employee.phoneCountry)))
    setPhone(nationalPhoneNumber(employee.phone))
    setSupervisor(
      optionFrom(supervisorOptions, employee.managerId === employee.id ? '' : employee.managerId),
    )
    setHireDate(employee.hireDate)
    setEmployeeStatus(optionFrom(EMPLOYEE_STATUS_OPTIONS, employee.status))
    const nextCatalog: Record<string, SelectOption> = {}
    customFields.forEach((field) => {
      nextCatalog[field.key] = optionFrom(
        catalogOptions[field.key] ?? [SELECT_PLACEHOLDER],
        getEmployeeFieldValue(employee, field.key),
      )
    })
    setCatalogValues(nextCatalog)
    setLevel(optionFrom(LEVEL_OPTIONS, employee.jobLevel))
    setCustomStatus(optionFrom(CUSTOM_STATUS_OPTIONS, employee.customFields?.status))
    setTestField(employee.customFields?.test ?? '')
    setTimeZone(optionFrom(TIMEZONE_OPTIONS, employee.timeZone))
    setMemberStatus(optionFrom(MEMBER_STATUS_OPTIONS, employee.memberStatus))
    setIsAdmin(Boolean(employee.isAdmin))
  }, [catalogOptions, customFields, employee, supervisorOptions])

  function handleSave() {
    if (!employee) return
    if (!email.trim()) {
      showToast({ message: 'Email address is required', variant: 'error' })
      return
    }

    let nextEmployee: DirectoryEmployee = {
      ...employee,
      email: email.trim(),
      alternateEmail: alternateEmail.trim() || undefined,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: formatPhone(phoneCountry.value, phone),
      phoneCountry: phoneCountry.value,
      managerId: supervisor.value || undefined,
      hireDate,
      status: employeeStatus.value as EmployeeStatus,
      jobLevel: level.value || undefined,
      timeZone: timeZone.value || undefined,
      memberStatus: memberStatus.value || undefined,
      isAdmin,
      customFields: nextCustomFields(employee.customFields, customStatus.value, testField.trim()),
    }
    customFields.forEach((field) => {
      nextEmployee = setEmployeeFieldValue(
        nextEmployee,
        field.key,
        catalogValues[field.key]?.value ?? '',
      )
    })
    onSave(nextEmployee)
    showToast({ message: 'Employee details saved', variant: 'success' })
    onOpenChange(false)
  }

  return (
    <WuModal
      open={Boolean(employee)}
      onOpenChange={onOpenChange}
      size="lg"
      maxWidth="880px"
      maxHeight="90vh"
      {...preventModalDismiss}
    >
      <WuModalHeader>Edit Employee Details</WuModalHeader>
      <WuModalContent>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <WuButton
            variant="secondary"
            size="sm"
            Icon={<span className="wm-mail-outline" aria-hidden />}
            onClick={() => showToast({ message: 'Deployment history opened', variant: 'info' })}
          >
            Deployment History
          </WuButton>
          <WuButton
            variant="secondary"
            size="sm"
            onClick={() => showToast({ message: 'Password reset link copied', variant: 'success' })}
          >
            Reset Password Link
          </WuButton>
          <WuButton
            size="sm"
            Icon={<span className="wm-mail" aria-hidden />}
            onClick={() =>
              showToast({ message: 'Password reset email sent', variant: 'success' })
            }
          >
            Email Reset Link
          </WuButton>
          <WuButton
            variant="iconOnly"
            size="sm"
            aria-label="Help"
            Icon={<span className="wm-help" aria-hidden />}
            onClick={() =>
              showToast({
                message: 'Sends a password reset email to this employee',
                variant: 'info',
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          <WuFormGroup
            Label="Email Address"
            Input={<WuInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} />}
          />
          <WuFormGroup
            Label="Alternate Email Address"
            Input={
              <WuInput
                type="email"
                value={alternateEmail}
                onChange={(event) => setAlternateEmail(event.target.value)}
              />
            }
          />
          <WuFormGroup
            Label="First Name"
            Input={<WuInput value={firstName} onChange={(event) => setFirstName(event.target.value)} />}
          />
          <WuFormGroup
            Label="Last Name"
            Input={<WuInput value={lastName} onChange={(event) => setLastName(event.target.value)} />}
          />
          <WuFormGroup
            Label="Phone"
            Input={
              <div className="flex items-center gap-2">
                <div className="w-[88px] shrink-0">
                  <FormSelect options={PHONE_COUNTRIES} value={phoneCountry} onChange={setPhoneCountry} />
                </div>
                <WuInput value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
            }
          />
          <WuFormGroup
            Label="Supervisor Email Address"
            Input={<FormSelect options={supervisorOptions} value={supervisor} onChange={setSupervisor} />}
          />
          <WuFormGroup
            Label="Start Date"
            Input={
              <WuDatePicker
                value={hireDate ? new Date(`${hireDate}T00:00:00`) : undefined}
                onChange={(date) => setHireDate(date ? format(date, 'yyyy-MM-dd') : '')}
                variant="outlined"
                placeholder="Select date"
              />
            }
          />
          <WuFormGroup
            Label="Employee Status"
            Input={
              <FormSelect
                options={EMPLOYEE_STATUS_OPTIONS}
                value={employeeStatus}
                onChange={setEmployeeStatus}
              />
            }
          />
          {customFields.map((field) => (
            <WuFormGroup
              key={field.key}
              Label={field.title}
              Input={
                <FormSelect
                  options={catalogOptions[field.key] ?? [SELECT_PLACEHOLDER]}
                  value={catalogValues[field.key] ?? SELECT_PLACEHOLDER}
                  onChange={(option) =>
                    setCatalogValues((current) => ({ ...current, [field.key]: option }))
                  }
                />
              }
            />
          ))}
          <WuFormGroup
            Label="Level"
            Input={<FormSelect options={LEVEL_OPTIONS} value={level} onChange={setLevel} />}
          />
          <WuFormGroup
            Label="Status"
            Input={
              <FormSelect options={CUSTOM_STATUS_OPTIONS} value={customStatus} onChange={setCustomStatus} />
            }
          />
          <WuFormGroup
            Label="test"
            Input={<WuInput value={testField} onChange={(event) => setTestField(event.target.value)} />}
          />
          <WuFormGroup
            Label="Time Zone"
            Input={<FormSelect options={TIMEZONE_OPTIONS} value={timeZone} onChange={setTimeZone} />}
          />
          <WuFormGroup
            Label="Member Status"
            Input={
              <FormSelect options={MEMBER_STATUS_OPTIONS} value={memberStatus} onChange={setMemberStatus} />
            }
          />
          <WuFormGroup Label="Admin" Input={<WuToggle checked={isAdmin} onChange={setIsAdmin} />} />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleSave}>Save Changes</WuButton>
      </WuModalFooter>
    </WuModal>
  )
}
