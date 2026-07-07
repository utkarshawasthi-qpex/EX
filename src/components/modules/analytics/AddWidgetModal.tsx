'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Layout } from 'react-grid-layout/legacy'
import type {
  DashboardWidget,
  ID,
  LifecycleSurvey,
  Question,
  WidgetType,
} from '@/types'
import { WIDGET_CATALOG } from '@/components/modules/analytics/widgetRegistry'
import { SummaryOrgContextPanel } from '@/components/modules/analytics/SummaryOrgContextPanel'
import { DEFAULT_SUMMARY_ADMIN_SETTINGS } from '@/lib/summaryDefaults'
import { isAdminContext } from '@/lib/userContext'
import {
  buildSummaryAdminConfigFromFields,
  SummaryAdminSettingsFields,
  type SummaryAdminSettingsFieldValues,
} from '@/components/modules/analytics/SummaryAdminSettingsFields'
import { getSurveys } from '@/lib/mockDb'
import { preventModalDismiss } from '@/lib/modalProps'
import { getCurrentUser } from '@/lib/userContext'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
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
const WuRadioGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuRadioGroup })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
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
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)

type SelectOption = {
  value: string
  label: string
}

export type AddWidgetConfig = {
  type: WidgetType
  title: string
  description?: string
  surveyId?: ID
  width: DashboardWidget['width']
  config?: Record<string, unknown>
  summaryConfig?: DashboardWidget['summaryConfig']
}

type AddWidgetModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLayout: Layout
  tabWidgets: DashboardWidget[]
  onWidgetAdd: (config: AddWidgetConfig) => void
}

const WIDGET_STEPS = [
  { icon: '📊', label: 'Widget' },
  { icon: '⚙', label: 'Settings' },
  { icon: '🔍', label: 'Source' },
  { icon: '📊', label: 'Columns set' },
] as const

const SUMMARY_STEPS = [
  { icon: '📊', label: 'Widget' },
  { icon: '📋', label: 'Org Context' },
  { icon: '⚙', label: 'Settings' },
  { icon: '👁', label: 'Visibility' },
] as const

const DEFAULT_SUMMARY_SETTINGS: SummaryAdminSettingsFieldValues = {
  ...DEFAULT_SUMMARY_ADMIN_SETTINGS,
}

const GROUP_BY_OPTIONS: SelectOption[] = [
  { value: 'Department', label: 'Department' },
  { value: 'Location', label: 'Location' },
  { value: 'Job Level', label: 'Job Level' },
  { value: 'Job Title', label: 'Job Title' },
]

const RESPONSE_RATE_GROUP_OPTIONS: SelectOption[] = [
  { value: 'Department', label: 'Department' },
  { value: 'Job Level', label: 'Job Level' },
  { value: 'Location', label: 'Location' },
]

const ANALYTICS_TYPE_WIDGETS: WidgetType[] = [
  'heatmap',
  'scorecard',
  'time_trend',
  'driver_analysis',
]

const NO_QUESTION_WIDGETS: WidgetType[] = ['notes', 'summary']

const MOCK_DEPLOYMENTS: SelectOption[] = [
  { value: '12 May 2026 06:01, 12 May 2026 05:59', label: '12 May 2026 06:01, 12 May 2026 05:59' },
  { value: '28 Apr 2026 09:00, 28 Apr 2026 08:59', label: '28 Apr 2026 09:00, 28 Apr 2026 08:59' },
  { value: '14 Mar 2026 10:00, 14 Mar 2026 09:59', label: '14 Mar 2026 10:00, 14 Mar 2026 09:59' },
]

const ANALYTICS_TYPE_OPTIONS = [
  { label: 'Mean', value: 'mean' },
  { label: 'Favorability %', value: 'favorability' },
]

const NO_MARKERS_OPTION: SelectOption = { value: '', label: 'No markers available' }

const DEFAULT_FULL_WIDTH_TYPES: WidgetType[] = ['summary', 'scorecard', 'driver_analysis']

function getDataWidgets(widgets: DashboardWidget[]): DashboardWidget[] {
  return widgets.filter((widget) => widget.type !== 'summary' && widget.type !== 'notes')
}

