'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { DIRECTORY_LANGUAGES } from '@/data/mock-employee-directory'
import { EMPLOYEE_STATUS_FILTER_OPTIONS } from '@/data/mock-employee-filters'
import type { DirectoryCustomField } from '@/data/mock-custom-fields'
import { mockSurveys } from '@/data/mock/surveys'
import { useRosterStore } from '@/lib/rosterStore'
import type { Question } from '@/types'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuFormGroup })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
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

type SelectOption = { value: string; label: string }
type ConfigStep = 'trigger' | 'request' | 'mapping'
type ConfigTab = 'configuration' | 'logs'

type ConditionRow = {
  id: string
  field: SelectOption | null
  detail: SelectOption | null
  value: string
}
type MappingRow = { id: string; source: string; target: string }
type HeaderRow = { id: string; key: string; value: string }
type RequestSection = 'authorization' | 'header' | 'body'

type WebhookConfig = {
  name: string
  triggerEvent: SelectOption
  survey: SelectOption | null
  questionId: string | null
  questionValue: string
  questionChoices: SelectOption[]
  importType: SelectOption | null
  conditions: ConditionRow[]
  method: SelectOption
  url: string
  authType: SelectOption
  apiKeyName: string
  apiKeyValue: string
  apiKeyAddTo: SelectOption
  bearerToken: string
  basicUsername: string
  basicPassword: string
  headers: HeaderRow[]
  body: string
  mappings: MappingRow[]
}

const ROSTER_TRIGGER_EVENTS: SelectOption[] = [
  { value: 'employee.created', label: 'Employee created' },
  { value: 'employee.updated', label: 'Employee updated' },
  { value: 'after.import', label: 'After import' },
  { value: 'employee.deleted', label: 'Employee deleted' },
]

const SURVEY_TRIGGER_EVENTS: SelectOption[] = [
  { value: 'after.survey', label: 'After survey' },
  { value: 'before.survey', label: 'Before survey' },
  { value: 'after.question', label: 'After question' },
  { value: 'after.page', label: 'After page' },
  { value: 'on.save.continue', label: 'On Save and Continue' },
]

const TRIGGER_EVENTS: SelectOption[] = [...ROSTER_TRIGGER_EVENTS, ...SURVEY_TRIGGER_EVENTS]

const SURVEY_OPTIONS: SelectOption[] = mockSurveys
  .filter((survey) => survey.type !== '360')
  .map((survey) => ({
    value: survey.id,
    label: survey.title,
  }))

function isSurveyTrigger(value: string) {
  return SURVEY_TRIGGER_EVENTS.some((event) => event.value === value)
}

function hidesConditions(value: string) {
  return (
    value === 'before.survey' ||
    value === 'after.question' ||
    value === 'after.page' ||
    value === 'on.save.continue'
  )
}

function questionsForSurvey(surveyId: string | null | undefined): Question[] {
  if (!surveyId) return []
  return mockSurveys.find((survey) => survey.id === surveyId)?.questions ?? []
}

function isInputQuestion(question: Question) {
  return question.type === 'open_text'
}

function choiceOptionsFor(question: Question): SelectOption[] {
  if (question.type === 'yes_no') {
    return [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ]
  }
  if (question.type === 'multiple_choice') {
    return (question.options ?? []).map((option) => ({ value: option, label: option }))
  }
  if (question.type === 'enps') {
    return Array.from({ length: 11 }, (_, index) => ({ value: String(index), label: String(index) }))
  }
  if (question.type === 'rating_scale') {
    const min = question.ratingScale?.min ?? 1
    const max = question.ratingScale?.max ?? 5
    return Array.from({ length: max - min + 1 }, (_, index) => {
      const score = min + index
      return { value: String(score), label: question.ratingScale?.labels?.[score] ?? String(score) }
    })
  }
  return []
}

const CONDITION_FIELDS: SelectOption[] = [
  { value: 'department', label: 'Department' },
  { value: 'location', label: 'Location' },
  { value: 'status', label: 'Status' },
  { value: 'role', label: 'Role' },
]

const ROSTER_FIELDS: SelectOption[] = [
  { value: 'email', label: 'Email address' },
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'manager', label: 'Manager' },
  { value: 'startDate', label: 'Start date' },
  { value: 'endDate', label: 'End date' },
  { value: 'status', label: 'Employee status' },
  { value: 'language', label: 'Language' },
  { value: 'customField', label: 'Custom field' },
]

