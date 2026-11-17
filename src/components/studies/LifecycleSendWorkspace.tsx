'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { MailComposer } from '@/components/modules/feedback360/MailComposer'
import { toEditorHtml, type MailSelectOption } from '@/components/modules/feedback360/MailComposeCard'
import { ScheduleReminderModal } from '@/components/modules/feedback360/ScheduleReminderModal'
import { LifecycleNewTemplateModal } from '@/components/studies/LifecycleNewTemplateModal'
import { LifecycleSentHistory } from '@/components/studies/LifecycleSentHistory'
import {
  AddFromEmailModal,
  ChannelExtraFields,
  DeliveryModeField,
  DeploymentField,
  RecipientPicker,
  SendCreditsBar,
  primaryDeliveryMode,
} from '@/components/studies/LifecycleInviteFields'
import { preventModalDismiss } from '@/lib/modalProps'
import { useRosterStore } from '@/lib/rosterStore'
import { cn } from '@/lib/utils'
import { getEmployeeDisplayName } from '@/data/mock-employee-directory'
import {
  LIFECYCLE_FROM_OPTIONS,
  LIFECYCLE_INVITE_TYPES,
  LIFECYCLE_MAIL_TEMPLATES,
  LIFECYCLE_REMINDER_TYPES,
  LIFECYCLE_TEMPLATE_TABS,
  DEFAULT_SLACK_INVITE_BODY,
  DEFAULT_SMS_INVITE_BODY,
  DEFAULT_SURVEY_INVITE_BODY,
  DEFAULT_SURVEY_INVITE_SUBJECT,
  INITIAL_LIFECYCLE_SEND_CREDITS,
  LIFECYCLE_CREDIT_PACK,
  PAID_DELIVERY_MODES,
  channelLabel,
  deploymentsForSurvey,
  lifecycleDeploymentLabel,
  mockLifecycleReminderRules,
  seedLifecycleMailHistory,
  surveyLinkForEmployee,
  usesPaidDelivery,
  type LifecycleDeliveryMode,
  type LifecycleDeployment,
  type LifecycleHistoryTab,
  type LifecycleMailBatch,
  type LifecycleMailTemplate,
  type LifecycleScheduleKind,
  type LifecycleTemplateKind,
} from '@/data/mock/lifecycleMail'
import {
  LIFECYCLE_REMINDER_AUDIENCE_OPTIONS,
  generateOccurrences,
  reminderScheduleStamp,
  ruleFiresOnDate,
  summarizeReminderRule,
  todayStamp,
  type Survey360ReminderRule,
} from '@/data/mock/survey360ReminderRules'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
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
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalFooter })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTable })),
  { ssr: false },
)

type WorkspaceSection = 'invitations' | 'reminders' | 'scheduled' | 'templates' | 'history'

const NAV: { id: WorkspaceSection; label: string }[] = [
  { id: 'invitations', label: 'Invitations' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'templates', label: 'Templates' },
  { id: 'history', label: 'Sent history' },
]

const HISTORY_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'sent', label: 'Sent' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'failed', label: 'Failed' },
  { value: 'opened', label: 'Opened' },
  { value: 'scheduled', label: 'Scheduled' },
]

const SCHEDULE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'invitation', label: 'New Invitations' },
  { value: 'reminder', label: 'Reminder Invitations' },
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

