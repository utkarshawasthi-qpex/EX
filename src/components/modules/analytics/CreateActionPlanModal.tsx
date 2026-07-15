'use client'

import dynamic from 'next/dynamic'
import { addDays, format } from 'date-fns'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import { mockEmployees } from '@/data/mock/employees'
import {
  buildInheritedLinkBlock,
  resolveDashboardScope,
} from '@/lib/empowerIntegration/dashboardLink'
import { parseTimeframeDays } from '@/lib/empowerIntegration/helpers'
import { initiativeMatchesScope } from '@/lib/empowerIntegration/scope'
import {
  countActiveInitiativesForScope,
  getAllInitiativesRaw,
  getInitiativeById,
  getOrgSettings,
  upsertInitiative,
} from '@/lib/empowerIntegration/storage'
import { preventModalDismiss } from '@/lib/modalProps'
import { getCurrentUser, isAdminContext } from '@/lib/userContext'
import type {
  EmpowerInitiativeRecord,
  InitiativeProvenance,
  SurveyLink,
  SurveyLinkCandidate,
} from '@/types/empowerIntegration'
import type { SummaryAction } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false },
)
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

export type CreateActionPlanModalProps = {
  open: boolean
  onClose: () => void
  action: SummaryAction
  descriptionDetail?: string
  inheritedLink: SurveyLink | null
  linkCandidates?: SurveyLinkCandidate[]
  provenance: InitiativeProvenance
  activeTab: 'company' | 'team'
  onCreated?: (id: string) => void
}

function toEmployeeOptions(): SelectOption[] {
  return mockEmployees.map((e) => ({
    value: e.id,
    label: `${e.firstName} ${e.lastName} (${e.department})`,
  }))
}