const IMPORT_TYPES: SelectOption[] = [
  { value: 'manual', label: 'Manual import' },
  { value: 'excel', label: 'Bulk import - Excel' },
]

const STATUS_OPTIONS: SelectOption[] = EMPLOYEE_STATUS_FILTER_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}))

const AFTER_SURVEY_CONDITION_FIELDS: SelectOption[] = [
  { value: 'system.variables', label: 'System Variable' },
  { value: 'geo.location', label: 'Geo Location' },
  { value: 'device.type', label: 'Device Type' },
]

const CUSTOM_VARIABLES: SelectOption[] = Array.from({ length: 255 }, (_, index) => ({
  value: `custom.${index + 1}`,
  label: `Custom ${index + 1}`,
}))

const GEO_LOCATION_FIELDS: SelectOption[] = [
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'country', label: 'Country' },
]

const DEVICE_TYPES: SelectOption[] = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' },
]

function emptyCondition(): ConditionRow {
  return { id: `cond_${Date.now()}`, field: null, detail: null, value: '' }
}

function conditionFieldsFor(trigger: string) {
  if (trigger === 'after.survey') return AFTER_SURVEY_CONDITION_FIELDS
  if (isRosterTrigger(trigger)) return ROSTER_FIELDS
  return CONDITION_FIELDS
}

function isRosterTrigger(trigger: string) {
  return ROSTER_TRIGGER_EVENTS.some((event) => event.value === trigger)
}

function choiceFrom(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value) ?? null
}

const METHODS: SelectOption[] = [
  { value: 'GET', label: 'Get' },
  { value: 'POST', label: 'Post' },
  { value: 'PUT', label: 'Put' },
]

const AUTH_TYPES: SelectOption[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'apiKey', label: 'API Key' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
]

const API_KEY_TARGETS: SelectOption[] = [
  { value: 'header', label: 'Header' },
  { value: 'query', label: 'Query Params' },
]

const REQUEST_SECTIONS: { id: RequestSection; label: string }[] = [
  { id: 'authorization', label: 'Authorization' },
  { id: 'header', label: 'Request Header' },
  { id: 'body', label: 'Request Body' },
]

const STEPS: { id: ConfigStep; label: string; description: string }[] = [
  {
    id: 'trigger',
    label: 'Trigger Logic',
    description: 'Setup a trigger for your webhook based on specific events and conditions',
  },
  {
    id: 'request',
    label: 'API Request',
    description: 'Configure how the webhook should send or receive data using your preferred HTTP method',
  },
  {
    id: 'mapping',
    label: 'Data Mapping',
    description: 'Map data received from the API request to custom variables',
  },
]

function QuestionTriggerFields({
  webhook,
  onChange,
}: {
  webhook: WebhookConfig
  onChange: (webhook: WebhookConfig) => void
}) {
  const questions = questionsForSurvey(webhook.survey?.value)
  const questionChoices = questions.map((question, index) => ({
    value: question.id,
    label: `${index + 1}. [Q${index + 1}] ${question.text}`,
  }))
  const selectedQuestion = questions.find((question) => question.id === webhook.questionId) ?? null
  const selectedOption = questionChoices.find((option) => option.value === webhook.questionId) ?? null

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <WuSelect
        data={questionChoices}
        accessorKey={{ value: 'value', label: 'label' }}
        value={selectedOption}
        placeholder="Select question"
        onSelect={(value) => {
          const option = asOption(value)
          onChange({
            ...webhook,
            questionId: option?.value ?? null,
            questionValue: '',
            questionChoices: [],
          })
        }}
        variant="outlined"
      />
      {selectedQuestion && isInputQuestion(selectedQuestion) ? (
        <WuInput
          variant="outlined"
          placeholder="Enter value"
          value={webhook.questionValue}
          onChange={(event) => onChange({ ...webhook, questionValue: event.target.value })}
        />
      ) : null}
      {selectedQuestion && !isInputQuestion(selectedQuestion) ? (
        <WuSelect
          data={choiceOptionsFor(selectedQuestion)}
          accessorKey={{ value: 'value', label: 'label' }}
          value={webhook.questionChoices}
          multiple
          placeholder="Select options"
          onSelect={(value) => {
            const next = (Array.isArray(value) ? value : value ? [value] : []) as SelectOption[]
            onChange({ ...webhook, questionChoices: next })
          }}
          variant="outlined"
        />
      ) : null}
    </div>
  )
}

