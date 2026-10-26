'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { MailComposer } from '@/components/modules/feedback360/MailComposer'
import { toEditorHtml, type MailSelectOption } from '@/components/modules/feedback360/MailComposeCard'
import { ScheduleReminderModal } from '@/components/modules/feedback360/ScheduleReminderModal'
import {
  AddFromEmailModal,
  ChannelExtraFields,
  DeliveryModeField,
  RecipientPicker,
  primaryDeliveryMode,
} from '@/components/studies/LifecycleInviteFields'
import { preventModalDismiss } from '@/lib/modalProps'
import { useRosterStore } from '@/lib/rosterStore'
import { cn } from '@/lib/utils'
import { getEmployeeDisplayName } from '@/data/mock-employee-directory'
import { formatDate } from '@/data/mock-utils'
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
  channelLabel,
  deploymentsForSurvey,
  mockLifecycleReminderRules,
  seedLifecycleMailHistory,
  type LifecycleDeliveryMode,
  type LifecycleDeployment,
  type LifecycleHistoryTab,
  type LifecycleMailBatch,
  type LifecycleMailTemplate,
  type LifecycleTemplateKind,
} from '@/data/mock/lifecycleMail'
import {
  LIFECYCLE_REMINDER_AUDIENCE_OPTIONS,
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
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCard })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
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
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuFormGroup })),
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
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
  { ssr: false },
)
const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTab })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)

type WorkspaceSection = 'invitations' | 'reminders' | 'templates' | 'history'
type ReminderTab = 'scheduled' | 'manual'

const NAV: { id: WorkspaceSection; label: string }[] = [
  { id: 'invitations', label: 'Invitations' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'templates', label: 'Templates' },
  { id: 'history', label: 'Sent history' },
]

const HISTORY_TABS: { id: LifecycleHistoryTab; label: string }[] = [
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
  if (label === 'Survey Invite') return 'Survey Invitation'
  return label
}

