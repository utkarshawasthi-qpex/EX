import { format } from 'date-fns'
import {
  composeFields,
  DEFAULT_SURVEY_REMINDER_BODY,
  todayStamp,
  type Survey360ReminderRule,
} from '@/data/mock/survey360ReminderRules'

export type LifecycleDeliveryMode = 'email' | 'slack' | 'sms'

export type LifecycleTemplateKind = 'survey' | 'sms' | 'slack' | 'global'

export type LifecycleMailTemplate = {
  id: string
  name: string
  kind: LifecycleTemplateKind
  templateType: string
  type: 'Default' | 'Custom'
  language: string
  subject: string
  body: string
}

export type LifecycleHistoryTab = 'sent' | 'scheduled' | 'member' | 'portal'

export type LifecycleMailRecipientLog = {
  id: string
  to: string
  name: string
  time: string
  status: string
  comments: string
}

export type LifecycleScheduleKind = 'invitation' | 'reminder'

export type LifecycleMailBatch = {
  id: string
  tab: LifecycleHistoryTab
  mailType: string
  subject: string
  date: string
  status: string
  deploymentId?: string
  recipients: LifecycleMailRecipientLog[]
  from?: string
  body?: string
  deliveryModes?: LifecycleDeliveryMode[]
  kind?: LifecycleScheduleKind
  cadence?: 'one_time' | 'recurring'
  scheduleSummary?: string
  ruleId?: string
  groupName?: string
}

export type LifecycleDeploymentSource = 'email' | 'import' | 'slack' | 'sms'

export type LifecycleDeployment = {
  id: string
  surveyId: string
  name: string
  status: 'Active' | 'Closed' | 'Draft'
  invitedEmployeeIds: string[]
  date: string
  deliveryMode: LifecycleDeploymentSource
  sentTo: string
  completedCount: number
  deliveredCount: number
}

export function deploymentChannelLabel(mode: LifecycleDeploymentSource) {
  if (mode === 'import') return 'Import'
  if (mode === 'slack') return 'Slack'
  if (mode === 'sms') return 'SMS'
  return 'Email'
}

export function deploymentProgress(deployment: LifecycleDeployment) {
  const invited = deployment.invitedEmployeeIds.length
  const completed = Math.min(Math.max(deployment.completedCount, 0), invited)
  const remaining = Math.max(invited - completed, 0)
  const completedPct = invited === 0 ? 0 : Math.round((completed / invited) * 100)
  const remainingPct = invited === 0 ? 0 : 100 - completedPct
  const deliveredPct = invited === 0 ? 0 : Math.round((deployment.deliveredCount / invited) * 100)
  return { invited, completed, remaining, completedPct, remainingPct, deliveredPct }
}

export function surveyLinkForEmployee(surveyId: string, employeeId: string) {
  return `https://survey.questionpro.example/s/${surveyId}?e=${employeeId}`
}

export const DEFAULT_SURVEY_INVITE_SUBJECT = "We'd love your feedback — Employee Engagement Survey"
export const DEFAULT_SURVEY_INVITE_BODY = `Dear {FIRST_NAME},

We'd love your feedback. Please take a few minutes to complete the survey for [COMPANY_NAME].

Thank you,
[COMPANY_NAME]`

export const DEFAULT_SMS_INVITE_BODY =
  "Hi {FIRST_NAME}, we'd love your feedback. Take the survey: [Survey Link]"
export const DEFAULT_SLACK_INVITE_BODY =
  'Hi {FIRST_NAME} — please take a few minutes to complete the survey for [COMPANY_NAME].'

export const DEFAULT_EMAIL_TEMPLATE_SUBJECT = 'Survey Invitation'
export const DEFAULT_EMAIL_TEMPLATE_BODY = `Hello,

We would appreciate your feedback in our online survey. All responses will remain confidential and secure. Thank you in advance for your valuable insights. Your input will be used to ensure that we continue to meet your needs. We appreciate your trust and look forward to serving you in the future.

We have contracted with QuestionPro, an independent research firm, to field your confidential survey responses. Please click on this link to complete the survey:

{SURVEY_LINK}

Please contact {OWNER_EMAIL} with any questions.

Thank You`

export const DEFAULT_SMS_TEMPLATE_BODY =
  'Hi, you have been invited to take part in our online survey. Please click the following link to give us your feedback. Look forward to hearing from you.'

export const DEFAULT_SLACK_TEMPLATE_BODY =
  "Hi {FIRST_NAME}, <br />We're inviting you to participate in a brief survey. Your feedback is important to us.<br /> Please take a few minutes to complete it here."

