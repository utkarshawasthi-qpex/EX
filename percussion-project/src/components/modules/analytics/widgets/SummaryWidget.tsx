'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CreateActionPlanModal } from '@/components/modules/analytics/CreateActionPlanModal'
import { useDashboardWidgetContext } from '@/components/modules/analytics/DashboardWidgetContext'
import { useReportWidgetHeight } from '@/components/modules/analytics/useReportWidgetHeight'
import { SummarySettingsModal } from '@/components/modules/analytics/SummarySettingsModal'
import { WidgetKebabMenu } from '@/components/modules/analytics/widgets/WidgetKebabMenu'
import { widgetSurfaceClassName } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { mockScorecardData } from '@/data/mock/analyticsData'
import { generateDashboardSummary } from '@/lib/buildSummaryPrompt'
import { normalizeSummaryAdminConfig } from '@/lib/normalizeSummaryConfig'
import {
  clearCachedCompanySummary,
  clearCachedManagerSummary,
  getCachedCompanySummary,
  getCachedManagerSummary,
  normalizeSummaryContent,
  saveCachedCompanySummary,
  saveCachedManagerSummary,
} from '@/lib/summaryStorage'
import { canSeeCompanySummary } from '@/lib/summaryVisibility'
import { getCurrentUser } from '@/lib/userContext'
import { cn } from '@/lib/utils'
import type {
  DashboardWidget,
  ManagerSummaryCache,
  SummaryAction,
  SummaryContent,
  ViewerCapabilities,
} from '@/types'

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

type SummaryWidgetProps = {
  widget?: DashboardWidget
  onUpdate?: (updated: DashboardWidget) => void
  onDelete?: () => void
  activeFilters?: string[]
  dashboardWidgets?: DashboardWidget[]
  capabilities?: ViewerCapabilities
  onEdit?: () => void
  onDuplicate?: () => void
}

function GeneratingState({ message = 'Generating summary...' }: { message?: string }) {
  return (
    <div className="px-4 py-6">
      <div className="space-y-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
      </div>
      <WuText size="sm" as="p" className="mt-4 text-center text-gray-400">
        {message}
      </WuText>
    </div>
  )
}

