'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { Layout } from 'react-grid-layout/legacy'
import ReactGridLayout, { WidthProvider } from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import { DashboardFilterPanel } from '@/components/modules/analytics/DashboardFilterPanel'
import { DashboardWidgetProvider } from '@/components/modules/analytics/DashboardWidgetContext'
import { DashboardWidgetRenderer } from '@/components/modules/analytics/widgetRegistry'
import { ShareTabFilterPopover } from '@/components/modules/analytics/ShareTabFilterPopover'
import {
  buildGridLayout,
  loadDashboardTabLayout,
  syncLayoutWithWidgets,
} from '@/lib/defaultWidgetLayouts'
import { applyWidgetHeightConstraints } from '@/lib/widgetGridMetrics'
import {
  getDashboardById,
  getDashboardTabs,
  getDashboardWidgets,
} from '@/lib/mockDb'
import {
  buildEffectiveShareFilters,
  isShareLinkExpired,
  isShareLinkUnlocked,
  resolveShareLinkBySlug,
  unlockShareLink,
} from '@/lib/publicShareLinks'
import { seedDefaultDashboardsIfNeeded } from '@/lib/seedDashboards'
import { cn } from '@/lib/utils'
import type {
  ActiveFilter,
  Dashboard,
  DashboardTab,
  DashboardWidget,
  FilterField,
  PublicShareLink,
  WidgetType,
} from '@/types'
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
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

const READ_ONLY_CAPABILITIES = getDashboardCapabilities(
  {
    id: 'shared',
    name: 'Shared',
    access: 'global',
    authorEmail: 'shared@questionpro.com',
    createdAt: '',
    tabs: [],
  },
  { email: 'viewer@example.com', role: 'employee' },
)

