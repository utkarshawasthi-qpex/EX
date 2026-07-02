'use client'

import { createContext, useContext } from 'react'
import type { ViewerCapabilities } from '@/types'

const DEFAULT_CAPABILITIES: ViewerCapabilities = {
  canEdit: true,
  canExport: true,
  canFilter: true,
  canAddWidgets: true,
  canDeleteWidgets: true,
  isOwner: true,
}

type DashboardWidgetContextValue = {
  capabilities: ViewerCapabilities
  onExportPpt?: () => void
  reportWidgetHeight?: (heightPx: number) => void
}

const DashboardWidgetContext = createContext<DashboardWidgetContextValue>({
  capabilities: DEFAULT_CAPABILITIES,
})

type DashboardWidgetProviderProps = {
  capabilities?: ViewerCapabilities
  onExportPpt?: () => void
  reportWidgetHeight?: (heightPx: number) => void
  children: React.ReactNode
}

export function DashboardWidgetProvider({
  capabilities,
  onExportPpt,
  reportWidgetHeight,
  children,
}: DashboardWidgetProviderProps) {
  const parent = useContext(DashboardWidgetContext)
  const value = {
    capabilities: capabilities ?? parent.capabilities,
    onExportPpt: onExportPpt ?? parent.onExportPpt,
    reportWidgetHeight: reportWidgetHeight ?? parent.reportWidgetHeight,
  }

  return (
    <DashboardWidgetContext.Provider value={value}>{children}</DashboardWidgetContext.Provider>
  )
}

export function useDashboardWidgetContext(): DashboardWidgetContextValue {
  return useContext(DashboardWidgetContext)
}
