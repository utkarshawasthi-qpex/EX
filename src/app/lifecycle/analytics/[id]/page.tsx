'use client'

import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Layout } from 'react-grid-layout/legacy'
import ReactGridLayout, { WidthProvider } from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { AddWidgetModal } from '@/components/modules/analytics/AddWidgetModal'
import type { AddWidgetConfig } from '@/components/modules/analytics/AddWidgetModal'
import { DashboardFilterPanel } from '@/components/modules/analytics/DashboardFilterPanel'
import { DashboardWidgetProvider } from '@/components/modules/analytics/DashboardWidgetContext'
import { ExportPptModal } from '@/components/modules/analytics/ExportPptModal'
import { DashboardWidgetRenderer } from '@/components/modules/analytics/widgetRegistry'
import { AuthChecking } from '@/components/shared/AuthChecking'
import {
  appendLayoutItem,
  buildGridLayout,
  defaultWidgetLayout,
  getMaxLayoutY,
  loadDashboardTabLayout,
  removeWidgetFromTabLayout,
  saveDashboardTabLayout,
  syncLayoutWithWidgets,
} from '@/lib/defaultWidgetLayouts'
import { applyWidgetHeightConstraints } from '@/lib/widgetGridMetrics'
import {
  getDashboardById,
  getDashboardTabs,
  getDashboardWidgets,
  saveDashboardTabs,
  saveDashboardWidgets,
} from '@/lib/mockDb'
import { seedDefaultDashboardsIfNeeded } from '@/lib/seedDashboards'
import { activeFiltersToLabels } from '@/lib/dashboardFilters'
import { getCurrentUser } from '@/lib/userContext'
import { cn } from '@/lib/utils'
import type { ActiveFilter, Dashboard, DashboardTab, DashboardWidget, FilterField, WidgetType } from '@/types'
import { getDashboardCapabilities } from '@/types'

const GridLayoutWithWidth = WidthProvider(ReactGridLayout)

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

function createEmptyTab(order: number): DashboardTab {
  return {
    id: `tab_${Date.now()}_${order}`,
    name: `Tab ${order}`,
    order,
    widgets: [],
  }
}

function canAccessDashboard(dashboard: Dashboard): boolean {
  const currentUser = getCurrentUser()
  if (currentUser.role === 'hr_admin' && !currentUser.isImpersonating) {
    return true
  }
  return dashboard.access === 'global'
}

function applyLayoutToWidgets(widgets: DashboardWidget[], layout: Layout): DashboardWidget[] {
  return widgets.map((widget) => {
    const item = layout.find((layoutItem) => layoutItem.i === widget.id)
    if (!item) return widget
    return {
      ...widget,
      layout: {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      },
    }
  })
}

