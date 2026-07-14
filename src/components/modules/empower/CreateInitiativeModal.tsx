'use client'

import dynamic from 'next/dynamic'
import { format, addDays } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import { mockEmployees } from '@/data/mock/employees'
import {
  aggregate,
  formatScopeLabel,
  getExCategoriesForScope,
  listAccessibleExSurveys,
} from '@/lib/empowerIntegration/aggregate'
import { upsertInitiative } from '@/lib/empowerIntegration/storage'
import { preventModalDismiss } from '@/lib/modalProps'
import { getCurrentUser, isAdminContext, isManagerUser } from '@/lib/userContext'
import type { EmpowerInitiativeRecord, SurveyLink, SurveyLinkScope } from '@/types/empowerIntegration'

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
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

type CreateInitiativeModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (id: string) => void
}

type Step = 'basics' | 'link' | 'confirm'

export function CreateInitiativeModal({ open, onOpenChange, onCreated }: CreateInitiativeModalProps) {
  const user = getCurrentUser()
  const isAdmin = isAdminContext()
  const isManager = isManagerUser(user)

  const [step, setStep] = useState<Step>('basics')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState<SelectOption | null>(null)
  const [owner, setOwner] = useState<SelectOption | null>(null)
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'))
  const [survey, setSurvey] = useState<SelectOption | null>(null)
  const [scopeKind, setScopeKind] = useState<'org' | 'team' | 'filter'>('org')
  const [focusId, setFocusId] = useState<string | null>(null)
  const [skipLink, setSkipLink] = useState(false)
  const [pendingLink, setPendingLink] = useState<SurveyLink | null>(null)

  const goalOptions = useMemo(
    () => EMPOWER_GOALS.map((item) => ({ value: item.id, label: item.title })),
    [],
  )
  const employeeOptions = useMemo(
    () =>
      mockEmployees.map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}`,
      })),
    [],
  )
  const surveyOptions = useMemo(() => {
    return listAccessibleExSurveys({ includeLive: true }).map((item) => ({
      value: item.id,
      label: item.status === 'live' ? `${item.name} (collecting — baseline finalizes at close)` : item.name,
    }))
  }, [])

  useEffect(() => {
    if (!open) return
    setStep('basics')
    setTitle('')
    setDescription('')
    setGoal(goalOptions[0] ?? null)
    setOwner({ value: user.id, label: user.name })
    setDueDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'))
    setSurvey(surveyOptions[0] ?? null)
    setScopeKind(isManager && !isAdmin ? 'team' : 'org')
    setFocusId(null)
    setSkipLink(false)
    setPendingLink(null)
  }, [open, goalOptions, surveyOptions, user.id, user.name, isAdmin, isManager])

  function resolveScope(): SurveyLinkScope {
    if (scopeKind === 'org') return { kind: 'org' }
    if (scopeKind === 'team') return { kind: 'team', managerId: user.id }
    return { kind: 'filter', filters: { department: user.department ?? 'Engineering' } }
  }

  function handleLinkStepContinue() {
    if (skipLink || !survey || !focusId) {
      setPendingLink(null)
      setStep('confirm')
      return
    }

    const scope = resolveScope()
    const result = aggregate(survey.value, { kind: 'category', id: focusId, label: focusId }, scope)
    if (!result.meetsThreshold) return

    const surveyMeta = listAccessibleExSurveys({ includeLive: true }).find((item) => item.id === survey.value)
    const categories = getExCategoriesForScope(survey.value, scope)
    const category = categories.find((item) => item.id === focusId)

    setPendingLink({
      surveyId: survey.value,
      surveyName: surveyMeta?.name ?? survey.label,
      surveyType: 'ex',
      cycleLabel: surveyMeta?.cycleLabel ?? '',
      scope,
      focus: { kind: 'category', id: focusId, label: category?.label ?? focusId },
      baseline: {
        favorability: result.scores.favorability,
        respondentCount: result.respondentCount,
        capturedAt: new Date().toISOString(),
        surveyStatus: surveyMeta?.status ?? 'closed',
      },
      latest: null,
    })
    setStep('confirm')
  }

  function handleCreate() {
    if (!title.trim() || !goal || !owner) return

    const now = new Date().toISOString()
    const id = `init_${Date.now()}`
    const initiative: EmpowerInitiativeRecord = {
      id,
      title: title.trim(),
      description,
      goalId: goal.value,
      class: 'team',
      status: 'active',
      progress: 'on_track',
      createdBy: user.id,
      ownerId: owner.value,
      contributors: [],
      dueDate,
      createdAt: now,
      tasks: [],
      provenance: null,
      surveyLink: pendingLink,
      history: [{ at: now, event: 'Initiative created manually' }],
    }

    upsertInitiative(initiative)
    onCreated?.(id)
    onOpenChange(false)
  }

  const scope = resolveScope()
  const categories = survey ? getExCategoriesForScope(survey.value, scope) : []

  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="md">
      <WuModalHeader>Create Initiative</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        {step === 'basics' && (
          <div className="space-y-4">
            <WuFormGroup Label="Title" Input={<WuInput value={title} onChange={(e) => setTitle(e.target.value)} />} />
            <WuFormGroup Label="Description" Input={<WuTextarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />} />
            <WuFormGroup Label="Goal" Input={<WuSelect data={goalOptions} accessorKey={{ value: 'value', label: 'label' }} value={goal} onSelect={(v) => setGoal(v as SelectOption)} variant="outlined" />} />
            <WuFormGroup Label="Owner" Input={<WuSelect data={employeeOptions} accessorKey={{ value: 'value', label: 'label' }} value={owner} onSelect={(v) => setOwner(v as SelectOption)} variant="outlined" disabled={!isAdmin} />} />
            <WuFormGroup Label="Due date" Input={<WuInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />} />
          </div>
        )}

        {step === 'link' && (
          <div className="space-y-4">
            <WuText size="sm" as="p" className="font-medium text-gray-700">
              Link survey data (optional)
            </WuText>
            <WuFormGroup Label="Survey" Input={<WuSelect data={surveyOptions} accessorKey={{ value: 'value', label: 'label' }} value={survey} onSelect={(v) => setSurvey(v as SelectOption)} variant="outlined" />} />
            {isAdmin ? (
              <WuFormGroup
                Label="Scope"
                Input={
                  <WuSelect
                    data={[
                      { value: 'org', label: 'Organization' },
                      { value: 'team', label: 'My Team' },
                      { value: 'filter', label: 'Custom filter' },
                    ]}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={{ value: scopeKind, label: scopeKind }}
                    onSelect={(v) => setScopeKind((v as SelectOption).value as typeof scopeKind)}
                    variant="outlined"
                  />
                }
              />
            ) : (
              <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                Scope: My Team (locked for managers)
              </div>
            )}
            <div className="space-y-2">
              <WuText size="sm" as="p" className="text-xs font-medium uppercase text-gray-500">
                Focus category
              </WuText>
              {categories.map((category) => {
                const result = aggregate(
                  survey?.value ?? '',
                  { kind: 'category', id: category.id, label: category.label },
                  scope,
                )
                const disabled = !result.meetsThreshold
                return (
                  <button
                    key={category.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setFocusId(category.id)}
                    className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm ${
                      focusId === category.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <span>{category.label}</span>
                    <span className="text-xs text-gray-500">
                      {disabled
                        ? 'Not enough responses to link'
                        : `${result.scores.favorability}% · n=${result.respondentCount}`}
                    </span>
                  </button>
                )
              })}
            </div>
            <WuButton variant="secondary" onClick={() => { setSkipLink(true); handleLinkStepContinue() }}>
              Skip linking
            </WuButton>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>{title}</strong></p>
            {pendingLink ? (
              <div className="rounded border border-green-200 bg-green-50 p-3 text-xs">
                Linked to {pendingLink.surveyName} · {pendingLink.focus.label} · {formatScopeLabel(pendingLink.scope)} · Baseline {pendingLink.baseline.favorability}%
              </div>
            ) : (
              <p className="text-gray-500">No survey link — unlinked initiative</p>
            )}
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-2">
          {step === 'basics' && (
            <>
              <WuButton variant="secondary" onClick={() => onOpenChange(false)}>Cancel</WuButton>
              <WuButton variant="primary" onClick={() => setStep('link')}>Next</WuButton>
            </>
          )}
          {step === 'link' && (
            <>
              <WuButton variant="secondary" onClick={() => setStep('basics')}>Back</WuButton>
              <WuButton variant="primary" onClick={handleLinkStepContinue}>Continue</WuButton>
            </>
          )}
          {step === 'confirm' && (
            <>
              <WuButton variant="secondary" onClick={() => setStep('link')}>Back</WuButton>
              <WuButton variant="primary" onClick={handleCreate}>Create</WuButton>
            </>
          )}
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