function asOption(value: unknown): SelectOption | null {
  const selected = Array.isArray(value) ? value[0] : value
  if (selected && typeof selected === 'object' && 'value' in selected) return selected as SelectOption
  return null
}

function RosterConditionFollowUp({
  row,
  customFields,
  onPatch,
}: {
  row: ConditionRow
  customFields: DirectoryCustomField[]
  onPatch: (patch: Partial<ConditionRow>) => void
}) {
  const field = row.field?.value
  if (!field) return null

  if (field === 'email' || field === 'name' || field === 'phone' || field === 'manager') {
    return <TextIs value={row.value} placeholder="Enter value" onChange={(value) => onPatch({ value })} />
  }

  if (field === 'startDate' || field === 'endDate') {
    return <TextIs value={row.value} placeholder="MM/DD/YYYY" onChange={(value) => onPatch({ value })} />
  }

  if (field === 'status') {
    return (
      <ChoiceIs
        options={STATUS_OPTIONS}
        value={row.detail}
        placeholder="Select status"
        onSelect={(detail) => onPatch({ detail })}
      />
    )
  }

  if (field === 'language') {
    return (
      <ChoiceIs
        options={DIRECTORY_LANGUAGES}
        value={row.detail}
        placeholder="Select language"
        onSelect={(detail) => onPatch({ detail })}
      />
    )
  }

  if (field === 'customField') {
    const fieldOptions = customFields.map((item) => ({ value: item.key, label: item.title }))
    const selected = customFields.find((item) => item.key === row.detail?.value)
    const options = (selected?.options ?? []).map((option) => ({ value: option, label: option }))
    return (
      <>
        <div className="w-44">
          <WuSelect
            data={fieldOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={row.detail}
            placeholder="Select field"
            onSelect={(value) => onPatch({ detail: asOption(value), value: '' })}
            variant="outlined"
          />
        </div>
        <span className="text-sm text-gray-600">is</span>
        <div className="w-44">
          <WuSelect
            data={options}
            accessorKey={{ value: 'value', label: 'label' }}
            value={choiceFrom(options, row.value)}
            placeholder="Select option"
            onSelect={(value) => onPatch({ value: asOption(value)?.value ?? '' })}
            variant="outlined"
          />
        </div>
      </>
    )
  }

  return null
}

function TextIs({
  value,
  placeholder,
  onChange,
}: {
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <>
      <span className="text-sm text-gray-600">is</span>
      <div className="w-44">
        <WuInput
          variant="outlined"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </>
  )
}

function ChoiceIs({
  options,
  value,
  placeholder,
  onSelect,
}: {
  options: SelectOption[]
  value: SelectOption | null
  placeholder: string
  onSelect: (option: SelectOption | null) => void
}) {
  return (
    <>
      <span className="text-sm text-gray-600">is</span>
      <div className="w-44">
        <WuSelect
          data={options}
          accessorKey={{ value: 'value', label: 'label' }}
          value={value}
          placeholder={placeholder}
          onSelect={(next) => onSelect(asOption(next))}
          variant="outlined"
        />
      </div>
    </>
  )
}

function emptyHeader(): HeaderRow {
  return { id: `hdr_${Date.now()}`, key: '', value: '' }
}

function RequiredMark({ label }: { label: string }) {
  return (
    <span>
      {label} <span className="text-red-500">*</span>
    </span>
  )
}

function createWebhook(name: string): WebhookConfig {
  return {
    name,
    triggerEvent: TRIGGER_EVENTS[0],
    survey: null,
    questionId: null,
    questionValue: '',
    questionChoices: [],
    importType: null,
    conditions: [emptyCondition()],
    method: METHODS[0],
    url: '',
    authType: AUTH_TYPES[0],
    apiKeyName: '',
    apiKeyValue: '',
    apiKeyAddTo: API_KEY_TARGETS[0],
    bearerToken: '',
    basicUsername: '',
    basicPassword: '',
    headers: [emptyHeader()],
    body: '',
    mappings: [{ id: `map_${Date.now()}`, source: 'employee.email', target: '' }],
  }
}

function ApiRequestStep({
  webhook,
  onChange,
  onBack,
  onNext,
}: {
  webhook: WebhookConfig
  onChange: (webhook: WebhookConfig) => void
  onBack: () => void
  onNext: () => void
}) {
  const { showToast } = useWuShowToast()
  const [section, setSection] = useState<RequestSection>('authorization')

  function testRun() {
    if (!webhook.url.trim()) {
      showToast({ variant: 'info', message: 'Enter an API URL before running a test.' })
      return
    }
    showToast({ variant: 'success', message: `Test run sent with ${webhook.method.label}.` })
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-gray-900">API Request</p>
        <WuText size="sm" as="p" className="mt-1 text-gray-500">
          Configure how the webhook should send or receive data using your preferred HTTP method
        </WuText>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="w-40">
            <WuFormGroup
              Label="HTTP Method"
              Input={
                <WuSelect
                  data={METHODS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={webhook.method}
                  onSelect={(value) => {
                    const option = asOption(value)
                    if (option) onChange({ ...webhook, method: option })
                  }}
                  variant="outlined"
                />
              }
            />
          </div>
          <div className="min-w-[16rem] flex-1">
            <WuFormGroup
              Label={<RequiredMark label="API URL" />}
              Input={
                <WuInput
                  variant="outlined"
                  value={webhook.url}
                  onChange={(event) => onChange({ ...webhook, url: event.target.value })}
                />
              }
            />
          </div>
          <button
            type="button"
            className="mb-0.5 inline-flex h-10 items-center gap-2 rounded border border-gray-200 bg-gray-100 px-4 text-sm text-gray-700 hover:bg-gray-200"
            onClick={testRun}
          >
            <span aria-hidden>▶</span>
            Test Run
          </button>
        </div>
      </div>

      <div>
        <div className="flex gap-6 border-b border-gray-200">
          {REQUEST_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                'border-b-2 pb-2 text-sm',
                section === item.id ? 'border-blue-600 font-medium text-blue-700' : 'border-transparent text-gray-600',
              )}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {section === 'authorization' ? (
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div className="w-40">
              <WuFormGroup
                Label="Type"
                Input={
                  <WuSelect
                    data={AUTH_TYPES}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={webhook.authType}
                    onSelect={(value) => {
                      const option = asOption(value)
                      if (option) onChange({ ...webhook, authType: option })
                    }}
                    variant="outlined"
                  />
                }
              />
            </div>
            {webhook.authType.value === 'apiKey' ? (
              <>
                <div className="w-44">
                  <WuFormGroup
                    Label={<RequiredMark label="Key" />}
                    Input={
                      <WuInput
                        variant="outlined"
                        value={webhook.apiKeyName}
                        onChange={(event) => onChange({ ...webhook, apiKeyName: event.target.value })}
                      />
                    }
                  />
                </div>
                <div className="w-44">
                  <WuFormGroup
                    Label={<RequiredMark label="Value" />}
                    Input={
                      <WuInput
                        variant="outlined"
                        value={webhook.apiKeyValue}
                        onChange={(event) => onChange({ ...webhook, apiKeyValue: event.target.value })}
                      />
                    }
                  />
                </div>
                <div className="w-40">
                  <WuFormGroup
                    Label="Add to"
                    Input={
                      <WuSelect
                        data={API_KEY_TARGETS}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={webhook.apiKeyAddTo}
                        onSelect={(value) => {
                          const option = asOption(value)
                          if (option) onChange({ ...webhook, apiKeyAddTo: option })
                        }}
                        variant="outlined"
                      />
                    }
                  />
                </div>
              </>
            ) : null}
            {webhook.authType.value === 'bearer' ? (
              <div className="w-64">
                <WuFormGroup
                  Label={<RequiredMark label="Token" />}
                  Input={
                    <WuInput
                      variant="outlined"
                      value={webhook.bearerToken}
                      onChange={(event) => onChange({ ...webhook, bearerToken: event.target.value })}
                    />
                  }
                />
              </div>
            ) : null}
            {webhook.authType.value === 'basic' ? (
              <>
                <div className="w-44">
                  <WuFormGroup
                    Label={<RequiredMark label="Username" />}
                    Input={
                      <WuInput
                        variant="outlined"
                        value={webhook.basicUsername}
                        onChange={(event) => onChange({ ...webhook, basicUsername: event.target.value })}
                      />
                    }
                  />
                </div>
                <div className="w-44">
                  <WuFormGroup
                    Label={<RequiredMark label="Password" />}
                    Input={
                      <WuInput
                        variant="outlined"
                        type="password"
                        value={webhook.basicPassword}
                        onChange={(event) => onChange({ ...webhook, basicPassword: event.target.value })}
                      />
                    }
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {section === 'header' ? (
          <div className="mt-4 flex flex-col gap-3">
            {webhook.headers.map((row, index) => {
              const isLast = index === webhook.headers.length - 1
              return (
                <div key={row.id} className="flex flex-wrap items-end gap-3">
                  <div className="w-44">
                    <WuFormGroup
                      Label={index === 0 ? 'Key' : undefined}
                      Input={
                        <WuInput
                          variant="outlined"
                          value={row.key}
                          onChange={(event) =>
                            onChange({
                              ...webhook,
                              headers: webhook.headers.map((item) =>
                                item.id === row.id ? { ...item, key: event.target.value } : item,
                              ),
                            })
                          }
                        />
                      }
                    />
                  </div>
                  <div className="w-64">
                    <WuFormGroup
                      Label={index === 0 ? 'Value' : undefined}
                      Input={
                        <WuInput
                          variant="outlined"
                          value={row.value}
                          onChange={(event) =>
                            onChange({
                              ...webhook,
                              headers: webhook.headers.map((item) =>
                                item.id === row.id ? { ...item, value: event.target.value } : item,
                              ),
                            })
                          }
                        />
                      }
                    />
                  </div>
                  {isLast ? (
                    <div className="mb-1 flex items-center gap-2">
                      <button
                        type="button"
                        className="text-lg text-gray-500 hover:text-gray-800"
                        aria-label="Remove header"
                        onClick={() =>
                          onChange({
                            ...webhook,
                            headers:
                              webhook.headers.length === 1
                                ? webhook.headers
                                : webhook.headers.filter((item) => item.id !== row.id),
                          })
                        }
                      >
                        −
                      </button>
                      <button
                        type="button"
                        className="text-lg text-gray-500 hover:text-gray-800"
                        aria-label="Add header"
                        onClick={() => onChange({ ...webhook, headers: [...webhook.headers, emptyHeader()] })}
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}

        {section === 'body' ? (
          <div className="mt-4 max-w-xl">
            <WuTextarea
              variant="outlined"
              rows={6}
              placeholder="Enter request body"
              value={webhook.body}
              onChange={(event) => onChange({ ...webhook, body: event.target.value })}
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <WuButton variant="secondary" onClick={onBack}>
          Back
        </WuButton>
        <WuButton variant="primary" onClick={onNext}>
          Next
        </WuButton>
      </div>
    </div>
  )
}

export function EmployeeIntegrationsPage() {
  const { showToast } = useWuShowToast()
  const [webhook, setWebhook] = useState<WebhookConfig | null>(null)
  const [connected, setConnected] = useState(false)
  const [configuring, setConfiguring] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [nameError, setNameError] = useState('')

  function startConnect() {
    setDraftName('')
    setNameError('')
    setNameOpen(true)
  }

  function confirmName() {
    const name = draftName.trim()
    if (!name) {
      setNameError('Name is required.')
      return
    }
    setWebhook(createWebhook(name))
    setConnected(false)
    setNameOpen(false)
    setConfiguring(true)
  }

  if (configuring && webhook) {
    return (
      <WebhookConfigScreen
        webhook={webhook}
        connected={connected}
        onChange={setWebhook}
        onBack={() => setConfiguring(false)}
        onSave={() => {
          if (!webhook.url.trim().startsWith('https://')) {
            showToast({ variant: 'info', message: 'Enter an https endpoint URL on API Request.' })
            return
          }
          setConnected(true)
          setConfiguring(false)
          showToast({ variant: 'success', message: `${webhook.name} saved` })
        }}
      />
    )
  }

  return (
    <div className="px-6 py-6">
      <WuHeading size="sm">Integrations</WuHeading>
      <WuText size="sm" as="p" className="mt-1 text-gray-500">
        Connect the employee list to systems that should receive updates.
      </WuText>

      <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
        <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"
              aria-hidden
            >
              <span className="wm-webhook text-xl leading-none" />
            </span>
            <span
              className={
                connected
                  ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                  : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'
              }
            >
              {connected ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <WuHeading size="sm" className="mt-3">
            Webhooks
          </WuHeading>
          <WuText size="sm" as="p" className="mt-1 flex-1 text-gray-500">
            {webhook
              ? `${webhook.name} sends employee updates to your endpoint.`
              : 'Name a webhook, then set the trigger, request, and data mapping.'}
          </WuText>
          <div className="mt-4 flex items-center gap-2">
            {webhook ? (
              <>
                <WuButton variant="secondary" size="sm" onClick={() => setConfiguring(true)}>
                  Configure
                </WuButton>
                <WuButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setWebhook(null)
                    setConnected(false)
                    showToast({ variant: 'success', message: 'Webhook disconnected' })
                  }}
                >
                  Disconnect
                </WuButton>
              </>
            ) : (
              <WuButton variant="primary" size="sm" onClick={startConnect}>
                Connect
              </WuButton>
            )}
          </div>
        </article>
      </div>

      <WuModal open={nameOpen} onOpenChange={setNameOpen} size="md" {...preventModalDismiss}>
        <WuModalHeader>Webhook name</WuModalHeader>
        <WuModalContent>
          <WuFormGroup
            Label="Name"
            Error={nameError || undefined}
            Input={
              <WuInput
                variant="outlined"
                value={draftName}
                invalid={Boolean(nameError)}
                placeholder="e.g. HRIS sync"
                onChange={(event) => {
                  setDraftName(event.target.value)
                  if (nameError) setNameError('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') confirmName()
                }}
              />
            }
          />
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="primary" onClick={confirmName}>
            Continue
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </div>
  )
}

function WebhookConfigScreen({
  webhook,
  connected,
  onChange,
  onBack,
  onSave,
}: {
  webhook: WebhookConfig
  connected: boolean
  onChange: (webhook: WebhookConfig) => void
  onBack: () => void
  onSave: () => void
}) {
  const { showToast } = useWuShowToast()
  const { customFields } = useRosterStore()
  const [tab, setTab] = useState<ConfigTab>('configuration')
  const [step, setStep] = useState<ConfigStep>('trigger')
  const stepIndex = STEPS.findIndex((item) => item.id === step)

  function updateCondition(id: string, patch: Partial<ConditionRow>) {
    onChange({
      ...webhook,
      conditions: webhook.conditions.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    })
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-800 hover:text-blue-700"
            onClick={onBack}
          >
            <span aria-hidden>‹</span>
            Webhooks
          </button>
          <button
            type="button"
            className="wm-help text-base leading-none text-blue-600"
            aria-label="About webhooks"
            onClick={() =>
              showToast({
                variant: 'info',
                message: 'Webhooks notify your endpoint when employee list events occur.',
              })
            }
          />
        </div>
        <div className="mt-3 flex gap-6">
          {(['configuration', 'logs'] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={cn(
                'border-b-2 pb-2 text-sm',
                tab === item ? 'border-blue-600 font-medium text-blue-700' : 'border-transparent text-gray-600',
              )}
              onClick={() => setTab(item)}
            >
              {item === 'configuration' ? 'Configuration' : 'Logs'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'logs' ? (
        <div className="px-6 py-16 text-center">
          <WuText size="sm" as="p" className="text-gray-500">
            {connected ? `No deliveries yet for ${webhook.name}.` : 'Save the webhook to start collecting logs.'}
          </WuText>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 px-6 py-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div>
            <p className="mb-4 text-sm font-medium text-gray-900">{webhook.name}</p>
            <ol className="relative ml-3 border-l border-gray-200">
              {STEPS.map((item, index) => {
                const isActive = item.id === step
                const isDone = index < stepIndex
                return (
                  <li key={item.id} className="mb-6 ml-6">
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => setStep(item.id)}
                    >
                      <span
                        className={cn(
                          'absolute -left-2 mt-1 size-4 rounded-full border-2 bg-white',
                          isActive || isDone ? 'border-blue-600' : 'border-gray-300',
                          isActive && 'bg-blue-600',
                        )}
                        aria-hidden
                      />
                      <span className={cn('block text-sm font-medium', isActive ? 'text-blue-700' : 'text-gray-800')}>
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">{item.description}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="max-w-5xl">
            {step === 'trigger' ? (
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-900">Trigger Event</p>
                  <WuText size="sm" as="p" className="mt-1 text-gray-500">
                    Select an event based on which the webhook should be triggered
                  </WuText>
                  <div className="mt-3 flex flex-wrap items-start gap-4">
                    <div className="w-56">
                      <WuSelect
                        data={TRIGGER_EVENTS}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={webhook.triggerEvent}
                        onSelect={(value) => {
                          const option = asOption(value)
                          if (!option) return
                          const allowed = new Set(conditionFieldsFor(option.value).map((field) => field.value))
                          onChange({
                            ...webhook,
                            triggerEvent: option,
                            questionId: option.value === 'after.question' ? webhook.questionId : null,
                            questionValue: option.value === 'after.question' ? webhook.questionValue : '',
                            questionChoices: option.value === 'after.question' ? webhook.questionChoices : [],
                            importType: option.value === 'after.import' ? webhook.importType : null,
                            conditions: webhook.conditions.map((row) => {
                              const field = row.field && allowed.has(row.field.value) ? row.field : null
                              return field ? { ...row, field } : { ...row, field: null, detail: null, value: '' }
                            }),
                          })
                        }}
                        variant="outlined"
                      />
                    </div>
                  </div>
                  {isSurveyTrigger(webhook.triggerEvent.value) ? (
                    <div className="mt-4 max-w-md">
                      <WuFormGroup
                        Label="Survey"
                        Input={
                          <WuSelect
                            data={SURVEY_OPTIONS}
                            accessorKey={{ value: 'value', label: 'label' }}
                            value={webhook.survey}
                            placeholder="Select"
                            onSelect={(value) =>
                              onChange({
                                ...webhook,
                                survey: asOption(value),
                                questionId: null,
                                questionValue: '',
                                questionChoices: [],
                              })
                            }
                            variant="outlined"
                          />
                        }
                      />
                    </div>
                  ) : null}
                  {webhook.triggerEvent.value === 'after.question' && webhook.survey ? (
                    <div className="mt-4 max-w-md">
                      <WuFormGroup
                        Label="Question"
                        Input={<QuestionTriggerFields webhook={webhook} onChange={onChange} />}
                      />
                    </div>
                  ) : null}
                </div>

                {hidesConditions(webhook.triggerEvent.value) ? null : (
                <div>
                  <p className="text-sm font-medium text-gray-900">Conditions</p>
                  <WuText size="sm" as="p" className="mt-1 text-gray-500">
                    Select the conditions based on which the webhook should be triggered
                  </WuText>
                  {webhook.triggerEvent.value === 'after.import' ? (
                    <div className="mt-4 max-w-xs">
                      <WuFormGroup
                        Label="Import type"
                        Input={
                          <WuSelect
                            data={IMPORT_TYPES}
                            accessorKey={{ value: 'value', label: 'label' }}
                            value={webhook.importType}
                            placeholder="Select"
                            onSelect={(value) => onChange({ ...webhook, importType: asOption(value) })}
                            variant="outlined"
                          />
                        }
                      />
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-col gap-3">
                    {webhook.conditions.map((row, index) => {
                      const isAfterSurvey = webhook.triggerEvent.value === 'after.survey'
                      const isLast = index === webhook.conditions.length - 1
                      return (
                        <div key={row.id} className="flex flex-wrap items-center gap-3">
                          <span className="w-10 text-sm text-gray-600">{index === 0 ? 'IF' : 'AND'}</span>
                          <div className="w-44">
                            <WuSelect
                              data={conditionFieldsFor(webhook.triggerEvent.value)}
                              accessorKey={{ value: 'value', label: 'label' }}
                              value={row.field}
                              placeholder="Select"
                              onSelect={(value) =>
                                updateCondition(row.id, { field: asOption(value), detail: null, value: '' })
                              }
                              variant="outlined"
                            />
                          </div>
                          {isRosterTrigger(webhook.triggerEvent.value) ? (
                            <RosterConditionFollowUp
                              row={row}
                              customFields={customFields}
                              onPatch={(patch) => updateCondition(row.id, patch)}
                            />
                          ) : null}
                          {isAfterSurvey && row.field?.value === 'system.variables' ? (
                            <>
                              <div className="w-44">
                                <WuSelect
                                  data={CUSTOM_VARIABLES}
                                  accessorKey={{ value: 'value', label: 'label' }}
                                  value={row.detail}
                                  placeholder="Select variable"
                                  onSelect={(value) => updateCondition(row.id, { detail: asOption(value) })}
                                  variant="outlined"
                                />
                              </div>
                              <span className="text-sm text-gray-600">is</span>
                              <div className="w-44">
                                <WuInput
                                  variant="outlined"
                                  placeholder="Enter value"
                                  value={row.value}
                                  onChange={(event) => updateCondition(row.id, { value: event.target.value })}
                                />
                              </div>
                            </>
                          ) : null}
                          {isAfterSurvey && row.field?.value === 'geo.location' ? (
                            <>
                              <div className="w-40">
                                <WuSelect
                                  data={GEO_LOCATION_FIELDS}
                                  accessorKey={{ value: 'value', label: 'label' }}
                                  value={row.detail}
                                  placeholder="Select"
                                  onSelect={(value) => updateCondition(row.id, { detail: asOption(value) })}
                                  variant="outlined"
                                />
                              </div>
                              <span className="text-sm text-gray-600">is</span>
                              <div className="w-44">
                                <WuInput
                                  variant="outlined"
                                  placeholder="Enter location"
                                  value={row.value}
                                  onChange={(event) => updateCondition(row.id, { value: event.target.value })}
                                />
                              </div>
                            </>
                          ) : null}
                          {isAfterSurvey && row.field?.value === 'device.type' ? (
                            <div className="w-44">
                              <WuSelect
                                data={DEVICE_TYPES}
                                accessorKey={{ value: 'value', label: 'label' }}
                                value={row.detail}
                                placeholder="Select device"
                                onSelect={(value) => updateCondition(row.id, { detail: asOption(value) })}
                                variant="outlined"
                              />
                            </div>
                          ) : null}
                          {isLast ? (
                            <div className="ml-auto flex items-center gap-2">
                              <button
                                type="button"
                                className="text-lg text-gray-500 hover:text-gray-800"
                                aria-label="Remove condition"
                                onClick={() =>
                                  onChange({
                                    ...webhook,
                                    conditions:
                                      webhook.conditions.length === 1
                                        ? webhook.conditions
                                        : webhook.conditions.filter((item) => item.id !== row.id),
                                  })
                                }
                              >
                                −
                              </button>
                              <button
                                type="button"
                                className="text-lg text-gray-500 hover:text-gray-800"
                                aria-label="Add condition"
                                onClick={() =>
                                  onChange({
                                    ...webhook,
                                    conditions: [...webhook.conditions, emptyCondition()],
                                  })
                                }
                              >
                                +
                              </button>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
                )}

                <div>
                  <WuButton variant="primary" onClick={() => setStep('request')}>
                    Next
                  </WuButton>
                </div>
              </div>
            ) : null}

            {step === 'request' ? (
              <ApiRequestStep
                webhook={webhook}
                onChange={onChange}
                onBack={() => setStep('trigger')}
                onNext={() => setStep('mapping')}
              />
            ) : null}

            {step === 'mapping' ? (
              <div className="flex max-w-2xl flex-col gap-4">
                <WuText size="sm" as="p" className="text-gray-500">
                  Map employee fields onto the values your endpoint expects.
                </WuText>
                {webhook.mappings.map((row) => (
                  <div key={row.id} className="grid gap-3 sm:grid-cols-2">
                    <WuInput variant="outlined" value={row.source} readOnly />
                    <WuInput
                      variant="outlined"
                      placeholder="Custom variable"
                      value={row.target}
                      onChange={(event) =>
                        onChange({
                          ...webhook,
                          mappings: webhook.mappings.map((item) =>
                            item.id === row.id ? { ...item, target: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <WuButton variant="secondary" onClick={() => setStep('request')}>
                    Back
                  </WuButton>
                  <WuButton variant="primary" onClick={onSave}>
                    Save
                  </WuButton>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
