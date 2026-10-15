'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { CollectorHeadcountModal, type CollectorHeadcountHandle } from '@/components/studies/CollectorHeadcountModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { type CollectorEmployeeField, type CollectorForm } from '@/data/mock-collector-forms'
import { getEmployeeDisplayName, type DirectoryEmployee } from '@/data/mock-employee-directory'
import { formatStudyDate } from '@/data/mock-utils'
import { useSurveyDistribution } from '@/lib/distributionStore'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'
import { useRosterStore } from '@/lib/rosterStore'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTable })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
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
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
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
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)

type DistributeSubTab = 'send' | 'collectorForms'

const DISTRIBUTE_TABS: { id: DistributeSubTab; label: string; icon: string }[] = [
  { id: 'send', label: 'Send', icon: 'wm-mail' },
  { id: 'collectorForms', label: 'Collector forms', icon: 'wm-groups' },
]

const EMPLOYEE_FIELD_OPTIONS = [
  { value: 'First Name', label: 'First Name' },
  { value: 'Last Name', label: 'Last Name' },
  { value: 'Email address', label: 'Email address' },
  { value: 'Employee ID', label: 'Employee ID' },
  { value: 'Department', label: 'Department' },
  { value: 'Location', label: 'Location' },
  { value: 'Job title', label: 'Job title' },
]

type CollectorDraft = {
  name: string
  active: boolean
  validateEmployee: boolean
  validateByEmail: boolean
  collectEmployeeData: boolean
  fields: CollectorEmployeeField[]
}

function RowAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <WuTooltip content={label} position="top" showArrow>
      <button
        type="button"
        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        aria-label={label}
        onClick={onClick}
      >
        <span className={`${icon} text-base leading-none`} aria-hidden />
      </button>
    </WuTooltip>
  )
}

