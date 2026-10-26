'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { MailInlineField, type MailSelectOption } from '@/components/modules/feedback360/MailComposeCard'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'
import { getEmployeeDisplayName, type DirectoryEmployee } from '@/data/mock-employee-directory'
import { employeeMatchesFilterGroups, type EmployeeFilterPreset } from '@/data/mock-employee-filters'
import {
  LIFECYCLE_DELIVERY_MODES,
  type LifecycleDeliveryMode,
} from '@/data/mock/lifecycleMail'

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
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
  { ssr: false },
)

type RecipientOption = MailSelectOption & { email: string }

export function DeliveryModeField({
  value,
  onChange,
}: {
  value: LifecycleDeliveryMode[]
  onChange: (next: LifecycleDeliveryMode[]) => void
}) {
  function toggle(mode: LifecycleDeliveryMode) {
    if (value.includes(mode)) {
      if (value.length === 1) return
      onChange(value.filter((item) => item !== mode))
      return
    }
    onChange([...value, mode])
  }

  return (
    <MailInlineField label="Deliver :" className="min-w-[280px] flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {LIFECYCLE_DELIVERY_MODES.map((mode) => {
          const active = value.includes(mode.id)
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => toggle(mode.id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium ring-1 transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700 ring-blue-200'
                  : 'bg-white text-gray-600 ring-gray-200 hover:text-gray-900',
              )}
            >
              {mode.label}
            </button>
          )
        })}
      </div>
    </MailInlineField>
  )
}

export function RecipientPicker({
  employees,
  selectedIds,
  onChange,
  groups,
}: {
  employees: DirectoryEmployee[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  groups: EmployeeFilterPreset[]
}) {
  const [query, setQuery] = useState('')
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupId, setGroupId] = useState('')

  const options = useMemo<RecipientOption[]>(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${getEmployeeDisplayName(employee)} (${employee.email})`,
        email: employee.email,
      })),
    [employees],
  )

  const selected = options.filter((option) => selectedIds.includes(option.value))
  const needle = query.trim().toLowerCase()
  const visible = needle
    ? options.filter(
        (option) =>
          selectedIds.includes(option.value) ||
          option.label.toLowerCase().includes(needle) ||
          option.email.toLowerCase().includes(needle),
      )
    : options

  const groupOptions = groups.map((group) => ({ value: group.id, label: group.name }))
  const selectedGroup = groupOptions.find((option) => option.value === groupId) ?? groupOptions[0] ?? null

  function addGroup() {
    const group = groups.find((item) => item.id === groupId) ?? groups[0]
    if (!group) return
    const matched = employees
      .filter((employee) => employeeMatchesFilterGroups(employee, group.groups))
      .map((employee) => employee.id)
    onChange([...new Set([...selectedIds, ...matched])])
    setGroupOpen(false)
  }

  return (
    <>
      <MailInlineField label="To :" className="min-w-[280px] flex-[1.4]">
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <WuSelect
              data={visible}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selected}
              onSelect={(next) => {
                const rows = (Array.isArray(next) ? next : next ? [next] : []) as RecipientOption[]
                onChange(rows.map((row) => row.value))
              }}
              multiple
              selectAll={{ enable: true, label: 'All employees' }}
              variant="outlined"
              placeholder="Type a name or email"
              Header={
                <div className="p-2">
                  <WuInput
                    variant="outlined"
                    value={query}
                    placeholder="Type a name or email"
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              }
            />
          </div>
          <WuButton
            variant="secondary"
            size="sm"
            onClick={() => {
              setGroupId(groups[0]?.id ?? '')
              setGroupOpen(true)
            }}
          >
            Add group
          </WuButton>
        </div>
      </MailInlineField>

      <WuModal open={groupOpen} onOpenChange={setGroupOpen} size="sm" {...preventModalDismiss}>
        <WuModalHeader>Add group</WuModalHeader>
        <WuModalContent>
          {groupOptions.length === 0 ? (
            <p className="text-sm text-gray-600">No employee groups yet. Create one in the employee list.</p>
          ) : (
            <WuFormGroup
              Label="Employee group"
              Input={
                <WuSelect
                  data={groupOptions}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedGroup}
                  onSelect={(next) => {
                    const option = (Array.isArray(next) ? next[0] : next) as MailSelectOption | null
                    setGroupId(option?.value ?? '')
                  }}
                  variant="outlined"
                />
              }
            />
          )}
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setGroupOpen(false)}>
            Cancel
          </WuButton>
          <WuButton onClick={addGroup} disabled={groupOptions.length === 0}>
            Add group
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </>
  )
}

export function AddFromEmailModal({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (option: MailSelectOption) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  function save() {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) {
      setError('Add a from name.')
      return
    }
    if (!trimmedEmail.includes('@')) {
      setError('Add a valid from email.')
      return
    }
    onAdd({
      value: trimmedEmail,
      label: `${trimmedName} (${trimmedEmail})`,
    })
    setName('')
    setEmail('')
    setError('')
    onOpenChange(false)
  }

  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="sm" {...preventModalDismiss}>
      <WuModalHeader>Add from email</WuModalHeader>
      <WuModalContent>
        <div className="space-y-4">
          <WuFormGroup
            Label="From name"
            Input={
              <WuInput
                variant="outlined"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError('')
                }}
              />
            }
          />
          <WuFormGroup
            Label="From email"
            Input={
              <WuInput
                variant="outlined"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError('')
                }}
              />
            }
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuButton variant="secondary" onClick={() => onOpenChange(false)}>
          Cancel
        </WuButton>
        <WuButton onClick={save}>Add email</WuButton>
      </WuModalFooter>
    </WuModal>
  )
}

export function ChannelExtraFields({
  modes,
  smsBody,
  slackBody,
  onSmsChange,
  onSlackChange,
}: {
  modes: LifecycleDeliveryMode[]
  smsBody: string
  slackBody: string
  onSmsChange: (value: string) => void
  onSlackChange: (value: string) => void
}) {
  const primary = modes.includes('email') ? 'email' : modes.includes('sms') ? 'sms' : 'slack'
  const showSms = modes.includes('sms') && primary !== 'sms'
  const showSlack = modes.includes('slack') && primary !== 'slack'
  if (!showSms && !showSlack) return null

  return (
    <div className="space-y-3 border-b border-gray-200 bg-white px-5 py-3">
      {showSms ? (
        <WuFormGroup
          Label="SMS message"
          Input={
            <WuTextarea
              rows={2}
              value={smsBody}
              onChange={(event) => onSmsChange(event.target.value)}
            />
          }
        />
      ) : null}
      {showSlack ? (
        <WuFormGroup
          Label="Slack message"
          Input={
            <WuTextarea
              rows={2}
              value={slackBody}
              onChange={(event) => onSlackChange(event.target.value)}
            />
          }
        />
      ) : null}
    </div>
  )
}

export function primaryDeliveryMode(modes: LifecycleDeliveryMode[]): LifecycleDeliveryMode {
  if (modes.includes('email')) return 'email'
  if (modes.includes('sms')) return 'sms'
  return 'slack'
}
