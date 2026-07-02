'use client'

import { useEffect, type RefObject } from 'react'

type WidgetHeightParts = {
  headerRef?: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLElement | null>
  extraPx?: number
}

export function useReportWidgetHeight(
  reportHeight: ((heightPx: number) => void) | undefined,
  parts: WidgetHeightParts,
  deps: unknown[] = [],
) {
  useEffect(() => {
    if (!reportHeight) return

    const measure = () => {
      const headerPx = parts.headerRef?.current?.offsetHeight ?? 0
      const contentPx = parts.contentRef.current?.scrollHeight ?? 0
      const total = headerPx + contentPx + (parts.extraPx ?? 0)
      if (total > 0) {
        reportHeight(total)
      }
    }

    const observed = [parts.contentRef.current, parts.headerRef?.current].filter(Boolean) as Element[]
    if (observed.length === 0) return

    const observer = new ResizeObserver(measure)
    observed.forEach((element) => observer.observe(element))
    measure()

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportHeight, parts.contentRef, parts.headerRef, parts.extraPx, ...deps])
}
