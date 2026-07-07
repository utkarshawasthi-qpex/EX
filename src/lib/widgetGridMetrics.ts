import type { Layout } from 'react-grid-layout/legacy'
import type { WidgetType } from '@/types'

export const WIDGET_GRID_ROW_HEIGHT = 60
export const WIDGET_GRID_MARGIN_Y = 16
export const WIDGET_GRID_MIN_H = 5
export const WIDGET_GRID_MIN_W = 5
export const WIDGET_GRID_MAX_W = 12
/** Lowest row count when snapping measured content to the grid. */
export const WIDGET_GRID_ABSOLUTE_MIN_H = 3
export const SUMMARY_WIDGET_MIN_H = 10
export const SUMMARY_WIDGET_DEFAULT_H = 12

export function getMinGridRowsForWidgetType(type: WidgetType): number {
  return type === 'summary' ? SUMMARY_WIDGET_MIN_H : WIDGET_GRID_MIN_H
}

/** Grid row count needed to fit content at the given pixel height. */
export function pixelsToGridRows(contentPx: number): number {
  const rows = Math.ceil(
    (contentPx + WIDGET_GRID_MARGIN_Y) /
      (WIDGET_GRID_ROW_HEIGHT + WIDGET_GRID_MARGIN_Y),
  )
  return Math.max(WIDGET_GRID_ABSOLUTE_MIN_H, rows)
}

export function gridRowsToPixels(rows: number): number {
  return rows * WIDGET_GRID_ROW_HEIGHT + Math.max(0, rows - 1) * WIDGET_GRID_MARGIN_Y
}

export function getWidgetMaxGridRows(widgetId: string, contentHeights: Record<string, number>): number | undefined {
  const contentPx = contentHeights[widgetId]
  if (!contentPx) return undefined
  return pixelsToGridRows(contentPx)
}

export function applyWidgetHeightConstraints(
  layout: Layout,
  contentHeights: Record<string, number>,
  widgetTypesById: Record<string, WidgetType> = {},
): Layout {
  return layout.map((item) => {
    const widgetType = widgetTypesById[item.i]
    const typeMinH = widgetType ? getMinGridRowsForWidgetType(widgetType) : WIDGET_GRID_MIN_H
    const measuredRows = getWidgetMaxGridRows(item.i, contentHeights)

    if (measuredRows !== undefined) {
      return {
        ...item,
        minW: WIDGET_GRID_MIN_W,
        maxW: WIDGET_GRID_MAX_W,
        minH: measuredRows,
        maxH: measuredRows,
        h: measuredRows,
      }
    }

    return {
      ...item,
      minW: WIDGET_GRID_MIN_W,
      maxW: WIDGET_GRID_MAX_W,
      minH: typeMinH,
      h: Math.max(item.h, typeMinH),
      maxH: undefined,
    }
  })
}

export function withDefaultGridConstraints(
  item: Layout[number],
  options?: { minH?: number },
): Layout[number] {
  return {
    ...item,
    minW: WIDGET_GRID_MIN_W,
    maxW: WIDGET_GRID_MAX_W,
    minH: options?.minH ?? WIDGET_GRID_MIN_H,
    maxH: undefined,
  }
}

