'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { getEmployeeDisplayName } from '@/data/mock-employee-directory'
import type { Survey360Deployment } from '@/data/mock/survey360Deployments'
import { preventModalDismiss } from '@/lib/modalProps'
import { useRosterStore } from '@/lib/rosterStore'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
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
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
  { ssr: false },
)

type WorkspaceSection = 'selection' | 'options' | 'compose' | 'templates' | 'history'
type PeopleTab = 'subjects' | 'evaluators'
type Relationship = 'Self' | 'Manager' | 'Peer' | 'Direct Report' | 'External'
type ParticipantStatus = 'Not started' | 'Invited' | 'Completed'

type SubjectRow = {
  id: string
  employeeId: string
  name: string
  email: string
  status: ParticipantStatus
}

type EvaluatorRow = {
  id: string
  subjectId: string
  employeeId: string
  name: string
  email: string
  relationship: Relationship
  status: ParticipantStatus
}

type HistoryRow = {
  id: string
  date: string
  type: string
  recipients: number
}

const NAV: { id: WorkspaceSection; label: string }[] = [
  { id: 'selection', label: 'Participant Selection' },
  { id: 'options', label: 'Participant Options' },
  { id: 'compose', label: 'Compose' },
  { id: 'templates', label: 'Templates' },
  { id: 'history', label: 'Sent History' },
]

const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: 'Self', label: 'Self' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Peer', label: 'Peer' },
  { value: 'Direct Report', label: 'Direct Report' },
  { value: 'External', label: 'External' },
]

const EMAIL_TEMPLATES = [
  {
    id: 'invite',
    name: 'Invitation',
    subject: 'You are invited to a 360 review',
    body: 'Please complete your feedback by the due date. Your responses help this person grow.',
  },
  {
    id: 'reminder',
    name: 'Reminder',
    subject: 'Reminder: 360 feedback is still open',
    body: 'This is a reminder to finish your 360 feedback. It only takes a few minutes.',
  },
  {
    id: 'thanks',
    name: 'Thank you',
    subject: 'Thank you for your feedback',
    body: 'Thank you for completing the 360 review. Your input has been recorded.',
  },
]

function formatStamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

type DeploymentDetailProps = {
  deployment: Survey360Deployment
  onBack: () => void
  onUpdate: (deployment: Survey360Deployment) => void
}