function emailsSentLabel(batch: LifecycleMailBatch) {
  const delivered = batch.recipients.filter((row) => row.status === 'Sent' || row.status === 'Opened').length
  return `${delivered}/${batch.recipients.length}`
}

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
  const [reminderTab, setReminderTab] = useState<ReminderTab>('scheduled')
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
  const [previewTemplate, setPreviewTemplate] = useState<LifecycleMailTemplate | null>(null)
  const [newTemplateOpen, setNewTemplateOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateSubject, setNewTemplateSubject] = useState('')
  const [newTemplateBody, setNewTemplateBody] = useState('')
  const [historyTab, setHistoryTab] = useState<LifecycleHistoryTab>('sent')
  const [history, setHistory] = useState<LifecycleMailBatch[]>(() => seedLifecycleMailHistory(surveyId))
  const [selectedBatch, setSelectedBatch] = useState<LifecycleMailBatch | null>(null)
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
  const [ruleToDelete, setRuleToDelete] = useState<Survey360ReminderRule | null>(null)
  const [addFromOpen, setAddFromOpen] = useState(false)

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

  const recipients = section === 'reminders' ? deploymentPeople : inviteRecipients
  const visibleReminderRules = reminderRules.filter((rule) => rule.deploymentId === selectedDeployment?.id)
  const primaryMode = primaryDeliveryMode(deliveryModes)
  const usesEmail = deliveryModes.includes('email')
  const composeTypeOptions = section === 'reminders' ? LIFECYCLE_REMINDER_TYPES : LIFECYCLE_INVITE_TYPES
  const composeTemplates = templates.filter((template) => {
    if (section === 'reminders') return template.kind === 'survey' || template.kind === 'global'
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
      label:
        section === 'reminders'
          ? `Invited in this deployment (${recipients.length})`
          : `Selected employees (${recipients.length})`,
    },
  ]
  const visibleTemplates = templates.filter((template) => template.kind === templateKind)
  const deploymentOptions = deployments.map((deployment) => ({
    value: deployment.id,
    label: `${deployment.name} (${deployment.status})`,
  }))
  const selectedDeploymentOption =
    deploymentOptions.find((option) => option.value === selectedDeployment?.id) ?? deploymentOptions[0] ?? null

  const visibleHistory = useMemo(
    () => history.filter((batch) => batch.tab === historyTab),
    [history, historyTab],
  )

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
    setSection(next)
    if (next === 'invitations') {
      setInviteType(LIFECYCLE_INVITE_TYPES[0])
      setDeliveryModes(['email'])
      const template = templates.find((item) => item.id === 'tpl_survey_invite') ?? templates[0]
      if (template) applyTemplate(template)
      return
    }
    if (next !== 'reminders') return
    setReminderTab('scheduled')
    setInviteType(LIFECYCLE_REMINDER_TYPES[0])
    const template = templates.find((item) => item.id === 'tpl_survey_reminder') ?? templates[0]
    if (template) applyTemplate(template)
  }

  function openTemplateInMail(template: LifecycleMailTemplate) {
    const isReminder = /reminder/i.test(template.templateType) || /reminder/i.test(template.name)
    if (template.kind === 'sms') setDeliveryModes(['sms'])
    else if (template.kind === 'slack') setDeliveryModes(['slack'])
    else setDeliveryModes(['email'])
    applyTemplate(template)
    setEditEmail(true)
    if (isReminder) {
      setInviteType(LIFECYCLE_REMINDER_TYPES[0])
      setReminderTab('manual')
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
  ) {
    const time = formatStamp(new Date())
    const batch: LifecycleMailBatch = {
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
        message:
          section === 'reminders'
            ? 'This deployment has no invited employees yet.'
            : 'Select employees or add a group before sending.',
      })
      return
    }
    if (usesEmail && (!emailSubject.trim() || !emailBody.trim())) {
      showToast({ variant: 'info', message: 'Add a subject and message before sending.' })
      return
    }
    const overlap = section === 'reminders' ? reminderOverlapMessage(recipients) : ''
    if (overlap) showToast({ variant: 'info', message: overlap })
    const channels = section === 'invitations' ? channelLabel(deliveryModes) : 'Email'
    const mailType = `${inviteType.label} · ${channels}`
    recordSend(recipients, mailType)
    if (section === 'invitations' && selectedDeployment) {
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
    showToast({
      variant: 'success',
      message: `Sent via ${channels.toLowerCase()} to ${recipients.length} employee${recipients.length === 1 ? '' : 's'}`,
    })
    setHistoryTab('sent')
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
    showToast({ variant: 'success', message: exists ? 'Reminder updated' : 'Reminder scheduled' })
  }

  function previewScheduledSend(rule: Survey360ReminderRule) {
    if (recipients.length === 0) {
      showToast({
        variant: 'info',
        message: 'This deployment has no invited employees to preview.',
      })
      return
    }
    const overlap = reminderOverlapMessage(recipients)
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
        recipients: recipients.map((person, index) => ({
          id: `hist_${Date.now()}_${index}`,
          to: person.email,
          name: person.name,
          time,
          status: 'Scheduled',
          comments: summarizeReminderRule(rule, null),
        })),
      },
      ...current,
    ])
    showToast({
      variant: 'success',
      message: `Scheduled send logged for ${recipients.length} employee${recipients.length === 1 ? '' : 's'}`,
    })
    setHistoryTab('scheduled')
    setSection('history')
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
    onSchedule: () => showToast({ variant: 'success', message: 'Mail scheduled for later today' }),
  }

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
            <MailComposer
              title="Invitations"
              {...composerProps}
              hideFrom={!usesEmail}
              hideSubject={!usesEmail}
              typeFieldPlacement="templates"
              typeField={<DeliveryModeField value={deliveryModes} onChange={setDeliveryModes} />}
              toField={
                <RecipientPicker
                  employees={employees}
                  selectedIds={selectedRecipientIds}
                  onChange={setSelectedRecipientIds}
                  groups={savedFilters}
                />
              }
              onAddFrom={() => setAddFromOpen(true)}
              extraContent={
                <ChannelExtraFields
                  modes={deliveryModes}
                  smsBody={smsBody}
                  slackBody={slackBody}
                  onSmsChange={setSmsBody}
                  onSlackChange={setSlackBody}
                />
              }
              editLabel={usesEmail ? 'Edit email' : 'Edit message'}
              sendLabel={deliveryModes.length === 1 && primaryMode === 'email' ? 'Send Mail' : 'Send'}
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
                          <div className="mb-4 max-w-md">
                            <WuFormGroup
                              Label="Deployment"
                              Input={
                                <WuSelect
                                  data={deploymentOptions}
                                  accessorKey={{ value: 'value', label: 'label' }}
                                  value={selectedDeploymentOption}
                                  onSelect={(next) => {
                                    const option = (
                                      Array.isArray(next) ? next[0] : next
                                    ) as MailSelectOption | null
                                    if (option?.value) setSelectedDeploymentId(option.value)
                                  }}
                                  variant="outlined"
                                />
                              }
                            />
                          </div>
                          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                            <WuHeading size="sm" className="text-gray-900">
                              Scheduled reminders
                            </WuHeading>
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

                          {visibleReminderRules.length === 0 ? (
                            <EmptyState
                              icon="wm-calendar"
                              title="No scheduled reminders"
                              description="Reminders for this deployment appear here."
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
                              {visibleReminderRules.map((rule) => {
                                const next = nextFiring(rule, null)
                                const firesToday = ruleFiresOnDate(rule, todayStamp(), null)
                                const sentToday = history.some(
                                  (batch) =>
                                    /reminder/i.test(batch.mailType) && batch.date.startsWith(todayStamp()),
                                )
                                return (
                                  <WuCard key={rule.id} rounded className="p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900">
                                          {reminderAudienceLabel(rule.audience)} ·{' '}
                                          {rule.mode === 'one_time' ? 'One-time' : 'Recurring'}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-700">
                                          {summarizeReminderRule(rule, null)}
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
                                        <WuButton
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => previewScheduledSend(rule)}
                                        >
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
                                        <WuButton
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => setRuleToDelete(rule)}
                                        >
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
                          banner={reminderOverlapMessage(recipients)}
                          showMore={false}
                          {...composerProps}
                          onSchedule={() => {
                            setReminderTab('scheduled')
                            setEditingRule({
                              id: '',
                              deploymentId: selectedDeployment?.id ?? '',
                              mode: 'one_time',
                              time: '',
                              audience: 'employee',
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
            <div className="overflow-y-auto px-6 py-4">
              <div className="flex flex-wrap items-end gap-6 border-b border-gray-200">
                {LIFECYCLE_TEMPLATE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={cn(
                      'border-b-2 pb-2 text-sm font-medium',
                      templateKind === tab.id
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-600',
                    )}
                    onClick={() => setTemplateKind(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 mb-4 flex flex-wrap items-center justify-between gap-3">
                <WuButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setNewTemplateName('')
                    setNewTemplateSubject(templateKind === 'sms' || templateKind === 'slack' ? '' : 'New message')
                    setNewTemplateBody('')
                    setNewTemplateOpen(true)
                  }}
                >
                  + New template
                </WuButton>
                <WuText size="sm" as="span" className="text-gray-600">
                  {visibleTemplates.length} Templates
                </WuText>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500">
                      <th className="px-3 py-2 font-medium">Template Name</th>
                      <th className="px-3 py-2 font-medium">Template Type</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Default Language</th>
                      <th className="w-40 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTemplates.length > 0 ? (
                      visibleTemplates.map((template) => (
                        <tr key={template.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-3 font-medium text-gray-900">{template.name}</td>
                          <td className="px-3 py-3 text-gray-700">{template.templateType}</td>
                          <td className="px-3 py-3 text-gray-700">{template.type}</td>
                          <td className="px-3 py-3 text-gray-700">{template.language}</td>
                          <td className="px-2 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <WuButton
                                variant="secondary"
                                size="sm"
                                onClick={() => setPreviewTemplate(template)}
                              >
                                Preview
                              </WuButton>
                              <WuButton
                                variant="primary"
                                size="sm"
                                onClick={() => openTemplateInMail(template)}
                              >
                                Send
                              </WuButton>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-10 text-center text-gray-500" colSpan={5}>
                          No templates in this category yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {section === 'history' ? (
            <div className="overflow-y-auto px-6 py-4">
              <div className="flex flex-wrap items-end gap-6 border-b border-gray-200">
                {HISTORY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={cn(
                      'border-b-2 pb-2 text-sm font-medium',
                      historyTab === tab.id
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-600',
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
                            ? 'No sent mail yet for this survey.'
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
        onSave={saveReminderRule}
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

      <WuModal
        open={newTemplateOpen}
        onOpenChange={setNewTemplateOpen}
        size="md"
        {...preventModalDismiss}
      >
        <WuModalHeader>New template</WuModalHeader>
        <WuModalContent>
          <div className="space-y-4">
            <WuFormGroup
              Label="Template name"
              Input={
                <WuInput
                  variant="outlined"
                  value={newTemplateName}
                  onChange={(event) => setNewTemplateName(event.target.value)}
                />
              }
            />
            {templateKind === 'sms' || templateKind === 'slack' ? null : (
              <WuFormGroup
                Label="Subject"
                Input={
                  <WuInput
                    variant="outlined"
                    value={newTemplateSubject}
                    onChange={(event) => setNewTemplateSubject(event.target.value)}
                  />
                }
              />
            )}
            <WuFormGroup
              Label="Message"
              Input={
                <WuTextarea
                  rows={5}
                  value={newTemplateBody}
                  onChange={(event) => setNewTemplateBody(event.target.value)}
                />
              }
            />
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setNewTemplateOpen(false)}>
            Cancel
          </WuButton>
          <WuButton
            onClick={() => {
              if (!newTemplateName.trim() || !newTemplateBody.trim()) {
                showToast({ variant: 'info', message: 'Add a name and message.' })
                return
              }
              const created: LifecycleMailTemplate = {
                id: `tpl_${Date.now()}`,
                name: newTemplateName.trim(),
                kind: templateKind,
                templateType:
                  templateKind === 'sms'
                    ? 'SMS'
                    : templateKind === 'slack'
                      ? 'Slack'
                      : templateKind === 'global'
                        ? 'Global'
                        : 'Survey',
                type: 'Custom',
                language: 'English',
                subject: newTemplateSubject.trim(),
                body: newTemplateBody.trim(),
              }
              setTemplates((current) => [created, ...current])
              setNewTemplateOpen(false)
              showToast({ variant: 'success', message: 'Template added' })
            }}
          >
            Add template
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </div>
  )
}
