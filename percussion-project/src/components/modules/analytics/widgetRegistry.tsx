'use client'

import type { ComponentType } from 'react'
import type { DashboardWidget, ViewerCapabilities, WidgetType } from '@/types'
import { DriverAnalysisWidget } from '@/components/modules/analytics/widgets/DriverAnalysisWidget'
import { ENPSWidget } from '@/components/modules/analytics/widgets/ENPSWidget'
import { HeatmapWidget } from '@/components/modules/analytics/widgets/HeatmapWidget'
import { NotesWidget } from '@/components/modules/analytics/widgets/NotesWidget'
import { ResponseRateWidget } from '@/components/modules/analytics/widgets/ResponseRateWidget'
import { ScorecardWidget } from '@/components/modules/analytics/widgets/ScorecardWidget'
import { SingleQuestionWidget } from '@/components/modules/analytics/widgets/SingleQuestionWidget'
import { SummaryWidget } from '@/components/modules/analytics/widgets/SummaryWidget'
import { SurveyComparisonWidget } from '@/components/modules/analytics/widgets/SurveyComparisonWidget'
import { TextAnalysisWidget } from '@/components/modules/analytics/widgets/TextAnalysisWidget'
import { TextReportWidget } from '@/components/modules/analytics/widgets/TextReportWidget'
import { TimeTrendWidget } from '@/components/modules/analytics/widgets/TimeTrendWidget'

export type WidgetCatalogItem = {
  type: WidgetType
  title: string
  description: string
  defaultWidth: 'full' | 'half'
  thumbnailClass: string
  isAiPowered?: boolean
  thumbnailGradient?: boolean
}

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'summary',
    title: 'Summary & Recommendations',
    description:
      'AI-powered summary with What, Why, and recommended actions — personalized per viewer.',
    defaultWidth: 'full',
    thumbnailClass: 'bg-gradient-to-br from-purple-500 to-blue-500',
    isAiPowered: true,
    thumbnailGradient: true,
  },
  {
    type: 'response_rate',
    title: 'Response rate',
    description: 'Get real-time insights into response rates for your surveys',
    defaultWidth: 'half',
    thumbnailClass: 'bg-blue-100',
  },
  {
    type: 'scorecard',
    title: 'Scorecard',
    description: 'Effective way to view survey results at a glance',
    defaultWidth: 'full',
    thumbnailClass: 'bg-indigo-100',
  },
  {
    type: 'enps',
    title: 'eNPS',
    description: 'Measure employee satisfaction and loyalty',
    defaultWidth: 'half',
    thumbnailClass: 'bg-green-100',
  },
  {
    type: 'heatmap',
    title: 'Heatmap',
    description: 'Visualize survey responses to spot trends',
    defaultWidth: 'half',
    thumbnailClass: 'bg-yellow-100',
  },
  {
    type: 'text_analysis',
    title: 'Text analysis',
    description: 'Use AI to classify open ended questions',
    defaultWidth: 'half',
    thumbnailClass: 'bg-purple-100',
  },
  {
    type: 'text_report',
    title: 'Text report',
    description: 'Analyze and categorize open-ended responses',
    defaultWidth: 'half',
    thumbnailClass: 'bg-pink-100',
  },
  {
    type: 'survey_comparison',
    title: 'Survey comparison',
    description: 'Visual side-by-side analysis of survey data',
    defaultWidth: 'half',
    thumbnailClass: 'bg-orange-100',
  },
  {
    type: 'time_trend',
    title: 'Time trend',
    description: 'Monitor changes in employee feedback over time',
    defaultWidth: 'half',
    thumbnailClass: 'bg-cyan-100',
  },
  {
    type: 'notes',
    title: 'Notes',
    description: 'Add notes to your dashboard',
    defaultWidth: 'half',
    thumbnailClass: 'bg-gray-100',
  },
  {
    type: 'single_question',
    title: 'Single question',
    description: 'Capture employee insights instantly',
    defaultWidth: 'half',
    thumbnailClass: 'bg-teal-100',
  },
  {
    type: 'driver_analysis',
    title: 'Driver analysis',
    description: 'Understand key drivers of engagement',
    defaultWidth: 'full',
    thumbnailClass: 'bg-red-100',
  },
]

export type WidgetComponentProps = {
  widget?: DashboardWidget
  onUpdate?: (widget: DashboardWidget) => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  activeFilters?: string[]
  dashboardWidgets?: DashboardWidget[]
  capabilities?: ViewerCapabilities
}

const WIDGET_COMPONENTS: Record<WidgetType, ComponentType<WidgetComponentProps>> = {
  summary: SummaryWidget,
  scorecard: ScorecardWidget,
  enps: ENPSWidget,
  heatmap: HeatmapWidget,
  response_rate: ResponseRateWidget,
  time_trend: TimeTrendWidget,
  single_question: SingleQuestionWidget,
  driver_analysis: DriverAnalysisWidget,
  survey_comparison: SurveyComparisonWidget,
  text_analysis: TextAnalysisWidget,
  text_report: TextReportWidget,
  notes: NotesWidget,
}

export function DashboardWidgetRenderer({
  widget,
  onUpdate,
  onEdit,
  onDuplicate,
  onDelete,
  activeFilters = [],
  dashboardWidgets = [],
  capabilities,
}: {
  widget: DashboardWidget
  onUpdate?: (widget: DashboardWidget) => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  activeFilters?: string[]
  dashboardWidgets?: DashboardWidget[]
  capabilities?: ViewerCapabilities
}) {
  const Component = WIDGET_COMPONENTS[widget.type]
  if (!Component) return null
  return (
    <Component
      widget={widget}
      onUpdate={onUpdate}
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      activeFilters={activeFilters}
      dashboardWidgets={dashboardWidgets.filter((item) => item.id !== widget.id)}
      capabilities={capabilities}
    />
  )
}

export function groupWidgetsIntoRows(widgets: DashboardWidget[]): DashboardWidget[][] {
  const sorted = [...widgets].sort((a, b) => a.order - b.order)
  const rows: DashboardWidget[][] = []
  let halfBuffer: DashboardWidget[] = []

  for (const widget of sorted) {
    if (widget.width === 'full') {
      if (halfBuffer.length > 0) {
        rows.push(halfBuffer)
        halfBuffer = []
      }
      rows.push([widget])
    } else {
      halfBuffer.push(widget)
      if (halfBuffer.length === 2) {
        rows.push(halfBuffer)
        halfBuffer = []
      }
    }
  }

  if (halfBuffer.length > 0) rows.push(halfBuffer)
  return rows
}

export function getDefaultWidgetTitle(type: WidgetType) {
  return WIDGET_CATALOG.find((item) => item.type === type)?.title ?? type
}

export function getDefaultWidgetWidth(type: WidgetType): 'full' | 'half' {
  if (type === 'summary') return 'full'
  return WIDGET_CATALOG.find((item) => item.type === type)?.defaultWidth ?? 'half'
}

const CHART_WIDGET_TYPES: WidgetType[] = [
  'time_trend',
  'driver_analysis',
  'enps',
  'heatmap',
  'summary',
]

export function getWidgetMinHeight(type: WidgetType): number {
  return CHART_WIDGET_TYPES.includes(type) ? 300 : 200
}