export function CreateActionPlanModal({
  open,
  onClose,
  action,
  descriptionDetail,
  inheritedLink: initialLink,
  linkCandidates = [],
  provenance,
  activeTab,
  onCreated,
}: CreateActionPlanModalProps) {
  const { showToast } = useWuShowToast()
  const user = getCurrentUser()
  const isAdmin = isAdminContext()
  const employeeOptions = useMemo(() => toEmployeeOptions(), [])
  const goalOptions = useMemo(
    () => EMPOWER_GOALS.map((g) => ({ value: g.id, label: g.title })),
    [],
  )

  const [title, setTitle] = useState(action.action)
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState<SelectOption | null>(null)
  const [goal, setGoal] = useState<SelectOption | null>(goalOptions[0] ?? null)
  const [dueDate, setDueDate] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [confirmStep, setConfirmStep] = useState(linkCandidates.length > 1)
  const [selectedLink, setSelectedLink] = useState<SurveyLink | null>(initialLink)
  const [capMode, setCapMode] = useState(false)
  const [capInitiatives, setCapInitiatives] = useState<EmpowerInitiativeRecord[]>([])
  const [selectedCapId, setSelectedCapId] = useState<SelectOption | null>(null)

  const tabScope = resolveDashboardScope(activeTab, user.id)

  useEffect(() => {
    if (!open) return
    setTitle(action.action)
    setDescription(
      descriptionDetail ??
        `${action.context}\n\nRecommended timeframe: ${action.timeframe}. Suggested owner: ${action.owner}.`,
    )
    setOwner({ value: user.id, label: user.name })
    setGoal(goalOptions[0] ?? null)
    setDueDate(format(addDays(new Date(), parseTimeframeDays(action.timeframe)), 'yyyy-MM-dd'))
    setCreatedId(null)
    setConfirmStep(linkCandidates.length > 1)
    setSelectedLink(initialLink)

    const settings = getOrgSettings()
    const scopeArg =
      tabScope.kind === 'team' ? { kind: 'team' as const, managerId: user.id } : { kind: 'org' as const }
    const atCap = countActiveInitiativesForScope(scopeArg) >= settings.activeInitiativeCap
    setCapMode(atCap)
    const caps = getAllInitiativesRaw().filter(
      (i) => i.status === 'active' && initiativeMatchesScope(i, tabScope),
    )
    setCapInitiatives(caps)
    setSelectedCapId(caps[0] ? { value: caps[0].id, label: caps[0].title } : null)
  }, [open, action, descriptionDetail, goalOptions, user.id, user.name, initialLink, linkCandidates.length, tabScope.kind])

  function handleClose() {
    setCreatedId(null)
    onClose()
  }

  function handleCreate() {
    if (!title.trim() || !owner || !goal) {
      showToast({ variant: 'error', message: 'Title, owner, and goal are required' })
      return
    }

    const now = new Date().toISOString()
    const id = `init_${Date.now()}`
    upsertInitiative({
      id,
      title: title.trim(),
      description,
      goalId: goal.value,
      status: 'active',
      progress: 'on_track',
      createdBy: user.id,
      ownerId: owner.value,
      contributors: [],
      dueDate,
      createdAt: now,
      tasks: [{ id: `task_${Date.now()}`, text: action.action, done: false, source: 'ai_recommendation' }],
      provenance,
      surveyLink: selectedLink,
      history: [{ at: now, event: 'Created from AI recommendation' }],
    })
    setCreatedId(id)
    onCreated?.(id)
    showToast({ variant: 'success', message: 'Initiative created — View in Empower →' })
  }

  function handleAddAsTask() {
    if (!selectedCapId) return
    const existing = getInitiativeById(selectedCapId.value)
    if (!existing) return
    const now = new Date().toISOString()
    upsertInitiative({
      ...existing,
      tasks: [
        ...existing.tasks,
        { id: `task_${Date.now()}`, text: action.action, done: false, source: 'ai_recommendation' },
      ],
      history: [
        ...existing.history,
        { at: now, event: `Added AI recommendation as task (P${provenance.recommendationPriority})` },
      ],
    })
    setCreatedId(existing.id)
    onCreated?.(existing.id)
    showToast({ variant: 'success', message: 'Task added to existing initiative' })
  }

  const cap = getOrgSettings().activeInitiativeCap
  const inheritedBlock = selectedLink ? buildInheritedLinkBlock(selectedLink) : null

  return (
    <WuModal open={open} onOpenChange={(v) => !v && handleClose()} size="md">
      <WuModalHeader>Create Action Plan</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        {createdId ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <WuText size="sm" as="p" className="font-medium text-green-800">
              {capMode ? 'Task added successfully.' : 'Initiative created successfully.'}
            </WuText>
            <Link href={`/empower/initiatives/${createdId}`} className="mt-3 inline-block text-sm font-medium text-purple-600 hover:underline" onClick={handleClose}>
              View in Empower →
            </Link>
          </div>
        ) : confirmStep && linkCandidates.length > 1 ? (
          <div className="space-y-3">
            <WuText size="sm" as="p" className="font-medium text-gray-800">Confirm source</WuText>
            <WuText size="sm" as="p" className="text-xs text-gray-500">
              This recommendation draws on multiple surveys. Select which source to link:
            </WuText>
            {linkCandidates.map((candidate) => (
              <button
                key={candidate.widgetId}
                type="button"
                onClick={() => {
                  setSelectedLink(candidate.link)
                  setConfirmStep(false)
                }}
                className="block w-full rounded border border-gray-200 px-3 py-2 text-left text-sm hover:border-blue-500 hover:bg-blue-50"
              >
                {candidate.label}
              </button>
            ))}
          </div>
        ) : capMode ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Your team has {cap} active initiatives. Complete one, or add this as a task:
            </div>
            <WuSelect
              data={capInitiatives.map((i) => ({ value: i.id, label: i.title }))}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedCapId}
              onSelect={(v) => setSelectedCapId(v as SelectOption)}
              variant="outlined"
            />
            {inheritedBlock && (
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">{inheritedBlock}</div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <WuFormGroup Label="Title" Input={<WuInput value={title} onChange={(e) => setTitle(e.target.value)} />} />
            <WuFormGroup Label="Goal" Input={<WuSelect data={goalOptions} accessorKey={{ value: 'value', label: 'label' }} value={goal} onSelect={(v) => setGoal(v as SelectOption)} variant="outlined" />} />
            <WuFormGroup Label="Owner" Input={<WuSelect data={employeeOptions} accessorKey={{ value: 'value', label: 'label' }} value={owner} onSelect={(v) => setOwner(v as SelectOption)} variant="outlined" disabled={!isAdmin} />} />
            <WuFormGroup Label="Due date" Input={<WuInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />} />
            <WuFormGroup Label="Description" Input={<WuTextarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />} />
            {inheritedBlock && (
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">{inheritedBlock}</div>
            )}
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-2">
          {createdId ? (
            <WuButton variant="primary" onClick={handleClose}>Done</WuButton>
          ) : confirmStep ? (
            <WuButton variant="secondary" onClick={handleClose}>Cancel</WuButton>
          ) : capMode ? (
            <>
              <WuButton variant="secondary" onClick={handleClose}>Cancel</WuButton>
              <WuButton variant="primary" onClick={handleAddAsTask}>Add as task</WuButton>
            </>
          ) : (
            <>
              <WuButton variant="secondary" onClick={handleClose}>Cancel</WuButton>
              <WuButton variant="primary" onClick={handleCreate}>Create in Empower</WuButton>
            </>
          )}
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