export function DeploymentDetail({ deployment, onBack, onUpdate }: DeploymentDetailProps) {
  const { showToast } = useWuShowToast()
  const { employees } = useRosterStore()
  const [section, setSection] = useState<WorkspaceSection>('selection')
  const [peopleTab, setPeopleTab] = useState<PeopleTab>('subjects')
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [evaluators, setEvaluators] = useState<EvaluatorRow[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [addSubjectsOpen, setAddSubjectsOpen] = useState(false)
  const [addEvaluatorsOpen, setAddEvaluatorsOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set())
  const [evaluatorSubjectId, setEvaluatorSubjectId] = useState('')
  const [relationship, setRelationship] = useState(RELATIONSHIPS[1])
  const [minEvaluators, setMinEvaluators] = useState('3')
  const [emailSubject, setEmailSubject] = useState(EMAIL_TEMPLATES[0].subject)
  const [emailBody, setEmailBody] = useState(EMAIL_TEMPLATES[0].body)
  const [history, setHistory] = useState<HistoryRow[]>([])

  const subjectName = (subjectId: string) => subjects.find((subject) => subject.id === subjectId)?.name ?? 'Subject'

  const visibleSubjects = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return subjects
    return subjects.filter(
      (subject) => subject.name.toLowerCase().includes(query) || subject.email.toLowerCase().includes(query),
    )
  }, [search, subjects])

  const visibleEvaluators = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return evaluators
    return evaluators.filter(
      (evaluator) =>
        evaluator.name.toLowerCase().includes(query) || evaluator.email.toLowerCase().includes(query),
    )
  }, [evaluators, search])

  const rosterChoices = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase()
    return employees
      .filter((employee) => {
        const name = getEmployeeDisplayName(employee).toLowerCase()
        return !query || name.includes(query) || employee.email.toLowerCase().includes(query)
      })
      .slice(0, 12)
  }, [employees, pickerQuery])

  function evaluationsFor(subjectId: string) {
    return evaluators.filter((evaluator) => evaluator.subjectId === subjectId).length
  }

  function syncCounts(nextSubjects: SubjectRow[], nextEvaluators: EvaluatorRow[]) {
    const invited = nextSubjects.length + nextEvaluators.length
    const responses =
      nextSubjects.filter((subject) => subject.status === 'Completed').length +
      nextEvaluators.filter((evaluator) => evaluator.status === 'Completed').length
    onUpdate({
      ...deployment,
      invited,
      responses,
      responseRate: invited === 0 ? 0 : Math.round((responses / invited) * 1000) / 10,
    })
  }

  function openSubjectPicker() {
    setPickerQuery('')
    setPickedIds(new Set())
    setAddSubjectsOpen(true)
  }

  function openEvaluatorPicker() {
    if (subjects.length === 0) {
      showToast({ variant: 'info', message: 'Add subjects before adding evaluators.' })
      setPeopleTab('subjects')
      return
    }
    setPickerQuery('')
    setPickedIds(new Set())
    setEvaluatorSubjectId(subjects[0]?.id ?? '')
    setRelationship(RELATIONSHIPS[1])
    setAddEvaluatorsOpen(true)
    setPeopleTab('evaluators')
  }

  function confirmSubjects() {
    const existing = new Set(subjects.map((subject) => subject.employeeId))
    const added: SubjectRow[] = employees
      .filter((employee) => pickedIds.has(employee.id) && !existing.has(employee.id))
      .map((employee) => ({
        id: `sub_${employee.id}_${Date.now()}`,
        employeeId: employee.id,
        name: getEmployeeDisplayName(employee),
        email: employee.email,
        status: 'Not started',
      }))
    if (added.length === 0) {
      showToast({ variant: 'info', message: 'Select at least one person who is not already a subject.' })
      return
    }
    const next = [...subjects, ...added]
    setSubjects(next)
    syncCounts(next, evaluators)
    setAddSubjectsOpen(false)
    setPeopleTab('subjects')
    showToast({ variant: 'success', message: `${added.length} subject${added.length === 1 ? '' : 's'} added` })
  }

  function confirmEvaluators() {
    if (!evaluatorSubjectId) {
      showToast({ variant: 'info', message: 'Choose a subject for these evaluators.' })
      return
    }
    const existing = new Set(
      evaluators
        .filter((evaluator) => evaluator.subjectId === evaluatorSubjectId)
        .map((evaluator) => evaluator.employeeId),
    )
    const added: EvaluatorRow[] = employees
      .filter((employee) => pickedIds.has(employee.id) && !existing.has(employee.id))
      .map((employee) => ({
        id: `eva_${employee.id}_${Date.now()}`,
        subjectId: evaluatorSubjectId,
        employeeId: employee.id,
        name: getEmployeeDisplayName(employee),
        email: employee.email,
        relationship: relationship.value,
        status: 'Not started',
      }))
    if (added.length === 0) {
      showToast({ variant: 'info', message: 'Select at least one evaluator.' })
      return
    }
    const next = [...evaluators, ...added]
    setEvaluators(next)
    syncCounts(subjects, next)
    setAddEvaluatorsOpen(false)
    showToast({ variant: 'success', message: `${added.length} evaluator${added.length === 1 ? '' : 's'} added` })
  }

  function togglePicked(id: string, checked: boolean) {
    setPickedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function recordSend(type: string, recipients: number) {
    setHistory((current) => [
      { id: `hist_${Date.now()}`, date: formatStamp(new Date()), type, recipients },
      ...current,
    ])
  }

  function launchDeployment() {
    if (subjects.length === 0) {
      showToast({ variant: 'info', message: 'Add subjects before launching this deployment.' })
      setSection('selection')
      setPeopleTab('subjects')
      return
    }
    const nextSubjects = subjects.map((subject) =>
      subject.status === 'Not started' ? { ...subject, status: 'Invited' as const } : subject,
    )
    const nextEvaluators = evaluators.map((evaluator) =>
      evaluator.status === 'Not started' ? { ...evaluator, status: 'Invited' as const } : evaluator,
    )
    setSubjects(nextSubjects)
    setEvaluators(nextEvaluators)
    onUpdate({ ...deployment, status: 'Active', list: 'ongoing' })
    recordSend('Launch', nextSubjects.length + nextEvaluators.length)
    showToast({ variant: 'success', message: 'Deployment launched' })
    setSection('history')
  }

  function sendEmail() {
    const pool = peopleTab === 'evaluators' ? evaluators : subjects
    const targets = pool.filter((person) => selectedIds.has(person.id))
    if (targets.length === 0) {
      showToast({ variant: 'info', message: 'Select participants on Participant Selection, then send.' })
      setSection('selection')
      return
    }
    if (!emailSubject.trim() || !emailBody.trim()) {
      showToast({ variant: 'info', message: 'Add a subject and message before sending.' })
      return
    }
    const targetIds = new Set(targets.map((person) => person.id))
    setSubjects((current) =>
      current.map((subject) => (targetIds.has(subject.id) ? { ...subject, status: 'Invited' } : subject)),
    )
    setEvaluators((current) =>
      current.map((evaluator) => (targetIds.has(evaluator.id) ? { ...evaluator, status: 'Invited' } : evaluator)),
    )
    recordSend('Email', targets.length)
    showToast({ variant: 'success', message: `Email sent to ${targets.length} participant${targets.length === 1 ? '' : 's'}` })
    setSection('history')
  }

  const rows = peopleTab === 'subjects' ? visibleSubjects : visibleEvaluators
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id))

  return (
    <div className="flex min-h-full bg-white">
      <aside className="w-52 shrink-0 border-r border-gray-200 bg-[#f3f4f6] py-2">
        {NAV.map((item) => {
          const isActive = section === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                'block w-full px-4 py-3 text-left text-sm',
                isActive ? 'bg-white font-medium text-gray-900' : 'text-gray-700 hover:bg-white/70',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </aside>

      <section className="min-w-0 flex-1">
        <div className="border-b border-gray-100 px-6 py-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-blue-700"
            onClick={onBack}
          >
            <span aria-hidden>‹</span>
            Deployment - {deployment.name}
          </button>
        </div>

        {section === 'selection' ? (
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-end gap-6 border-b border-gray-200">
              <button
                type="button"
                className={cn(
                  'border-b-2 pb-2 text-sm font-medium',
                  peopleTab === 'subjects' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600',
                )}
                onClick={() => setPeopleTab('subjects')}
              >
                Subjects ({subjects.length})
              </button>
              <button
                type="button"
                className={cn(
                  'border-b-2 pb-2 text-sm font-medium',
                  peopleTab === 'evaluators' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600',
                )}
                onClick={() => setPeopleTab('evaluators')}
              >
                Evaluators ({evaluators.length})
              </button>
              <button
                type="button"
                className="mb-2 rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  const next = subjects.map((subject) => ({ ...subject }))
                  setSubjects(next)
                  showToast({ variant: 'success', message: 'Participant stats refreshed' })
                }}
              >
                Sanitize Stats
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <WuButton
                  variant="primary"
                  size="sm"
                  onClick={peopleTab === 'subjects' ? openSubjectPicker : openEvaluatorPicker}
                >
                  {peopleTab === 'subjects' ? '+ Add new subjects' : '+ Add evaluators'}
                </WuButton>
                <WuInput
                  variant="outlined"
                  placeholder={peopleTab === 'subjects' ? 'Search Subjects' : 'Search Evaluators'}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-52"
                />
              </div>
              <button
                type="button"
                className="text-sm text-blue-700 hover:underline"
                onClick={() =>
                  showToast({
                    variant: 'success',
                    message: `Exported ${peopleTab === 'subjects' ? subjects.length : evaluators.length} participants`,
                  })
                }
              >
                Export participants
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500">
                    <th className="w-10 px-2 py-2">
                      <WuCheckbox
                        checked={allSelected}
                        partial={selectedIds.size > 0 && !allSelected}
                        onChange={(checked) =>
                          setSelectedIds(checked ? new Set(rows.map((row) => row.id)) : new Set())
                        }
                      />
                    </th>
                    <th className="px-3 py-2 font-medium">Participant</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    {peopleTab === 'subjects' ? (
                      <th className="px-3 py-2 font-medium">Evaluations Received</th>
                    ) : (
                      <>
                        <th className="px-3 py-2 font-medium">Subject</th>
                        <th className="px-3 py-2 font-medium">Relationship</th>
                      </>
                    )}
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {peopleTab === 'subjects'
                    ? visibleSubjects.map((subject) => (
                        <tr key={subject.id} className="border-b border-gray-100">
                          <td className="px-2 py-3">
                            <WuCheckbox
                              checked={selectedIds.has(subject.id)}
                              onChange={(checked) => {
                                setSelectedIds((current) => {
                                  const next = new Set(current)
                                  if (checked) next.add(subject.id)
                                  else next.delete(subject.id)
                                  return next
                                })
                              }}
                            />
                          </td>
                          <td className="px-3 py-3 text-gray-800">{subject.name}</td>
                          <td className="px-3 py-3 text-gray-600">{subject.email}</td>
                          <td className="px-3 py-3 text-gray-700">{evaluationsFor(subject.id)}</td>
                          <td className="px-3 py-3 text-gray-600">{subject.status}</td>
                        </tr>
                      ))
                    : visibleEvaluators.map((evaluator) => (
                        <tr key={evaluator.id} className="border-b border-gray-100">
                          <td className="px-2 py-3">
                            <WuCheckbox
                              checked={selectedIds.has(evaluator.id)}
                              onChange={(checked) => {
                                setSelectedIds((current) => {
                                  const next = new Set(current)
                                  if (checked) next.add(evaluator.id)
                                  else next.delete(evaluator.id)
                                  return next
                                })
                              }}
                            />
                          </td>
                          <td className="px-3 py-3 text-gray-800">{evaluator.name}</td>
                          <td className="px-3 py-3 text-gray-600">{evaluator.email}</td>
                          <td className="px-3 py-3 text-gray-700">{subjectName(evaluator.subjectId)}</td>
                          <td className="px-3 py-3 text-gray-700">{evaluator.relationship}</td>
                          <td className="px-3 py-3 text-gray-600">{evaluator.status}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {rows.length === 0 ? (
              <WuText size="sm" as="p" className="mx-auto mt-16 max-w-md text-center text-gray-500">
                {peopleTab === 'subjects' ? (
                  <>
                    To distribute this 360° study{' '}
                    <button type="button" className="text-blue-700 hover:underline" onClick={openSubjectPicker}>
                      Add Subjects
                    </button>{' '}
                    and then you&apos;ll be able to send an email to selected participants
                  </>
                ) : (
                  <>
                    <button type="button" className="text-blue-700 hover:underline" onClick={openEvaluatorPicker}>
                      Add evaluators
                    </button>{' '}
                    for each subject so they can provide feedback.
                  </>
                )}
              </WuText>
            ) : null}
          </div>
        ) : null}

        {section === 'options' ? (
          <div className="max-w-xl px-6 py-6">
            <WuText size="sm" as="p" className="mb-4 text-gray-500">
              Set who must respond before this deployment can close, then launch invitations.
            </WuText>
            <WuFormGroup
              Label="Minimum evaluators per subject"
              Input={
                <WuInput
                  variant="outlined"
                  value={minEvaluators}
                  onChange={(event) => setMinEvaluators(event.target.value)}
                />
              }
            />
            <div className="mt-6 flex items-center gap-3">
              <WuButton variant="primary" onClick={launchDeployment}>
                Launch deployment
              </WuButton>
              <WuText size="sm" as="span" className="text-gray-500">
                Status: {deployment.status}
              </WuText>
            </div>
          </div>
        ) : null}

        {section === 'compose' ? (
          <div className="max-w-2xl px-6 py-6">
            <WuFormGroup
              Label="Subject"
              Input={
                <WuInput
                  variant="outlined"
                  value={emailSubject}
                  onChange={(event) => setEmailSubject(event.target.value)}
                />
              }
            />
            <div className="mt-4">
              <WuFormGroup
                Label="Message"
                Input={
                  <WuTextarea
                    variant="outlined"
                    value={emailBody}
                    onChange={(event) => setEmailBody(event.target.value)}
                  />
                }
              />
            </div>
            <div className="mt-4">
              <WuButton variant="primary" onClick={sendEmail}>
                Send to selected participants
              </WuButton>
            </div>
          </div>
        ) : null}

        {section === 'templates' ? (
          <div className="grid gap-3 px-6 py-6 sm:grid-cols-3">
            {EMAIL_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                className="rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-blue-300"
                onClick={() => {
                  setEmailSubject(template.subject)
                  setEmailBody(template.body)
                  setSection('compose')
                  showToast({ variant: 'success', message: `${template.name} template applied` })
                }}
              >
                <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                <p className="mt-1 text-xs text-gray-500">{template.subject}</p>
              </button>
            ))}
          </div>
        ) : null}

        {section === 'history' ? (
          <div className="px-6 py-6">
            {history.length === 0 ? (
              <WuText size="sm" as="p" className="text-gray-500">
                Nothing has been sent for this deployment yet.
              </WuText>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500">
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 font-medium">Recipients</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100">
                      <td className="py-3 text-gray-700">{row.date}</td>
                      <td className="py-3 text-gray-800">{row.type}</td>
                      <td className="py-3 text-gray-700">{row.recipients}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}
      </section>

      <WuModal open={addSubjectsOpen} onOpenChange={setAddSubjectsOpen} size="md" {...preventModalDismiss}>
        <WuModalHeader>Add subjects</WuModalHeader>
        <WuModalContent>
          <WuInput
            variant="outlined"
            placeholder="Search employees"
            value={pickerQuery}
            onChange={(event) => setPickerQuery(event.target.value)}
          />
          <div className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
            {rosterChoices.map((employee) => (
              <label key={employee.id} className="flex items-start gap-3 rounded-md px-1 py-1 hover:bg-gray-50">
                <WuCheckbox
                  checked={pickedIds.has(employee.id)}
                  onChange={(checked) => togglePicked(employee.id, checked)}
                />
                <span>
                  <span className="block text-sm text-gray-900">{getEmployeeDisplayName(employee)}</span>
                  <span className="block text-xs text-gray-500">{employee.email}</span>
                </span>
              </label>
            ))}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="primary" onClick={confirmSubjects}>
            Add
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal open={addEvaluatorsOpen} onOpenChange={setAddEvaluatorsOpen} size="md" {...preventModalDismiss}>
        <WuModalHeader>Add evaluators</WuModalHeader>
        <WuModalContent>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <WuFormGroup
              Label="Subject"
              Input={
                <WuSelect
                  data={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={
                    subjects
                      .map((subject) => ({ value: subject.id, label: subject.name }))
                      .find((option) => option.value === evaluatorSubjectId) ?? null
                  }
                  onSelect={(value) => {
                    const selected = value as { value: string } | { value: string }[] | null
                    const next = Array.isArray(selected) ? selected[0] : selected
                    setEvaluatorSubjectId(next?.value ?? '')
                  }}
                  variant="outlined"
                />
              }
            />
            <WuFormGroup
              Label="Relationship"
              Input={
                <WuSelect
                  data={RELATIONSHIPS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={relationship}
                  onSelect={(value) => {
                    const selected = value as (typeof RELATIONSHIPS)[number] | (typeof RELATIONSHIPS)[number][] | null
                    const next = Array.isArray(selected) ? selected[0] : selected
                    setRelationship(next ?? RELATIONSHIPS[1])
                  }}
                  variant="outlined"
                />
              }
            />
          </div>
          <WuInput
            variant="outlined"
            placeholder="Search employees"
            value={pickerQuery}
            onChange={(event) => setPickerQuery(event.target.value)}
          />
          <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
            {rosterChoices.map((employee) => (
              <label key={employee.id} className="flex items-start gap-3 rounded-md px-1 py-1 hover:bg-gray-50">
                <WuCheckbox
                  checked={pickedIds.has(employee.id)}
                  onChange={(checked) => togglePicked(employee.id, checked)}
                />
                <span>
                  <span className="block text-sm text-gray-900">{getEmployeeDisplayName(employee)}</span>
                  <span className="block text-xs text-gray-500">{employee.email}</span>
                </span>
              </label>
            ))}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="primary" onClick={confirmEvaluators}>
            Add
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </div>
  )
}
