import type { Layout } from 'react-grid-layout/legacy'
import type { DashboardWidget, WidgetType } from '@/types'
import { withDefaultGridConstraints } from '@/lib/widgetGridMetrics'

export type LayoutItem = {
  x: number
  y: number
  w: number
  h: number
}

export const defaultWidgetLayout: Record<WidgetType, LayoutItem> = {
  scorecard: { x: 0, y: 0, w: 12, h: 7 },
  response_rate: { x: 0, y: 7, w: 6, h: 6 },
  time_trend: { x: 6, y: 7, w: 6, h: 6 },
  enps: { x: 0, y: 13, w: 6, h: 7 },
  heatmap: { x: 6, y: 13, w: 6, h: 7 },
  single_question: { x: 0, y: 20, w: 6, h: 6 },
  survey_comparison: { x: 6, y: 20, w: 6, h: 6 },
  driver_analysis: { x: 0, y: 26, w: 12, h: 8 },
  text_analysis: { x: 0, y: 34, w: 6, h: 6 },
  text_report: { x: 6, y: 34, w: 6, h: 6 },
  notes: { x: 0, y: 40, w: 6, h: 5 },
  summary: { x: 0, y: 0, w: 12, h: 10 },
}

export function buildGridLayout(widgets: DashboardWidget[]): Layout {
  return widgets.map((widget) => {
    if (
      widget.layout &&
      widget.layout.w !== undefined &&
      widget.layout.h !== undefined &&
      widget.layout.w >= 5 &&
      widget.layout.h >= 5
    ) {
      return withDefaultGridConstraints({
        i: widget.id,
        x: widget.layout.x,
        y: widget.layout.y,
        w: widget.layout.w,
        h: widget.layout.h,
      })
    }

    const defaults = defaultWidgetLayout[widget.type] ?? { x: 0, y: 0, w: 6, h: 6 }
    return withDefaultGridConstraints({
      i: widget.id,
      x: defaults.x,
      y: defaults.y,
      w: defaults.w,
      h: defaults.h,
    })
  })
}

export function getMaxLayoutY(layout: Layout): number {
  if (layout.length === 0) return 0
  return Math.max(...layout.map((item) => item.y + item.h), 0)
}

/** Place a new layout item at y=0 and push existing items down. */
export function insertLayoutItemAtTop(layout: Layout, newItem: Layout[number]): Layout {
  const itemAtTop = { ...newItem, y: 0 }
  const shifted = layout.map((item) => ({ ...item, y: item.y + itemAtTop.h }))
  return [itemAtTop, ...shifted]
}

export function createLayoutItemForNewWidget(
  widget: DashboardWidget,
  existingLayout: Layout,
  options?: { insertAtTop?: boolean },
): Layout[number] {
  const defaults = defaultWidgetLayout[widget.type] ?? { x: 0, y: 0, w: 6, h: 6 }
  const maxY = existingLayout.length > 0 ? getMaxLayoutY(existingLayout) : 0
  const insertAtTop = options?.insertAtTop ?? widget.type === 'summary'

  return withDefaultGridConstraints({
    i: widget.id,
    x: 0,
    y: insertAtTop ? 0 : maxY,
    w: defaults.w,
    h: defaults.h,
  })
}

export function appendLayoutItem(
  layout: Layout,
  widget: DashboardWidget,
  options?: { insertAtTop?: boolean },
): Layout {
  const insertAtTop = options?.insertAtTop ?? widget.type === 'summary'
  const newItem = createLayoutItemForNewWidget(widget, layout, { insertAtTop })
  if (insertAtTop) {
    return insertLayoutItemAtTop(layout, newItem)
  }
  return [...layout, newItem]
}

export function createLayoutItemForWidget(
  widget: DashboardWidget,
  y: number,
): Layout[number] {
  const defaults = defaultWidgetLayout[widget.type]
  return withDefaultGridConstraints({
    i: widget.id,
    x: widget.layout?.x ?? defaults.x,
    y,
    w: widget.layout?.w ?? defaults.w,
    h: widget.layout?.h ?? defaults.h,
  })
}

export function syncLayoutWithWidgets(widgets: DashboardWidget[], savedLayout?: Layout): Layout {
  const savedById = new Map((savedLayout ?? []).map((item) => [item.i, item]))
  const maxY = getMaxLayoutY(savedLayout ?? [])

  return widgets.map((widget, index) => {
    const saved = savedById.get(widget.id)
    if (saved) {
      return withDefaultGridConstraints(saved)
    }

    const defaults = defaultWidgetLayout[widget.type]
    return withDefaultGridConstraints({
      i: widget.id,
      x: defaults.x,
      y: maxY + index,
      w: defaults.w,
      h: defaults.h,
    })
  })
}

export function layoutToWidgetLayouts(layout: Layout): Record<string, LayoutItem> {
  return Object.fromEntries(
    layout.map((item) => [item.i, { x: item.x, y: item.y, w: item.w, h: item.h }]),
  )
}

export function getDashboardTabLayoutStorageKey(dashboardId: string, tabId: string): string {
  return `pp_layout_${dashboardId}_${tabId}`
}

function isValidSavedLayout(parsed: unknown): parsed is Layout {
  if (!Array.isArray(parsed) || parsed.length === 0) return false
  const first = parsed[0] as Layout[number] | undefined
  return first?.w !== undefined && first?.h !== undefined
}

export function loadDashboardTabLayout(dashboardId: string, tabId: string): Layout | null {
  if (typeof window === 'undefined') return null

  const keys = [
    getDashboardTabLayoutStorageKey(dashboardId, tabId),
    `pp_dashboard_layout_${dashboardId}_${tabId}`,
  ]

  for (const key of keys) {
    try {
      const stored = window.localStorage.getItem(key)
      if (!stored) continue
      const parsed = JSON.parse(stored)
      if (isValidSavedLayout(parsed)) {
        return parsed
      }
    } catch {
      continue
    }
  }

  return null
}

export function saveDashboardTabLayout(
  dashboardId: string,
  tabId: string,
  layout: Layout,
): void {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    getDashboardTabLayoutStorageKey(dashboardId, tabId),
    JSON.stringify(layout),
  )
}

export function removeWidgetFromTabLayout(
  dashboardId: string,
  tabId: string,
  widgetId: string,
): void {
  const tabLayout = loadDashboardTabLayout(dashboardId, tabId)
  if (!tabLayout) return

  saveDashboardTabLayout(
    dashboardId,
    tabId,
    tabLayout.filter((item) => item.i !== widgetId),
  )
}
