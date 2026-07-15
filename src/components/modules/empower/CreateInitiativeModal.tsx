'use client'

import dynamic from 'next/dynamic'
import { format, addDays } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { EMPOWER_GOALS } from '@/data/mock/empowerIntegrationSeed'
import { mockEmployees } from '@/data/mock/employees'
import { aggregate, getExCategoriesForScope, listAccessibleExSurveys } from '@/lib/empowerIntegration/aggregate'
import { countActiveInitiativesForScope, getOrgSettings, upsertInitiative } from '@/lib/empowerIntegration/storage'
import { preventModalDismiss } from '@/lib/modalProps'
import { getCurrentUser, isAdminContext, isManagerUser } from '@/lib/userContext'
import type { EmpowerInitiativeRecord, SurveyLink, SurveyLinkScope } from '@/types/empowerIntegration'

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false })
const WuFormGroup = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })), { ssr: false })
const WuInput = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })), { ssr: false })
const WuModal = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })), { ssr: false })
const WuModalContent = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })), { ssr: false })
const WuModalFooter = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })), { ssr: false })
const WuModalHeader = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })), { ssr: false })
const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })), { ssr: false })
const WuTextarea = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })), { ssr: false })
const WuText = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })), { ssr: false })

type SelectOption = { value: string; label: string }
type Step = 'basics' | 'link' | 'confirm'

export function CreateInitiativeModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (id: string) => void
}) {
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
  const [pendingLink, setPendingLink] = useState<SurveyLink | null>(null)
  const [capBlocked, setCapBlocked] = useState(false)

  const goalOptions = useMemo(() => EMPOWER_GOALS.map((g) => ({ value: g.id, label: g.title })), [])
  const employeeOptions = useMemo(() => mockEmployees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })), [])
  const surveyOptions = useMemo(
    () =>
      listAccessibleExSurveys(true).map((s) => ({
        value: s.id,
        label: s.status === 'live' ? `${s.name} (collecting — baseline finalizes at close)` : s.name,
      })),
    [],
  )

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
    setPendingLink(null)
    const scopeArg = isManager && !isAdmin ? { kind: 'team' as const, managerId: user.id } : { kind: 'org' as const }
    setCapBlocked(countActiveInitiativesForScope(scopeArg) >= getOrgSettings().activeInitiativeCap)
  }, [open, goalOptions, surveyOptions, user.id, user.name, isAdmin, isManager])

  function resolveScope(): SurveyLinkScope {
    if (scopeKind === 'org') return { kind: 'org' }
    if (scopeKind === 'team') return { kind: 'team', managerId: user.id }
    return { kind: 'filter', filters: { department: user.department ?? 'Engineering' } }
  }

  function handleLinkContinue(skip = false) {
    if (skip || !survey || !focusId) {
      setPendingLink(null)
      setStep('confirm')
      return
    }
    const scope = resolveScope()
    const result = aggregate(survey.value, { kind: 'category', id: focusId, label: focusId }, scope)
    if (!result.meetsThreshold) return
    const meta = listAccessibleExSurveys(true).find((s) => s.id === survey.value)
    const categories = getExCategoriesForScope(survey.value, scope)
    const cat = categories.find((c) => c.id === focusId)
    setPendingLink({
      surveyId: survey.value,
      surveyName: meta?.name ?? survey.label,
      cycleLabel: meta?.cycleLabel ?? '',
      scope,
      focus: { kind: 'category', id: focusId, label: cat?.label ?? focusId },
      baseline: {
        favorability: result.favorability,
        respondentCount: result.respondentCount,
        capturedAt: new Date().toISOString(),
        surveyStatus: meta?.status ?? 'closed',
      },
      latest: null,
    })
    setStep('confirm')
  }

  function handleCreate() {
    if (capBlocked) return
    if (!title.trim() || !goal || !owner) return
    const now = new Date().toISOString()
    const id = `init_${Date.now()}`
    const record: EmpowerInitiativeRecord = {
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
      tasks: [],
      provenance: null,
      surveyLink: pendingLink,
      history: [{ at: now, event: 'Initiative created manually' }],
    }
    upsertInitiative(record)
    onCreated?.(id)
    onOpenChange(false)
  }

  const scope = resolveScope()
  const categories = survey ? getExCategoriesForScope(survey.value, scope) : []

  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="md">
      <WuModalHeader>Create Initiative</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        {capBlocked && step === 'basics' && (
          <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Your team has {getOrgSettings().activeInitiativeCap} active initiatives. Complete one before creating another.
          </div>
        )}
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
            <WuText size="sm" as="p" className="font-medium">Link survey data (optional)</WuText>
            <WuSelect data={surveyOptions} accessorKey={{ value: 'value', label: 'label' }} value={survey} onSelect={(v) => setSurvey(v as SelectOption)} variant="outlined" />
            {isAdmin ? (
              <WuSelect
                data={[{ value: 'org', label: 'Organization' }, { value: 'team', label: 'My Team' }, { value: 'filter', label: 'Custom filter' }]}
                accessorKey={{ value: 'value', label: 'label' }}
                value={{ value: scopeKind, label: scopeKind }}
                onSelect={(v) => setScopeKind((v as SelectOption).value as typeof scopeKind)}
                variant="outlined"
              />
            ) : (
              <div className="rounded border bg-gray-50 px-3 py-2 text-xs">Scope: My Team (locked)</div>
            )}
            {categories.map((cat) => {
              const result = aggregate(survey?.value ?? '', { kind: 'category', id: cat.id, label: cat.label }, scope)
              return (
                <button key={cat.id} type="button" disabled={!result.meetsThreshold} onClick={() => setFocusId(cat.id)} className={`flex w-full justify-between rounded border px-3 py-2 text-sm ${focusId === cat.id ? 'border-blue-600 bg-blue-50' : ''} ${!result.meetsThreshold ? 'opacity-50' : ''}`}>
                  <span>{cat.label}</span>
                  <span className="text-xs text-gray-500">{result.meetsThreshold ? `${result.favorability}% · n=${result.respondentCount}` : 'Not enough responses to link'}</span>
                </button>
              )
            })}
            <WuButton variant="secondary" onClick={() => handleLinkContinue(true)}>Skip linking</WuButton>
          </div>
        )}
        {step === 'confirm' && (
          <div className="text-sm">
            <p className="font-medium">{title}</p>
            {pendingLink ? (
              <div className="mt-2 rounded border border-green-200 bg-green-50 p-3 text-xs">
                Linked to {pendingLink.surveyName} · {pendingLink.focus.label} · Baseline {pendingLink.baseline.favorability}%
              </div>
            ) : (
              <p className="mt-2 text-gray-500">Unlinked initiative</p>
            )}
          </div>
        )}
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-2">
          {step === 'basics' && (
            <>
              <WuButton variant="secondary" onClick={() => onOpenChange(false)}>Cancel</WuButton>
              <WuButton variant="primary" onClick={() => setStep('link')} disabled={capBlocked}>Next</WuButton>
            </>
          )}
          {step === 'link' && (
            <>
              <WuButton variant="secondary" onClick={() => setStep('basics')}>Back</WuButton>
              <WuButton variant="primary" onClick={() => handleLinkContinue(false)}>Continue</WuButton>
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
