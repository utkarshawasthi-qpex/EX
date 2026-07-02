import type { Layout } from 'react-grid-layout/legacy'

export const WIDGET_GRID_ROW_HEIGHT = 60
export const WIDGET_GRID_MARGIN_Y = 16
export const WIDGET_GRID_MIN_H = 5
export const WIDGET_GRID_MIN_W = 5
export const WIDGET_GRID_MAX_W = 12

/** Grid row count needed to fit content at the given pixel height. */
export function pixelsToGridRows(contentPx: number): number {
  const rows = Math.ceil(
    (contentPx + WIDGET_GRID_MARGIN_Y) /
      (WIDGET_GRID_ROW_HEIGHT + WIDGET_GRID_MARGIN_Y),
  )
  return Math.max(WIDGET_GRID_MIN_H, rows)
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
): Layout {
  return layout.map((item) => {
    const measuredMaxH = getWidgetMaxGridRows(item.i, contentHeights)
    const maxH = measuredMaxH ?? item.h
    const minH = WIDGET_GRID_MIN_H
    const nextH = Math.min(Math.max(item.h, minH), maxH)

    return {
      ...item,
      minW: WIDGET_GRID_MIN_W,
      maxW: WIDGET_GRID_MAX_W,
      minH,
      h: nextH,
      maxH,
    }
  })
}

export function withDefaultGridConstraints(item: Layout[number]): Layout[number] {
  return {
    ...item,
    minW: WIDGET_GRID_MIN_W,
    maxW: WIDGET_GRID_MAX_W,
    minH: WIDGET_GRID_MIN_H,
    maxH: undefined,
  }
}