function WidgetStepIndicator({
  currentStep,
  steps,
}: {
  currentStep: number
  steps: readonly { icon: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((stepItem, index) => (
        <span key={stepItem.label} className="flex items-center gap-2">
          {index < currentStep && (
            <span className="text-sm font-medium text-blue-400" aria-hidden>
              ✓
            </span>
          )}
          <span
            className={cn(
              'flex items-center gap-1 text-sm',
              index === currentStep && 'font-semibold text-blue-600',
              index < currentStep && 'text-blue-400',
              index > currentStep && 'text-gray-400',
            )}
          >
            <span aria-hidden>{stepItem.icon}</span>
            {stepItem.label}
          </span>
          {index < steps.length - 1 && (
            <span className="text-gray-300" aria-hidden>
              &gt;
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

function SummaryThumbnail() {
  return (
    <div
      className="relative flex h-16 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-500 to-blue-500"
      aria-hidden
    >
      <span className="text-2xl text-white">✦</span>
      <span className="absolute right-1 top-1 rounded bg-white px-1 text-xs font-bold text-purple-600">
        AI
      </span>
    </div>
  )
}

function WidgetThumbnail({ type }: { type: WidgetType }) {
  if (type === 'summary') return <SummaryThumbnail />

  const baseClass = 'flex h-16 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg'

  if (type === 'response_rate') {
    return (
      <div className={cn(baseClass, 'bg-blue-50')} aria-hidden>
        <svg width="72" height="54" viewBox="0 0 72 54" fill="none">
          <circle cx="23" cy="21" r="13" stroke="#3b82f6" strokeWidth="3" />
          <text x="23" y="24" textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="700">100%</text>
          <rect x="8" y="40" width="28" height="3" rx="1.5" fill="#cbd5e1" />
          <rect x="8" y="45" width="22" height="3" rx="1.5" fill="#cbd5e1" />
          <rect x="8" y="50" width="18" height="3" rx="1.5" fill="#cbd5e1" />
        </svg>
      </div>
    )
  }

  if (type === 'scorecard') {
    return (
      <div className={cn(baseClass, 'bg-blue-50')} aria-hidden>
        <svg width="72" height="48" viewBox="0 0 72 48">
          {['A', 'B', 'C'].map((label, index) => {
            const y = 9 + index * 14
            return (
              <g key={label}>
                <text x="6" y={y + 5} fontSize="8" fill="#64748b">{label}</text>
                <rect x="18" y={y} width="16" height="6" fill="#f87171" />
                <rect x="34" y={y} width="14" height="6" fill="#facc15" />
                <rect x="48" y={y} width="18" height="6" fill="#22c55e" />
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  if (type === 'enps') {
    return (
      <div className={cn(baseClass, 'bg-green-50')} aria-hidden>
        <svg width="72" height="50" viewBox="0 0 72 50" fill="none">
          <path d="M18 31 A18 18 0 0 1 30 14" stroke="#f87171" strokeWidth="4" />
          <path d="M30 14 A18 18 0 0 1 42 14" stroke="#facc15" strokeWidth="4" />
          <path d="M42 14 A18 18 0 0 1 54 31" stroke="#4ade80" strokeWidth="4" />
          <line x1="36" y1="31" x2="27" y2="38" stroke="#334155" strokeWidth="2" />
          <text x="36" y="47" textAnchor="middle" fontSize="11" fill="#166534" fontWeight="700">-66</text>
        </svg>
      </div>
    )
  }

  if (type === 'heatmap') {
    const colors = ['#86efac', '#fde047', '#fca5a5', '#86efac', '#fca5a5', '#fde047', '#86efac', '#fde047', '#fca5a5', '#86efac', '#fde047', '#86efac']
    return (
      <div className={cn(baseClass, 'bg-yellow-50')} aria-hidden>
        <svg width="56" height="48" viewBox="0 0 56 48">
          {[1, 2, 3].map((label, i) => (
            <text key={label} x={20 + i * 10} y="8" fontSize="6" fill="#64748b">{label}</text>
          ))}
          {colors.map((color, index) => {
            const row = Math.floor(index / 4)
            const col = index % 4
            return <rect key={`${color}-${index}`} x={8 + col * 10} y={13 + row * 10} width="8" height="8" fill={color} rx="1" />
          })}
        </svg>
      </div>
    )
  }

  if (type === 'text_analysis') {
    return (
      <div className={cn(baseClass, 'bg-purple-50')} aria-hidden>
        <svg width="58" height="44" viewBox="0 0 58 44">
          {[42, 32, 24, 17].map((width, index) => {
            const y = 8 + index * 9
            return (
              <g key={width}>
                <circle cx="8" cy={y + 2} r="2" fill="#8b5cf6" />
                <rect x="14" y={y} width={width} height="4" rx="2" fill="#a78bfa" />
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  if (type === 'text_report') {
    return (
      <div className={cn(baseClass, 'bg-gray-50')} aria-hidden>
        <svg width="58" height="44" viewBox="0 0 58 44">
          {[42, 34, 46, 28, 38].map((width, index) => {
            const y = 7 + index * 7
            return (
              <g key={`${width}-${index}`}>
                <rect x="6" y={y - 2} width="4" height="4" fill="#cbd5e1" />
                <line x1="14" y1={y} x2={14 + width} y2={y} stroke="#cbd5e1" strokeWidth="2" />
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  if (type === 'survey_comparison') {
    return (
      <div className={cn(baseClass, 'bg-orange-50')} aria-hidden>
        <svg width="62" height="46" viewBox="0 0 62 46">
          {[1, 2, 3].map((label, index) => {
            const y = 9 + index * 12
            return (
              <g key={label}>
                <text x="5" y={y + 7} fontSize="7" fill="#64748b">{label}</text>
                <rect x="16" y={y} width={14 + index * 3} height="5" fill="#60a5fa" />
                <rect x="16" y={y + 6} width={22 - index * 4} height="5" fill="#fb923c" />
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  if (type === 'time_trend') {
    return (
      <div className={cn(baseClass, 'bg-blue-50')} aria-hidden>
        <svg width="62" height="44" viewBox="0 0 62 44" fill="none">
          {[12, 22, 32].map((y) => <line key={y} x1="7" y1={y} x2="56" y2={y} stroke="#dbeafe" />)}
          <path d="M8 16 C20 15 28 22 38 24 C46 26 52 27 56 29" stroke="#3b82f6" strokeWidth="2" fill="none" />
          <path d="M8 32 C19 29 27 26 36 22 C45 18 51 16 56 13" stroke="#22c55e" strokeWidth="2" fill="none" />
          <line x1="7" y1="36" x2="57" y2="36" stroke="#94a3b8" />
        </svg>
      </div>
    )
  }

  if (type === 'notes') {
    return (
      <div className={cn(baseClass, 'bg-yellow-50')} aria-hidden>
        <svg width="58" height="44" viewBox="0 0 58 44">
          <text x="8" y="13" fontSize="10" fill="#64748b" fontWeight="700">ABC</text>
          {[20, 27, 34].map((y) => <line key={y} x1="8" y1={y} x2="42" y2={y} stroke="#cbd5e1" strokeWidth="2" />)}
          <line x1="42" y1="34" x2="52" y2="24" stroke="#f59e0b" strokeWidth="3" />
          <line x1="50" y1="22" x2="54" y2="26" stroke="#92400e" strokeWidth="2" />
        </svg>
      </div>
    )
  }

  if (type === 'single_question') {
    return (
      <div className={cn(baseClass, 'bg-blue-50')} aria-hidden>
        <svg width="66" height="48" viewBox="0 0 66 48">
          {[26, 16, 13, 26, 19].map((value, index) => {
            const y = 5 + index * 8
            return (
              <g key={`${value}-${index}`}>
                <rect x="6" y={y} width={value} height="5" rx="2" fill="#3b82f6" />
                <text x="58" y={y + 5} textAnchor="end" fontSize="7" fill="#64748b">{value}%</text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <div className={cn(baseClass, 'bg-green-50')} aria-hidden>
      <svg width="58" height="46" viewBox="0 0 58 46">
        <line x1="29" y1="6" x2="29" y2="40" stroke="#cbd5e1" strokeDasharray="3 3" />
        <line x1="8" y1="23" x2="50" y2="23" stroke="#cbd5e1" strokeDasharray="3 3" />
        <circle cx="18" cy="15" r="4" fill="#f87171" />
        <circle cx="39" cy="13" r="4" fill="#22c55e" />
        <circle cx="47" cy="20" r="3" fill="#4ade80" />
        <circle cx="19" cy="33" r="3" fill="#94a3b8" />
        <circle cx="41" cy="33" r="4" fill="#60a5fa" />
      </svg>
    </div>
  )
}

function WidgetCatalogCard({
  item,
  selected,
  onSelect,
}: {
  item: (typeof WIDGET_CATALOG)[number]
  selected: boolean
  onSelect: (type: WidgetType) => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-[80px] cursor-pointer gap-4 rounded-lg border p-4 text-left transition-all hover:border-blue-400 hover:shadow-sm',
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200',
      )}
      onClick={() => onSelect(item.type)}
    >
      <WidgetThumbnail type={item.type} />
      <div className="min-w-0 flex-1">
        <WuText size="sm" as="span" className="font-semibold text-gray-900">
          {item.title}
        </WuText>
        <WuText size="sm" as="span" className="mt-1 block text-gray-500">
          {item.description}
        </WuText>
      </div>
    </button>
  )
}

function getSurveyOptions(surveys: LifecycleSurvey[]): SelectOption[] {
  return surveys.map((survey) => ({
    value: survey.id,
    label: survey.title,
  }))
}

function getSelectedSurvey(surveys: LifecycleSurvey[], surveyId: string): LifecycleSurvey {
  return surveys.find((survey) => survey.id === surveyId) ?? surveys[0]
}

function getMarkerOptions(survey?: LifecycleSurvey): SelectOption[] {
  return (survey?.markers ?? []).map((marker) => ({
    value: marker.id,
    label: marker.name,
  }))
}

function getDefaultWidth(type: WidgetType): DashboardWidget['width'] {
  return DEFAULT_FULL_WIDTH_TYPES.includes(type) ? 'full' : 'half'
}

function widgetNeedsQuestions(type: WidgetType | null): boolean {
  return Boolean(type && !NO_QUESTION_WIDGETS.includes(type))
}

function widgetHasAnalyticsType(type: WidgetType | null): boolean {
  return Boolean(type && ANALYTICS_TYPE_WIDGETS.includes(type))
}

function getWidgetDisplayName(type: WidgetType): string {
  return WIDGET_CATALOG.find((item) => item.type === type)?.title ?? type
}

function getQuestionLabel(question: Question): string {
  return question.text
}

function FieldRow({
  label,
  children,
  helper,
}: {
  label: string
  children: ReactNode
  helper?: string
}) {
  return (
    <div className="flex items-start gap-4">
      <label className="w-32 flex-shrink-0 pt-2 text-sm text-gray-600">{label}</label>
      <div className="min-w-0 flex-1">
        {children}
        {helper && (
          <WuText size="sm" as="p" className="mt-1 text-gray-400">
            {helper}
          </WuText>
        )}
      </div>
    </div>
  )
}

function getDefaultSurvey(surveys: LifecycleSurvey[]): LifecycleSurvey | undefined {
  return surveys[0]
}

export function AddWidgetModal({
  open,
  onOpenChange,
  currentLayout,
  tabWidgets,
  onWidgetAdd,
}: AddWidgetModalProps) {
  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null)
  const [analyticsType, setAnalyticsType] = useState<'mean' | 'favorability'>('mean')
  const [widgetName, setWidgetName] = useState('')
  const [widgetDescription, setWidgetDescription] = useState('')
  const [surveySearch, setSurveySearch] = useState('')
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('')
  const [selectedDeployment, setSelectedDeployment] = useState<string>(MOCK_DEPLOYMENTS[0].value)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [widgetConfig, setWidgetConfig] = useState<Record<string, unknown>>({})
  const [widgetSize, setWidgetSize] = useState<DashboardWidget['width']>('half')
  const [summarySettings, setSummarySettings] =
    useState<SummaryAdminSettingsFieldValues>(DEFAULT_SUMMARY_SETTINGS)
  void currentLayout

  const isSummaryFlow = selectedType === 'summary'
  const flowSteps = isSummaryFlow ? SUMMARY_STEPS : WIDGET_STEPS
  const maxStep = flowSteps.length - 1
  const dataWidgetsOnTab = getDataWidgets(tabWidgets)

  const catalogItems = WIDGET_CATALOG.filter((item) => item.type !== 'summary')
  const summaryItem = WIDGET_CATALOG.find((item) => item.type === 'summary')
  const surveys = useMemo(() => getSurveys(), [])
  const selectedSurvey = getSelectedSurvey(surveys, selectedSurveyId)
  const surveyOptions = getSurveyOptions(surveys)
  const filteredSurveys = useMemo(
    () =>
      surveys.filter((survey) =>
        survey.title.toLowerCase().includes(surveySearch.trim().toLowerCase()),
      ),
    [surveys, surveySearch],
  )
  const markerOptions = getMarkerOptions(selectedSurvey)
  const selectedQuestionObjects = selectedSurvey?.questions.filter((question) =>
    selectedQuestions.includes(question.id),
  ) ?? []
  const needsQuestions = widgetNeedsQuestions(selectedType)
  const standardSourceValid =
    Boolean(selectedSurveyId) && (!needsQuestions || selectedQuestions.length > 0)
  const canContinue =
    (step === 0 && Boolean(selectedType)) ||
    (isSummaryFlow && step === 1) ||
    (isSummaryFlow && step === 2 && widgetName.trim().length > 0) ||
    (isSummaryFlow && step === 3 && dataWidgetsOnTab.length > 0) ||
    (!isSummaryFlow && step === 1 && widgetName.trim().length > 0) ||
    (!isSummaryFlow && step === 2 && standardSourceValid) ||
    (!isSummaryFlow && step === 3 && standardSourceValid && widgetName.trim().length > 0)

  const resetModalState = useCallback(() => {
    const defaultSurvey = getDefaultSurvey(surveys)
    setStep(0)
    setSelectedType(null)
    setAnalyticsType('mean')
    setWidgetName('')
    setWidgetDescription('')
    setSurveySearch('')
    setSelectedSurveyId(defaultSurvey?.id ?? '')
    setSelectedDeployment(MOCK_DEPLOYMENTS[0].value)
    setSelectedQuestions([])
    setWidgetConfig({})
    setWidgetSize('half')
    setSummarySettings(DEFAULT_SUMMARY_SETTINGS)
  }, [surveys])

  useEffect(() => {
    if (open) resetModalState()
  }, [open, resetModalState])

  function handleModalOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetModalState()
    onOpenChange(nextOpen)
  }

  function handleSelect(type: WidgetType) {
    setSelectedType(type)
    setAnalyticsType('mean')
    setWidgetName(type === 'summary' ? 'Summary & Recommendations' : getWidgetDisplayName(type))
    setWidgetDescription('')
    setSelectedQuestions([])
    setWidgetConfig({})
    setWidgetSize(getDefaultWidth(type))
    setSummarySettings(DEFAULT_SUMMARY_SETTINGS)
  }

  function handleCreate() {
    if (!selectedType) return

    if (selectedType === 'summary') {
      onWidgetAdd({
        type: 'summary',
        title: widgetName.trim() || 'Summary & Recommendations',
        description: widgetDescription,
        width: 'full',
        summaryConfig: buildSummaryAdminConfigFromFields(summarySettings, getCurrentUser().id, {
          isGenerating: true,
        }),
      })
      handleModalOpenChange(false)
      return
    }

    if (!selectedSurvey) return
    onWidgetAdd({
      type: selectedType,
      title: widgetName.trim() || getWidgetDisplayName(selectedType),
      description: widgetDescription,
      surveyId: selectedSurveyId,
      width: widgetSize,
      config: {
        analyticsType,
        description: widgetDescription,
        surveyId: selectedSurveyId,
        deployment: selectedDeployment,
        questions: selectedQuestions,
        ...widgetConfig,
      },
    })
    handleModalOpenChange(false)
  }

  function updateWidgetConfig(key: string, value: unknown) {
    setWidgetConfig((current) => ({ ...current, [key]: value }))
  }

  function toggleQuestion(questionId: string) {
    setSelectedQuestions((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    )
  }

  function toggleAllQuestions(checked: boolean) {
    setSelectedQuestions(checked ? selectedSurvey?.questions.map((question) => question.id) ?? [] : [])
  }

  function handleSurveySelect(surveyId: string) {
    setSelectedSurveyId(surveyId)
    setSelectedDeployment(MOCK_DEPLOYMENTS[0].value)
    setSelectedQuestions([])
    setWidgetConfig({})
  }

  function getConfigOption(key: string, options: SelectOption[], fallback: SelectOption): SelectOption {
    const value = widgetConfig[key]
    return options.find((option) => option.value === value) ?? fallback
  }

  function renderSelectedQuestionsText(questions: Question[]) {
    if (questions.length === 0) return 'No questions selected'
    return questions.map((question) => question.text).join(', ')
  }

  function renderColumnsSet() {
    if (!selectedType) return null

    if (selectedType === 'scorecard' || selectedType === 'heatmap') {
      return (
        <>
          <FieldRow label="Group by">
            <WuSelect
              data={GROUP_BY_OPTIONS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={getConfigOption('groupBy', GROUP_BY_OPTIONS, GROUP_BY_OPTIONS[2])}
              onSelect={(value) => updateWidgetConfig('groupBy', (value as SelectOption).value)}
              variant="outlined"
            />
          </FieldRow>
          <FieldRow label="Show comparison">
            <WuToggle
              checked={(widgetConfig.showComparison as boolean | undefined) ?? true}
              onChange={(checked) => updateWidgetConfig('showComparison', checked)}
              Label="Show comparison column"
            />
          </FieldRow>
          <FieldRow label="Min respondents" helper="Minimum respondents to show data">
            <WuInput
              type="number"
              value={String((widgetConfig.minRespondents as number | undefined) ?? 5)}
              onChange={(event) => updateWidgetConfig('minRespondents', Number(event.target.value))}
            />
          </FieldRow>
        </>
      )
    }

    if (selectedType === 'enps') {
      return (
        <>
          <FieldRow label="Show segment breakdown">
            <WuToggle
              checked={(widgetConfig.showSegmentBreakdown as boolean | undefined) ?? true}
              onChange={(checked) => updateWidgetConfig('showSegmentBreakdown', checked)}
            />
          </FieldRow>
          <FieldRow label="Comparison survey">
            <WuSelect
              data={surveyOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={surveyOptions.find((survey) => survey.value === widgetConfig.comparisonSurveyId)}
              onSelect={(value) => updateWidgetConfig('comparisonSurveyId', (value as SelectOption).value)}
              variant="outlined"
              placeholder="Select for comparison (optional)"
            />
          </FieldRow>
        </>
      )
    }

    if (selectedType === 'time_trend') {
      const selectedMetrics = (widgetConfig.metrics as string[] | undefined) ?? ['overall']
      const toggleMetric = (metricId: string) => {
        const next = selectedMetrics.includes(metricId)
          ? selectedMetrics.filter((id) => id !== metricId)
          : [...selectedMetrics, metricId]
        updateWidgetConfig('metrics', next)
      }

      return (
        <FieldRow label="Metrics to show">
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <WuCheckbox checked={selectedMetrics.includes('overall')} onChange={() => toggleMetric('overall')} />
              <WuText size="sm" as="span" className="text-gray-700">
                Overall
              </WuText>
            </label>
            {markerOptions.map((marker) => (
              <label key={marker.value} className="flex items-center gap-3">
                <WuCheckbox checked={selectedMetrics.includes(marker.value)} onChange={() => toggleMetric(marker.value)} />
                <WuText size="sm" as="span" className="text-gray-700">
                  {marker.label}
                </WuText>
              </label>
            ))}
          </div>
        </FieldRow>
      )
    }

    if (selectedType === 'driver_analysis') {
      return (
        <FieldRow label="Primary outcome">
          <WuSelect
            data={markerOptions}
            accessorKey={{ value: 'value', label: 'label' }}
              value={getConfigOption('primaryOutcome', markerOptions, markerOptions[0] ?? NO_MARKERS_OPTION)}
            onSelect={(value) => updateWidgetConfig('primaryOutcome', (value as SelectOption).value)}
            variant="outlined"
          />
        </FieldRow>
      )
    }

    if (selectedType === 'response_rate') {
      return (
        <FieldRow label="Group by">
          <WuSelect
            data={RESPONSE_RATE_GROUP_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={getConfigOption('groupBy', RESPONSE_RATE_GROUP_OPTIONS, RESPONSE_RATE_GROUP_OPTIONS[1])}
            onSelect={(value) => updateWidgetConfig('groupBy', (value as SelectOption).value)}
            variant="outlined"
          />
        </FieldRow>
      )
    }

    if (selectedType === 'single_question') {
      return (
        <FieldRow label="Selected question">
          <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {selectedQuestionObjects.length > 1
              ? renderSelectedQuestionsText(selectedQuestionObjects)
              : selectedQuestionObjects[0]?.text ?? 'No question selected'}
          </div>
        </FieldRow>
      )
    }

    if (selectedType === 'survey_comparison') {
      return (
        <FieldRow label="Compare with">
          <WuSelect
            data={surveyOptions.filter((survey) => survey.value !== selectedSurveyId)}
            accessorKey={{ value: 'value', label: 'label' }}
            value={surveyOptions.find((survey) => survey.value === widgetConfig.compareWithSurveyId)}
            onSelect={(value) => updateWidgetConfig('compareWithSurveyId', (value as SelectOption).value)}
            variant="outlined"
            placeholder="Select survey to compare"
          />
        </FieldRow>
      )
    }

    if (selectedType === 'text_analysis' || selectedType === 'text_report') {
      const openTextQuestions = selectedQuestionObjects.filter((question) => question.type === 'open_text')
      return (
        <>
          <FieldRow label="Questions to analyse">
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {renderSelectedQuestionsText(openTextQuestions.length > 0 ? openTextQuestions : selectedQuestionObjects)}
            </div>
          </FieldRow>
          {selectedType === 'text_analysis' && (
            <FieldRow label="Show sentiment">
              <WuToggle
                checked={(widgetConfig.showSentiment as boolean | undefined) ?? true}
                onChange={(checked) => updateWidgetConfig('showSentiment', checked)}
              />
            </FieldRow>
          )}
        </>
      )
    }

    if (selectedType === 'notes') {
      return (
        <FieldRow label="Note content">
          <WuTextarea
            rows={4}
            value={(widgetConfig.noteContent as string | undefined) ?? ''}
            placeholder="Add your note here..."
            onChange={(event) => updateWidgetConfig('noteContent', event.target.value)}
          />
        </FieldRow>
      )
    }

    return (
      <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
        No additional settings required for this widget type.
      </div>
    )
  }

  function renderStepContent() {
    if (step === 0) {
      return (
        <>
          <WuHeading size="sm" className="mb-4">
            Select a widget type
          </WuHeading>
          <div className="grid max-h-[420px] grid-cols-2 gap-4 overflow-y-auto pr-1">
            {summaryItem && (
              <WidgetCatalogCard item={summaryItem} selected={selectedType === 'summary'} onSelect={handleSelect} />
            )}
            {catalogItems.map((item) => (
              <WidgetCatalogCard key={item.type} item={item} selected={selectedType === item.type} onSelect={handleSelect} />
            ))}
          </div>
        </>
      )
    }

    if (step === 1) {
      if (isSummaryFlow) {
        if (!isAdminContext()) {
          return (
            <WuText size="sm" as="p" className="text-sm text-gray-600">
              Organization context is available to HR admins when creating summary widgets.
            </WuText>
          )
        }

        return (
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <SummaryOrgContextPanel />
          </div>
        )
      }

      return (
        <div className="space-y-5">
          {widgetHasAnalyticsType(selectedType) && (
            <>
              <FieldRow label="Analytics">
                <WuRadioGroup
                  options={ANALYTICS_TYPE_OPTIONS}
                  defaultValue={analyticsType}
                  onChange={(value) => setAnalyticsType(value as 'mean' | 'favorability')}
                />
              </FieldRow>
              <div className="border-b border-gray-100" />
            </>
          )}
          <FieldRow label="Name">
            <div className="space-y-1">
              <WuInput
                value={widgetName}
                placeholder="Enter name"
                maxLength={100}
                onChange={(event) => setWidgetName(event.target.value.slice(0, 100))}
              />
              <div className="text-right text-xs text-gray-400">{widgetName.length}/100</div>
            </div>
          </FieldRow>
          <FieldRow label="Description">
            <WuTextarea
              rows={4}
              value={widgetDescription}
              placeholder="Optional description"
              onChange={(event) => setWidgetDescription(event.target.value)}
            />
          </FieldRow>
        </div>
      )
    }

    if (step === 2) {
      if (isSummaryFlow) {
        return (
          <div className="space-y-5">
            <FieldRow label="Name">
              <div className="space-y-1">
                <WuInput
                  value={widgetName}
                  placeholder="Enter name"
                  maxLength={100}
                  onChange={(event) => setWidgetName(event.target.value.slice(0, 100))}
                />
                <div className="text-right text-xs text-gray-400">{widgetName.length}/100</div>
              </div>
            </FieldRow>
            <FieldRow label="Description">
              <WuTextarea
                rows={4}
                value={widgetDescription}
                placeholder="Describe what this summary covers..."
                onChange={(event) => setWidgetDescription(event.target.value)}
              />
            </FieldRow>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
              <div className="flex items-start gap-2">
                <span className="text-purple-500" aria-hidden>
                  ✦
                </span>
                <div>
                  <WuText size="sm" as="p" className="text-purple-700">
                    This widget generates an AI-powered summary of all data currently on this dashboard
                    tab, combined with your organization&apos;s context settings.
                  </WuText>
                </div>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className="grid min-h-[390px] grid-cols-[35%_65%] gap-4">
          <div className="rounded border border-gray-100 bg-white p-3">
            <WuText size="sm" as="p" className="mb-2 font-medium text-gray-700">
              Select a survey
            </WuText>
            <WuInput
              value={surveySearch}
              placeholder="Search for survey"
              onChange={(event) => setSurveySearch(event.target.value)}
            />
            <div className="mt-3 max-h-[320px] overflow-y-auto">
              {filteredSurveys.map((survey) => {
                const isSelected = survey.id === selectedSurveyId
                return (
                  <button
                    key={survey.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors',
                      isSelected ? 'bg-blue-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50',
                    )}
                    onClick={() => handleSurveySelect(survey.id)}
                  >
                    <span aria-hidden className="text-xs">
                      ≡
                    </span>
                    <span className="truncate">{survey.title}</span>
                  </button>
                )
              })}
              {filteredSurveys.length === 0 && (
                <WuText size="sm" as="p" className="px-3 py-4 text-gray-500">
                  No surveys found
                </WuText>
              )}
            </div>
          </div>

          <div className="rounded border border-gray-100 bg-white p-4">
            <FieldRow label="Deployment">
              <WuSelect
                data={MOCK_DEPLOYMENTS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={MOCK_DEPLOYMENTS.find((deployment) => deployment.value === selectedDeployment)}
                onSelect={(value) => setSelectedDeployment((value as SelectOption).value)}
                variant="outlined"
              />
            </FieldRow>
            <div className="my-3 border-b border-gray-100" />
            {!needsQuestions ? (
              <WuText size="sm" as="p" className="text-gray-500 italic">
                This widget uses all available data from the selected survey.
              </WuText>
            ) : (
              <div className="max-h-[280px] overflow-y-auto">
                <div className="sticky top-0 z-10 flex items-center gap-3 bg-white py-2">
                  <WuCheckbox
                    checked={Boolean(selectedSurvey?.questions.length) && selectedQuestions.length === selectedSurvey?.questions.length}
                    partial={Boolean(selectedQuestions.length && selectedQuestions.length !== selectedSurvey?.questions.length)}
                    onChange={toggleAllQuestions}
                  />
                  <WuText size="sm" as="span" className="font-medium text-gray-700">
                    Questions
                  </WuText>
                </div>
                {selectedSurvey?.questions.length ? (
                  selectedSurvey.questions.map((question) => (
                    <button
                      key={question.id}
                      type="button"
                      className="flex w-full items-start gap-3 px-1 py-2 text-left hover:bg-gray-50"
                      onClick={() => toggleQuestion(question.id)}
                    >
                      <WuCheckbox
                        checked={selectedQuestions.includes(question.id)}
                        onChange={() => undefined}
                      />
                      <WuText size="sm" as="span" className="text-gray-700">
                        {getQuestionLabel(question)}
                      </WuText>
                    </button>
                  ))
                ) : (
                  <WuText size="sm" as="p" className="py-4 text-gray-500">
                    No questions available
                  </WuText>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (step === 3) {
      if (isSummaryFlow) {
        return (
          <SummaryAdminSettingsFields
            values={summarySettings}
            onChange={(patch) => setSummarySettings((current) => ({ ...current, ...patch }))}
            dataWidgets={dataWidgetsOnTab}
            showDataCheck
          />
        )
      }

      return (
      <div className="space-y-5">
        {renderColumnsSet()}
        <div className="border-t border-gray-100 pt-5">
          <FieldRow label="Widget size">
            <div className="flex gap-2">
              {(['half', 'full'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  className={cn(
                    'rounded border px-4 py-2 text-sm font-medium',
                    widgetSize === size
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                  )}
                  onClick={() => setWidgetSize(size)}
                >
                  {size === 'half' ? 'Half width' : 'Full width'}
                </button>
              ))}
            </div>
          </FieldRow>
        </div>
      </div>
      )
    }

    return null
  }

  return (
    <WuModal open={open} onOpenChange={handleModalOpenChange} size={isSummaryFlow && step === 1 ? 'xl' : 'lg'}>
      <WuModalHeader>
        <span className="flex items-center gap-2">
          {selectedType ? getWidgetDisplayName(selectedType) : 'Add widget'}
          <button type="button" className="text-gray-400" aria-label="Help">
            ?
          </button>
        </span>
      </WuModalHeader>
      <WuModalContent {...preventModalDismiss}>{renderStepContent()}</WuModalContent>
      <WuModalFooter>
        <div className="flex w-full items-center justify-between gap-4">
          <WidgetStepIndicator currentStep={step} steps={flowSteps} />
          <div className="flex items-center gap-3">
            {step === 0 ? (
              <WuButton variant="secondary" onClick={() => handleModalOpenChange(false)}>
                Cancel
              </WuButton>
            ) : (
              <WuButton variant="secondary" onClick={() => setStep((current) => Math.max(current - 1, 0))}>
                Back
              </WuButton>
            )}
            {step < maxStep ? (
              <WuButton
                variant="primary"
                disabled={!canContinue}
                onClick={() => setStep((current) => Math.min(current + 1, maxStep))}
              >
                Next
              </WuButton>
            ) : (
              <WuButton variant="primary" disabled={!canContinue} onClick={handleCreate}>
                Create Widget
              </WuButton>
            )}
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