export const LIFECYCLE_DELIVERY_MODES: { id: LifecycleDeliveryMode; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'slack', label: 'Slack' },
  { id: 'sms', label: 'SMS' },
]

export const PAID_DELIVERY_MODES: LifecycleDeliveryMode[] = ['slack', 'sms']
export const INITIAL_LIFECYCLE_SEND_CREDITS = 0
export const LIFECYCLE_CREDIT_PACK = 10

export function usesPaidDelivery(modes: LifecycleDeliveryMode[]) {
  return modes.some((mode) => PAID_DELIVERY_MODES.includes(mode))
}

export const LIFECYCLE_TEMPLATE_TABS: { id: LifecycleTemplateKind; label: string }[] = [
  { id: 'survey', label: 'Survey specific templates' },
  { id: 'sms', label: 'SMS templates' },
  { id: 'slack', label: 'Slack templates' },
  { id: 'global', label: 'Global templates' },
]

export const LIFECYCLE_FROM_OPTIONS = [
  { value: 'survey@qp-mail.com', label: 'QuestionPro Survey (survey@qp-mail.com)' },
]

export const LIFECYCLE_INVITE_TYPES = [{ value: 'survey_invite', label: 'Survey Invite' }]

export const LIFECYCLE_REMINDER_TYPES = [{ value: 'survey_reminder', label: 'Survey Reminder' }]

export const LIFECYCLE_MAIL_TEMPLATES: LifecycleMailTemplate[] = [
  {
    id: 'tpl_survey_invite',
    name: 'Survey Invite',
    kind: 'survey',
    templateType: 'Survey Invite',
    type: 'Default',
    language: 'English',
    subject: DEFAULT_SURVEY_INVITE_SUBJECT,
    body: DEFAULT_SURVEY_INVITE_BODY,
  },
  {
    id: 'tpl_survey_reminder',
    name: 'Survey Reminder',
    kind: 'survey',
    templateType: 'Survey Reminder',
    type: 'Default',
    language: 'English',
    subject: 'Reminder: complete your survey',
    body: `Dear {FIRST_NAME},

This is a reminder to finish your survey for [COMPANY_NAME]. It only takes a few minutes.

Thank you,
[COMPANY_NAME]`,
  },
  {
    id: 'tpl_survey_thank_you',
    name: 'Thank you for responding',
    kind: 'survey',
    templateType: 'Thank you',
    type: 'Custom',
    language: 'English',
    subject: 'Thank you for sharing your feedback',
    body: `Dear {FIRST_NAME},

Thank you for completing the survey for [COMPANY_NAME]. Your responses help us improve the employee experience.

Thank you,
[COMPANY_NAME]`,
  },
  {
    id: 'tpl_sms_invite',
    name: 'SMS invite',
    kind: 'sms',
    templateType: 'SMS Invite',
    type: 'Default',
    language: 'English',
    subject: '',
    body: DEFAULT_SMS_INVITE_BODY,
  },
  {
    id: 'tpl_sms_reminder',
    name: 'SMS reminder',
    kind: 'sms',
    templateType: 'SMS Reminder',
    type: 'Custom',
    language: 'English',
    subject: '',
    body: 'Hi {FIRST_NAME}, reminder to finish your survey: [Survey Link]',
  },
  {
    id: 'tpl_slack_invite',
    name: 'Slack invite',
    kind: 'slack',
    templateType: 'Slack Invite',
    type: 'Default',
    language: 'English',
    subject: '',
    body: DEFAULT_SLACK_INVITE_BODY,
  },
  {
    id: 'tpl_slack_reminder',
    name: 'Slack reminder',
    kind: 'slack',
    templateType: 'Slack Reminder',
    type: 'Custom',
    language: 'English',
    subject: '',
    body: 'Hi {FIRST_NAME}, this is a reminder to complete the survey when you have a few minutes.',
  },
  {
    id: 'tpl_global_invite',
    name: 'Global survey invite',
    kind: 'global',
    templateType: 'Survey Invite',
    type: 'Default',
    language: 'English',
    subject: "We'd love your feedback",
    body: `Dear {FIRST_NAME},

Please complete this survey. Your feedback helps [COMPANY_NAME] improve.

Thank you,
[COMPANY_NAME]`,
  },
  {
    id: 'tpl_global_nudge',
    name: 'Global reminder nudge',
    kind: 'global',
    templateType: 'Survey Reminder',
    type: 'Custom',
    language: 'English',
    subject: 'A quick reminder',
    body: `Dear {FIRST_NAME},

Just a reminder that we still need your response.

Thank you,
[COMPANY_NAME]`,
  },
]

