'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib'
import { getEmployeeDisplayName } from '@/data/mock-employee-directory'
import type { Survey360Deployment } from '@/data/mock/survey360Deployments'
import { formatDate } from '@/data/mock-utils'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  MailComposeCard,
  toEditorHtml,
  type MailSelectOption,
} from '@/components/modules/feedback360/MailComposeCard'
import { ScheduleReminderModal } from '@/components/modules/feedback360/ScheduleReminderModal'
import { preventModalDismiss } from '@/lib/modalProps'
import { useRosterStore } from '@/lib/rosterStore'
import { cn } from '@/lib/utils'
import {
  mockSurvey360ReminderRules,
  nextFiring,
  reminderAudienceLabel,
  ruleFiresOnDate,
  summarizeReminderRule,
  todayStamp,
  type Survey360ReminderRule,
} from '@/data/mock/survey360ReminderRules'

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
const WuDatePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuDatePicker })),
  { ssr: false },
)
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuMenu })),
  { ssr: false },
)
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuMenuItem })),
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
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCard })),
  { ssr: false },
)
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)
const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTab })),
  { ssr: false },
)

type WorkspaceSection = 'selection' | 'options' | 'invitations' | 'reminders' | 'templates' | 'history'
type PeopleTab = 'subjects' | 'evaluators'
type OptionsTab = 'subject' | 'manager' | 'nominations'
type MailSection = 'invitations' | 'reminders'
type ReminderTab = 'scheduled' | 'manual'
type Relationship = 'Self' | 'Manager' | 'Peer' | 'Direct Report' | 'External'
type ParticipantStatus = 'Not started' | 'Invited' | 'Completed'

type ParticipantOptionsState = {
  subjectSelfEvaluates: boolean
  subjectNominatesEvaluators: boolean
  subjectCannotRemoveAdminNominations: boolean
  subjectCanAccessReport: boolean
  subjectCanSendInvitations: boolean
  subjectCanViewNominationStatus: boolean
  managerCanViewNominations: boolean
  managerCanSetUpNominations: boolean
  managerApprovesEvaluations: boolean
  hideAddNewNominee: boolean
  keepNomineeListPrivate: boolean
}

const DEFAULT_PARTICIPANT_OPTIONS: ParticipantOptionsState = {
  subjectSelfEvaluates: false,
  subjectNominatesEvaluators: false,
  subjectCannotRemoveAdminNominations: false,
  subjectCanAccessReport: false,
  subjectCanSendInvitations: false,
  subjectCanViewNominationStatus: false,
  managerCanViewNominations: false,
  managerCanSetUpNominations: false,
  managerApprovesEvaluations: false,
  hideAddNewNominee: false,
  keepNomineeListPrivate: false,
}

const OPTIONS_TABS: { id: OptionsTab; label: string }[] = [
  { id: 'subject', label: 'Subject' },
  { id: 'manager', label: 'Manager' },
  { id: 'nominations', label: 'Nominations' },
]

const SUBJECT_OPTIONS: { key: keyof ParticipantOptionsState; label: string }[] = [
  { key: 'subjectSelfEvaluates', label: 'Subject self evaluates' },
  { key: 'subjectNominatesEvaluators', label: 'Subject nominates evaluators' },
  { key: 'subjectCannotRemoveAdminNominations', label: 'Subject cannot remove nominations set by managers or admins' },
  { key: 'subjectCanAccessReport', label: 'Subject can access their report' },
  { key: 'subjectCanSendInvitations', label: 'Subject can send invitations' },
  { key: 'subjectCanViewNominationStatus', label: 'Subject can view completion status of nominations' },
]

const MANAGER_OPTIONS: { key: keyof ParticipantOptionsState; label: string }[] = [
  { key: 'managerCanViewNominations', label: 'Manager can view nominations' },
  { key: 'managerCanSetUpNominations', label: 'Manager can set up nominations' },
  { key: 'managerApprovesEvaluations', label: 'Manager approves evaluations' },
]

const NOMINATION_OPTIONS: { key: keyof ParticipantOptionsState; label: string }[] = [
  { key: 'hideAddNewNominee', label: 'Hide add new nominee option' },
  { key: 'keepNomineeListPrivate', label: 'Keep nominee list private' },
]

type SubjectRow = {
  id: string
  employeeId: string
  name: string
  email: string
  status: ParticipantStatus
  reportReleased: boolean
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

type HistoryTab = 'sent' | 'scheduled' | 'member' | 'portal'

type MailRecipientLog = {
  id: string
  to: string
  name: string
  time: string
  status: string
  comments: string
}

type MailBatch = {
  id: string
  tab: HistoryTab
  mailType: string
  subject: string
  date: string
  status: string
  recipients: MailRecipientLog[]
}

type MailTemplateRow = {
  id: string
  name: string
  templateType: string
  type: 'Default' | 'Custom'
  language: string
  subject: string
  body: string
}

const NAV: { id: WorkspaceSection; label: string }[] = [
  { id: 'selection', label: 'Participant selection' },
  { id: 'options', label: 'Participant options' },
  { id: 'invitations', label: 'Invitations' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'templates', label: 'Templates' },
  { id: 'history', label: 'Sent history' },
]

const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: 'Self', label: 'Self' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Peer', label: 'Peer' },
  { value: 'Direct Report', label: 'Direct report' },
  { value: 'External', label: 'External' },
]

const DEFAULT_INVITE_SUBJECT = 'You are invited to participate in [COMPANY_NAME] 360 review'
const DEFAULT_INVITE_BODY = `Dear {FIRST_NAME},

You're invited to participate in a new process to accelerate the development of leaders at [COMPANY_NAME]. To get started, invitations to participate in a short survey will be sent to the individuals you select. You will also complete the survey yourself.

Thank you,
[COMPANY_NAME]`

const DEFAULT_REMINDER_SUBJECT = 'Reminder: complete your 360 feedback'
const DEFAULT_REMINDER_BODY = `Dear {FIRST_NAME},

This is a reminder to finish your 360 feedback for [COMPANY_NAME]. It only takes a few minutes.

Thank you,
[COMPANY_NAME]`

const INVITE_TYPES = [
  { value: 'subject_invite', label: 'Subject Invite' },
  { value: 'evaluator_invite', label: 'Evaluator Invite' },
  { value: 'manager_invite', label: 'Manager Invite' },
]

const REMINDER_TYPES = [
  { value: 'subject_reminder', label: 'Subject Reminder' },
  { value: 'evaluator_reminder', label: 'Evaluator Reminder' },
]