function newFieldId() {
  return `fld_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function defaultEmployeeField(): CollectorEmployeeField {
  return { id: newFieldId(), name: 'First Name', required: false, custom: false }
}

function emptyCollectorDraft(): CollectorDraft {
  return {
    name: '',
    active: true,
    validateEmployee: true,
    validateByEmail: true,
    collectEmployeeData: true,
    fields: [defaultEmployeeField()],
  }
}

function showEmployeeFields(draft: CollectorDraft) {
  return !draft.validateEmployee || draft.collectEmployeeData
}

function showEmailOption(draft: CollectorDraft) {
  return draft.validateEmployee || draft.collectEmployeeData
}

const CREATE_STEPS = [
  { icon: '📝', label: 'Collector form' },
  { icon: '↑', label: 'Expected responses' },
] as const

function CollectorStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CREATE_STEPS.map((stepItem, index) => (
        <span key={stepItem.label} className="flex items-center gap-2">
          {index < currentStep ? (
            <span className="text-sm font-medium text-blue-400" aria-hidden>
              ✓
            </span>
          ) : null}
          <span
            className={cn(
              'flex items-center gap-1 text-sm',
              index === currentStep && 'font-semibold text-blue-600',
              index < currentStep && 'text-blue-400',
              index > currentStep && 'text-gray-400',
            )}
          >
            <span aria-hidden>{stepItem.icon}</span>
            {stepItem.label}
          </span>
          {index < CREATE_STEPS.length - 1 ? (
            <span className="text-gray-300" aria-hidden>
              &gt;
            </span>
          ) : null}
        </span>
      ))}
    </div>
  )
}

function ensureEmployeeFields(fields: CollectorEmployeeField[]) {
  return fields.length > 0 ? fields : [defaultEmployeeField()]
}

function draftFromCollector(form: CollectorForm): CollectorDraft {
  const draft: CollectorDraft = {
    name: form.name,
    active: form.status === 'Active',
    validateEmployee: form.validateEmployee,
    validateByEmail: form.validateByEmail,
    collectEmployeeData: form.collectEmployeeData,
    fields: form.employeeFields.map((field) => ({ ...field, custom: false })),
  }
  return showEmployeeFields(draft) ? { ...draft, fields: ensureEmployeeFields(draft.fields) } : draft
}

export function StudyDistributionPage({
  studyName: studyNameProp,
  surveyId,
  embedded = false,
  initialSubTab = 'send',
}: {
  studyName?: string
  surveyId?: string
  embedded?: boolean
  initialSubTab?: DistributeSubTab
}) {
  const searchParams = useSearchParams()
  const { showToast } = useWuShowToast()
  const { employees } = useRosterStore()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const studyName = studyNameProp?.trim() || searchParams.get('study')?.trim() || 'this study'
  const resolvedSurveyId = surveyId?.trim() || 'survey_unknown'
  const { collectorForms: collectors, setCollectorForms } = useSurveyDistribution(resolvedSurveyId)
  const [subTab, setSubTab] = useState<DistributeSubTab>(initialSubTab)
  const [createOpen, setCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState(0)
  const [createSession, setCreateSession] = useState(0)
  const [responsesBlocked, setResponsesBlocked] = useState(false)
  const headcountRef = useRef<CollectorHeadcountHandle>(null)
  const [draft, setDraft] = useState<CollectorDraft>(emptyCollectorDraft)
  const [editing, setEditing] = useState<CollectorForm | null>(null)
  const [qrForm, setQrForm] = useState<CollectorForm | null>(null)
  const [deleteForm, setDeleteForm] = useState<CollectorForm | null>(null)
  const allSelected = employees.length > 0 && selectedIds.size === employees.length

  function toggle(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(employees.map((employee) => employee.id)) : new Set())
  }

  function sendInvites() {
    if (selectedIds.size === 0) {
      showToast({ message: 'Select at least one employee', variant: 'error' })
      return
    }
    showToast({
      message: `Survey sent to ${selectedIds.size} employees`,
      variant: 'success',
    })
    setSelectedIds(new Set())
  }

  const columns = useMemo<IWuTableColumnDef<DirectoryEmployee>[]>(
    () => [
      {
        accessorKey: 'id',
        id: 'select',
        header: () => (
          <WuCheckbox checked={allSelected} partial={selectedIds.size > 0 && !allSelected} onChange={toggleAll} />
        ),
        size: 44,
        enableSorting: false,
        cell: ({ row }) => (
          <WuCheckbox
            checked={selectedIds.has(row.original.id)}
            onChange={(checked) => toggle(row.original.id, checked)}
          />
        ),
      },
      {
        accessorKey: 'firstName',
        header: 'Name',
        cell: ({ row }) => getEmployeeDisplayName(row.original),
      },
      {
        accessorKey: 'email',
        header: 'Email address',
      },
      {
        accessorKey: 'department',
        header: 'Department',
      },
      {
        accessorKey: 'location',
        header: 'Location',
      },
    ],
    [allSelected, selectedIds],
  )

  function copyLink(form: CollectorForm) {
    void navigator.clipboard.writeText(form.link)
    showToast({ message: 'Link copied', variant: 'success' })
  }

  const collectorColumns = useMemo<IWuTableColumnDef<CollectorForm>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <button
            type="button"
            className="block max-w-md truncate text-left text-sm text-blue-700 hover:underline"
            onClick={() => openEditor(row.original)}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Date created',
        cell: ({ row }) => formatStudyDate(row.original.createdAt),
      },
      {
        accessorKey: 'modifiedAt',
        header: 'Date modified',
        cell: ({ row }) => formatStudyDate(row.original.modifiedAt),
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        accessorKey: 'responsesCollected',
        header: 'Responses',
      },
      {
        accessorKey: 'id',
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <RowAction icon="wm-content-copy" label="Copy link" onClick={() => copyLink(row.original)} />
            <RowAction icon="wm-qr-code" label="QR code" onClick={() => setQrForm(row.original)} />
            <RowAction icon="wm-edit" label="Edit" onClick={() => openEditor(row.original)} />
            <RowAction icon="wm-delete" label="Delete" onClick={() => setDeleteForm(row.original)} />
          </div>
        ),
      },
    ],
    [showToast],
  )

  function openEditor(form: CollectorForm) {
    setCreateOpen(false)
    setEditing(form)
    setDraft(draftFromCollector(form))
    setCreateStep(0)
    setCreateSession((current) => current + 1)
    setResponsesBlocked(false)
  }

  function closeEditor() {
    setCreateOpen(false)
    setEditing(null)
    setDraft(emptyCollectorDraft())
    setCreateStep(0)
  }

  const onResponsesBlocked = useCallback((blocked: boolean) => {
    setResponsesBlocked(blocked)
  }, [])

  function updateField(id: string, patch: Partial<CollectorEmployeeField>) {
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    }))
  }

  function createCollector() {
    const name = draft.name.trim()
    if (!name) {
      showToast({ message: 'Enter a name for the collector form', variant: 'error' })
      return
    }
    const today = new Date().toISOString()
    const settings = {
      name,
      status: draft.active ? ('Active' as const) : ('Inactive' as const),
      validateEmployee: draft.validateEmployee,
      validateByEmail: showEmailOption(draft) && draft.validateByEmail,
      collectEmployeeData: draft.collectEmployeeData,
      employeeFields: showEmployeeFields(draft)
        ? ensureEmployeeFields(draft.fields).map((field) => ({
            ...field,
            custom: false,
            name: field.name.trim() || 'First Name',
          }))
        : [],
      modifiedAt: today,
    }
    const headcount = headcountRef.current?.commit() ?? null
    if (!headcount) return
    if (editing) {
      setCollectorForms((current) =>
        current.map((item) =>
          item.id === editing.id
            ? { ...item, ...settings, headcount, responsesExpected: headcount.totalExpected }
            : item,
        ),
      )
      closeEditor()
      showToast({ message: 'Collector form updated', variant: 'success' })
      return
    }
    const id = `cf_${Date.now().toString(36)}`
    setCollectorForms((current) => [
      {
        id,
        link: `https://ex.questionpro.com/c/${id}`,
        responsesCollected: 0,
        responsesExpected: headcount.totalExpected,
        createdAt: today,
        headcount,
        ...settings,
      },
      ...current,
    ])
    closeEditor()
    showToast({ message: 'Collector form created', variant: 'success' })
  }

  useEffect(() => {
    if (searchParams.get('section') !== 'headcount') return
    setSubTab('collectorForms')
  }, [searchParams])

  const emailOption = (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <WuCheckbox
        checked={draft.validateByEmail}
        onChange={(checked) => setDraft((current) => ({ ...current, validateByEmail: checked }))}
      />
      Email address
    </label>
  )

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="border-b border-gray-200 bg-white">
        {embedded ? null : (
          <div className="px-6 pt-6">
            <WuHeading size="sm" className="text-gray-800">
              Distribute {studyName}
            </WuHeading>
            <WuText size="sm" className="mt-1 text-gray-500">
              {subTab === 'send'
                ? 'Select employees from the roster and send the survey.'
                : 'Share a link so people can open it and respond.'}
            </WuText>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-[#f7f9fc] px-4 py-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {DISTRIBUTE_TABS.map((tab) => {
              const active = tab.id === subTab
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSubTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    active ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800',
                  )}
                >
                  <span className={`${tab.icon} text-base leading-none`} aria-hidden />
                  {tab.label}
                </button>
              )
            })}
          </div>
          {subTab === 'send' ? (
            <WuButton onClick={sendInvites} disabled={selectedIds.size === 0}>
              Send to {selectedIds.size || 'selected'}
            </WuButton>
          ) : null}
        </div>
      </div>

      <div className="px-6 py-6">
      {subTab === 'collectorForms' ? (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#1B3A6B]">Collector forms</h2>
            <WuTooltip
              content="A collector form is a link people can open to take this survey without an email invite."
              position="right"
              showArrow
            >
              <span
                className="inline-flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white"
                aria-label="About collector forms"
              >
                ?
              </span>
            </WuTooltip>
          </div>
          <div className="mb-4">
            <WuButton
              onClick={() => {
                setEditing(null)
                setDraft(emptyCollectorDraft())
                setCreateStep(0)
                setCreateSession((current) => current + 1)
                setResponsesBlocked(false)
                setCreateOpen(true)
              }}
            >
              <span className="mr-1" aria-hidden>
                +
              </span>
              New collector form
            </WuButton>
          </div>
          {collectors.length === 0 ? (
            <EmptyState
              icon="wm-groups"
              title="No collector forms"
              description="Create a link people can open to take this survey."
            />
          ) : (
            <WuTable
              data={collectors as unknown[]}
              columns={collectorColumns as unknown as IWuTableColumnDef<unknown>[]}
              variant="striped"
              size="compact"
              stickyHeader
              maxHeight="calc(100vh - 320px)"
            />
          )}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon="wm-person"
          title="No employees in the list"
          description="Import employees before distributing a study."
        />
      ) : (
        <div>
          <WuTable
            data={employees as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            variant="striped"
            size="compact"
            stickyHeader
            maxHeight="calc(100vh - 220px)"
          />
        </div>
      )}
      </div>

      <WuModal
        open={createOpen || editing != null}
        onOpenChange={(open) => {
          if (!open) closeEditor()
        }}
        variant="action"
        size="lg"
        {...preventModalDismiss}
      >
        <WuModalHeader>
          <span className="inline-flex items-center gap-2">
            {editing ? 'Edit collector form' : 'New collector form'}
            <WuTooltip
              content="People open this link to take the survey. Validation matches them to an employee, and collected fields are stored with the response."
              position="bottom"
              showArrow
            >
              <span
                className="inline-flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white"
                aria-label="About this collector form"
              >
                ?
              </span>
            </WuTooltip>
          </span>
        </WuModalHeader>
        <WuModalContent>
          <div className={createStep === 0 ? 'space-y-5' : 'hidden'}>
            <div className="flex items-center gap-4">
              <span className="shrink-0 text-sm text-gray-600">Collector form name</span>
              <div className="min-w-0 flex-1">
                <WuInput
                  variant="outlined"
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
              <label className="flex shrink-0 items-center gap-2 text-sm text-gray-700">
                Active
                <WuToggle
                  checked={draft.active}
                  onChange={(checked) => setDraft((current) => ({ ...current, active: checked }))}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-8">
              <label className="flex items-center gap-3 text-sm text-gray-600">
                Validate employee
                <WuToggle
                  checked={draft.validateEmployee}
                  onChange={(checked) =>
                    setDraft((current) => ({
                      ...current,
                      validateEmployee: checked,
                      fields: !checked || current.collectEmployeeData ? ensureEmployeeFields(current.fields) : current.fields,
                    }))
                  }
                />
              </label>
              {draft.validateEmployee ? emailOption : null}
            </div>

            <div className="flex flex-wrap items-center gap-8">
              <label className="flex items-center gap-3 text-sm text-gray-600">
                {draft.validateEmployee ? 'Collect employee data' : 'Collect employee identity'}
                <WuToggle
                  checked={draft.collectEmployeeData}
                  onChange={(checked) =>
                    setDraft((current) => ({
                      ...current,
                      collectEmployeeData: checked,
                      fields: !current.validateEmployee || checked ? ensureEmployeeFields(current.fields) : current.fields,
                    }))
                  }
                />
              </label>
              {!draft.validateEmployee && draft.collectEmployeeData ? emailOption : null}
            </div>

            {showEmployeeFields(draft) ? (
              <div className="space-y-3">
                {draft.fields.map((field) => {
                  const options = EMPLOYEE_FIELD_OPTIONS.some((option) => option.value === field.name)
                    ? EMPLOYEE_FIELD_OPTIONS
                    : [...EMPLOYEE_FIELD_OPTIONS, { value: field.name, label: field.name }]
                  const selected = options.find((option) => option.value === field.name) ?? options[0]
                  return (
                    <div key={field.id} className="flex flex-wrap items-center gap-4">
                      <div className="w-44">
                        <WuSelect
                          data={options}
                          accessorKey={{ value: 'value', label: 'label' }}
                          value={selected}
                          onSelect={(next) =>
                            updateField(field.id, {
                              name: (next as (typeof options)[number]).value,
                              custom: false,
                            })
                          }
                          variant="outlined"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        Required
                        <WuToggle
                          checked={field.required}
                          onChange={(checked) => updateField(field.id, { required: checked })}
                        />
                      </label>
                      {draft.fields.length > 1 ? (
                        <button
                          type="button"
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          aria-label={`Remove ${field.name || 'field'}`}
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              fields:
                                current.fields.length <= 1
                                  ? current.fields
                                  : current.fields.filter((item) => item.id !== field.id),
                            }))
                          }
                        >
                          <span className="wm-delete text-base leading-none" aria-hidden />
                        </button>
                      ) : null}
                    </div>
                  )
                })}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      fields: [
                        ...current.fields,
                        {
                          id: newFieldId(),
                          name: EMPLOYEE_FIELD_OPTIONS.find((option) => !current.fields.some((field) => field.name === option.value))
                            ?.value ?? 'Last Name',
                          required: false,
                          custom: false,
                        },
                      ],
                    }))
                  }
                >
                  <span aria-hidden>+</span>
                  Add custom field
                </button>
              </div>
            ) : null}
          </div>
          {createOpen || editing ? (
            <div className={createStep === 1 ? undefined : 'hidden'}>
              <CollectorHeadcountModal
                ref={headcountRef}
                embedded
                form={editing}
                open
                collectorName={draft.name}
                sessionKey={createSession}
                onOpenChange={() => undefined}
                onSave={() => undefined}
                onBlockedChange={onResponsesBlocked}
              />
            </div>
          ) : null}
        </WuModalContent>
        <WuModalFooter>
          <div className="flex w-full items-center justify-between gap-4">
            <CollectorStepIndicator currentStep={createStep} />
            <div className="flex items-center gap-3">
              {createStep === 0 ? (
                <WuButton variant="secondary" onClick={closeEditor}>
                  Cancel
                </WuButton>
              ) : (
                <WuButton variant="secondary" onClick={() => setCreateStep(0)}>
                  Back
                </WuButton>
              )}
              {createStep === 0 ? (
                <WuButton disabled={!draft.name.trim()} onClick={() => setCreateStep(1)}>
                  Next
                </WuButton>
              ) : (
                <WuButton onClick={createCollector} disabled={responsesBlocked}>
                  {editing ? 'Save' : 'Create collector form'}
                </WuButton>
              )}
            </div>
          </div>
        </WuModalFooter>
      </WuModal>

      <WuModal
        open={qrForm != null}
        onOpenChange={(open) => {
          if (!open) setQrForm(null)
        }}
        variant="action"
        size="sm"
        {...preventModalDismiss}
      >
        <WuModalHeader>QR code</WuModalHeader>
        <WuModalContent>
          {qrForm ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="grid size-40 grid-cols-7 gap-0.5 border border-gray-900 p-2"
                aria-hidden
              >
                {Array.from({ length: 49 }, (_, index) => (
                  <span
                    key={index}
                    className={index % 3 === 0 || index % 5 === 0 ? 'bg-gray-900' : 'bg-white'}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-gray-900">{qrForm.name}</p>
              <p className="break-all text-xs text-gray-500">{qrForm.link}</p>
            </div>
          ) : null}
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setQrForm(null)}>
            Close
          </WuButton>
          <WuButton
            onClick={() => {
              if (qrForm) copyLink(qrForm)
            }}
          >
            Copy link
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <ConfirmModal
        open={deleteForm != null}
        onOpenChange={(open) => {
          if (!open) setDeleteForm(null)
        }}
        title="Delete collector form"
        description={deleteForm ? `Delete ${deleteForm.name}? People with this link will no longer be able to respond.` : ''}
        confirmLabel="Delete"
        variant="critical"
        onConfirm={() => {
          if (!deleteForm) return
          setCollectorForms((current) => current.filter((item) => item.id !== deleteForm.id))
          setDeleteForm(null)
          showToast({ message: 'Collector form deleted', variant: 'success' })
        }}
      />
    </div>
  )
}