function SummarySections({
  content,
  onCreateActionPlan,
  canSeeActions = true,
  canCreateActionPlan = true,
  showRestrictedNote = false,
  isCreator = false,
  onRefresh,
}: {
  content: SummaryContent
  onCreateActionPlan: (action: SummaryAction) => void
  canSeeActions?: boolean
  canCreateActionPlan?: boolean
  showRestrictedNote?: boolean
  isCreator?: boolean
  onRefresh?: () => void
}) {
  const sortedActions = [...content.actions].sort((a, b) => a.priority - b.priority)

  return (
    <div className="flex h-full flex-col overflow-hidden px-4 py-3">
      <WuText size="sm" as="p" className="mb-3 flex-shrink-0 leading-relaxed text-gray-700">
        {content.summary}
      </WuText>

      <div className="mb-3 flex-shrink-0 border-t border-gray-100" />

      {canSeeActions && (
        <>
          <div className="mb-2 flex flex-shrink-0 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-1 rounded-full bg-green-500" />
              <WuText size="sm" as="span" className="font-semibold uppercase tracking-wide text-gray-400">
                Recommended actions
              </WuText>
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                {sortedActions.length}
              </span>
            </div>
            <WuText size="sm" as="span" className="text-gray-400">
              Sorted by priority
            </WuText>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
            {sortedActions.map((action, index) => (
              <div
                key={`action-${index}`}
                className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <span
                    className={cn(
                      'mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-bold',
                      action.priority === 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-500',
                    )}
                  >
                    P{action.priority}
                  </span>

                  <div className="min-w-0 flex-1">
                    <WuText size="sm" as="p" className="font-medium leading-snug text-gray-800">
                      {action.action}
                    </WuText>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <WuText size="sm" as="span" className="text-gray-400">
                        {action.timeframe}
                      </WuText>
                      <span className="text-xs text-gray-200">·</span>
                      <span className="flex items-center gap-1">
                        <span
                          className={cn(
                            'size-1.5 rounded-full',
                            action.owner === 'HR'
                              ? 'bg-amber-400'
                              : action.owner === 'Leadership'
                                ? 'bg-purple-400'
                                : 'bg-blue-400',
                          )}
                        />
                        <WuText size="sm" as="span" className="text-gray-400">
                          {action.owner}
                        </WuText>
                      </span>
                      {action.context && (
                        <>
                          <span className="text-xs text-gray-200">·</span>
                          <WuText size="sm" as="span" className="italic text-gray-400">
                            {action.context}
                          </WuText>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {canCreateActionPlan && (
                  <button
                    type="button"
                    onClick={() => onCreateActionPlan(action)}
                    className={cn(
                      'mt-0.5 flex-shrink-0 text-xs font-medium',
                      action.priority === 1
                        ? 'rounded bg-blue-600 px-2.5 py-1 text-white transition-colors hover:bg-blue-700'
                        : 'text-blue-600 hover:underline',
                    )}
                  >
                    Create action plan →
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showRestrictedNote && (
        <WuText size="sm" as="p" className="mt-3 text-center text-gray-400">
          Recommended actions are visible to HR Admins only
        </WuText>
      )}

      <div className="mt-2 flex flex-shrink-0 items-center justify-between border-t border-gray-50 pt-2">
        <WuText size="sm" as="span" className="text-gray-400">
          Generated {format(new Date(content.generatedAt), 'MMM d, yyyy')}
        </WuText>
        {isCreator && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs text-gray-400 transition-colors hover:text-blue-600"
          >
            ↺ Refresh
          </button>
        )}
      </div>
    </div>
  )
}

export function SummaryWidget(props: SummaryWidgetProps) {
  if (!props.widget?.summaryConfig || !props.onUpdate) return null
  return (
    <SummaryWidgetInner
      {...props}
      widget={props.widget}
      onUpdate={props.onUpdate}
    />
  )
}

function SummaryWidgetInner({
  widget,
  onUpdate,
  onDelete,
  activeFilters = [],
  dashboardWidgets = [],
  capabilities: capabilitiesProp,
  onEdit,
  onDuplicate,
}: SummaryWidgetProps & {
  widget: DashboardWidget
  onUpdate: (updated: DashboardWidget) => void
}) {
  const { capabilities: contextCapabilities, onExportPpt, reportWidgetHeight } =
    useDashboardWidgetContext()
  const capabilities = capabilitiesProp ?? contextCapabilities
  const chromeRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const currentUser = getCurrentUser()
  const config = normalizeSummaryAdminConfig(widget.summaryConfig!)

  const isAdmin = capabilities.isOwner
  const canSeeCompanySummaryTab = canSeeCompanySummary(
    config.visibility,
    currentUser,
    config.createdBy,
  )

  const viewerDataDiffersFromOrg =
    activeFilters.length > 0 || currentUser.isImpersonating === true

  const showMyTeamTab =
    Boolean(config?.allowEmployeeSummaries) && !isAdmin && viewerDataDiffersFromOrg

  const showCompanyTab = canSeeCompanySummaryTab
  const showTabRow = showCompanyTab && showMyTeamTab

  const [activeTab, setActiveTab] = useState<'company' | 'team'>(() =>
    showMyTeamTab ? 'team' : 'company',
  )

  const canSeeActions = (() => {
    if (activeTab === 'company') {
      return isAdmin
    }

    if (activeTab === 'team') {
      return true
    }

    return false
  })()

  const canCreateActionPlan = canSeeActions

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [actionPlanOpen, setActionPlanOpen] = useState(false)
  const [actionPlanPrefill, setActionPlanPrefill] = useState({
    title: '',
    timeframe: '30 days',
    owner: 'Manager',
    surveyName: mockScorecardData.surveyName,
  })

  const [myTeamCache, setMyTeamCache] = useState<ManagerSummaryCache | null>(() =>
    getCachedManagerSummary(widget.id, currentUser.id),
  )
  const [isGeneratingTeam, setIsGeneratingTeam] = useState(false)
  const [teamError, setTeamError] = useState<'api_error' | null>(null)

  const dataWidgets = useMemo(
    () => dashboardWidgets.filter((item) => item.type !== 'summary' && item.type !== 'notes'),
    [dashboardWidgets],
  )

  const hasStartedGeneration = useRef(false)
  const hasRestoredCache = useRef(false)

  useEffect(() => {
    hasStartedGeneration.current = false
    hasRestoredCache.current = false
  }, [widget.id])

  useEffect(() => {
    if (showMyTeamTab) {
      setActiveTab('team')
    } else if (showCompanyTab) {
      setActiveTab('company')
    }
  }, [showCompanyTab, showMyTeamTab])

  const generateCompanySummary = useCallback(async () => {
    if (!config) return

    if (dataWidgets.length === 0) {
      onUpdate({
        ...widget,
        summaryConfig: {
          ...config,
          isGenerating: false,
          generationError: 'no_data',
        },
      })
      return
    }

    try {
      const parsed = await generateDashboardSummary(dataWidgets, activeFilters, {
        viewType: 'company',
      })
      saveCachedCompanySummary(widget.id, parsed)
      onUpdate({
        ...widget,
        summaryConfig: {
          ...config,
          isGenerating: false,
          companyContent: parsed,
          generationError: undefined,
        },
      })
    } catch {
      onUpdate({
        ...widget,
        summaryConfig: {
          ...config,
          isGenerating: false,
          generationError: 'api_error',
        },
      })
    }
  }, [activeFilters, config, dataWidgets, onUpdate, widget])

  useEffect(() => {
    if (!isAdmin) return

    if (config.companyContent || config.generationError) return

    const cached = getCachedCompanySummary(widget.id)
    if (cached && !config.isGenerating && !hasRestoredCache.current) {
      hasRestoredCache.current = true
      onUpdate({
        ...widget,
        summaryConfig: {
          ...config,
          companyContent: cached,
          isGenerating: false,
          generationError: undefined,
        },
      })
      return
    }

    if (config.isGenerating && !hasStartedGeneration.current) {
      hasStartedGeneration.current = true
      void generateCompanySummary()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.id, config.isGenerating, config.companyContent, config.generationError, isAdmin])

  const generateTeamSummary = useCallback(async () => {
    if (!config) return

    setIsGeneratingTeam(true)
    setTeamError(null)

    try {
      const parsed = await generateDashboardSummary(dataWidgets, activeFilters, {
        viewType: 'team',
      })

      const cache: ManagerSummaryCache = {
        userId: currentUser.id,
        content: parsed,
        generatedAt: new Date().toISOString(),
        dataFilters: activeFilters,
      }

      saveCachedManagerSummary(widget.id, cache)
      setMyTeamCache(cache)
      setIsGeneratingTeam(false)
    } catch {
      setIsGeneratingTeam(false)
      setTeamError('api_error')
    }
  }, [activeFilters, config, currentUser.id, dataWidgets, widget.id])

  function handleRegenerateCompany() {
    if (!config) return
    clearCachedCompanySummary(widget.id)
    setShowRegenerateConfirm(false)
    onUpdate({
      ...widget,
      summaryConfig: {
        ...config,
        isGenerating: true,
        companyContent: undefined,
        generationError: undefined,
      },
    })
  }

  function handleCreateActionPlan(action: SummaryAction) {
    setActionPlanPrefill({
      title: action.action,
      timeframe: action.timeframe,
      owner: action.owner,
      surveyName: mockScorecardData.surveyName,
    })
    setActionPlanOpen(true)
  }

  function handleClearTeamCache() {
    clearCachedManagerSummary(widget.id, currentUser.id)
    setMyTeamCache(null)
    setTeamError(null)
  }

  if (!canSeeCompanySummaryTab && !showMyTeamTab) return null

  const companyContent = config.companyContent
    ? normalizeSummaryContent(config.companyContent)
    : undefined
  const companyGenerating = config.isGenerating
  const companyError = config.generationError

  function renderCompanyTab() {
    if (companyGenerating) {
      return <GeneratingState message="Generating summary..." />
    }

    if (companyError === 'no_data') {
      return (
        <div className="px-4 py-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1 text-sm font-medium text-amber-800">No data to summarise</p>
            <p className="text-xs text-amber-700">
              Add data widgets to this tab first — Scorecard, eNPS, or Heatmap.
            </p>
          </div>
        </div>
      )
    }

    if (companyError === 'api_error') {
      return (
        <div className="px-4 py-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="mb-1 text-sm font-medium text-red-800">Unable to generate summary</p>
            <p className="mb-3 text-xs text-red-700">
              There was an error connecting to the AI service.
            </p>
            {isAdmin && (
              <button
                type="button"
                className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                onClick={handleRegenerateCompany}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )
    }

    if (!companyContent) return null

    return (
      <>
        <SummarySections
          content={companyContent}
          onCreateActionPlan={handleCreateActionPlan}
          canSeeActions={canSeeActions}
          canCreateActionPlan={canCreateActionPlan}
          showRestrictedNote={!canSeeActions && !isAdmin}
          isCreator={isAdmin}
          onRefresh={handleRegenerateCompany}
        />
      </>
    )
  }

  function renderTeamTab() {
    return renderTeamContent()
  }

  function renderTeamContent() {
    if (isGeneratingTeam) {
      return <GeneratingState message="Generating summary..." />
    }

    if (teamError) {
      return (
        <div className="px-4 py-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="mb-1 text-sm font-medium text-red-800">Unable to generate summary</p>
            <p className="mb-3 text-xs text-red-700">
              There was an error connecting to the AI service.
            </p>
            <button
              type="button"
              className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              onClick={() => void generateTeamSummary()}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    if (!myTeamCache) {
      return (
        <div className="px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <span className="text-lg text-blue-400" aria-hidden>
              ✦
            </span>
          </div>
          <p className="mb-1 text-sm font-medium text-gray-700">Generate AI Summary</p>
          <p className="mx-auto mb-4 max-w-xs text-xs text-gray-400">
            Summarises all data on this dashboard using your organisation context.
          </p>
          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap justify-center gap-1">
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600"
                >
                  {filter}
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            onClick={() => void generateTeamSummary()}
          >
            Generate Summary
          </button>
        </div>
      )
    }

    return (
      <>
        <SummarySections
          content={normalizeSummaryContent(myTeamCache.content)}
          onCreateActionPlan={handleCreateActionPlan}
          canSeeActions
          canCreateActionPlan
          isCreator={myTeamCache.userId === currentUser.id}
          onRefresh={handleClearTeamCache}
        />
      </>
    )
  }

  const showRefresh =
    (activeTab === 'company' && isAdmin && Boolean(companyContent)) ||
    (activeTab === 'team' && myTeamCache?.userId === currentUser.id && Boolean(myTeamCache))

  useReportWidgetHeight(
    reportWidgetHeight,
    { headerRef: chromeRef, contentRef },
    [
      activeTab,
      companyContent,
      companyGenerating,
      companyError,
      myTeamCache,
      isGeneratingTeam,
      teamError,
      showTabRow,
    ],
  )

  return (
    <>
      <div className={widgetSurfaceClassName}>
        <div ref={chromeRef} className="flex-shrink-0">
          <div className="flex items-start justify-between px-4 pt-3 pb-2">
          <div className="flex items-start gap-2">
            {capabilities.canEdit && (
              <span
                className="widget-drag-handle mt-0.5 cursor-grab text-base text-gray-300 select-none active:cursor-grabbing"
                aria-label="Drag widget"
              >
                ⠿
              </span>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <WuHeading size="md" className="text-gray-900">
                  {widget.title}
                </WuHeading>
                <WuText
                  size="sm"
                  as="span"
                  className="rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 font-medium text-blue-600"
                >
                  AI
                </WuText>
                {isAdmin && config.visibility === 'private' && (
                  <WuText size="sm" as="span" className="text-gray-400">
                    🔒 Private
                  </WuText>
                )}
                {isAdmin && config.visibility !== 'private' && (
                  <span className="flex items-center gap-1 rounded border border-gray-200 px-1.5 py-0.5">
                    <span className="inline-block size-1.5 rounded-full bg-blue-400" />
                    <WuText size="sm" as="span" className="text-gray-500">
                      Shared
                    </WuText>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            {showRefresh && (
              <>
                <button
                  type="button"
                  className="text-sm text-gray-400 transition-colors hover:text-blue-600"
                  aria-label="Regenerate summary"
                  title="Regenerate summary"
                  onClick={() => {
                    if (activeTab === 'company') {
                      setShowRegenerateConfirm((open) => !open)
                    } else {
                      handleClearTeamCache()
                    }
                  }}
                >
                  ↺
                </button>
                {showRegenerateConfirm && activeTab === 'company' && (
                  <div className="absolute top-8 right-0 z-20 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                    <p className="text-sm text-gray-700">
                      Regenerate summary? This will replace the current summary.
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <WuButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowRegenerateConfirm(false)}
                      >
                        Cancel
                      </WuButton>
                      <WuButton variant="primary" size="sm" onClick={handleRegenerateCompany}>
                        Regenerate
                      </WuButton>
                    </div>
                  </div>
                )}
              </>
            )}
            {isAdmin && (
              <WidgetKebabMenu
                title={widget.title}
                canEdit
                onSettings={() => setSettingsOpen(true)}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onExportPpt={onExportPpt}
              />
            )}
          </div>
        </div>

        {showTabRow && (
          <div className="flex shrink-0 border-b border-gray-100 bg-gray-50">
            {showCompanyTab && (
              <button
                type="button"
                className={cn(
                  'px-4 py-2 text-sm transition-colors',
                  activeTab === 'company'
                    ? 'border-b-2 border-blue-600 bg-white font-medium text-blue-600'
                    : 'text-gray-500 hover:text-gray-700',
                )}
                onClick={() => setActiveTab('company')}
              >
                Company Overview
              </button>
            )}
            {showMyTeamTab && (
              <button
                type="button"
                className={cn(
                  'px-4 py-2 text-sm transition-colors',
                  activeTab === 'team'
                    ? 'border-b-2 border-blue-600 bg-white font-medium text-blue-600'
                    : 'text-gray-500 hover:text-gray-700',
                )}
                onClick={() => setActiveTab('team')}
              >
                My Team
              </button>
            )}
          </div>
        )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div ref={contentRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {showCompanyTab && (!showMyTeamTab || activeTab === 'company') && renderCompanyTab()}
            {showMyTeamTab && (!showCompanyTab || activeTab === 'team') && renderTeamTab()}
          </div>
        </div>
      </div>

      <SummarySettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        widget={widget}
        onUpdate={onUpdate}
      />

      <CreateActionPlanModal
        open={actionPlanOpen}
        onClose={() => setActionPlanOpen(false)}
        prefill={actionPlanPrefill}
      />
    </>
  )
}