const FROM_OPTIONS = [
  { value: 'survey@qp-mail.com', label: 'QuestionPro Survey (survey@qp-mail.com)' },
]

const HISTORY_TABS: { id: HistoryTab; label: string }[] = [
  { id: 'sent', label: 'Sent Mail' },
  { id: 'scheduled', label: 'Scheduled Mail' },
  { id: 'member', label: 'Member Mail Logs' },
  { id: 'portal', label: 'Portal Mail Logs' },
]

const HISTORY_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'sent', label: 'Sent' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'failed', label: 'Failed' },
  { value: 'opened', label: 'Opened' },
  { value: 'scheduled', label: 'Scheduled' },
]

const DEPLOYMENT_TEMPLATES: MailTemplateRow[] = [
  {
    id: 'tpl_report_approved',
    name: 'Report Request Approved',
    templateType: 'Report Approved',
    type: 'Default',
    language: 'English',
    subject: 'Your report request was approved',
    body: 'Dear {FIRST_NAME},\n\nYour report request has been approved.\n\nThank you,\n[COMPANY_NAME]',
  },
  {
    id: 'tpl_report_rejected',
    name: 'Report Request Rejected',
    templateType: 'Report Approval Rejected',
    type: 'Default',
    language: 'English',
    subject: 'Your report request was rejected',
    body: 'Dear {FIRST_NAME},\n\nYour report request was not approved.\n\nThank you,\n[COMPANY_NAME]',
  },
  {
    id: 'tpl_report_approval',
    name: 'Report Request Approval',
    templateType: 'Report Approval Requested',
    type: 'Default',
    language: 'English',
    subject: 'Report approval needed',
    body: 'Dear {FIRST_NAME},\n\nA report is waiting for your approval.\n\nThank you,\n[COMPANY_NAME]',
  },
  {
    id: 'tpl_request_approval',
    name: 'Request Approval',
    templateType: 'Request Approval',
    type: 'Default',
    language: 'English',
    subject: 'Approval requested',
    body: 'Dear {FIRST_NAME},\n\nPlease review and approve this request.\n\nThank you,\n[COMPANY_NAME]',
  },
  {
    id: 'tpl_nomination_denied',
    name: 'Nomination Denied',
    templateType: 'Nomination Denied',
    type: 'Default',
    language: 'English',
    subject: 'Nomination denied',
    body: 'Dear {FIRST_NAME},\n\nA nomination was denied.\n\nThank you,\n[COMPANY_NAME]',
  },
  {
    id: 'tpl_nomination_approved',
    name: 'Approve Nomination',
    templateType: 'Nomination Approved',
    type: 'Default',
    language: 'English',
    subject: 'Nomination approved',
    body: 'Dear {FIRST_NAME},\n\nA nomination was approved.\n\nThank you,\n[COMPANY_NAME]',
  },
  {
    id: 'tpl_manager_report',
    name: 'Manager Report Ready',
    templateType: 'Manager Report Ready',
    type: 'Default',
    language: 'English',
    subject: 'Manager report is ready',
    body: 'Dear {FIRST_NAME},\n\nThe manager report is ready to view.\n\nThank you,\n[COMPANY_NAME]',
  },
  {
    id: 'tpl_subject_report',
    name: 'Subject Report Ready',
    templateType: 'Subject Report Ready',
    type: 'Default',
    language: 'English',
    subject: 'Your 360 report is ready',
    body: 'Dear {FIRST_NAME},\n\nYour 360 report is ready to view.\n\nThank you,\n[COMPANY_NAME]',
  },
  {
    id: 'tpl_evaluator_reminder',
    name: 'Evaluator Reminder',
    templateType: 'Evaluator Reminder',
    type: 'Default',
    language: 'English',
    subject: DEFAULT_REMINDER_SUBJECT,
    body: DEFAULT_REMINDER_BODY,
  },
  {
    id: 'tpl_subject_reminder',
    name: 'Subject Reminder',
    templateType: 'Subject Reminder',
    type: 'Default',
    language: 'English',
    subject: DEFAULT_REMINDER_SUBJECT,
    body: DEFAULT_REMINDER_BODY,
  },
  {
    id: 'tpl_subject_invite',
    name: 'Subject Invite',
    templateType: 'Subject Invite',
    type: 'Default',
    language: 'English',
    subject: DEFAULT_INVITE_SUBJECT,
    body: DEFAULT_INVITE_BODY,
  },
  {
    id: 'tpl_evaluator_invite',
    name: 'Evaluator Invite',
    templateType: 'Evaluator Invite',
    type: 'Default',
    language: 'English',
    subject: 'You are invited to provide 360 feedback',
    body: 'Dear {FIRST_NAME},\n\nYou are invited to provide feedback as part of a 360 review at [COMPANY_NAME].\n\nThank you,\n[COMPANY_NAME]',
  },
]

function formatStamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatMailStamp(stamp: string) {
  const parsed = new Date(stamp.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return stamp
  return format(parsed, 'MMM d yyyy HH:mm:ss')
}

function historyMailType(label: string) {
  if (label === 'Subject Invite') return 'Subject Invitation'
  if (label === 'Evaluator Invite') return 'Evaluator Invitation'
  if (label === 'Manager Invite') return 'Manager Invitation'
  return label
}

function emailsSentLabel(batch: MailBatch) {
  const delivered = batch.recipients.filter(
    (row) => row.status === 'Sent' || row.status === 'Opened',
  ).length
  return `${delivered}/${batch.recipients.length}`
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
  const [criteriaSubject, setCriteriaSubject] = useState<SubjectRow | null>(null)
  const [subjectToRemove, setSubjectToRemove] = useState<SubjectRow | null>(null)
  const [pickerQuery, setPickerQuery] = useState('')
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set())
  const [evaluatorSubjectId, setEvaluatorSubjectId] = useState('')
  const [relationship, setRelationship] = useState(RELATIONSHIPS[1])
  const [minEvaluators] = useState('3')
  const [optionsTab, setOptionsTab] = useState<OptionsTab>('subject')
  const [participantOptions, setParticipantOptions] = useState<ParticipantOptionsState>(DEFAULT_PARTICIPANT_OPTIONS)
  const [inviteType, setInviteType] = useState(INVITE_TYPES[0])
  const [mailFrom, setMailFrom] = useState(FROM_OPTIONS[0])
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl_subject_invite')
  const [emailSubject, setEmailSubject] = useState(DEFAULT_INVITE_SUBJECT)
  const [emailBody, setEmailBody] = useState(() => toEditorHtml(DEFAULT_INVITE_BODY))
  const [editEmail, setEditEmail] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [templates, setTemplates] = useState<MailTemplateRow[]>(DEPLOYMENT_TEMPLATES)
  const [historyTab, setHistoryTab] = useState<HistoryTab>('sent')
  const [history, setHistory] = useState<MailBatch[]>(() => [
    {
      id: 'hist_overlap_priya',
      tab: 'sent',
      mailType: 'Evaluator Reminder',
      subject: DEFAULT_REMINDER_SUBJECT,
      date: `${todayStamp()} 08:12:00`,
      status: 'Delivery Successful',
      recipients: [
        {
          id: 'hist_overlap_priya_r',
          to: 'priya.nair@questionpro.example',
          name: 'Priya Nair',
          time: `${todayStamp()} 08:12:00`,
          status: 'Sent',
          comments: '',
        },
      ],
    },
    {
      id: 'hist_overlap_marcus',
      tab: 'sent',
      mailType: 'Subject Reminder',
      subject: DEFAULT_REMINDER_SUBJECT,
      date: `${todayStamp()} 08:14:00`,
      status: 'Delivery Successful',
      recipients: [
        {
          id: 'hist_overlap_marcus_r',
          to: 'marcus.chen@questionpro.example',
          name: 'Marcus Chen',
          time: `${todayStamp()} 08:14:00`,
          status: 'Sent',
          comments: '',
        },
      ],
    },
    {
      id: 'hist_invite_bounce',
      tab: 'sent',
      mailType: 'Subject Invitation',
      subject: "You are invited to participate in {COMPANY_NAME}'s 360 leadership development program",
      date: `${todayStamp()} 16:22:41`,
      status: 'Delivery Successful',
      recipients: [
        {
          id: 'hist_invite_bounce_r',
          to: 'x@gmail.com',
          name: 'x',
          time: `${todayStamp()} 16:22:00`,
          status: 'Bounced',
          comments:
            '(host gmail-smtp-in.l.google.com[173.194.43.27] said: 550-5.2.1 The email account that you tried to reach is inactive. For more 550-5.2.1 information, go to 550 5.2.1 https://support.google.com/mail/?p=DisabledUser 41be03b00d2f7-cd6b8808b8csi3766439a12.384 - gsmtp (in reply to RCPT TO command))',
        },
      ],
    },
  ])
  const [selectedBatch, setSelectedBatch] = useState<MailBatch | null>(null)
  const [recipientStatus, setRecipientStatus] = useState(HISTORY_STATUS_OPTIONS[0])
  const [editingDueDate, setEditingDueDate] = useState(false)
  const [dueDateDraft, setDueDateDraft] = useState(deployment.dueDate ?? '')
  const [reminderTab, setReminderTab] = useState<ReminderTab>('scheduled')
  const [reminderRules, setReminderRules] = useState<Survey360ReminderRule[]>(() =>
    mockSurvey360ReminderRules.filter((rule) => rule.deploymentId === deployment.id),
  )
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Survey360ReminderRule | null>(null)
  const [ruleToDelete, setRuleToDelete] = useState<Survey360ReminderRule | null>(null)

  useEffect(() => {
    setReminderRules(mockSurvey360ReminderRules.filter((rule) => rule.deploymentId === deployment.id))
    setReminderTab('scheduled')
  }, [deployment.id])

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

  function minimumRequired() {
    const parsed = Number.parseInt(minEvaluators, 10)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }

  function criteriaFor(subjectId: string) {
    const minimum = minimumRequired()
    const assigned = evaluators.filter((evaluator) => evaluator.subjectId === subjectId)
    const rows = RELATIONSHIPS.map((item) => {
      const group = assigned.filter((evaluator) => evaluator.relationship === item.value)
      const received = group.filter((evaluator) => evaluator.status === 'Completed').length
      return { relationship: item.label, evaluators: group.length, received }
    }).filter((row) => row.evaluators > 0)
    const received = rows.reduce((sum, row) => sum + row.received, 0)
    return {
      rows,
      evaluators: assigned.length,
      received,
      minimum,
      met: assigned.length > 0 && received >= minimum,
    }
  }

  function downloadCriteria(subject: SubjectRow) {
    const report = criteriaFor(subject.id)
    const lines = [
      'Relationship,Evaluators,Responses received',
      ...report.rows.map((row) => `${row.relationship},${row.evaluators},${row.received}`),
      `Total,${report.evaluators},${report.received}`,
      `Minimum evaluators,${report.minimum},`,
      `Criteria,${report.met ? 'Met' : 'Not met'},`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const slug = subject.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    link.href = url
    link.download = `Criteria_report_${slug || 'subject'}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast({ variant: 'success', message: 'Criteria report downloaded' })
  }

  function releaseReport(subject: SubjectRow) {
    if (!criteriaFor(subject.id).met) {
      showToast({ variant: 'info', message: 'Criteria are not met, so this report cannot be released.' })
      return
    }
    setSubjects((current) =>
      current.map((item) => (item.id === subject.id ? { ...item, reportReleased: true } : item)),
    )
    showToast({ variant: 'success', message: `Report released to ${subject.name}` })
  }

  function removeReport(subject: SubjectRow) {
    if (!subject.reportReleased) {
      showToast({ variant: 'info', message: 'There is no released report to remove.' })
      return
    }
    setSubjects((current) =>
      current.map((item) => (item.id === subject.id ? { ...item, reportReleased: false } : item)),
    )
    showToast({ variant: 'success', message: `Report removed for ${subject.name}` })
  }

  function viewReport(subject: SubjectRow) {
    if (!criteriaFor(subject.id).met) {
      showToast({ variant: 'info', message: 'Criteria are not met, so this report cannot be viewed.' })
      return
    }
    showToast({ variant: 'success', message: `Opened the report for ${subject.name}` })
  }

  function removeSubject(subject: SubjectRow) {
    const nextSubjects = subjects.filter((item) => item.id !== subject.id)
    const nextEvaluators = evaluators.filter((item) => item.subjectId !== subject.id)
    setSubjects(nextSubjects)
    setEvaluators(nextEvaluators)
    setSelectedIds((current) => {
      const next = new Set(current)
      next.delete(subject.id)
      return next
    })
    syncCounts(nextSubjects, nextEvaluators)
    setSubjectToRemove(null)
    showToast({ variant: 'success', message: `${subject.name} removed` })
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
        reportReleased: false,
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

  function recordSend(
    targets: { name: string; email: string }[],
    mailType: string,
    tab: HistoryTab = 'sent',
    status = 'Delivery Successful',
    recipientStatus = 'Sent',
  ) {
    const time = formatStamp(new Date())
    const batch: MailBatch = {
      id: `hist_${Date.now()}`,
      tab,
      mailType: historyMailType(mailType),
      subject: emailSubject,
      date: time,
      status,
      recipients: targets.map((target, index) => ({
        id: `hist_${Date.now()}_${index}`,
        to: target.email,
        name: target.name,
        time,
        status: recipientStatus,
        comments: '',
      })),
    }
    setHistory((current) => [batch, ...current])
  }

  function setOption(key: keyof ParticipantOptionsState, value: boolean) {
    setParticipantOptions((current) => ({ ...current, [key]: value }))
  }

  function saveParticipantOptions() {
    showToast({ variant: 'success', message: 'Participant options saved' })
  }

  const mailSection: MailSection | null =
    section === 'invitations' ? 'invitations' : section === 'reminders' ? 'reminders' : null
  const composeTypeOptions = section === 'reminders' ? REMINDER_TYPES : INVITE_TYPES
  const templateOptions = templates.map((template) => ({ value: template.id, label: template.name }))
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? templates[0] ?? null
  const toIsSubjects = inviteType.value.includes('subject')
  const toPool = toIsSubjects ? subjects : evaluators
  const toLabel = toIsSubjects
    ? `All Subjects (${subjects.length})`
    : `All Evaluators (${evaluators.length})`
  const toOptions = [{ value: 'all', label: toLabel }]

  const visibleHistory = useMemo(
    () => history.filter((batch) => batch.tab === historyTab),
    [history, historyTab],
  )

  const visibleRecipients = useMemo(() => {
    if (!selectedBatch) return []
    if (recipientStatus.value === 'all') return selectedBatch.recipients
    return selectedBatch.recipients.filter(
      (row) => row.status.toLowerCase() === recipientStatus.value,
    )
  }, [selectedBatch, recipientStatus.value])

  function applyTemplate(template: MailTemplateRow) {
    setSelectedTemplateId(template.id)
    setEmailSubject(template.subject)
    setEmailBody(toEditorHtml(template.body))
    setEditorKey((current) => current + 1)
  }

  function openMailSection(next: MailSection) {
    setSection(next)
    if (next === 'invitations') {
      setInviteType(INVITE_TYPES[0])
      const template = templates.find((item) => item.id === 'tpl_subject_invite') ?? templates[0]
      if (template) applyTemplate(template)
      return
    }
    setReminderTab('scheduled')
    setInviteType(REMINDER_TYPES[0])
    const template = templates.find((item) => item.id === 'tpl_subject_reminder') ?? templates[0]
    if (template) applyTemplate(template)
  }

  function openTemplateInMail(template: MailTemplateRow) {
    const isReminder = /reminder/i.test(template.templateType) || /reminder/i.test(template.name)
    applyTemplate(template)
    setEditEmail(true)
    if (isReminder) {
      setInviteType(REMINDER_TYPES[0])
      setReminderTab('manual')
      setSection('reminders')
    } else {
      setInviteType(INVITE_TYPES[0])
      setSection('invitations')
    }
    showToast({ variant: 'success', message: `${template.name} opened` })
  }

  function reminderOverlapMessage(people: { name: string; email: string }[]) {
    const today = todayStamp()
    const scheduleToday = reminderRules.some((rule) => ruleFiresOnDate(rule, today, deployment.dueDate))
    const sentToday = history.flatMap((batch) =>
      /reminder/i.test(batch.mailType) && batch.date.startsWith(today)
        ? batch.recipients.filter((row) => row.time.startsWith(today))
        : [],
    )
    const sentEmails = new Set(sentToday.map((row) => row.to.toLowerCase()))
    const names = [
      ...people.filter((person) => sentEmails.has(person.email.toLowerCase()) || scheduleToday).map((person) => person.name),
      ...sentToday.map((row) => row.name),
    ].filter((name, index, all) => all.indexOf(name) === index)
    if (!scheduleToday && sentToday.length === 0) return ''
    if (names.length === 0) {
      return 'A scheduled reminder also fires today. Sending another is allowed, but people may receive more than one.'
    }
    const listed = names.slice(0, 4).join(', ')
    const extra = names.length > 4 ? ` + ${names.length - 4} more` : ''
    return `These people already have a reminder today: ${listed}${extra}. Sending another is allowed, but they will receive more than one.`
  }

  function sendEmail() {
    if (toPool.length === 0) {
      showToast({
        variant: 'info',
        message: toIsSubjects
          ? 'Add subjects on Participant Selection before sending.'
          : 'Add evaluators on Participant Selection before sending.',
      })
      setSection('selection')
      return
    }
    if (!emailSubject.trim() || !emailBody.trim()) {
      showToast({ variant: 'info', message: 'Add a subject and message before sending.' })
      return
    }
    const overlap = section === 'reminders' ? reminderOverlapMessage(toPool) : ''
    if (overlap) {
      showToast({ variant: 'info', message: overlap })
    }
    if (toIsSubjects) {
      setSubjects((current) => current.map((subject) => ({ ...subject, status: 'Invited' })))
    } else {
      setEvaluators((current) => current.map((evaluator) => ({ ...evaluator, status: 'Invited' })))
    }
    recordSend(
      toPool.map((person) => ({ name: person.name, email: person.email })),
      inviteType.label,
    )
    showToast({
      variant: 'success',
      message: `Mail sent to ${toPool.length} ${toIsSubjects ? 'subject' : 'evaluator'}${toPool.length === 1 ? '' : 's'}`,
    })
    setHistoryTab('sent')
    setSection('history')
  }

  function saveReminderRule(rule: Survey360ReminderRule) {
    const nextRule = { ...rule, deploymentId: deployment.id }
    const exists = reminderRules.some((item) => item.id === nextRule.id)
    const next = exists
      ? reminderRules.map((item) => (item.id === nextRule.id ? nextRule : item))
      : [...reminderRules, nextRule]
    setReminderRules(next)
    const audiencePool = nextRule.audience === 'evaluator' ? evaluators : subjects
    const warning = reminderOverlapMessage(
      audiencePool.map((person) => ({ name: person.name, email: person.email })),
    )
    const firesToday = ruleFiresOnDate(nextRule, todayStamp(), deployment.dueDate)
    if (firesToday && warning) {
      showToast({ variant: 'info', message: warning })
    }
    showToast({ variant: 'success', message: exists ? 'Reminder updated' : 'Reminder scheduled' })
  }

  function previewScheduledSend(rule: Survey360ReminderRule) {
    const audiencePool = rule.audience === 'evaluator' ? evaluators : subjects
    const people = audiencePool.map((person) => ({ name: person.name, email: person.email }))
    if (people.length === 0) {
      showToast({
        variant: 'info',
        message:
          rule.audience === 'evaluator'
            ? 'Add evaluators on Participant selection to preview who would receive this.'
            : 'Add subjects on Participant selection to preview who would receive this.',
      })
      return
    }
    const overlap = reminderOverlapMessage(people)
    if (overlap) showToast({ variant: 'info', message: overlap })
    const time = formatStamp(new Date())
    setHistory((current) => [
      {
        id: `hist_${Date.now()}`,
        tab: 'scheduled',
        mailType: reminderAudienceLabel(rule.audience),
        subject: rule.subject,
        date: time,
        status: 'Scheduled',
        recipients: people.map((person, index) => ({
          id: `hist_${Date.now()}_${index}`,
          to: person.email,
          name: person.name,
          time,
          status: 'Scheduled',
          comments: summarizeReminderRule(rule, deployment.dueDate),
        })),
      },
      ...current,
    ])
    showToast({
      variant: 'success',
      message: `Scheduled send logged for ${people.length} ${rule.audience === 'evaluator' ? 'evaluator' : 'subject'}${people.length === 1 ? '' : 's'}`,
    })
    setHistoryTab('scheduled')
    setSection('history')
  }

  const rows = peopleTab === 'subjects' ? visibleSubjects : visibleEvaluators
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id))

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white">
      <aside className="w-52 shrink-0 overflow-y-auto border-r border-gray-200 bg-[#f3f4f6] py-2">
        {NAV.map((item) => {
          const isActive = section === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'invitations' || item.id === 'reminders') openMailSection(item.id)
                else setSection(item.id)
              }}
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

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-blue-700"
            onClick={onBack}
          >
            <span aria-hidden>‹</span>
            Deployment - {deployment.name}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {editingDueDate ? (
              <>
                <div className="w-48">
                  <WuDatePicker
                    value={dueDateDraft ? new Date(`${dueDateDraft}T00:00:00`) : undefined}
                    onChange={(date) => setDueDateDraft(date ? format(date, 'yyyy-MM-dd') : '')}
                    variant="outlined"
                    placeholder="Select due date"
                  />
                </div>
                <WuButton
                  variant="link"
                  onClick={() => {
                    setDueDateDraft('')
                  }}
                >
                  Clear
                </WuButton>
                <WuButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDueDateDraft(deployment.dueDate ?? '')
                    setEditingDueDate(false)
                  }}
                >
                  Cancel
                </WuButton>
                <WuButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const nextDue = dueDateDraft.trim() || null
                    onUpdate({ ...deployment, dueDate: nextDue })
                    setEditingDueDate(false)
                    showToast({
                      variant: 'success',
                      message: nextDue ? `Due date set to ${formatDate(`${nextDue}T00:00:00`)}` : 'Due date cleared',
                    })
                  }}
                >
                  Save
                </WuButton>
              </>
            ) : (
              <>
                <WuText size="sm" as="span" className="text-gray-600">
                  Due date:{' '}
                  <span className="font-medium text-gray-900">
                    {deployment.dueDate ? formatDate(`${deployment.dueDate}T00:00:00`) : 'None'}
                  </span>
                </WuText>
                <WuButton
                  variant="link"
                  onClick={() => {
                    setDueDateDraft(deployment.dueDate ?? '')
                    setEditingDueDate(true)
                  }}
                >
                  {deployment.dueDate ? 'Edit' : 'Add due date'}
                </WuButton>
              </>
            )}
          </div>
        </div>

        <div className={cn('min-h-0 flex-1', mailSection ? 'overflow-hidden' : 'overflow-y-auto')}>
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
                    {peopleTab === 'subjects' ? <th className="w-24 px-2 py-2" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {peopleTab === 'subjects'
                    ? visibleSubjects.map((subject) => {
                        const counts = criteriaFor(subject.id)
                        return (
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
                          <td className="px-3 py-3 text-gray-700">
                            {counts.received}/{counts.evaluators}
                          </td>
                          <td className="px-3 py-3 text-gray-600">{subject.status}</td>
                          <td className="px-2 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                aria-label={`Remove ${subject.name}`}
                                onClick={() => setSubjectToRemove(subject)}
                              >
                                <span className="wm-delete text-base leading-none" aria-hidden />
                              </button>
                              <WuMenu
                                Trigger={
                                  <button
                                    type="button"
                                    className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    aria-label={`Actions for ${subject.name}`}
                                  >
                                    <span className="wm-more-vert text-base leading-none" />
                                  </button>
                                }
                                align="end"
                              >
                                <WuMenuItem
                                  onSelect={() =>
                                    showToast({ variant: 'success', message: `Logged in as ${subject.name}` })
                                  }
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="wm-person text-base leading-none" aria-hidden />
                                    Login As
                                  </span>
                                </WuMenuItem>
                                <WuMenuItem onSelect={() => releaseReport(subject)}>
                                  <span className="flex items-center gap-2">
                                    <span className="wm-description text-base leading-none" aria-hidden />
                                    Release Report
                                  </span>
                                </WuMenuItem>
                                <WuMenuItem onSelect={() => setCriteriaSubject(subject)}>
                                  <span className="flex items-center gap-2">
                                    <span className="wm-bar-chart text-base leading-none" aria-hidden />
                                    Get Criteria Report
                                  </span>
                                </WuMenuItem>
                                <WuMenuItem onSelect={() => removeReport(subject)}>
                                  <span className="flex items-center gap-2">
                                    <span className="wm-remove text-base leading-none" aria-hidden />
                                    Remove Report
                                  </span>
                                </WuMenuItem>
                                <WuMenuItem onSelect={() => viewReport(subject)}>
                                  <span className="flex items-center gap-2">
                                    <span className="wm-visibility text-base leading-none" aria-hidden />
                                    View Report
                                  </span>
                                </WuMenuItem>
                                <WuMenuItem
                                  onSelect={() => {
                                    setSection('history')
                                    showToast({ variant: 'info', message: `Showing sent history for ${subject.name}` })
                                  }}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="wm-history text-base leading-none" aria-hidden />
                                    History
                                  </span>
                                </WuMenuItem>
                              </WuMenu>
                            </div>
                          </td>
                        </tr>
                        )
                      })
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
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-end gap-6 border-b border-gray-200">
              {OPTIONS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={cn(
                    'border-b-2 pb-2 text-sm font-medium',
                    optionsTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600',
                  )}
                  onClick={() => setOptionsTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-6 max-w-xl space-y-5">
              {(optionsTab === 'subject'
                ? SUBJECT_OPTIONS
                : optionsTab === 'manager'
                  ? MANAGER_OPTIONS
                  : NOMINATION_OPTIONS
              ).map((option) => (
                <label key={option.key} className="flex items-center justify-between gap-6 text-sm text-gray-800">
                  <span>{option.label}</span>
                  <WuToggle
                    checked={participantOptions[option.key]}
                    onChange={(checked) => setOption(option.key, checked)}
                  />
                </label>
              ))}
            </div>

            <div className="mt-8">
              <WuButton variant="primary" onClick={saveParticipantOptions}>
                Save
              </WuButton>
            </div>
          </div>
        ) : null}

        {section === 'invitations' ? (
          <MailComposer
            title="Invitations"
            typeOptions={composeTypeOptions}
            inviteType={inviteType}
            onTypeChange={setInviteType}
            toOptions={toOptions}
            fromOptions={FROM_OPTIONS}
            mailFrom={mailFrom}
            onFromChange={setMailFrom}
            templateOptions={templateOptions}
            selectedTemplate={
              selectedTemplate
                ? { value: selectedTemplate.id, label: selectedTemplate.name }
                : templateOptions[0]
            }
            onTemplateChange={(id) => {
              const template = templates.find((item) => item.id === id)
              if (template) applyTemplate(template)
            }}
            emailSubject={emailSubject}
            onSubjectChange={setEmailSubject}
            emailBody={emailBody}
            onBodyChange={setEmailBody}
            editEmail={editEmail}
            onEditEmailChange={(value) => {
              setEditEmail(value)
              if (value) setEditorKey((current) => current + 1)
            }}
            editorKey={editorKey}
            recipientCount={toPool.length}
            recipientKind={toIsSubjects ? 'subject' : 'evaluator'}
            onSend={sendEmail}
            onSendTest={() =>
              showToast({ variant: 'success', message: 'Test mail sent to your inbox' })
            }
            onSchedule={() =>
              showToast({ variant: 'success', message: 'Mail scheduled for later today' })
            }
          />
        ) : null}

        {section === 'reminders' ? (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <WuTab
              key={reminderTab}
              defaultValue={reminderTab}
              items={
                [
                  {
                    value: 'scheduled',
                    Trigger: 'Scheduled',
                    Content: (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <WuHeading size="sm" className="text-gray-900">
                      Scheduled reminders
                    </WuHeading>
                  </div>
                  <div className="flex items-center gap-2">
                    <WuButton variant="secondary" onClick={() => setReminderTab('manual')}>
                      Send reminder now
                    </WuButton>
                    <WuButton
                      variant="primary"
                      onClick={() => {
                        setEditingRule(null)
                        setScheduleOpen(true)
                      }}
                    >
                      Add reminder
                    </WuButton>
                  </div>
                </div>

                {reminderRules.length === 0 ? (
                  <EmptyState
                    icon="wm-calendar"
                    title="No scheduled reminders"
                    description="Add a one-time or repeating reminder."
                    action={
                      <WuButton
                        variant="primary"
                        onClick={() => {
                          setEditingRule(null)
                          setScheduleOpen(true)
                        }}
                      >
                        Add reminder
                      </WuButton>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {reminderRules.map((rule) => {
                      const next = nextFiring(rule, deployment.dueDate)
                      const firesToday = ruleFiresOnDate(rule, todayStamp(), deployment.dueDate)
                      const sentToday = history.some(
                        (batch) =>
                          /reminder/i.test(batch.mailType) && batch.date.startsWith(todayStamp()),
                      )
                      return (
                        <WuCard key={rule.id} rounded className="p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {reminderAudienceLabel(rule.audience)} · {rule.mode === 'one_time' ? 'One-time' : 'Recurring'}
                              </p>
                              <p className="mt-1 text-sm text-gray-700">
                                {summarizeReminderRule(rule, deployment.dueDate)}
                              </p>
                              <p className="mt-1 truncate text-sm text-gray-600">{rule.subject}</p>
                              <p className="mt-2 text-xs text-gray-500">
                                Next: {next ? formatDate(`${next}T00:00:00`) : 'No upcoming firing'}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {firesToday ? (
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-xs font-medium',
                                    sentToday
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-50 text-blue-700',
                                  )}
                                >
                                  {sentToday ? 'Overlap today' : 'Fires today'}
                                </span>
                              ) : null}
                              <WuButton variant="secondary" size="sm" onClick={() => previewScheduledSend(rule)}>
                                Preview send
                              </WuButton>
                              <WuButton
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setEditingRule(rule)
                                  setScheduleOpen(true)
                                }}
                              >
                                Edit
                              </WuButton>
                              <WuButton variant="secondary" size="sm" onClick={() => setRuleToDelete(rule)}>
                                Delete
                              </WuButton>
                            </div>
                          </div>
                        </WuCard>
                      )
                    })}
                  </div>
                )}
              </div>
                    ),
                  },
                  {
                    value: 'manual',
                    Trigger: 'Manual',
                    Content: (
              <MailComposer
                title="Manual reminder"
                banner={reminderOverlapMessage(toPool)}
                showMore={false}
                typeOptions={composeTypeOptions}
                inviteType={inviteType}
                onTypeChange={setInviteType}
                toOptions={toOptions}
                fromOptions={FROM_OPTIONS}
                mailFrom={mailFrom}
                onFromChange={setMailFrom}
                templateOptions={templateOptions}
                selectedTemplate={
                  selectedTemplate
                    ? { value: selectedTemplate.id, label: selectedTemplate.name }
                    : templateOptions[0]
                }
                onTemplateChange={(id) => {
                  const template = templates.find((item) => item.id === id)
                  if (template) applyTemplate(template)
                }}
                emailSubject={emailSubject}
                onSubjectChange={setEmailSubject}
                emailBody={emailBody}
                onBodyChange={setEmailBody}
                editEmail={editEmail}
                onEditEmailChange={(value) => {
                  setEditEmail(value)
                  if (value) setEditorKey((current) => current + 1)
                }}
                editorKey={editorKey}
                recipientCount={toPool.length}
                recipientKind={toIsSubjects ? 'subject' : 'evaluator'}
                onSend={sendEmail}
                onSendTest={() =>
                  showToast({ variant: 'success', message: 'Test mail sent to your inbox' })
                }
                onSchedule={() => {
                  setReminderTab('scheduled')
                  setEditingRule({
                    id: '',
                    deploymentId: deployment.id,
                    mode: 'one_time',
                    time: '',
                    audience: inviteType.value.includes('subject') ? 'subject' : 'evaluator',
                    from: mailFrom.value,
                    templateId: selectedTemplateId,
                    subject: emailSubject,
                    body: emailBody,
                  })
                  setScheduleOpen(true)
                }}
              />
                    ),
                  },
                ] as IWuTabItem[]
              }
            />
          </div>
        ) : null}

        {section === 'templates' ? (
          <div className="px-6 py-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WuButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const created: MailTemplateRow = {
                      id: `tpl_${Date.now()}`,
                      name: 'New template',
                      templateType: 'Custom',
                      type: 'Custom',
                      language: 'English',
                      subject: 'New message',
                      body: 'Dear {FIRST_NAME},\n\n\n\nThank you,\n[COMPANY_NAME]',
                    }
                    setTemplates((current) => [created, ...current])
                    showToast({ variant: 'success', message: 'Template added' })
                  }}
                >
                  + New template
                </WuButton>
                <button
                  type="button"
                  className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white"
                  aria-label="About templates"
                  onClick={() =>
                    showToast({
                      variant: 'info',
                      message: 'Templates are used for invitations, reminders, nominations, and report emails.',
                    })
                  }
                >
                  ?
                </button>
              </div>
              <WuText size="sm" as="span" className="text-gray-600">
                {templates.length} Templates
              </WuText>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500">
                    <th className="px-3 py-2 font-medium">Template Name</th>
                    <th className="px-3 py-2 font-medium">Template Type</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Default Language</th>
                    <th className="px-3 py-2 font-medium">Translations</th>
                    <th className="w-24 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id} className="group border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3 font-medium text-gray-900">{template.name}</td>
                      <td className="px-3 py-3 text-gray-700">{template.templateType}</td>
                      <td className="px-3 py-3 text-gray-700">{template.type}</td>
                      <td className="px-3 py-3 text-gray-700">{template.language}</td>
                      <td className="px-3 py-3 text-gray-500">N/A</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            className="rounded p-1 text-gray-500 hover:bg-white hover:text-gray-800"
                            aria-label={`Manage languages for ${template.name}`}
                            title="Manage languages"
                            onClick={() =>
                              showToast({ variant: 'info', message: `Manage languages for ${template.name}` })
                            }
                          >
                            <span className="wm-translate text-base leading-none" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1 text-gray-500 hover:bg-white hover:text-gray-800"
                            aria-label={`Edit ${template.name}`}
                            onClick={() => openTemplateInMail(template)}
                          >
                            <span className="wm-edit text-base leading-none" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {section === 'history' ? (
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-end gap-6 border-b border-gray-200">
              {HISTORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={cn(
                    'border-b-2 pb-2 text-sm font-medium',
                    historyTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600',
                  )}
                  onClick={() => setHistoryTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500">
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Subject</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Emails Sent</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {visibleHistory.length > 0 ? (
                    visibleHistory.map((batch) => (
                      <tr key={batch.id} className="border-b border-gray-100">
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            className="text-left font-medium text-blue-600 hover:underline"
                            onClick={() => {
                              setRecipientStatus(HISTORY_STATUS_OPTIONS[0])
                              setSelectedBatch(batch)
                            }}
                          >
                            {batch.mailType}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-gray-800">{batch.subject}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                          {formatMailStamp(batch.date)}
                        </td>
                        <td className="px-3 py-3 text-gray-700">{emailsSentLabel(batch)}</td>
                        <td className="px-3 py-3 text-gray-700">{batch.status}</td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            className="inline-flex size-6 items-center justify-center rounded-full border border-gray-400 text-[11px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                            aria-label={`Individual mail history for ${batch.mailType}`}
                            onClick={() => {
                              setRecipientStatus(HISTORY_STATUS_OPTIONS[0])
                              setSelectedBatch(batch)
                            }}
                          >
                            i
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-3 py-10 text-center text-gray-500" colSpan={6}>
                        {historyTab === 'sent'
                          ? 'No sent mail yet for this deployment.'
                          : `No ${HISTORY_TABS.find((tab) => tab.id === historyTab)?.label.toLowerCase() ?? 'logs'} yet.`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        </div>
      </section>

      <WuModal
        open={selectedBatch != null}
        onOpenChange={(open) => {
          if (!open) setSelectedBatch(null)
        }}
        variant="action"
        size="lg"
        {...preventModalDismiss}
      >
        <WuModalHeader>
          <span className="inline-flex items-center gap-2">
            Individual Mail History
            <WuTooltip content="Recipient-level delivery status for this send." position="bottom" showArrow>
              <span
                className="inline-flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white"
                aria-label="About individual mail history"
              >
                ?
              </span>
            </WuTooltip>
          </span>
        </WuModalHeader>
        <WuModalContent>
          <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
            <div className="w-44">
              <WuSelect
                data={HISTORY_STATUS_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={recipientStatus}
                onSelect={(next) => setRecipientStatus(next as (typeof HISTORY_STATUS_OPTIONS)[number])}
                variant="outlined"
              />
            </div>
            <WuButton
              variant="primary"
              onClick={() =>
                showToast({
                  variant: 'success',
                  message: `Downloaded ${visibleRecipients.length} mail log row${visibleRecipients.length === 1 ? '' : 's'}`,
                })
              }
            >
              <span className="inline-flex items-center gap-2">
                <span className="wm-download text-base" aria-hidden />
                Download CSV
              </span>
            </WuButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500">
                  <th className="px-3 py-2 font-medium">To</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Comments</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecipients.length > 0 ? (
                  visibleRecipients.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 align-top">
                      <td className="px-3 py-3 text-gray-800">{row.to}</td>
                      <td className="px-3 py-3 text-gray-800">{row.name}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                        {formatMailStamp(row.time)}
                      </td>
                      <td className="px-3 py-3 text-gray-700">{row.status}</td>
                      <td className="px-3 py-3 text-gray-600">{row.comments || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-10 text-center text-gray-500" colSpan={5}>
                      No mail logs for this status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </WuModalContent>
      </WuModal>

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

      <WuModal
        open={criteriaSubject != null}
        onOpenChange={(open) => {
          if (!open) setCriteriaSubject(null)
        }}
        variant="action"
        size="lg"
        {...preventModalDismiss}
      >
        <WuModalHeader>
          <span className="block leading-tight">Criteria report</span>
          {criteriaSubject ? (
            <span className="mt-1 block text-sm font-normal text-gray-500">{criteriaSubject.name}</span>
          ) : null}
        </WuModalHeader>
        <WuModalContent>
          {criteriaSubject ? <CriteriaReportBody report={criteriaFor(criteriaSubject.id)} /> : null}
        </WuModalContent>
        <WuModalFooter>
          <div className="flex w-full items-center justify-end gap-3">
            <WuButton variant="secondary" onClick={() => setCriteriaSubject(null)}>
              Close
            </WuButton>
            <WuButton
              onClick={() => {
                if (criteriaSubject) downloadCriteria(criteriaSubject)
              }}
            >
              Download
            </WuButton>
          </div>
        </WuModalFooter>
      </WuModal>

      <ScheduleReminderModal
        open={scheduleOpen}
        onOpenChange={(open) => {
          setScheduleOpen(open)
          if (!open) setEditingRule(null)
        }}
        dueDate={deployment.dueDate}
        initial={editingRule}
        templates={templates}
        subjectCount={subjects.length}
        evaluatorCount={evaluators.length}
        onSave={saveReminderRule}
      />

      <ConfirmModal
        open={subjectToRemove != null}
        onOpenChange={(open) => {
          if (!open) setSubjectToRemove(null)
        }}
        title="Remove subject"
        description={
          subjectToRemove
            ? `Remove ${subjectToRemove.name} from this deployment? Their evaluators will be removed too.`
            : ''
        }
        confirmLabel="Remove"
        variant="critical"
        onConfirm={() => {
          if (subjectToRemove) removeSubject(subjectToRemove)
        }}
      />

      <ConfirmModal
        open={ruleToDelete != null}
        onOpenChange={(open) => {
          if (!open) setRuleToDelete(null)
        }}
        title="Delete reminder"
        description="Delete this scheduled reminder? Remaining firings will be cancelled."
        confirmLabel="Delete"
        variant="critical"
        onConfirm={() => {
          if (!ruleToDelete) return
          setReminderRules((current) => current.filter((rule) => rule.id !== ruleToDelete.id))
          setRuleToDelete(null)
          showToast({ variant: 'success', message: 'Scheduled reminder deleted' })
        }}
      />
    </div>
  )
}

function CriteriaReportBody({
  report,
}: {
  report: {
    rows: { relationship: string; evaluators: number; received: number }[]
    evaluators: number
    received: number
    minimum: number
    met: boolean
  }
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        A report can be generated when responses received reach the minimum evaluators for this deployment.
      </p>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs text-gray-500">
            <th className="px-3 py-2 font-medium">Relationship</th>
            <th className="px-3 py-2 font-medium">Evaluators</th>
            <th className="px-3 py-2 font-medium">Responses received</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.length === 0 ? (
            <tr>
              <td className="px-3 py-3 text-gray-500" colSpan={3}>
                No evaluators have been added for this subject.
              </td>
            </tr>
          ) : (
            report.rows.map((row) => (
              <tr key={row.relationship} className="border-b border-gray-100">
                <td className="px-3 py-3 text-gray-800">{row.relationship}</td>
                <td className="px-3 py-3 text-gray-700">{row.evaluators}</td>
                <td className="px-3 py-3 text-gray-700">{row.received}</td>
              </tr>
            ))
          )}
          <tr className="border-b border-gray-200">
            <td className="px-3 py-3 font-medium text-gray-900">Total</td>
            <td className="px-3 py-3 font-medium text-gray-900">{report.evaluators}</td>
            <td className="px-3 py-3 font-medium text-gray-900">{report.received}</td>
          </tr>
        </tbody>
      </table>
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-700">Minimum evaluators: {report.minimum}</span>
        <span className={report.met ? 'font-medium text-green-700' : 'font-medium text-red-600'}>
          {report.met ? 'Criteria met' : 'Criteria not met'}
        </span>
      </div>
    </div>
  )
}

function MailComposer({
  title,
  banner,
  typeOptions,
  inviteType,
  onTypeChange,
  toOptions,
  fromOptions,
  mailFrom,
  onFromChange,
  templateOptions,
  selectedTemplate,
  onTemplateChange,
  emailSubject,
  onSubjectChange,
  emailBody,
  onBodyChange,
  editEmail,
  onEditEmailChange,
  editorKey,
  recipientCount,
  recipientKind,
  onSend,
  onSendTest,
  onSchedule,
  showMore = true,
}: {
  title: string
  banner?: string
  typeOptions: MailSelectOption[]
  inviteType: MailSelectOption
  onTypeChange: (next: MailSelectOption) => void
  toOptions: MailSelectOption[]
  fromOptions: MailSelectOption[]
  mailFrom: MailSelectOption
  onFromChange: (next: MailSelectOption) => void
  templateOptions: MailSelectOption[]
  selectedTemplate: MailSelectOption
  onTemplateChange: (id: string) => void
  emailSubject: string
  onSubjectChange: (value: string) => void
  emailBody: string
  onBodyChange: (value: string) => void
  editEmail: boolean
  onEditEmailChange: (value: boolean) => void
  editorKey: number
  recipientCount: number
  recipientKind: 'subject' | 'evaluator'
  onSend: () => void
  onSendTest: () => void
  onSchedule: () => void
  showMore?: boolean
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F7F9FC] px-6 py-5">
      <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <WuHeading size="sm" className="text-gray-900">
            {title}
          </WuHeading>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
            {recipientCount} {recipientKind}
            {recipientCount === 1 ? '' : 's'}
          </span>
          <WuTooltip
            content="Turn on Edit email to change the subject, body, and merge variables before you send."
            position="left"
            showArrow
          >
            <span
              className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white"
              aria-label="About this page"
            >
              ?
            </span>
          </WuTooltip>
        </div>
      </div>

      {banner ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {banner}
        </div>
      ) : null}

      <MailComposeCard
        typeOptions={typeOptions}
        inviteType={inviteType}
        onTypeChange={onTypeChange}
        toOptions={toOptions}
        fromOptions={fromOptions}
        mailFrom={mailFrom}
        onFromChange={onFromChange}
        templateOptions={templateOptions}
        selectedTemplate={selectedTemplate}
        onTemplateChange={onTemplateChange}
        emailSubject={emailSubject}
        onSubjectChange={onSubjectChange}
        emailBody={emailBody}
        onBodyChange={onBodyChange}
        editEmail={editEmail}
        onEditEmailChange={onEditEmailChange}
        editorKey={editorKey}
        footerRight={
          <>
            {showMore ? (
              <WuMenu Trigger={<WuButton variant="secondary">More</WuButton>} align="end">
                <WuMenuItem onSelect={onSendTest}>Send test</WuMenuItem>
                <WuMenuItem onSelect={onSchedule}>Schedule mail</WuMenuItem>
              </WuMenu>
            ) : null}
            <WuButton variant="primary" onClick={onSend}>
              Send Mail
            </WuButton>
          </>
        }
      />
    </div>
  )
}
