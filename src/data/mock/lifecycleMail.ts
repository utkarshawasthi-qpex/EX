import { composeFields, todayStamp, type Survey360ReminderRule } from '@/data/mock/survey360ReminderRules'

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

export type LifecycleMailBatch = {
  id: string
  tab: LifecycleHistoryTab
  mailType: string
  subject: string
  date: string
  status: string
  recipients: LifecycleMailRecipientLog[]
}

export type LifecycleDeployment = {
  id: string
  surveyId: string
  name: string
  status: 'Active' | 'Closed' | 'Draft'
  invitedEmployeeIds: string[]
  date: string
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

export const LIFECYCLE_DELIVERY_MODES: { id: LifecycleDeliveryMode; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'slack', label: 'Slack' },
  { id: 'sms', label: 'SMS' },
]

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

export const mockLifecycleDeployments: LifecycleDeployment[] = [
  {
    id: 'lcdep_culture_wave1',
    surveyId: 'surv_workplace_culture',
    name: 'Wave 1 — October 2026',
    status: 'Active',
    invitedEmployeeIds: ['emp_001', 'emp_002', 'emp_003', 'emp_004', 'emp_005', 'emp_007', 'emp_008', 'emp_017'],
    date: '2026-10-20 09:15:00',
  },
  {
    id: 'lcdep_culture_pilot',
    surveyId: 'surv_workplace_culture',
    name: 'Engineering pilot',
    status: 'Closed',
    invitedEmployeeIds: ['emp_001', 'emp_002', 'emp_003', 'emp_004', 'emp_005'],
    date: '2026-09-02 11:00:00',
  },
  {
    id: 'lcdep_q1_pulse',
    surveyId: 'surv_q1_pulse',
    name: 'Q1 pulse send',
    status: 'Active',
    invitedEmployeeIds: ['emp_001', 'emp_007', 'emp_012', 'emp_017', 'emp_022'],
    date: '2026-10-20 09:30:00',
  },
]

export function deploymentsForSurvey(surveyId: string, surveyName: string): LifecycleDeployment[] {
  const seeded = mockLifecycleDeployments.filter((deployment) => deployment.surveyId === surveyId)
  if (seeded.length > 0) return seeded
  return [
    {
      id: `lcdep_${surveyId}_first`,
      surveyId,
      name: `${surveyName} — first send`,
      status: 'Draft',
      invitedEmployeeIds: [],
      date: `${todayStamp()} 09:00:00`,
    },
  ]
}

const today = todayStamp()

export const mockLifecycleReminderRules: Survey360ReminderRule[] = [
  {
    id: 'rem_culture_today',
    deploymentId: 'lcdep_culture_wave1',
    mode: 'one_time',
    date: today,
    time: '09:00',
    ...composeFields('employee'),
  },
  {
    id: 'rem_culture_weekly',
    deploymentId: 'lcdep_culture_wave1',
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

export function seedLifecycleMailHistory(surveyId: string): LifecycleMailBatch[] {
  if (surveyId !== 'surv_workplace_culture') return []
  return [
    {
      id: 'hist_culture_invite',
      tab: 'sent',
      mailType: 'Survey Invitation · Email',
      subject: DEFAULT_SURVEY_INVITE_SUBJECT,
      date: '2026-10-20 09:15:00',
      status: 'Delivery Successful',
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
  ]
}

export function channelLabel(modes: LifecycleDeliveryMode[]) {
  const labels = LIFECYCLE_DELIVERY_MODES.filter((mode) => modes.includes(mode.id)).map((mode) => mode.label)
  return labels.join(', ')
}