export default function DashboardCanvasPage() {
  const router = useRouter()
  const params = useParams()
  const dashboardId = params.id as string
  const { showToast } = useWuShowToast()

  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [tabs, setTabs] = useState<DashboardTab[]>([])
  const [allTabWidgets, setAllTabWidgets] = useState<Record<string, DashboardWidget[]>>({})
  const [activeTabId, setActiveTabId] = useState('')
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [currentLayout, setCurrentLayout] = useState<Layout>([])
  const [layoutReady, setLayoutReady] = useState(false)
  const allTabWidgetsRef = useRef(allTabWidgets)
  allTabWidgetsRef.current = allTabWidgets
  const [openTabMenuId, setOpenTabMenuId] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [widgetContentHeights, setWidgetContentHeights] = useState<Record<string, number>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return

    seedDefaultDashboardsIfNeeded()

    const loaded = getDashboardById(dashboardId)
    if (!loaded || !canAccessDashboard(loaded)) {
      router.replace('/lifecycle/analytics/list')
      return
    }

    const storedTabs = getDashboardTabs(dashboardId)
    const widgetMap: Record<string, DashboardWidget[]> = {}
    storedTabs.forEach((tab) => {
      widgetMap[tab.id] = getDashboardWidgets(dashboardId, tab.id)
    })

    setDashboard(loaded)
    setTabs(storedTabs)
    setAllTabWidgets(widgetMap)
    setActiveTabId(storedTabs[0]?.id ?? '')
    setIsDashboardLoading(false)
  }, [dashboardId, router])

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]
  const widgets = allTabWidgets[activeTabId] ?? []

  const uniqueWidgets = useMemo(
    () => widgets.filter((widget, index, self) => index === self.findIndex((item) => item.id === widget.id)),
    [widgets],
  )

  const widgetTypesById = useMemo(
    () =>
      Object.fromEntries(uniqueWidgets.map((widget) => [widget.id, widget.type])) as Record<
        string,
        WidgetType
      >,
    [uniqueWidgets],
  )

  const capabilities = useMemo(
    () => (dashboard ? getDashboardCapabilities(dashboard, getCurrentUser()) : null),
    [dashboard],
  )

  const updateWidgets = useCallback(
    (tabId: string, newWidgets: DashboardWidget[]) => {
      setAllTabWidgets((current) => {
        const updated = { ...current, [tabId]: newWidgets }
        saveDashboardWidgets(dashboardId, updated)
        return updated
      })
    },
    [dashboardId],
  )

  const loadLayoutForTab = useCallback(
    (tabId: string) => {
      const tabWidgets = allTabWidgetsRef.current[tabId] ?? []
      const savedLayout = loadDashboardTabLayout(dashboardId, tabId)

      if (savedLayout) {
        return syncLayoutWithWidgets(tabWidgets, savedLayout)
      }

      return buildGridLayout(tabWidgets)
    },
    [dashboardId],
  )

  useLayoutEffect(() => {
    if (!activeTabId || isDashboardLoading) {
      setLayoutReady(false)
      return
    }

    setLayoutReady(false)
    setWidgetContentHeights({})
    setCurrentLayout(loadLayoutForTab(activeTabId))
    setLayoutReady(true)
  }, [activeTabId, isDashboardLoading, loadLayoutForTab])

  const constrainedLayout = useMemo(
    () => applyWidgetHeightConstraints(currentLayout, widgetContentHeights, widgetTypesById),
    [currentLayout, widgetContentHeights, widgetTypesById],
  )

  const uniqueLayout = useMemo(
    () =>
      constrainedLayout.filter(
        (item, index, self) => index === self.findIndex((candidate) => candidate.i === item.i),
      ),
    [constrainedLayout],
  )

  const registerWidgetContentHeight = useCallback((widgetId: string, heightPx: number) => {
    setWidgetContentHeights((current) => {
      if (current[widgetId] === heightPx) return current
      return { ...current, [widgetId]: heightPx }
    })
  }, [])

  useEffect(() => {
    if (!layoutReady || Object.keys(widgetContentHeights).length === 0) return

    setCurrentLayout((previous) => {
      const next = applyWidgetHeightConstraints(previous, widgetContentHeights, widgetTypesById)
      const layoutChanged = next.some(
        (item, index) =>
          item.minW !== previous[index]?.minW ||
          item.minH !== previous[index]?.minH ||
          item.maxH !== previous[index]?.maxH,
      )
      if (!layoutChanged) return previous
      return next
    })
  }, [layoutReady, widgetContentHeights, widgetTypesById])

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      setCurrentLayout(applyWidgetHeightConstraints(newLayout, widgetContentHeights, widgetTypesById))
    },
    [widgetContentHeights, widgetTypesById],
  )

  const commitLayoutStop = useCallback(
    (layout: Layout) => {
      if (!activeTabId) return

      const constrained = applyWidgetHeightConstraints(layout, widgetContentHeights, widgetTypesById)

      try {
        saveDashboardTabLayout(dashboardId, activeTabId, constrained)
      } catch (error) {
        console.error('Layout save failed:', error)
      }

      setCurrentLayout(constrained)
      const tabWidgets = allTabWidgetsRef.current[activeTabId] ?? []
      updateWidgets(activeTabId, applyLayoutToWidgets(tabWidgets, constrained))
    },
    [activeTabId, dashboardId, updateWidgets, widgetContentHeights, widgetTypesById],
  )

  const addWidgetToCurrentTab = useCallback(
    (newWidget: DashboardWidget, options?: { insertAtTop?: boolean }) => {
      if (!activeTabId) return

      const tabWidgets = allTabWidgetsRef.current[activeTabId] ?? []
      const insertAtTop = options?.insertAtTop ?? newWidget.type === 'summary'
      const updatedWidgets = insertAtTop
        ? [newWidget, ...tabWidgets]
        : [...tabWidgets, newWidget]
      updateWidgets(activeTabId, updatedWidgets)

      const updatedLayout = appendLayoutItem(currentLayout, newWidget, { insertAtTop })
      setCurrentLayout(updatedLayout)

      try {
        saveDashboardTabLayout(dashboardId, activeTabId, updatedLayout)
      } catch (error) {
        console.error('Layout save failed:', error)
      }
    },
    [activeTabId, currentLayout, dashboardId, updateWidgets],
  )

  const persistTabs = useCallback(
    (newTabs: DashboardTab[]) => {
      setTabs(newTabs)
      saveDashboardTabs(dashboardId, newTabs)
      setDashboard((current) => (current ? { ...current, tabs: newTabs } : current))
    },
    [dashboardId],
  )

  function addTab() {
    if (!dashboard) return
    const nextTab = createEmptyTab(tabs.length + 1)
    const newTabs = [...tabs, nextTab]
    persistTabs(newTabs)
    setAllTabWidgets((current) => {
      const updated = { ...current, [nextTab.id]: [] }
      saveDashboardWidgets(dashboardId, updated)
      return updated
    })
    setActiveTabId(nextTab.id)
  }

  function renameTab(tabId: string) {
    const nextName = window.prompt('Rename tab')
    if (!nextName?.trim()) return
    persistTabs(tabs.map((tab) => (tab.id === tabId ? { ...tab, name: nextName.trim() } : tab)))
    setOpenTabMenuId(null)
  }

  function duplicateTab(tabId: string) {
    if (!dashboard) return
    const tab = tabs.find((candidate) => candidate.id === tabId)
    if (!tab) return

    const duplicate: DashboardTab = {
      id: `tab_${Date.now()}`,
      name: `${tab.name} Copy`,
      order: tabs.length + 1,
      widgets: [],
    }
    const newTabs = [...tabs, duplicate]
    persistTabs(newTabs)

    const sourceWidgets = allTabWidgets[tabId] ?? []
    const copiedWidgets = sourceWidgets.map((widget, index) => ({
      ...widget,
      id: `widget_copy_${Date.now()}_${index}`,
      title: `${widget.title} (Copy)`,
    }))

    setAllTabWidgets((current) => {
      const updated = { ...current, [duplicate.id]: copiedWidgets }
      saveDashboardWidgets(dashboardId, updated)
      return updated
    })
    setActiveTabId(duplicate.id)
    setOpenTabMenuId(null)
  }

  function deleteTab(tabId: string) {
    const newTabs = tabs.filter((tab) => tab.id !== tabId)
    const nextTabs = newTabs.length > 0 ? newTabs : [createEmptyTab(1)]
    persistTabs(nextTabs)

    setAllTabWidgets((current) => {
      const updated = { ...current }
      delete updated[tabId]
      saveDashboardWidgets(dashboardId, updated)
      return updated
    })

    if (activeTabId === tabId) {
      setActiveTabId(nextTabs[0]?.id ?? '')
    }
    setOpenTabMenuId(null)
  }

  function toggleFilter(field: FilterField, value: string) {
    setActiveFilters((prev) => {
      const exists = prev.some((filter) => filter.fieldId === field.id && filter.value === value)
      if (exists) {
        return prev.filter((filter) => !(filter.fieldId === field.id && filter.value === value))
      }
      return [
        ...prev,
        {
          fieldId: field.id,
          fieldLabel: field.label,
          value,
        },
      ]
    })
  }

  function clearAllFilters() {
    setActiveFilters([])
  }

  function handleWidgetUpdate(updatedWidget: DashboardWidget) {
    if (!activeTabId) return
    updateWidgets(
      activeTabId,
      widgets.map((item) => (item.id === updatedWidget.id ? updatedWidget : item)),
    )
  }

  function handleWidgetAdd(config: AddWidgetConfig) {
    if (!dashboard || !activeTabId) return

    const widgetId = `widget_${Date.now()}`
    const defaults = defaultWidgetLayout[config.type] ?? { x: 0, y: 0, w: 6, h: 6 }
    const maxY = getMaxLayoutY(currentLayout)
    const isSummary = config.type === 'summary'
    const nextWidget: DashboardWidget = {
      id: widgetId,
      type: config.type,
      title: config.title,
      surveyId: config.surveyId,
      width: config.width,
      order: isSummary ? 1 : widgets.length + 1,
      config: config.config,
      summaryConfig: config.summaryConfig,
      layout: {
        x: 0,
        y: isSummary ? 0 : maxY,
        w: defaults.w,
        h: defaults.h,
      },
    }

    addWidgetToCurrentTab(nextWidget)
    showToast({
      variant: config.type === 'summary' ? 'info' : 'success',
      message:
        config.type === 'summary'
          ? 'Summary widget added — generating insights...'
          : 'Widget added to dashboard',
    })
  }

  function handleDuplicateWidget(widget: DashboardWidget) {
    if (!dashboard || !activeTabId) return

    const widgetId = `widget_copy_${Date.now()}`
    const sourceLayout = currentLayout.find((item) => item.i === widget.id)
    const y = sourceLayout ? sourceLayout.y + sourceLayout.h : getMaxLayoutY(currentLayout)
    const nextWidget: DashboardWidget = {
      ...widget,
      id: widgetId,
      title: `${widget.title} (Copy)`,
      order: widgets.length + 1,
      layout: {
        x: sourceLayout?.x ?? widget.layout?.x ?? defaultWidgetLayout[widget.type]?.x ?? 0,
        y,
        w: sourceLayout?.w ?? widget.layout?.w ?? defaultWidgetLayout[widget.type]?.w ?? 6,
        h: sourceLayout?.h ?? widget.layout?.h ?? defaultWidgetLayout[widget.type]?.h ?? 6,
      },
    }

    addWidgetToCurrentTab(nextWidget, { insertAtTop: false })
    showToast({ variant: 'success', message: 'Widget duplicated' })
  }

  function handleEditWidget(widget: DashboardWidget) {
    console.log('Edit widget', widget)
  }

  function handleDeleteWidget(widgetId: string) {
    if (!dashboard || !activeTabId) return

    updateWidgets(
      activeTabId,
      widgets.filter((widget) => widget.id !== widgetId),
    )

    const nextLayout = currentLayout.filter((item) => item.i !== widgetId)
    setCurrentLayout(nextLayout)
    saveDashboardTabLayout(dashboardId, activeTabId, nextLayout)
    removeWidgetFromTabLayout(dashboardId, activeTabId, widgetId)
    showToast({ variant: 'success', message: 'Widget removed' })
  }

  if (isDashboardLoading || !dashboard) {
    return <AuthChecking />
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <main className="flex min-h-0 flex-1 flex-col bg-white">
        <header className="z-20 shrink-0 border-b border-gray-200 bg-white px-6 pt-4 pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="cursor-pointer text-xl text-gray-400 transition-colors hover:text-gray-600"
                onClick={() => router.push('/lifecycle/analytics/list')}
                aria-label="Back to dashboards"
              >
                ←
              </button>
              <WuHeading size="xl" className="truncate text-gray-900">
                {dashboard.name}
              </WuHeading>
            </div>

            <div className="flex items-center gap-3">
              {capabilities?.canAddWidgets && (
                <button
                  type="button"
                  className="text-xl text-gray-400 hover:text-gray-600"
                  onClick={() => setIsAddWidgetOpen(true)}
                  aria-label="Add widget"
                >
                  +
                </button>
              )}
              <button
                type="button"
                className="wm-filter relative text-xl text-gray-400 hover:text-gray-600"
                onClick={() => setIsFilterOpen((open) => !open)}
                aria-label="Filters"
              >
                {activeFilters.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {activeFilters.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="wc-downloads text-xl text-gray-400 hover:text-gray-600"
                onClick={() => setExportModalOpen(true)}
                aria-label="Download"
              />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="wm-account-tree text-sm text-blue-600" aria-hidden />
            <button type="button" className="text-blue-600 hover:underline">
              <WuText size="sm" as="span">
                Hierarchy based rule
              </WuText>
            </button>
            <button
              type="button"
              className="flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white"
              aria-label="Hierarchy rule information"
            >
              ?
            </button>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-0 py-2">
              {activeFilters.map((filter) => (
                <span
                  key={`${filter.fieldId}-${filter.value}`}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
                >
                  <span className="font-medium">{filter.fieldLabel}:</span>
                  {filter.value}
                  <button
                    type="button"
                    onClick={() =>
                      toggleFilter(
                        { id: filter.fieldId, label: filter.fieldLabel, values: [] },
                        filter.value,
                      )
                    }
                    className="ml-1 text-blue-400 hover:text-blue-700"
                    aria-label={`Remove ${filter.fieldLabel} ${filter.value}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-gray-400 underline hover:text-gray-600"
              >
                Clear all
              </button>
            </div>
          )}

          <DashboardFilterPanel
            open={isFilterOpen}
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
            onClearAll={clearAllFilters}
            onClose={() => setIsFilterOpen(false)}
          />
        </header>

        {capabilities && !capabilities.isOwner && (
          <div className="shrink-0 border-b border-blue-100 bg-blue-50 px-4 py-1.5">
            <p className="text-xs text-blue-600">
              👁 You&apos;re viewing a shared dashboard — export and filters are available. Contact
              the dashboard owner to make changes.
            </p>
          </div>
        )}

        <section className="min-h-0 flex-1 overflow-y-auto pb-16 pt-4">
          {!activeTab || widgets.length === 0 ? (
            <div className="flex h-full min-h-96 flex-col items-center justify-center p-6 text-center">
              <WuHeading size="md">No widgets on this tab yet</WuHeading>
              <WuText size="md" as="p" className="mt-2 max-w-xl text-gray-500">
                Add widgets to start visualizing your data. Each tab can hold multiple widgets
                tailored to your reporting needs.
              </WuText>
              <WuButton
                variant="primary"
                className="mt-5"
                onClick={() => setIsAddWidgetOpen(true)}
                disabled={!capabilities?.canAddWidgets}
              >
                + Add widget
              </WuButton>
            </div>
          ) : !layoutReady ? null : (
            <DashboardWidgetProvider
              capabilities={capabilities ?? getDashboardCapabilities(dashboard, getCurrentUser())}
              onExportPpt={() => setExportModalOpen(true)}
            >
              <GridLayoutWithWidth
                className="layout"
                layout={uniqueLayout}
                cols={12}
                rowHeight={60}
                onLayoutChange={handleLayoutChange}
                onDragStop={commitLayoutStop}
                onResizeStop={commitLayoutStop}
                draggableHandle=".widget-drag-handle"
                resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
                margin={[16, 16]}
                containerPadding={[16, 16]}
                isResizable={capabilities?.canEdit ?? false}
                isDraggable={capabilities?.canEdit ?? false}
              >
                {uniqueWidgets.map((widget) => (
                  <div key={widget.id} className="widget-grid-item">
                    <DashboardWidgetProvider
                      reportWidgetHeight={(heightPx) =>
                        registerWidgetContentHeight(widget.id, heightPx)
                      }
                    >
                      <DashboardWidgetRenderer
                        widget={widget}
                        onUpdate={handleWidgetUpdate}
                        onEdit={() => handleEditWidget(widget)}
                        onDuplicate={() => handleDuplicateWidget(widget)}
                        onDelete={() => handleDeleteWidget(widget.id)}
                        activeFilters={activeFilters}
                        dashboardWidgets={uniqueWidgets}
                        capabilities={capabilities ?? undefined}
                      />
                    </DashboardWidgetProvider>
                  </div>
                ))}
              </GridLayoutWithWidth>
            </DashboardWidgetProvider>
          )}
        </section>

        <footer className="z-20 shrink-0 border-t border-gray-200 bg-white">
          <div className="flex h-10 items-center gap-1 overflow-x-auto px-4">
            <button
              type="button"
              className="shrink-0 px-2 text-xl text-gray-400 hover:text-gray-600"
              onClick={addTab}
              aria-label="Add tab"
            >
              +
            </button>
            {tabs.map((tab) => (
              <div key={tab.id} className="relative flex shrink-0 items-center">
                <button
                  type="button"
                  className={cn(
                    'px-3 py-2 text-sm',
                    tab.id === activeTabId
                      ? 'font-medium text-blue-600'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {tab.name}
                </button>
                <button
                  type="button"
                  className="px-0.5 text-gray-400 hover:text-gray-600"
                  onClick={() => setOpenTabMenuId(openTabMenuId === tab.id ? null : tab.id)}
                  aria-label={`Tab options for ${tab.name}`}
                >
                  ⋮
                </button>
                {openTabMenuId === tab.id && (
                  <div className="absolute bottom-10 right-0 z-20 w-40 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => renameTab(tab.id)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => duplicateTab(tab.id)}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                      onClick={() => deleteTab(tab.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </footer>

        <AddWidgetModal
          open={isAddWidgetOpen}
          onOpenChange={setIsAddWidgetOpen}
          currentLayout={currentLayout}
          tabWidgets={widgets}
          onWidgetAdd={handleWidgetAdd}
        />
        {activeTab && (
          <ExportPptModal
            open={exportModalOpen}
            onClose={() => setExportModalOpen(false)}
            dashboardName={dashboard.name}
            tabName={activeTab.name}
            widgets={widgets}
            activeFilters={activeFiltersToLabels(activeFilters)}
          />
        )}
      </main>
    </div>
  )
}