function formatDeliverySchedule(stamp: string) {
  const parsed = new Date(stamp.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return stamp
  return format(parsed, 'MMM d yyyy hh:mm a')
}

function reminderHistoryLabel(batch: LifecycleMailBatch) {
  const mode = batch.deliveryModes?.[0]
  const channel = mode === 'slack' ? 'Slack' : mode === 'sms' ? 'SMS' : 'Email'
  const kind = batch.kind === 'reminder' ? 'Survey reminder' : 'Survey invitation'
  const parsed = new Date(batch.date.replace(' ', 'T'))
  const when = Number.isNaN(parsed.getTime()) ? batch.date : format(parsed, 'MMM d, yyyy h:mm a')
  return `${kind} · ${channel} · ${when}`
}

function scheduledKind(batch: LifecycleMailBatch): LifecycleScheduleKind {
  if (batch.kind) return batch.kind
  return /reminder/i.test(batch.mailType) ? 'reminder' : 'invitation'
}

function scheduledTypeParts(batch: LifecycleMailBatch) {
  return {
    type: scheduledKind(batch) === 'reminder' ? 'Reminders' : 'New invitation',
    cadence: batch.cadence === 'recurring' ? 'Recurring' : 'One-time',
  }
}

function scheduledToLabel(batch: LifecycleMailBatch) {
  const count = batch.recipients.length
  if (batch.groupName) return `${batch.groupName} (${count})`
  return String(count)
}

function nextUpcomingStamp(batch: LifecycleMailBatch, rules: Survey360ReminderRule[]) {
  if (batch.cadence !== 'recurring') return null
  const rule =
    (batch.ruleId ? rules.find((item) => item.id === batch.ruleId) : undefined) ??
    rules.find((item) => item.deploymentId === batch.deploymentId && item.mode === 'recurring')
  if (!rule || rule.mode !== 'recurring') return null
  const stamps = generateOccurrences(rule, null).map((date) => {
    const hhmm = rule.time || '09:00'
    const time = hhmm.length === 5 ? `${hhmm}:00` : hhmm
    return `${date} ${time}`
  })
  return stamps.find((stamp) => stamp > batch.date) ?? null
}

function historyMailType(label: string) {
  if (label === 'Survey Invite') return 'Survey Invitation'
  return label
}

const DEPLOYMENT_STATUS_OPTIONS: { value: LifecycleDeployment['status']; label: string }[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Draft', label: 'Draft' },
]

export function LifecycleSendWorkspace({
  surveyId,
  surveyName,
}: {
  surveyId: string
  surveyName: string
}) {
  const { showToast } = useWuShowToast()
  const { employees, savedFilters } = useRosterStore()
  const [section, setSection] = useState<WorkspaceSection>('invitations')
  const [inviteType, setInviteType] = useState<MailSelectOption>(LIFECYCLE_INVITE_TYPES[0])
  const [fromOptions, setFromOptions] = useState<MailSelectOption[]>(LIFECYCLE_FROM_OPTIONS)
  const [mailFrom, setMailFrom] = useState<MailSelectOption>(LIFECYCLE_FROM_OPTIONS[0])
  const [deliveryModes, setDeliveryModes] = useState<LifecycleDeliveryMode[]>(['email'])
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl_survey_invite')
  const [emailSubject, setEmailSubject] = useState(
    surveyName ? `We'd love your feedback — ${surveyName}` : DEFAULT_SURVEY_INVITE_SUBJECT,
  )
  const [emailBody, setEmailBody] = useState(() => toEditorHtml(DEFAULT_SURVEY_INVITE_BODY))
  const [smsBody, setSmsBody] = useState(DEFAULT_SMS_INVITE_BODY)
  const [slackBody, setSlackBody] = useState(DEFAULT_SLACK_INVITE_BODY)
  const [editEmail, setEditEmail] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [templates, setTemplates] = useState<LifecycleMailTemplate[]>(LIFECYCLE_MAIL_TEMPLATES)
  const [templateKind, setTemplateKind] = useState<LifecycleTemplateKind>('survey')
  const [templateQuery, setTemplateQuery] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState<LifecycleMailTemplate | null>(null)
  const [newTemplateOpen, setNewTemplateOpen] = useState(false)
  const [history, setHistory] = useState<LifecycleMailBatch[]>(() => seedLifecycleMailHistory(surveyId))
  const [selectedBatch, setSelectedBatch] = useState<LifecycleMailBatch | null>(null)
  const [historyBatchOptions, setHistoryBatchOptions] = useState<LifecycleMailBatch[]>([])
  const [recipientStatus, setRecipientStatus] = useState(HISTORY_STATUS_OPTIONS[0])
  const [deployments, setDeployments] = useState<LifecycleDeployment[]>(() =>
    deploymentsForSurvey(surveyId, surveyName),
  )
  const [selectedDeploymentId, setSelectedDeploymentId] = useState(() => {
    const list = deploymentsForSurvey(surveyId, surveyName)
    return list.find((deployment) => deployment.status === 'Active')?.id ?? list[0]?.id ?? ''
  })
  const [reminderRules, setReminderRules] = useState<Survey360ReminderRule[]>(() =>
    mockLifecycleReminderRules.filter((rule) =>
      deploymentsForSurvey(surveyId, surveyName).some((deployment) => deployment.id === rule.deploymentId),
    ),
  )
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Survey360ReminderRule | null>(null)
  const [scheduleQuery, setScheduleQuery] = useState('')
  const [scheduleFilter, setScheduleFilter] = useState<(typeof SCHEDULE_FILTERS)[number]>(SCHEDULE_FILTERS[0])
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([])
  const [scheduledDetail, setScheduledDetail] = useState<LifecycleMailBatch | null>(null)
  const [inviteListBatch, setInviteListBatch] = useState<LifecycleMailBatch | null>(null)
  const [deleteTargets, setDeleteTargets] = useState<LifecycleMailBatch[]>([])
  const [deleteDeployment, setDeleteDeployment] = useState<LifecycleDeployment | null>(null)
  const [settingsDeployment, setSettingsDeployment] = useState<LifecycleDeployment | null>(null)
  const [settingsStatus, setSettingsStatus] = useState<{
    value: LifecycleDeployment['status']
    label: string
  }>({ value: 'Active', label: 'Active' })
  const [linksTarget, setLinksTarget] = useState<{
    deployment: LifecycleDeployment
    mode: 'generate' | 'download'
  } | null>(null)
  const [composeGroupName, setComposeGroupName] = useState<string | null>(null)
  const [pendingScheduleId, setPendingScheduleId] = useState<string | null>(null)
  const [addFromOpen, setAddFromOpen] = useState(false)
  const [credits, setCredits] = useState(INITIAL_LIFECYCLE_SEND_CREDITS)
  const paidDeliveryLocked = credits <= 0

  const selectedDeployment = deployments.find((deployment) => deployment.id === selectedDeploymentId) ?? deployments[0]
  const deploymentPeople = useMemo(() => {
    const ids = new Set(selectedDeployment?.invitedEmployeeIds ?? [])
    const pool = ids.size > 0 ? employees.filter((employee) => ids.has(employee.id)) : employees
    return pool.map((employee) => ({
      id: employee.id,
      name: getEmployeeDisplayName(employee),
      email: employee.email,
    }))
  }, [employees, selectedDeployment])

  const inviteRecipients = useMemo(
    () =>
      employees
        .filter((employee) => selectedRecipientIds.includes(employee.id))
        .map((employee) => ({
          id: employee.id,
          name: getEmployeeDisplayName(employee),
          email: employee.email,
        })),
    [employees, selectedRecipientIds],
  )

  const recipients = inviteRecipients
  const visibleReminderRules = reminderRules.filter((rule) =>
    deployments.some((deployment) => deployment.id === rule.deploymentId),
  )
  const primaryMode = primaryDeliveryMode(deliveryModes)
  const usesEmail = deliveryModes.includes('email')
  const composeTypeOptions = section === 'reminders' ? LIFECYCLE_REMINDER_TYPES : LIFECYCLE_INVITE_TYPES
  const composeTemplates = templates.filter((template) => {
    if (primaryMode === 'sms') return template.kind === 'sms'
    if (primaryMode === 'slack') return template.kind === 'slack'
    return template.kind === 'survey' || template.kind === 'global'
  })
  const templateOptions = composeTemplates.map((template) => ({ value: template.id, label: template.name }))
  const selectedTemplate =
    composeTemplates.find((template) => template.id === selectedTemplateId) ?? composeTemplates[0] ?? null
  const toOptions = [
    {
      value: 'all',
      label: `Selected employees (${recipients.length})`,
    },
  ]
  const visibleTemplates = useMemo(() => {
    const needle = templateQuery.trim().toLowerCase()
    return templates.filter((template) => {
      if (template.kind !== templateKind) return false
      if (!needle) return true
      return (
        template.name.toLowerCase().includes(needle) ||
        template.templateType.toLowerCase().includes(needle) ||
        template.type.toLowerCase().includes(needle) ||
        template.language.toLowerCase().includes(needle)
      )
    })
  }, [templateKind, templateQuery, templates])
  const templateKindOptions = LIFECYCLE_TEMPLATE_TABS.map((tab) => ({
    value: tab.id,
    label: tab.label,
  }))
  const selectedTemplateKind =
    templateKindOptions.find((option) => option.value === templateKind) ?? templateKindOptions[0]
  const deploymentOptions = deployments.map((deployment) => ({
    value: deployment.id,
    label: lifecycleDeploymentLabel(deployment),
  }))
  const selectedDeploymentOption =
    deploymentOptions.find((option) => option.value === selectedDeployment?.id) ?? deploymentOptions[0] ?? null

  const visibleRecipients = useMemo(() => {
    if (!selectedBatch) return []
    if (recipientStatus.value === 'all') return selectedBatch.recipients
    return selectedBatch.recipients.filter((row) => row.status.toLowerCase() === recipientStatus.value)
  }, [selectedBatch, recipientStatus.value])

  function applyTemplate(template: LifecycleMailTemplate) {
    setSelectedTemplateId(template.id)
    if (template.kind === 'sms') {
      setSmsBody(template.body)
      setEmailBody(toEditorHtml(template.body))
    } else if (template.kind === 'slack') {
      setSlackBody(template.body)
      setEmailBody(toEditorHtml(template.body))
    } else {
      if (template.subject) setEmailSubject(template.subject)
      setEmailBody(toEditorHtml(template.body))
    }
    setEditorKey((current) => current + 1)
  }

  function openMailSection(next: WorkspaceSection) {
    setPendingScheduleId(null)
    setComposeGroupName(null)
    setSection(next)
    if (next === 'invitations') {
      setInviteType(LIFECYCLE_INVITE_TYPES[0])
      setDeliveryModes(['email'])
      const template = templates.find((item) => item.id === 'tpl_survey_invite') ?? templates[0]
      if (template) applyTemplate(template)
      return
    }
    if (next !== 'reminders') return
    setInviteType(LIFECYCLE_REMINDER_TYPES[0])
    setDeliveryModes(['email'])
    const template = templates.find((item) => item.id === 'tpl_survey_reminder') ?? templates[0]
    if (template) applyTemplate(template)
  }

  function openTemplateInMail(template: LifecycleMailTemplate) {
    const isReminder = /reminder/i.test(template.templateType) || /reminder/i.test(template.name)
    if ((template.kind === 'sms' || template.kind === 'slack') && paidDeliveryLocked) {
      showToast({ variant: 'info', message: 'Buy credits to send by SMS or Slack.' })
      setDeliveryModes(['email'])
    } else if (template.kind === 'sms') setDeliveryModes(['sms'])
    else if (template.kind === 'slack') setDeliveryModes(['slack'])
    else setDeliveryModes(['email'])
    applyTemplate(template)
    setEditEmail(true)
    if (isReminder) {
      setInviteType(LIFECYCLE_REMINDER_TYPES[0])
      setSection('reminders')
    } else {
      setInviteType(LIFECYCLE_INVITE_TYPES[0])
      setSection('invitations')
    }
    showToast({ variant: 'success', message: `${template.name} opened` })
  }

  function reminderOverlapMessage(people: { name: string; email: string }[]) {
    const today = todayStamp()
    const scheduleToday = visibleReminderRules.some((rule) => ruleFiresOnDate(rule, today, null))
    const sentToday = history.flatMap((batch) =>
      /reminder/i.test(batch.mailType) && batch.date.startsWith(today)
        ? batch.recipients.filter((row) => row.time.startsWith(today))
        : [],
    )
    const sentEmails = new Set(sentToday.map((row) => row.to.toLowerCase()))
    const names = [
      ...people
        .filter((person) => sentEmails.has(person.email.toLowerCase()) || scheduleToday)
        .map((person) => person.name),
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

  function recordSend(
    targets: { name: string; email: string }[],
    mailType: string,
    tab: LifecycleHistoryTab = 'sent',
    status = 'Delivery Successful',
    recipientStatusValue = 'Sent',
    at?: string,
    extras?: Partial<
      Pick<
        LifecycleMailBatch,
        'from' | 'body' | 'deliveryModes' | 'kind' | 'cadence' | 'scheduleSummary' | 'ruleId' | 'deploymentId' | 'groupName'
      >
    >,
  ) {
    const time = at ?? formatStamp(new Date())
    const kind = extras?.kind
    const deploymentId =
      extras && 'deploymentId' in extras
        ? extras.deploymentId
        : kind === 'invitation' || (tab === 'scheduled' && section === 'invitations')
          ? undefined
          : selectedDeployment?.id
    const batch: LifecycleMailBatch = {
      id: `hist_${Date.now()}`,
      tab,
      mailType: historyMailType(mailType),
      subject: emailSubject,
      date: time,
      status,
      deploymentId,
      from: extras?.from ?? mailFrom.value,
      body: extras?.body ?? emailBody,
      deliveryModes: extras?.deliveryModes ?? deliveryModes,
      kind: extras?.kind,
      cadence: extras?.cadence,
      scheduleSummary: extras?.scheduleSummary,
      ruleId: extras?.ruleId,
      groupName: extras?.groupName ?? composeGroupName ?? undefined,
      recipients: targets.map((target, index) => ({
        id: `hist_${Date.now()}_${index}`,
        to: target.email,
        name: target.name,
        time,
        status: recipientStatusValue,
        comments: '',
      })),
    }
    setHistory((current) => [batch, ...current])
  }

  function sendEmail() {
    if (recipients.length === 0) {
      showToast({
        variant: 'info',
        message: 'Select employees or add a group before sending.',
      })
      return
    }
    if (usesEmail && (!emailSubject.trim() || !emailBody.trim())) {
      showToast({ variant: 'info', message: 'Add a subject and message before sending.' })
      return
    }
    if (usesPaidDelivery(deliveryModes) && paidDeliveryLocked) {
      showToast({ variant: 'info', message: 'Buy credits to send by SMS or Slack.' })
      return
    }
    const overlap = section === 'reminders' ? reminderOverlapMessage(recipients) : ''
    if (overlap) showToast({ variant: 'info', message: overlap })
    const channels = channelLabel(deliveryModes)
    const mailType = `${inviteType.label} · ${channels}`
    const time = formatStamp(new Date())
    let deploymentId = selectedDeployment?.id
    if (section === 'invitations') {
      const created: LifecycleDeployment = {
        id: `lcdep_${Date.now()}`,
        surveyId,
        name: formatDeliverySchedule(time),
        status: 'Active',
        invitedEmployeeIds: selectedRecipientIds,
        date: time,
        deliveryMode: primaryMode,
        sentTo: composeGroupName ?? 'Custom Email(s)',
        completedCount: 0,
        deliveredCount: recipients.length,
      }
      setDeployments((current) => [created, ...current])
      setSelectedDeploymentId(created.id)
      deploymentId = created.id
    } else if (selectedDeployment) {
      setDeployments((current) =>
        current.map((deployment) =>
          deployment.id === selectedDeployment.id
            ? {
                ...deployment,
                invitedEmployeeIds: [...new Set([...deployment.invitedEmployeeIds, ...selectedRecipientIds])],
                status: 'Active',
              }
            : deployment,
        ),
      )
    }
    recordSend(recipients, mailType, 'sent', 'Delivery Successful', 'Sent', time, {
      kind: section === 'reminders' ? 'reminder' : 'invitation',
      deploymentId,
      groupName: composeGroupName ?? undefined,
    })
    if (pendingScheduleId) {
      const scheduledId = pendingScheduleId
      setHistory((current) => current.filter((batch) => batch.id !== scheduledId))
      setPendingScheduleId(null)
    }
    showToast({
      variant: 'success',
      message: `Sent via ${channels.toLowerCase()} to ${recipients.length} employee${recipients.length === 1 ? '' : 's'}`,
    })
    setSection('history')
  }

  function saveReminderRule(rule: Survey360ReminderRule) {
    const nextRule = {
      ...rule,
      deploymentId: selectedDeployment?.id ?? rule.deploymentId,
      audience: 'employee' as const,
    }
    const exists = reminderRules.some((item) => item.id === nextRule.id)
    setReminderRules(
      exists
        ? reminderRules.map((item) => (item.id === nextRule.id ? nextRule : item))
        : [...reminderRules, nextRule],
    )
    const warning = reminderOverlapMessage(recipients)
    const firesToday = ruleFiresOnDate(nextRule, todayStamp(), null)
    if (firesToday && warning) showToast({ variant: 'info', message: warning })
    if (!exists) {
      const channels = channelLabel(deliveryModes)
      const kind: LifecycleScheduleKind = nextRule.kind === 'invitation' ? 'invitation' : 'reminder'
      recordSend(
        recipients,
        `${inviteType.label} · ${channels}`,
        'scheduled',
        'Scheduled',
        'Scheduled',
        reminderScheduleStamp(nextRule, null),
        {
          from: mailFrom.value,
          body: emailBody,
          deliveryModes,
          kind,
          cadence: nextRule.mode === 'recurring' ? 'recurring' : 'one_time',
          scheduleSummary: summarizeReminderRule(nextRule, null),
          ruleId: nextRule.id,
          deploymentId: kind === 'reminder' ? selectedDeployment?.id : undefined,
          groupName: composeGroupName ?? undefined,
        },
      )
    }
    showToast({
      variant: 'success',
      message: exists
        ? 'Schedule updated'
        : nextRule.kind === 'invitation'
          ? 'Invitation scheduled'
          : 'Reminder scheduled',
    })
    setSection('scheduled')
  }

  function openScheduleFromCompose() {
    if (recipients.length === 0) {
      showToast({ variant: 'info', message: 'Select employees or add a group before scheduling.' })
      return
    }
    if (usesPaidDelivery(deliveryModes) && paidDeliveryLocked) {
      showToast({ variant: 'info', message: 'Buy credits to send by SMS or Slack.' })
      return
    }
    setEditingRule({
      id: '',
      deploymentId: selectedDeployment?.id ?? '',
      mode: 'one_time',
      time: '',
      audience: 'employee',
      kind: section === 'reminders' ? 'reminder' : 'invitation',
      from: mailFrom.value,
      templateId: selectedTemplateId,
      subject: emailSubject,
      body: emailBody,
    })
    window.setTimeout(() => setScheduleOpen(true), 0)
  }

  const composerProps = {
    typeOptions: composeTypeOptions,
    inviteType,
    onTypeChange: setInviteType,
    toOptions,
    fromOptions,
    mailFrom,
    onFromChange: setMailFrom,
    templateOptions,
    selectedTemplate: selectedTemplate
      ? { value: selectedTemplate.id, label: selectedTemplate.name }
      : templateOptions[0] ?? { value: '', label: 'Template' },
    onTemplateChange: (id: string) => {
      const template = templates.find((item) => item.id === id)
      if (template) applyTemplate(template)
    },
    emailSubject,
    onSubjectChange: setEmailSubject,
    emailBody,
    onBodyChange: setEmailBody,
    editEmail,
    onEditEmailChange: (value: boolean) => {
      setEditEmail(value)
      if (value) setEditorKey((current) => current + 1)
    },
    editorKey,
    recipientCount: recipients.length,
    recipientKind: 'employee',
    onSend: sendEmail,
    onSendTest: () => showToast({ variant: 'success', message: 'Test mail sent to your inbox' }),
    onSchedule: openScheduleFromCompose,
  }

  const sharedCompose = {
    hideFrom: !usesEmail,
    hideSubject: !usesEmail,
    typeFieldPlacement: 'templates' as const,
    typeField: (
      <DeliveryModeField
        value={deliveryModes}
        onChange={setDeliveryModes}
        lockedModes={paidDeliveryLocked ? PAID_DELIVERY_MODES : []}
        onLockedClick={() =>
          showToast({ variant: 'info', message: 'Buy credits to send by SMS or Slack.' })
        }
      />
    ),
    toField: (
      <RecipientPicker
        employees={employees}
        selectedIds={selectedRecipientIds}
        onChange={setSelectedRecipientIds}
        groups={savedFilters}
        onGroupAdded={(group) => setComposeGroupName(group?.name ?? null)}
      />
    ),
    onAddFrom: () => setAddFromOpen(true),
    extraContent: (
      <ChannelExtraFields
        modes={deliveryModes}
        smsBody={smsBody}
        slackBody={slackBody}
        onSmsChange={setSmsBody}
        onSlackChange={setSlackBody}
      />
    ),
    editEmail: true,
    footerLeft: (
      <SendCreditsBar
        credits={credits}
        onBuyMore={() => {
          setCredits((current) => current + LIFECYCLE_CREDIT_PACK)
          showToast({
            variant: 'success',
            message: `Added $${LIFECYCLE_CREDIT_PACK} in credits`,
          })
        }}
      />
    ),
    helpText: 'Buy credits to send by SMS or Slack. Email does not use credits.',
    sendLabel: deliveryModes.length === 1 && primaryMode === 'email' ? 'Send Mail' : 'Send',
  }

  const scheduledMails = useMemo(
    () => history.filter((batch) => batch.tab === 'scheduled'),
    [history],
  )
  const visibleScheduledMails = useMemo(() => {
    const query = scheduleQuery.trim().toLowerCase()
    return scheduledMails.filter((batch) => {
      const kind = scheduledKind(batch)
      if (scheduleFilter.value !== 'all' && kind !== scheduleFilter.value) return false
      if (!query) return true
      const deploymentName = lifecycleDeploymentLabel(
        deployments.find((deployment) => deployment.id === batch.deploymentId) ?? { date: '' },
      )
      const { type, cadence } = scheduledTypeParts(batch)
      return [batch.subject, batch.mailType, deploymentName, type, cadence, formatDeliverySchedule(batch.date)]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [deployments, scheduleFilter.value, scheduleQuery, scheduledMails])
  const scheduledEmpty = scheduledMails.length === 0
  const visibleScheduleIds = visibleScheduledMails.map((batch) => batch.id)
  const allSchedulesSelected =
    visibleScheduleIds.length > 0 && visibleScheduleIds.every((id) => selectedScheduleIds.includes(id))
  const someSchedulesSelected = visibleScheduleIds.some((id) => selectedScheduleIds.includes(id))

  function toggleScheduleRow(id: string, checked: boolean) {
    setSelectedScheduleIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    )
  }

  function toggleAllSchedules() {
    setSelectedScheduleIds((current) =>
      allSchedulesSelected
        ? current.filter((id) => !visibleScheduleIds.includes(id))
        : [...new Set([...current, ...visibleScheduleIds])],
    )
  }

  function batchesFromIds(ids: string[]) {
    return scheduledMails.filter((batch) => ids.includes(batch.id))
  }

  function openScheduledInCompose(batch: LifecycleMailBatch) {
    const kind = scheduledKind(batch)
    const emails = new Set(batch.recipients.map((row) => row.to.toLowerCase()))
    const matchedIds = employees
      .filter((employee) => emails.has(employee.email.toLowerCase()))
      .map((employee) => employee.id)
    setSelectedRecipientIds(matchedIds)
    setComposeGroupName(batch.groupName ?? null)
    setEmailSubject(batch.subject)
    setEmailBody(toEditorHtml(batch.body ?? ''))
    setDeliveryModes(batch.deliveryModes?.length ? batch.deliveryModes : ['email'])
    const from = fromOptions.find((option) => option.value === batch.from)
    if (from) setMailFrom(from)
    setEditEmail(true)
    setEditorKey((current) => current + 1)
    setPendingScheduleId(batch.id)
    setSelectedScheduleIds([])
    setScheduledDetail(null)
    if (kind === 'reminder') {
      if (batch.deploymentId) setSelectedDeploymentId(batch.deploymentId)
      setInviteType(LIFECYCLE_REMINDER_TYPES[0])
      setSection('reminders')
    } else {
      setInviteType(LIFECYCLE_INVITE_TYPES[0])
      setSection('invitations')
    }
    showToast({ variant: 'info', message: 'Review this message, then send.' })
  }

  function sendScheduledNow(batches: LifecycleMailBatch[]) {
    if (batches.length === 0) return
    if (batches.length > 1) {
      showToast({
        variant: 'info',
        message: 'Select one scheduled email to review and send.',
      })
      return
    }
    openScheduledInCompose(batches[0])
  }

  function deleteScheduled(batches: LifecycleMailBatch[]) {
    if (batches.length === 0) return
    const ids = new Set(batches.map((batch) => batch.id))
    setHistory((current) => current.filter((batch) => !ids.has(batch.id)))
    setSelectedScheduleIds((current) => current.filter((id) => !ids.has(id)))
    setScheduledDetail((current) => (current && ids.has(current.id) ? null : current))
    setInviteListBatch((current) => (current && ids.has(current.id) ? null : current))
    showToast({
      variant: 'success',
      message:
        batches.length === 1
          ? 'Scheduled email deleted'
          : `${batches.length} scheduled emails deleted`,
    })
  }

  const selectedScheduledBatches = batchesFromIds(selectedScheduleIds.filter((id) => visibleScheduleIds.includes(id)))

  const scheduledColumns = useMemo<IWuTableColumnDef<LifecycleMailBatch>[]>(() => {
    const bulkOpen = selectedScheduledBatches.length > 0
    const columns: IWuTableColumnDef<LifecycleMailBatch>[] = [
      {
        accessorKey: 'id',
        id: 'select',
        header: () => (
          <div className="flex items-center gap-3 whitespace-nowrap">
            <WuCheckbox
              checked={allSchedulesSelected}
              partial={someSchedulesSelected && !allSchedulesSelected}
              onChange={toggleAllSchedules}
            />
            {bulkOpen ? (
              <>
                <span className="text-sm text-gray-700">
                  {selectedScheduledBatches.length} selected
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => sendScheduledNow(selectedScheduledBatches)}
                >
                  <span className="wm-send text-base" aria-hidden />
                  Send now
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-red-600"
                  onClick={() => setDeleteTargets(selectedScheduledBatches)}
                >
                  <span className="wm-delete text-base" aria-hidden />
                  Delete
                </button>
              </>
            ) : null}
          </div>
        ),
        size: bulkOpen ? 360 : 44,
        minSize: bulkOpen ? 340 : 44,
        maxSize: bulkOpen ? 400 : 48,
        enableSorting: false,
        cell: ({ row }) => (
          <WuCheckbox
            checked={selectedScheduleIds.includes(row.original.id)}
            onChange={(checked) => toggleScheduleRow(row.original.id, Boolean(checked))}
          />
        ),
      },
      {
        accessorKey: 'date',
        header: bulkOpen ? '' : 'Delivery Schedule (IST)',
        size: 160,
        minSize: 145,
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left font-medium text-blue-600 hover:underline"
            onClick={() => setScheduledDetail(row.original)}
          >
            {formatDeliverySchedule(row.original.date)}
          </button>
        ),
      },
      {
        accessorKey: 'kind',
        header: bulkOpen ? '' : 'Type',
        size: 110,
        minSize: 96,
        cell: ({ row }) => {
          const { type, cadence } = scheduledTypeParts(row.original)
          return (
            <div>
              <div className="text-gray-800">{type}</div>
              <div className="text-xs text-gray-500">{cadence}</div>
            </div>
          )
        },
      },
    ]
    if (scheduleFilter.value !== 'invitation') {
      columns.push({
        accessorKey: 'deploymentId',
        header: bulkOpen ? '' : 'Deployment',
        size: 135,
        minSize: 120,
        cell: ({ row }) => {
          if (scheduledKind(row.original) !== 'reminder') return '—'
          const deployment = deployments.find((item) => item.id === row.original.deploymentId)
          return deployment ? lifecycleDeploymentLabel(deployment) : '—'
        },
      })
    }
    columns.push(
      {
        accessorKey: 'recipients',
        header: bulkOpen ? '' : 'Invitations',
        size: 90,
        minSize: 80,
        cell: ({ row }) => (
          <button
            type="button"
            className="font-medium text-blue-600 hover:underline"
            onClick={() => setInviteListBatch(row.original)}
          >
            {row.original.recipients.length}
          </button>
        ),
      },
      {
        accessorKey: 'cadence',
        id: 'next',
        header: bulkOpen ? '' : 'Next',
        size: 135,
        minSize: 120,
        cell: ({ row }) => {
          const nextStamp = nextUpcomingStamp(row.original, reminderRules)
          return nextStamp ? formatDeliverySchedule(nextStamp) : '—'
        },
      },
      {
        accessorKey: 'id',
        id: 'rowActions',
        header: ' ',
        size: 180,
        minSize: 170,
        maxSize: 190,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
              onClick={(event) => {
                event.stopPropagation()
                openScheduledInCompose(row.original)
              }}
            >
              <span className="wm-send text-base" aria-hidden />
              Send now
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-red-600"
              onClick={(event) => {
                event.stopPropagation()
                setDeleteTargets([row.original])
              }}
            >
              <span className="wm-delete text-base" aria-hidden />
              Delete
            </button>
          </div>
        ),
      },
    )
    return columns
  }, [
    allSchedulesSelected,
    deployments,
    reminderRules,
    scheduleFilter.value,
    selectedScheduleIds,
    selectedScheduledBatches,
    someSchedulesSelected,
  ])

  const templateColumns = useMemo<IWuTableColumnDef<LifecycleMailTemplate>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Template Name',
        size: 220,
        minSize: 180,
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left font-medium text-blue-600 hover:underline"
            onClick={() => setPreviewTemplate(row.original)}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'templateType',
        header: 'Template Type',
        size: 140,
        minSize: 120,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        size: 100,
        minSize: 90,
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
              row.original.type === 'Default'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-blue-50 text-blue-700',
            )}
          >
            {row.original.type}
          </span>
        ),
      },
      {
        accessorKey: 'language',
        header: 'Default Language',
        size: 140,
        minSize: 120,
      },
      {
        accessorKey: 'id',
        id: 'rowActions',
        header: ' ',
        size: 180,
        minSize: 180,
        maxSize: 180,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
              onClick={(event) => {
                event.stopPropagation()
                setPreviewTemplate(row.original)
              }}
            >
              <span className="wm-visibility text-base" aria-hidden />
              Preview
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
              onClick={(event) => {
                event.stopPropagation()
                openTemplateInMail(row.original)
              }}
            >
              <span className="wm-send text-base" aria-hidden />
              Send
            </button>
          </div>
        ),
      },
    ],
    [],
  )

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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {section === 'invitations' ? (
            <MailComposer title="Invitations" hideHeader {...composerProps} {...sharedCompose} />
          ) : null}

          {section === 'reminders' ? (
            <MailComposer
              title="Reminders"
              hideHeader
              banner={recipients.length > 0 ? reminderOverlapMessage(recipients) : undefined}
              {...composerProps}
              {...sharedCompose}
              beforeFields={
                <DeploymentField
                  options={deploymentOptions}
                  value={selectedDeploymentOption}
                  onChange={(option) => setSelectedDeploymentId(option.value)}
                />
              }
            />
          ) : null}

          {section === 'scheduled' ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-8 flex items-center justify-between gap-4">
                <WuButton
                  variant="primary"
                  onClick={() => {
                    setSelectedRecipientIds([])
                    openMailSection('invitations')
                  }}
                >
                  + New schedule
                </WuButton>
                <div className="flex items-center gap-3">
                  <div className="w-52">
                    <WuInput
                      variant="outlined"
                      placeholder="Search"
                      Icon={<span className="wm-search" />}
                      iconPosition="left"
                      value={scheduleQuery}
                      onChange={(event) => setScheduleQuery(event.target.value)}
                    />
                  </div>
                  <div className="w-52">
                    <WuSelect
                      data={SCHEDULE_FILTERS}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={scheduleFilter}
                      onSelect={(next) => {
                        const option = (Array.isArray(next) ? next[0] : next) as
                          | (typeof SCHEDULE_FILTERS)[number]
                          | null
                        if (option?.value) setScheduleFilter(option)
                      }}
                      variant="outlined"
                    />
                  </div>
                </div>
              </div>

              {scheduledEmpty ? (
                <EmptyState
                  icon="wm-calendar"
                  title="No scheduled emails"
                  description="Scheduled invitations and reminders for this survey appear here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <WuTable
                    data={visibleScheduledMails as unknown[]}
                    columns={scheduledColumns as unknown as IWuTableColumnDef<unknown>[]}
                    variant="striped"
                    size="default"
                    sort={{ enabled: true }}
                    NoDataContent={
                      <EmptyState
                        icon="wm-search-off"
                        title="No scheduled emails match this filter"
                        description="Try another search or filter."
                      />
                    }
                  />
                </div>
              )}
            </div>
          ) : null}

          {section === 'templates' ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-8 flex items-center gap-4">
                {templateKind === 'global' ? null : (
                  <WuButton variant="primary" onClick={() => setNewTemplateOpen(true)}>
                    + New template
                  </WuButton>
                )}
                <div className="ml-auto flex items-center gap-3">
                  <div className="w-52">
                    <WuInput
                      variant="outlined"
                      placeholder="Search"
                      Icon={<span className="wm-search" />}
                      iconPosition="left"
                      value={templateQuery}
                      onChange={(event) => setTemplateQuery(event.target.value)}
                    />
                  </div>
                  <div className="w-64">
                    <WuSelect
                      data={templateKindOptions}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selectedTemplateKind}
                      onSelect={(next) => {
                        const option = (Array.isArray(next) ? next[0] : next) as
                          | (typeof templateKindOptions)[number]
                          | null
                        if (option?.value) {
                          setTemplateKind(option.value)
                          setTemplateQuery('')
                        }
                      }}
                      variant="outlined"
                    />
                  </div>
                </div>
              </div>

              {visibleTemplates.length === 0 ? (
                <EmptyState
                  icon={templateQuery.trim() ? 'wm-search-off' : 'wm-file'}
                  title={
                    templateQuery.trim()
                      ? 'No templates match this search'
                      : templateKind === 'global'
                        ? 'No global templates'
                        : 'No templates in this category'
                  }
                  description={
                    templateQuery.trim()
                      ? 'Try another search or category.'
                      : templateKind === 'global'
                        ? 'Save an email template as Global to reuse it across surveys.'
                        : 'Create a template to reuse for invitations and reminders.'
                  }
                  action={
                    templateQuery.trim() || templateKind === 'global' ? undefined : (
                      <WuButton variant="primary" onClick={() => setNewTemplateOpen(true)}>
                        + New template
                      </WuButton>
                    )
                  }
                />
              ) : (
                <div className="w-full min-w-0 [&_table]:w-full [&_th:last-child]:w-[180px] [&_th:last-child]:min-w-[180px] [&_td:last-child]:w-[180px] [&_td:last-child]:min-w-[180px]">
                  <WuTable
                    data={visibleTemplates as unknown[]}
                    columns={templateColumns as unknown as IWuTableColumnDef<unknown>[]}
                    variant="striped"
                    size="default"
                    tableLayout="fixed"
                    sort={{ enabled: true }}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          ) : null}

          {section === 'history' ? (
            <LifecycleSentHistory
              deployments={deployments}
              history={history}
              onOpenInvitations={(deployment) => {
                const byId = new Map(employees.map((employee) => [employee.id, employee]))
                setInviteListBatch({
                  id: `${deployment.id}_invites`,
                  tab: 'sent',
                  mailType: 'Invitations',
                  subject: '',
                  date: deployment.date,
                  status: '',
                  groupName: deployment.sentTo,
                  recipients: deployment.invitedEmployeeIds.map((id, index) => {
                    const employee = byId.get(id)
                    return {
                      id: `${deployment.id}_${id}_${index}`,
                      to: employee?.email ?? '',
                      name: employee ? getEmployeeDisplayName(employee) : id,
                      time: deployment.date,
                      status: '',
                      comments: '',
                    }
                  }),
                })
              }}
              onOpenDelivered={(deployment) => {
                const existing = history.filter(
                  (batch) =>
                    batch.tab === 'sent' &&
                    batch.kind === 'invitation' &&
                    batch.deploymentId === deployment.id,
                )
                setRecipientStatus(HISTORY_STATUS_OPTIONS[0])
                if (existing.length > 0) {
                  setHistoryBatchOptions(existing)
                  setSelectedBatch(existing[0])
                  return
                }
                const byId = new Map(employees.map((employee) => [employee.id, employee]))
                const recipients = deployment.invitedEmployeeIds.map((id, index) => {
                  const employee = byId.get(id)
                  return {
                    id: `${deployment.id}_delivery_${id}_${index}`,
                    to: employee?.email ?? '',
                    name: employee ? getEmployeeDisplayName(employee) : id,
                    time: deployment.date,
                    status: index < deployment.deliveredCount ? 'Sent' : 'Not delivered',
                    comments: '',
                  }
                })
                setHistoryBatchOptions([])
                setSelectedBatch({
                  id: `${deployment.id}_delivery`,
                  tab: 'sent',
                  mailType: 'Survey Invitation',
                  subject: '',
                  date: deployment.date,
                  status: '',
                  deploymentId: deployment.id,
                  kind: 'invitation',
                  deliveryModes: deployment.deliveryMode === 'email' ? ['email'] : undefined,
                  recipients,
                })
              }}
              onReminders={(deployment) => {
                setSelectedDeploymentId(deployment.id)
                setSection('reminders')
              }}
              onDelete={setDeleteDeployment}
              onSettings={(deployment) => {
                setSettingsStatus(
                  DEPLOYMENT_STATUS_OPTIONS.find((option) => option.value === deployment.status) ??
                    DEPLOYMENT_STATUS_OPTIONS[0],
                )
                setSettingsDeployment(deployment)
              }}
              onGenerateLinks={(deployment) => {
                showToast({
                  variant: 'success',
                  message: `Generated survey links for ${employees.length} employee${
                    employees.length === 1 ? '' : 's'
                  }`,
                })
                setLinksTarget({ deployment, mode: 'generate' })
              }}
              onDownloadLinks={(deployment) => {
                showToast({
                  variant: 'success',
                  message: `Downloaded batch links for ${deployment.invitedEmployeeIds.length} employee${
                    deployment.invitedEmployeeIds.length === 1 ? '' : 's'
                  }`,
                })
                setLinksTarget({ deployment, mode: 'download' })
              }}
              onReminderHistory={(reminders) => {
                setRecipientStatus(HISTORY_STATUS_OPTIONS[0])
                setHistoryBatchOptions(reminders)
                setSelectedBatch(reminders[0] ?? null)
              }}
            />
          ) : null}
        </div>
      </section>

      <WuModal
        open={selectedBatch != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBatch(null)
            setHistoryBatchOptions([])
          }
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {historyBatchOptions.length > 1 ? (
              <div className="w-80">
                <WuSelect
                  data={historyBatchOptions.map((batch) => ({
                    value: batch.id,
                    label: reminderHistoryLabel(batch),
                  }))}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={
                    selectedBatch
                      ? {
                          value: selectedBatch.id,
                          label: reminderHistoryLabel(selectedBatch),
                        }
                      : null
                  }
                  onSelect={(next) => {
                    const option = (Array.isArray(next) ? next[0] : next) as
                      | { value: string; label: string }
                      | null
                    const batch = historyBatchOptions.find((item) => item.id === option?.value)
                    if (batch) {
                      setRecipientStatus(HISTORY_STATUS_OPTIONS[0])
                      setSelectedBatch(batch)
                    }
                  }}
                  variant="outlined"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {selectedBatch ? reminderHistoryLabel(selectedBatch) : ''}
              </p>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-3">
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
                      <td className="px-3 py-3 whitespace-nowrap text-gray-600">{formatMailStamp(row.time)}</td>
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

      <WuModal
        open={scheduledDetail != null}
        onOpenChange={(open) => {
          if (!open) setScheduledDetail(null)
        }}
        variant="action"
        size="lg"
        {...preventModalDismiss}
      >
        <WuModalHeader>Scheduled email</WuModalHeader>
        <WuModalContent>
          {scheduledDetail ? (
            <div className="space-y-4 text-sm">
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500">To</div>
                <p className="text-gray-900">{scheduledToLabel(scheduledDetail)}</p>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500">From</div>
                <p className="text-gray-900">
                  {fromOptions.find((option) => option.value === scheduledDetail.from)?.label ??
                    scheduledDetail.from ??
                    '—'}
                </p>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500">Deliver</div>
                <p className="text-gray-900">{channelLabel(scheduledDetail.deliveryModes ?? ['email'])}</p>
              </div>
              {scheduledKind(scheduledDetail) === 'reminder' ? (
                <div>
                  <div className="mb-1 text-xs font-medium text-gray-500">Deployment</div>
                  <p className="text-gray-900">
                    {scheduledDetail.deploymentId
                      ? lifecycleDeploymentLabel(
                          deployments.find((deployment) => deployment.id === scheduledDetail.deploymentId) ?? {
                            date: '',
                          },
                        )
                      : '—'}
                  </p>
                </div>
              ) : null}
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500">Schedule</div>
                <p className="text-gray-900">
                  {scheduledDetail.scheduleSummary ?? formatDeliverySchedule(scheduledDetail.date)}
                </p>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500">Subject</div>
                <p className="font-medium text-gray-900">{scheduledDetail.subject}</p>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-gray-500">Content</div>
                <div
                  className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3 leading-6 text-gray-800 [&_p]:m-0"
                  dangerouslySetInnerHTML={{
                    __html: toEditorHtml(scheduledDetail.body ?? ''),
                  }}
                />
              </div>
            </div>
          ) : null}
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setScheduledDetail(null)}>
            Close
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal
        open={inviteListBatch != null}
        onOpenChange={(open) => {
          if (!open) setInviteListBatch(null)
        }}
        variant="action"
        size="md"
        {...preventModalDismiss}
      >
        <WuModalHeader>
          {inviteListBatch?.groupName
            ? `${inviteListBatch.groupName} (${inviteListBatch.recipients.length})`
            : `Invited (${inviteListBatch?.recipients.length ?? 0})`}
        </WuModalHeader>
        <WuModalContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {inviteListBatch?.recipients.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="px-3 py-2.5 text-gray-900">{row.name || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-700">{row.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setInviteListBatch(null)}>
            Close
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <ConfirmModal
        open={deleteTargets.length > 0}
        onOpenChange={(open) => {
          if (!open) setDeleteTargets([])
        }}
        title={deleteTargets.length > 1 ? 'Delete scheduled emails?' : 'Delete scheduled email?'}
        description={
          deleteTargets.length > 1
            ? `${deleteTargets.length} scheduled emails will be removed and will not send.`
            : 'This scheduled email will be removed and will not send.'
        }
        confirmLabel="Delete"
        variant="critical"
        onConfirm={() => deleteScheduled(deleteTargets)}
      />

      <ConfirmModal
        open={deleteDeployment != null}
        onOpenChange={(open) => {
          if (!open) setDeleteDeployment(null)
        }}
        title="Delete this deployment?"
        description="This deployment and its reminder history will be removed from sent history."
        confirmLabel="Delete"
        variant="critical"
        onConfirm={() => {
          if (!deleteDeployment) return
          const removedId = deleteDeployment.id
          setDeployments((current) => current.filter((deployment) => deployment.id !== removedId))
          setHistory((current) => current.filter((batch) => batch.deploymentId !== removedId))
          if (selectedDeploymentId === removedId) {
            const remaining = deployments.filter((deployment) => deployment.id !== removedId)
            setSelectedDeploymentId(remaining[0]?.id ?? '')
          }
          setDeleteDeployment(null)
          showToast({ variant: 'success', message: 'Deployment deleted' })
        }}
      />

      <WuModal
        open={settingsDeployment != null}
        onOpenChange={(open) => {
          if (!open) setSettingsDeployment(null)
        }}
        variant="action"
        size="md"
        {...preventModalDismiss}
      >
        <WuModalHeader>Deployment settings</WuModalHeader>
        <WuModalContent>
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-1 text-xs font-medium text-gray-500">Date</div>
              <p className="text-gray-900">
                {settingsDeployment ? formatDeliverySchedule(settingsDeployment.date) : '—'}
              </p>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-gray-500">Sent to</div>
              <p className="text-gray-900">{settingsDeployment?.sentTo ?? '—'}</p>
            </div>
            <div className="w-56">
              <div className="mb-1 text-xs font-medium text-gray-500">Status</div>
              <WuSelect
                data={DEPLOYMENT_STATUS_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={settingsStatus}
                onSelect={(next) =>
                  setSettingsStatus(next as (typeof DEPLOYMENT_STATUS_OPTIONS)[number])
                }
                variant="outlined"
              />
            </div>
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setSettingsDeployment(null)}>
            Cancel
          </WuButton>
          <WuButton
            onClick={() => {
              if (!settingsDeployment) return
              setDeployments((current) =>
                current.map((deployment) =>
                  deployment.id === settingsDeployment.id
                    ? { ...deployment, status: settingsStatus.value }
                    : deployment,
                ),
              )
              setSettingsDeployment(null)
              showToast({ variant: 'success', message: 'Deployment settings saved' })
            }}
          >
            Save
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal
        open={linksTarget != null}
        onOpenChange={(open) => {
          if (!open) setLinksTarget(null)
        }}
        variant="action"
        size="lg"
        {...preventModalDismiss}
      >
        <WuModalHeader>
          {linksTarget?.mode === 'generate' ? 'Survey links' : 'Batch links'}
        </WuModalHeader>
        <WuModalContent>
          {(() => {
            const byId = new Map(employees.map((employee) => [employee.id, employee]))
            const ids =
              linksTarget?.mode === 'generate'
                ? employees.map((employee) => employee.id)
                : linksTarget?.deployment.invitedEmployeeIds ?? []
            const rows = ids.map((id) => {
              const employee = byId.get(id)
              return {
                id,
                name: employee ? getEmployeeDisplayName(employee) : id,
                email: employee?.email ?? '—',
                link: surveyLinkForEmployee(surveyId, id),
              }
            })
            return (
              <>
                <div className="mb-4 flex justify-end">
                  <WuButton
                    variant="primary"
                    onClick={() =>
                      showToast({
                        variant: 'success',
                        message: `Downloaded ${rows.length} survey link${rows.length === 1 ? '' : 's'}`,
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
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium">Survey link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length > 0 ? (
                        rows.map((row) => (
                          <tr key={row.id} className="border-b border-gray-100">
                            <td className="px-3 py-2.5 text-gray-900">{row.name}</td>
                            <td className="px-3 py-2.5 text-gray-700">{row.email}</td>
                            <td className="px-3 py-2.5 font-mono text-xs text-blue-600">{row.link}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-3 py-10 text-center text-gray-500" colSpan={3}>
                            No employees to generate links for.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )
          })()}
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setLinksTarget(null)}>
            Close
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <AddFromEmailModal
        open={addFromOpen}
        onOpenChange={setAddFromOpen}
        onAdd={(option) => {
          setFromOptions((current) =>
            current.some((item) => item.value === option.value) ? current : [...current, option],
          )
          setMailFrom(option)
          showToast({ variant: 'success', message: 'From email added' })
        }}
      />

      <ScheduleReminderModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        dueDate={null}
        initial={editingRule}
        templates={templates}
        subjectCount={deploymentPeople.length}
        evaluatorCount={0}
        employeeCount={deploymentPeople.length}
        audienceOptions={LIFECYCLE_REMINDER_AUDIENCE_OPTIONS}
        defaultAudience="employee"
        variant="when"
        onSave={saveReminderRule}
      />

      <WuModal
        open={previewTemplate != null}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null)
        }}
        variant="action"
        size="md"
        {...preventModalDismiss}
      >
        <WuModalHeader>{previewTemplate?.name ?? 'Preview'}</WuModalHeader>
        <WuModalContent>
          {previewTemplate?.subject ? (
            <p className="mb-3 text-sm font-medium text-gray-900">{previewTemplate.subject}</p>
          ) : null}
          <div
            className="space-y-3 text-sm leading-6 text-gray-800 [&_p]:m-0"
            dangerouslySetInnerHTML={{
              __html: toEditorHtml(previewTemplate?.body ?? ''),
            }}
          />
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setPreviewTemplate(null)}>
            Close
          </WuButton>
          <WuButton
            onClick={() => {
              if (!previewTemplate) return
              const template = previewTemplate
              setPreviewTemplate(null)
              openTemplateInMail(template)
            }}
          >
            Send
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <LifecycleNewTemplateModal
        open={newTemplateOpen}
        kind={templateKind === 'global' ? 'survey' : templateKind}
        onOpenChange={setNewTemplateOpen}
        onInvalid={(message) => showToast({ variant: 'info', message })}
        onSave={(created) => {
          setTemplates((current) => [created, ...current])
          setNewTemplateOpen(false)
          if (created.kind === 'global') setTemplateKind('global')
          showToast({ variant: 'success', message: 'Template saved' })
        }}
      />
    </div>
  )
}
