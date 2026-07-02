'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { preventModalDismiss } from '@/lib/modalProps'
import type { Employee, EmployeeStatus } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
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

type SelectOption = {
  value: string
  label: string
}

type AddEmployeeModalProps = {
  open: boolean
  employees: Employee[]
  departments: string[]
  locations: string[]
  onOpenChange: (open: boolean) => void
  onAddEmployee: (employee: Employee) => void
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
]

function toOptions(values: string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }))
}

export function AddEmployeeModal({
  open,
  employees,
  departments,
  locations,
  onOpenChange,
  onAddEmployee,
}: AddEmployeeModalProps) {
  const { showToast } = useWuShowToast()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState<SelectOption | null>(null)
  const [location, setLocation] = useState<SelectOption | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [hireDate, setHireDate] = useState('')
  const [manager, setManager] = useState<SelectOption | null>(null)
  const [status, setStatus] = useState<SelectOption>(STATUS_OPTIONS[0])
  const [error, setError] = useState('')

  const departmentOptions = toOptions(departments)
  const locationOptions = toOptions(locations)
  const managerOptions = employees.map((employee) => ({
    value: employee.id,
    label: `${employee.firstName} ${employee.lastName}`,
  }))

  function resetForm() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setDepartment(null)
    setLocation(null)
    setJobTitle('')
    setHireDate('')
    setManager(null)
    setStatus(STATUS_OPTIONS[0])
    setError('')
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) resetForm()
  }

  function handleSelect(
    value: unknown,
    setter: (option: SelectOption | null) => void,
  ) {
    const selected = value as SelectOption | SelectOption[]
    setter((Array.isArray(selected) ? selected[0] : selected) ?? null)
  }

  function handleSave() {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !department ||
      !location ||
      !jobTitle.trim() ||
      !hireDate
    ) {
      setError('Complete all required fields before saving.')
      return
    }

    const employee: Employee = {
      id: `emp_${String(employees.length + 1).padStart(3, '0')}_${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      department: department.value,
      location: location.value,
      jobTitle: jobTitle.trim(),
      hireDate,
      status: status.value as EmployeeStatus,
      managerId: manager?.value,
    }

    onAddEmployee(employee)
    showToast({ message: 'Employee added successfully.', variant: 'success' })
    handleOpenChange(false)
  }

  return (
    <WuModal open={open} onOpenChange={handleOpenChange} size="md">
      <WuModalHeader>Add Employee</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <WuFormGroup
            Label="First Name"
            Input={<WuInput value={firstName} onChange={(event) => setFirstName(event.target.value)} />}
          />
          <WuFormGroup
            Label="Last Name"
            Input={<WuInput value={lastName} onChange={(event) => setLastName(event.target.value)} />}
          />
          <WuFormGroup
            Label="Email"
            Input={<WuInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} />}
          />
          <WuFormGroup
            Label="Department"
            Input={
              <WuSelect
                data={departmentOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={department}
                onSelect={(value) => handleSelect(value, setDepartment)}
                variant="outlined"
                placeholder="Select department"
              />
            }
          />
          <WuFormGroup
            Label="Location"
            Input={
              <WuSelect
                data={locationOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={location}
                onSelect={(value) => handleSelect(value, setLocation)}
                variant="outlined"
                placeholder="Select location"
              />
            }
          />
          <WuFormGroup
            Label="Job Title"
            Input={<WuInput value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />}
          />
          <WuFormGroup
            Label="Hire Date"
            Input={<WuInput type="date" value={hireDate} onChange={(event) => setHireDate(event.target.value)} />}
          />
          <WuFormGroup
            Label="Manager"
            Input={
              <WuSelect
                data={managerOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={manager}
                onSelect={(value) => handleSelect(value, setManager)}
                variant="outlined"
                placeholder="Select manager"
              />
            }
          />
          <WuFormGroup
            Label="Status"
            Input={
              <WuSelect
                data={STATUS_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={status}
                onSelect={(value) => handleSelect(value, (option) => option && setStatus(option))}
                variant="outlined"
              />
            }
          />
          {error && <div className="md:col-span-2 text-sm text-red-600">{error}</div>}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-3">
          <WuButton variant="secondary" onClick={() => handleOpenChange(false)}>
            Cancel
          </WuButton>
          <WuButton variant="primary" onClick={handleSave}>
            Save Employee
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