export function lifecycleDeploymentLabel(deployment: Pick<LifecycleDeployment, 'date'>) {
  const parsed = new Date(deployment.date.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return deployment.date
  return format(parsed, 'MMM d yyyy hh:mm a')
}

export const mockLifecycleDeployments: LifecycleDeployment[] = [
  {
    id: 'lcdep_culture_import_today',
    surveyId: 'surv_workplace_culture',
    name: 'Oct 29 2026 09:00 AM',
    status: 'Draft',
    invitedEmployeeIds: [],
    date: '2026-10-29 09:00:00',
    deliveryMode: 'import',
    sentTo: 'Custom Email(s)',
    completedCount: 0,
    deliveredCount: 0,
  },
  {
    id: 'lcdep_culture_email_oct28',
    surveyId: 'surv_workplace_culture',
    name: 'Oct 28 2026 10:12 AM',
    status: 'Active',
    invitedEmployeeIds: ['emp_001'],
    date: '2026-10-28 10:12:00',
    deliveryMode: 'email',
    sentTo: 'Custom Email(s)',
    completedCount: 0,
    deliveredCount: 0,
  },
  {
    id: 'lcdep_culture_wave1',
    surveyId: 'surv_workplace_culture',
    name: 'Oct 20 2026 09:15 AM',
    status: 'Active',
    invitedEmployeeIds: ['emp_001', 'emp_002', 'emp_003', 'emp_004', 'emp_005', 'emp_007', 'emp_008', 'emp_017'],
    date: '2026-10-20 09:15:00',
    deliveryMode: 'email',
    sentTo: 'Custom Email(s)',
    completedCount: 5,
    deliveredCount: 8,
  },
  {
    id: 'lcdep_culture_email_oct6',
    surveyId: 'surv_workplace_culture',
    name: 'Oct 6 2026 11:30 AM',
    status: 'Active',
    invitedEmployeeIds: ['emp_002', 'emp_003', 'emp_004'],
    date: '2026-10-06 11:30:00',
    deliveryMode: 'email',
    sentTo: 'Custom Email(s)',
    completedCount: 1,
    deliveredCount: 3,
  },
  {
    id: 'lcdep_culture_import_oct6',
    surveyId: 'surv_workplace_culture',
    name: 'Oct 6 2026 08:00 AM',
    status: 'Active',
    invitedEmployeeIds: ['emp_005', 'emp_007', 'emp_008'],
    date: '2026-10-06 08:00:00',
    deliveryMode: 'import',
    sentTo: 'Custom Email(s)',
    completedCount: 3,
    deliveredCount: 0,
  },
  {
    id: 'lcdep_culture_pilot',
    surveyId: 'surv_workplace_culture',
    name: 'Sep 2 2026 11:00 AM',
    status: 'Closed',
    invitedEmployeeIds: ['emp_001', 'emp_002', 'emp_003', 'emp_004', 'emp_005'],
    date: '2026-09-02 11:00:00',
    deliveryMode: 'email',
    sentTo: 'Custom Email(s)',
    completedCount: 4,
    deliveredCount: 5,
  },
  {
    id: 'lcdep_q1_pulse',
    surveyId: 'surv_q1_pulse',
    name: 'Oct 20 2026 09:30 AM',
    status: 'Active',
    invitedEmployeeIds: ['emp_001', 'emp_007', 'emp_012', 'emp_017', 'emp_022'],
    date: '2026-10-20 09:30:00',
    deliveryMode: 'email',
    sentTo: 'Custom Email(s)',
    completedCount: 2,
    deliveredCount: 5,
  },
]

export function deploymentsForSurvey(surveyId: string, _surveyName: string): LifecycleDeployment[] {
  const seeded = mockLifecycleDeployments.filter((deployment) => deployment.surveyId === surveyId)
  if (seeded.length > 0) return seeded
  const date = `${todayStamp()} 09:00:00`
  return [
    {
      id: `lcdep_${surveyId}_first`,
      surveyId,
      name: lifecycleDeploymentLabel({ date }),
      status: 'Draft',
      invitedEmployeeIds: [],
      date,
      deliveryMode: 'email',
      sentTo: 'Custom Email(s)',
      completedCount: 0,
      deliveredCount: 0,
    },
  ]
}

const today = todayStamp()

export const mockLifecycleReminderRules: Survey360ReminderRule[] = [
  {
    id: 'rem_culture_today',
    deploymentId: 'lcdep_culture_wave1',
    kind: 'reminder',
    mode: 'one_time',
    date: today,
    time: '14:45',
    ...composeFields('employee'),
  },
  {
    id: 'rem_culture_weekly',
    deploymentId: 'lcdep_culture_wave1',
    kind: 'reminder',
    mode: 'recurring',
    interval: 'weekly',
    weekdays: [1],
    startDate: '2026-10-13',
    time: '10:00',
    endKind: 'after_n',
    occurrenceCount: 6,
    ...composeFields('employee'),
  },
  {
    id: 'rem_culture_pilot_once',
    deploymentId: 'lcdep_culture_pilot',
    mode: 'one_time',
    date: '2026-09-08',
    time: '15:00',
    ...composeFields('employee'),
  },
  {
    id: 'rem_q1_weekly',
    deploymentId: 'lcdep_q1_pulse',
    mode: 'recurring',
    interval: 'every_n_days',
    intervalCount: 3,
    startDate: '2026-10-20',
    time: '09:30',
    endKind: 'on_date',
    endDate: '2026-11-14',
    ...composeFields('employee'),
  },
]

const WAVE1_PEOPLE = [
  { to: 'sarah.johnson@questionpro.example', name: 'Sarah Johnson' },
  { to: 'marcus.chen@questionpro.example', name: 'Marcus Chen' },
  { to: 'priya.nair@questionpro.example', name: 'Priya Nair' },
  { to: 'daniel.brooks@questionpro.example', name: 'Daniel Brooks' },
  { to: 'amelia.garcia@questionpro.example', name: 'Amelia Garcia' },
  { to: 'elena.morris@questionpro.example', name: 'Elena Morris' },
  { to: 'owen.kim@questionpro.example', name: 'Owen Kim' },
  { to: 'hannah.lee@questionpro.example', name: 'Hannah Lee' },
] as const

function scheduledRecipients(prefix: string, stamp: string): LifecycleMailRecipientLog[] {
  return WAVE1_PEOPLE.map((person, index) => ({
    id: `${prefix}_${index}`,
    to: person.to,
    name: person.name,
    time: stamp,
    status: 'Scheduled',
    comments: '',
  }))
}

export function seedLifecycleMailHistory(surveyId: string): LifecycleMailBatch[] {
  if (surveyId !== 'surv_workplace_culture') return []
  const inviteStamp = '2026-10-30 14:30:00'
  const reminderStamp = `${today} 14:45:00`
  const weeklyStamp = '2026-11-02 10:00:00'
  return [
    {
      id: 'hist_culture_reminder_sched',
      tab: 'scheduled',
      mailType: 'Survey Reminder · Email',
      subject: 'Reminder: complete your survey',
      date: reminderStamp,
      status: 'Scheduled',
      deploymentId: 'lcdep_culture_wave1',
      from: LIFECYCLE_FROM_OPTIONS[0].value,
      body: DEFAULT_SURVEY_REMINDER_BODY,
      deliveryModes: ['email'],
      kind: 'reminder',
      cadence: 'one_time',
      scheduleSummary: 'One-time — Oct 28, 2026 at 2:45 PM',
      ruleId: 'rem_culture_today',
      recipients: scheduledRecipients('hist_culture_reminder_sched', reminderStamp),
    },
    {
      id: 'hist_culture_invite_sched',
      tab: 'scheduled',
      mailType: 'Survey Invitation · Email',
      subject: DEFAULT_SURVEY_INVITE_SUBJECT,
      date: inviteStamp,
      status: 'Scheduled',
      from: LIFECYCLE_FROM_OPTIONS[0].value,
      body: DEFAULT_SURVEY_INVITE_BODY,
      deliveryModes: ['email'],
      kind: 'invitation',
      cadence: 'one_time',
      scheduleSummary: 'One-time — Oct 30, 2026 at 2:30 PM',
      groupName: 'Active employees',
      recipients: scheduledRecipients('hist_culture_invite_sched', inviteStamp),
    },
    {
      id: 'hist_culture_reminder_weekly',
      tab: 'scheduled',
      mailType: 'Survey Reminder · Email',
      subject: 'Reminder: complete your survey',
      date: weeklyStamp,
      status: 'Scheduled',
      deploymentId: 'lcdep_culture_wave1',
      from: LIFECYCLE_FROM_OPTIONS[0].value,
      body: DEFAULT_SURVEY_REMINDER_BODY,
      deliveryModes: ['email'],
      kind: 'reminder',
      cadence: 'recurring',
      scheduleSummary: 'Every Monday at 10:00 AM, starting Oct 13, 2026, for 6 occurrences',
      ruleId: 'rem_culture_weekly',
      recipients: scheduledRecipients('hist_culture_reminder_weekly', weeklyStamp),
    },
    {
      id: 'hist_culture_invite',
      tab: 'sent',
      mailType: 'Survey Invitation · Email',
      subject: DEFAULT_SURVEY_INVITE_SUBJECT,
      date: '2026-10-20 09:15:00',
      status: 'Delivery Successful',
      deploymentId: 'lcdep_culture_wave1',
      kind: 'invitation',
      deliveryModes: ['email'],
      recipients: [
        {
          id: 'hist_culture_invite_sarah',
          to: 'sarah.johnson@questionpro.example',
          name: 'Sarah Johnson',
          time: '2026-10-20 09:15:00',
          status: 'Opened',
          comments: '',
        },
        {
          id: 'hist_culture_invite_marcus',
          to: 'marcus.chen@questionpro.example',
          name: 'Marcus Chen',
          time: '2026-10-20 09:15:00',
          status: 'Sent',
          comments: '',
        },
        {
          id: 'hist_culture_invite_priya',
          to: 'priya.nair@questionpro.example',
          name: 'Priya Nair',
          time: '2026-10-20 09:15:00',
          status: 'Sent',
          comments: '',
        },
        {
          id: 'hist_culture_invite_bounce',
          to: 'x@gmail.com',
          name: 'Unknown recipient',
          time: '2026-10-20 09:15:00',
          status: 'Bounced',
          comments: 'Mailbox does not exist',
        },
      ],
    },
    {
      id: 'hist_culture_reminder',
      tab: 'sent',
      mailType: 'Survey Reminder · Email',
      subject: 'Reminder: complete your survey',
      date: `${today} 08:12:00`,
      status: 'Delivery Successful',
      deploymentId: 'lcdep_culture_wave1',
      kind: 'reminder',
      deliveryModes: ['email'],
      recipients: [
        {
          id: 'hist_culture_reminder_priya',
          to: 'priya.nair@questionpro.example',
          name: 'Priya Nair',
          time: `${today} 08:12:00`,
          status: 'Sent',
          comments: '',
        },
      ],
    },
    {
      id: 'hist_culture_oct6_rem1',
      tab: 'sent',
      mailType: 'Survey Reminder · Email',
      subject: 'Reminder: complete your survey',
      date: '2026-10-28 09:15:00',
      status: 'Delivery Successful',
      deploymentId: 'lcdep_culture_email_oct6',
      kind: 'reminder',
      deliveryModes: ['email'],
      recipients: [
        {
          id: 'hist_culture_oct6_rem1_marcus',
          to: 'marcus.chen@questionpro.example',
          name: 'Marcus Chen',
          time: '2026-10-28 09:15:00',
          status: 'Opened',
          comments: '',
        },
        {
          id: 'hist_culture_oct6_rem1_priya',
          to: 'priya.nair@questionpro.example',
          name: 'Priya Nair',
          time: '2026-10-28 09:15:00',
          status: 'Sent',
          comments: '',
        },
        {
          id: 'hist_culture_oct6_rem1_daniel',
          to: 'daniel.brooks@questionpro.example',
          name: 'Daniel Brooks',
          time: '2026-10-28 09:15:00',
          status: 'Sent',
          comments: '',
        },
      ],
    },
    {
      id: 'hist_culture_oct6_rem2',
      tab: 'sent',
      mailType: 'Survey Reminder · Email',
      subject: 'Reminder: complete your survey',
      date: '2026-10-28 16:40:00',
      status: 'Delivery Successful',
      deploymentId: 'lcdep_culture_email_oct6',
      kind: 'reminder',
      deliveryModes: ['email'],
      recipients: [
        {
          id: 'hist_culture_oct6_rem2_priya',
          to: 'priya.nair@questionpro.example',
          name: 'Priya Nair',
          time: '2026-10-28 16:40:00',
          status: 'Sent',
          comments: '',
        },
        {
          id: 'hist_culture_oct6_rem2_daniel',
          to: 'daniel.brooks@questionpro.example',
          name: 'Daniel Brooks',
          time: '2026-10-28 16:40:00',
          status: 'Opened',
          comments: '',
        },
      ],
    },
  ]
}

export function channelLabel(modes: LifecycleDeliveryMode[]) {
  const labels = LIFECYCLE_DELIVERY_MODES.filter((mode) => modes.includes(mode.id)).map((mode) => mode.label)
  return labels.join(', ')
}