export default function SharedDashboardPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''

  const [link, setLink] = useState<PublicShareLink | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [tabs, setTabs] = useState<DashboardTab[]>([])
  const [allTabWidgets, setAllTabWidgets] = useState<Record<string, DashboardWidget[]>>({})
  const [activeTabId, setActiveTabId] = useState('')
  const [loading, setLoading] = useState(true)
  const [unlocked, setUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [tabFilterOpen, setTabFilterOpen] = useState(false)
  const [dynamicDashboardFilters, setDynamicDashboardFilters] = useState<ActiveFilter[]>([])
  const [dynamicTabFiltersByTab, setDynamicTabFiltersByTab] = useState<
    Record<string, ActiveFilter[]>
  >({})
  const [currentLayout, setCurrentLayout] = useState<Layout>([])
  const [layoutReady, setLayoutReady] = useState(false)
  const [widgetContentHeights, setWidgetContentHeights] = useState<Record<string, number>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    seedDefaultDashboardsIfNeeded()

    const resolved = resolveShareLinkBySlug(slug)
    if (!resolved) {
      setLink(null)
      setLoading(false)
      return
    }

    setLink(resolved)
    setUnlocked(!resolved.passwordProtected || isShareLinkUnlocked(resolved.slug))

    const loaded = getDashboardById(resolved.dashboardId)
    if (!loaded) {
      setDashboard(null)
      setLoading(false)
      return
    }

    const storedTabs = getDashboardTabs(resolved.dashboardId)
    const included = new Set(
      resolved.includedTabIds.length > 0
        ? resolved.includedTabIds
        : storedTabs.map((tab) => tab.id),
    )
    const visibleTabs = storedTabs.filter((tab) => included.has(tab.id))
    const widgetMap: Record<string, DashboardWidget[]> = {}
    visibleTabs.forEach((tab) => {
      widgetMap[tab.id] = getDashboardWidgets(resolved.dashboardId, tab.id)
    })

    setDashboard(loaded)
    setTabs(visibleTabs)
    setAllTabWidgets(widgetMap)
    setActiveTabId(visibleTabs[0]?.id ?? '')
    setLoading(false)
  }, [slug])

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

  const dynamicTabFilters = dynamicTabFiltersByTab[activeTabId] ?? []

  const effectiveFilters = useMemo(() => {
    if (!link || !activeTabId) return [] as ActiveFilter[]
    return buildEffectiveShareFilters(
      link,
      activeTabId,
      dynamicDashboardFilters,
      dynamicTabFilters,
    )
  }, [activeTabId, dynamicDashboardFilters, dynamicTabFilters, link])

  const staticChips = useMemo(() => {
    if (!link || !activeTabId) return [] as ActiveFilter[]
    return buildEffectiveShareFilters(link, activeTabId, [], [])
  }, [activeTabId, link])

  const loadLayoutForTab = useCallback(
    (tabId: string) => {
      if (!link) return [] as Layout
      const tabWidgets = allTabWidgets[tabId] ?? []
      const savedLayout = loadDashboardTabLayout(link.dashboardId, tabId)
      if (savedLayout) return syncLayoutWithWidgets(tabWidgets, savedLayout)
      return buildGridLayout(tabWidgets)
    },
    [allTabWidgets, link],
  )

  useLayoutEffect(() => {
    if (!activeTabId || loading || !unlocked) {
      setLayoutReady(false)
      return
    }
    setLayoutReady(false)
    setWidgetContentHeights({})
    setCurrentLayout(loadLayoutForTab(activeTabId))
    setLayoutReady(true)
  }, [activeTabId, loading, loadLayoutForTab, unlocked])

  const uniqueLayout = useMemo(() => {
    const constrained = applyWidgetHeightConstraints(
      currentLayout,
      widgetContentHeights,
      widgetTypesById,
    )
    return constrained.filter(
      (item, index, self) => index === self.findIndex((entry) => entry.i === item.i),
    )
  }, [currentLayout, widgetContentHeights, widgetTypesById])

  const registerWidgetContentHeight = useCallback((widgetId: string, heightPx: number) => {
    setWidgetContentHeights((current) => {
      if (current[widgetId] === heightPx) return current
      return { ...current, [widgetId]: heightPx }
    })
  }, [])

  function toggleDynamicDashboardFilter(field: FilterField, value: string) {
    setDynamicDashboardFilters((prev) => {
      const exists = prev.some((filter) => filter.fieldId === field.id && filter.value === value)
      if (exists) {
        return prev.filter((filter) => !(filter.fieldId === field.id && filter.value === value))
      }
      return [...prev, { fieldId: field.id, fieldLabel: field.label, value }]
    })
  }

  function toggleDynamicTabFilter(field: FilterField, value: string) {
    setDynamicTabFiltersByTab((prev) => {
      const current = prev[activeTabId] ?? []
      const exists = current.some((filter) => filter.fieldId === field.id && filter.value === value)
      const next = exists
        ? current.filter((filter) => !(filter.fieldId === field.id && filter.value === value))
        : [...current, { fieldId: field.id, fieldLabel: field.label, value }]
      return { ...prev, [activeTabId]: next }
    })
  }

  function handleUnlock() {
    if (!link) return
    if (passwordInput !== link.password) {
      setPasswordError('Incorrect password')
      return
    }
    unlockShareLink(link.slug)
    setUnlocked(true)
    setPasswordError('')
  }

  const titleAlignClass =
    link?.titleAlign === 'center'
      ? 'text-center'
      : link?.titleAlign === 'right'
        ? 'text-right'
        : 'text-left'

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <WuText size="sm" as="p" className="text-gray-400">
          Loading shared dashboard…
        </WuText>
      </div>
    )
  }

  if (!link || !dashboard) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <WuHeading size="md">Shared dashboard not found</WuHeading>
        <WuText size="sm" as="p" className="mt-2 max-w-md text-gray-500">
          This link may have been deleted, or it was created in a different browser session.
        </WuText>
      </div>
    )
  }

  if (link.status === 'closed') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <WuHeading size="md">This sharing link is closed</WuHeading>
        <WuText size="sm" as="p" className="mt-2 max-w-md text-gray-500">
          Ask the dashboard owner to reopen the link if you need access.
        </WuText>
      </div>
    )
  }

  if (isShareLinkExpired(link)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <WuHeading size="md">This sharing link has expired</WuHeading>
        <WuText size="sm" as="p" className="mt-2 max-w-md text-gray-500">
          Contact the dashboard owner for an updated link.
        </WuText>
      </div>
    )
  }

  if (link.passwordProtected && !unlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <WuHeading size="md">Password required</WuHeading>
          <WuText size="sm" as="p" className="mt-2 text-gray-500">
            Enter the password to view this shared dashboard.
          </WuText>
          <div className="mt-4 space-y-3">
            <WuInput
              variant="outlined"
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleUnlock()
              }}
            />
            {passwordError && (
              <p className="text-xs text-red-600">{passwordError}</p>
            )}
            <WuButton variant="primary" className="w-full" onClick={handleUnlock}>
              View dashboard
            </WuButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen min-h-0 flex-col bg-white">
      <header className="z-20 shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className={cn('min-w-0 flex-1', titleAlignClass)}>
            <WuHeading size="xl" className="truncate text-gray-900">
              {link.displayTitle || dashboard.name}
            </WuHeading>
            {staticChips.length > 0 && (
              <div
                className={cn(
                  'mt-2 flex flex-wrap gap-1.5',
                  link.titleAlign === 'center' && 'justify-center',
                  link.titleAlign === 'right' && 'justify-end',
                )}
              >
                {staticChips.map((filter) => (
                  <span
                    key={`static-${filter.fieldId}-${filter.value}`}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] text-gray-600"
                  >
                    <span className="font-medium">{filter.fieldLabel}:</span>
                    &nbsp;{filter.value}
                    <span className="ml-1 text-gray-400">(fixed)</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {link.allowDynamicDashboardFilters && (
            <button
              type="button"
              className="relative shrink-0 text-xl text-gray-400 hover:text-gray-600"
              onClick={() => setIsFilterOpen((open) => !open)}
              aria-label="Dashboard filters"
            >
              <span className="wm-filter-alt text-xl leading-none" aria-hidden />
              {dynamicDashboardFilters.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {dynamicDashboardFilters.length}
                </span>
              )}
            </button>
          )}
        </div>

        {link.allowDynamicDashboardFilters && dynamicDashboardFilters.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {dynamicDashboardFilters.map((filter) => (
              <span
                key={`dyn-dash-${filter.fieldId}-${filter.value}`}
                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
              >
                <span className="font-medium">{filter.fieldLabel}:</span>
                {filter.value}
                <button
                  type="button"
                  onClick={() =>
                    toggleDynamicDashboardFilter(
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
              onClick={() => setDynamicDashboardFilters([])}
              className="text-xs text-gray-400 underline hover:text-gray-600"
            >
              Clear all
            </button>
          </div>
        )}

        {link.allowDynamicDashboardFilters && (
          <DashboardFilterPanel
            open={isFilterOpen}
            activeFilters={dynamicDashboardFilters}
            onToggleFilter={toggleDynamicDashboardFilter}
            onClearAll={() => setDynamicDashboardFilters([])}
            onClose={() => setIsFilterOpen(false)}
            panelClassName="fixed right-0 top-0 z-40 flex h-screen w-[280px] flex-col border-l border-gray-200 bg-white shadow-lg"
          />
        )}
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto pb-16 pt-4">
        {!activeTab || uniqueWidgets.length === 0 ? (
          <div className="flex h-full min-h-96 flex-col items-center justify-center p-6 text-center">
            <WuHeading size="md">No widgets on this tab</WuHeading>
            <WuText size="sm" as="p" className="mt-2 text-gray-500">
              This shared view does not include widgets for the selected tab.
            </WuText>
          </div>
        ) : !layoutReady ? null : (
          <DashboardWidgetProvider capabilities={READ_ONLY_CAPABILITIES}>
            <GridLayoutWithWidth
              className="layout"
              layout={uniqueLayout}
              cols={12}
              rowHeight={60}
              draggableHandle=".widget-drag-handle"
              margin={[16, 16]}
              containerPadding={[16, 16]}
              isResizable={false}
              isDraggable={false}
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
                      activeFilters={effectiveFilters}
                      dashboardWidgets={uniqueWidgets}
                      capabilities={READ_ONLY_CAPABILITIES}
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
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            const tabFilterCount = (dynamicTabFiltersByTab[tab.id] ?? []).length
            return (
              <div key={tab.id} className="relative flex shrink-0 items-center">
                <button
                  type="button"
                  className={cn(
                    'px-3 py-2 text-sm',
                    isActive ? 'font-medium text-blue-600' : 'text-gray-500 hover:text-gray-700',
                  )}
                  onClick={() => {
                    setActiveTabId(tab.id)
                    setTabFilterOpen(false)
                  }}
                >
                  {tab.name}
                </button>
                {link.allowDynamicTabFilters && isActive && (
                  <>
                    <button
                      type="button"
                      className="relative mr-1 text-gray-400 hover:text-gray-600"
                      aria-label={`Filters for ${tab.name}`}
                      onClick={() => setTabFilterOpen((open) => !open)}
                    >
                      <span className="wm-filter-alt text-base leading-none" aria-hidden />
                      {tabFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                          {tabFilterCount}
                        </span>
                      )}
                    </button>
                    <ShareTabFilterPopover
                      open={tabFilterOpen}
                      activeFilters={dynamicTabFilters}
                      onToggleFilter={toggleDynamicTabFilter}
                      onClearAll={() =>
                        setDynamicTabFiltersByTab((prev) => ({ ...prev, [activeTabId]: [] }))
                      }
                      onClose={() => setTabFilterOpen(false)}
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>
      </footer>
    </div>
  )
}
