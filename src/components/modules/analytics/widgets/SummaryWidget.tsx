'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CreateActionPlanModal } from '@/components/modules/analytics/CreateActionPlanModal'
import { useDashboardWidgetContext } from '@/components/modules/analytics/DashboardWidgetContext'
import { SummarySettingsModal } from '@/components/modules/analytics/SummarySettingsModal'
import { SummaryWidgetSections } from '@/components/modules/analytics/SummaryWidgetSections'
import { useReportWidgetHeight } from '@/components/modules/analytics/useReportWidgetHeight'
import { WidgetKebabMenu } from '@/components/modules/analytics/widgets/WidgetKebabMenu'
import { widgetSurfaceClassName } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { mockScorecardData } from '@/data/mock/analyticsData'
import {
  generateDashboardSummary,
  regenerateSingleAction,
  regenerateSummaryParagraph,
} from '@/lib/buildSummaryPrompt'
import { normalizeSummaryAdminConfig } from '@/lib/normalizeSummaryConfig'
import {
  canGenerateSummary,
  canManageVersions,
  canRateSummary,
  canRegenerateSummary,
  isSharedSummaryViewer,
} from '@/lib/summaryPermissions'
import {
  clearCachedCompanySummary,
  getCachedCompanySummary,
  getCachedManagerSummary,
  normalizeSummaryContent,
  saveCachedCompanySummary,
  saveCachedManagerSummary,
} from '@/lib/summaryStorage'
import { resolveSummaryContentForViewer } from '@/lib/summaryContent'
import { canSeeCompanySummary } from '@/lib/summaryVisibility'
import { getCurrentUser, isManagerUser } from '@/lib/userContext'
import { cn } from '@/lib/utils'
import type {
  DashboardWidget,
  ManagerSummaryCache,
  SummaryAction,
  SummaryContent,
  SummaryPriority,
  ViewerCapabilities,
} from '@/types'

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
  const rootRef = useRef<HTMLDivElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const currentUser = getCurrentUser()
  const config = normalizeSummaryAdminConfig(widget.summaryConfig!)

  const isAdmin = capabilities.isOwner
  const currentUserIsManager = isManagerUser(currentUser)
  const managerSummariesEnabled = config.allowEmployeeSummaries

  const canSeeCompanySummaryTab = canSeeCompanySummary(
    config.visibility,
    currentUser,
    config.createdBy,
  )

  const [myTeamCache, setMyTeamCache] = useState<ManagerSummaryCache | null>(() =>
    getCachedManagerSummary(widget.id, currentUser.id),
  )

  const myTeamDataDiffers =
    activeFilters.length > 0 ||
    currentUser.isImpersonating === true ||
    (currentUserIsManager && managerSummariesEnabled)

  const showMyTeamTab =
    !isAdmin &&
    currentUserIsManager &&
    myTeamDataDiffers &&
    (managerSummariesEnabled || Boolean(myTeamCache))

  const showCompanyTab = canSeeCompanySummaryTab
  const showTabRow = showCompanyTab && showMyTeamTab

  const defaultTab: 'company' | 'team' =
    managerSummariesEnabled && currentUserIsManager && myTeamDataDiffers ? 'team' : 'company'

  const [activeTab, setActiveTab] = useState<'company' | 'team'>(defaultTab)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showSummaryRegenerateConfirm, setShowSummaryRegenerateConfirm] = useState(false)
  const [regeneratingSummary, setRegeneratingSummary] = useState(false)
  const [regeneratingActionPriority, setRegeneratingActionPriority] =
    useState<SummaryPriority | null>(null)
  const [actionPlanOpen, setActionPlanOpen] = useState(false)
  const [actionPlanPrefill, setActionPlanPrefill] = useState({
    title: '',
    timeframe: '30 days',
    owner: 'Manager',
    surveyName: mockScorecardData.surveyName,
  })

  const [isGeneratingTeam, setIsGeneratingTeam] = useState(false)
  const [teamError, setTeamError] = useState<'api_error' | null>(null)

  const canGenerateCompany = canGenerateSummary(config, currentUser, isAdmin, 'company')
  const canGenerateTeam = canGenerateSummary(config, currentUser, isAdmin, 'team')

  const canSeeActions = activeTab === 'company' ? isAdmin : activeTab === 'team'
  const canCreateActionPlan = canSeeActions
  const canRegenerateCompany = canRegenerateSummary(
    config,
    currentUser,
    isAdmin,
    'company',
    Boolean(config.companyContent),
  )
  const canRegenerateTeam = canRegenerateSummary(
    config,
    currentUser,
    isAdmin,
    'team',
    Boolean(myTeamCache),
    myTeamCache?.userId,
  )
  const canRegenerate = activeTab === 'company' ? canRegenerateCompany : canRegenerateTeam

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

  function handleCompanyContentChange(content: SummaryContent) {
    if (!config) return
    saveCachedCompanySummary(widget.id, content)
    onUpdate({
      ...widget,
      summaryConfig: {
        ...config,
        companyContent: content,
      },
    })
  }

  function handleTeamContentChange(content: SummaryContent) {
    if (!myTeamCache) return
    const updated: ManagerSummaryCache = {
      ...myTeamCache,
      content,
      generatedAt: new Date().toISOString(),
    }
    saveCachedManagerSummary(widget.id, updated)
    setMyTeamCache(updated)
  }

  async function handleRegenerateSummaryParagraph() {
    if (!config?.companyContent) return
    setShowSummaryRegenerateConfirm(false)
    setRegeneratingSummary(true)
    try {
      const normalized = normalizeSummaryContent(config.companyContent)
      const updated = await regenerateSummaryParagraph(
        normalized,
        dataWidgets,
        activeFilters,
        'company',
      )
      handleCompanyContentChange(updated)
    } finally {
      setRegeneratingSummary(false)
    }
  }

  async function handleRegenerateTeamSummaryParagraph() {
    if (!myTeamCache) return
    setShowSummaryRegenerateConfirm(false)
    setRegeneratingSummary(true)
    try {
      const normalized = normalizeSummaryContent(myTeamCache.content)
      const updated = await regenerateSummaryParagraph(
        normalized,
        dataWidgets,
        activeFilters,
        'team',
      )
      handleTeamContentChange(updated)
    } finally {
      setRegeneratingSummary(false)
    }
  }

  async function handleRegenerateAction(priority: SummaryPriority) {
    if (activeTab === 'company' && config?.companyContent) {
      setRegeneratingActionPriority(priority)
      try {
        const normalized = normalizeSummaryContent(config.companyContent)
        const updated = await regenerateSingleAction(
          normalized,
          priority,
          dataWidgets,
          activeFilters,
        )
        handleCompanyContentChange(updated)
      } finally {
        setRegeneratingActionPriority(null)
      }
      return
    }

    if (activeTab === 'team' && myTeamCache) {
      setRegeneratingActionPriority(priority)
      try {
        const normalized = normalizeSummaryContent(myTeamCache.content)
        const updated = await regenerateSingleAction(
          normalized,
          priority,
          dataWidgets,
          activeFilters,
        )
        handleTeamContentChange(updated)
      } finally {
        setRegeneratingActionPriority(null)
      }
    }
  }

  function handleRegenerateCompanyFull() {
    if (!config) return
    clearCachedCompanySummary(widget.id)
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

  const companyContent = config.companyContent
    ? normalizeSummaryContent(config.companyContent, {
        scope: 'company',
        createdBy: config.createdBy,
        visibility: config.visibility,
      })
    : undefined

  const companyResolved = companyContent
    ? resolveSummaryContentForViewer(companyContent, {
        canManageVersions: canManageVersions(currentUser, companyContent),
        isSharedViewer: isSharedSummaryViewer(currentUser, companyContent, config),
        visibility: config.visibility,
      })
    : null

  const teamContent = myTeamCache
    ? normalizeSummaryContent(myTeamCache.content, {
        scope: `team:${myTeamCache.userId}`,
        createdBy: myTeamCache.userId,
        visibility: 'private',
      })
    : undefined

  const teamResolved = teamContent
    ? resolveSummaryContentForViewer(teamContent, {
        canManageVersions: canManageVersions(currentUser, teamContent),
        isSharedViewer: false,
        visibility: 'private',
      })
    : null
  const companyGenerating = config.isGenerating
  const companyError = config.generationError

  const showCompanyWideBadge =
    !isAdmin && activeTab === 'company' && Boolean(companyContent)

  useReportWidgetHeight(
    reportWidgetHeight,
    { rootRef, headerRef: chromeRef, contentRef },
    [
      activeTab,
      companyContent,
      companyGenerating,
      companyError,
      myTeamCache,
      isGeneratingTeam,
      teamError,
      showTabRow,
      regeneratingSummary,
      regeneratingActionPriority,
    ],
  )

  if (!canSeeCompanySummaryTab && !showMyTeamTab) return null

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
                onClick={handleRegenerateCompanyFull}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )
    }

    if (!companyContent || !companyResolved) return null

    if (companyResolved.isPendingShare) {
      return (
        <div className="px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
            <span className="text-lg text-gray-400" aria-hidden>
              ✦
            </span>
          </div>
          <p className="mb-1 text-sm font-medium text-gray-700">Summary not yet shared</p>
          <p className="mx-auto max-w-xs text-xs text-gray-400">
            The dashboard owner has not published a summary version for viewers yet.
          </p>
        </div>
      )
    }

    const displayContent = companyResolved.content
    const manageVersions = canManageVersions(currentUser, companyContent)

    return (
      <SummaryWidgetSections
        content={displayContent}
        onContentChange={handleCompanyContentChange}
        onCreateActionPlan={handleCreateActionPlan}
        canShowFeedback={canRateSummary(currentUser, displayContent)}
        canSeeActions={canSeeActions}
        canCreateActionPlan={canCreateActionPlan}
        showRestrictedNote={!canSeeActions && !isAdmin}
        canManageVersions={manageVersions}
        canRegenerate={canRegenerateCompany}
        canPublishVersion={manageVersions && config.visibility === 'everyone'}
        publishedVersionMissing={companyResolved.publishedVersionMissing}
        onRegenerateSummary={() => void handleRegenerateSummaryParagraph()}
        onRegenerateAction={(priority) => void handleRegenerateAction(priority)}
        regeneratingSummary={regeneratingSummary}
        regeneratingActionPriority={regeneratingActionPriority}
        showSummaryRegenerateConfirm={showSummaryRegenerateConfirm}
        onToggleSummaryRegenerateConfirm={() =>
          setShowSummaryRegenerateConfirm((open) => !open)
        }
      />
    )
  }

  function renderTeamTab() {
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
            {canGenerateTeam && (
              <button
                type="button"
                className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                onClick={() => void generateTeamSummary()}
              >
                Try again
              </button>
            )}
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
          <p className="mb-1 text-sm font-medium text-gray-700">Generate my team summary</p>
          <p className="mx-auto mb-4 max-w-xs text-xs text-gray-400">
            Based on your filtered view of this dashboard
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
            {canGenerateTeam && (
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                onClick={() => void generateTeamSummary()}
              >
                Generate Summary
              </button>
            )}
        </div>
      )
    }

    if (!teamContent || !teamResolved) return null

    const manageTeamVersions = canManageVersions(currentUser, teamContent)

    return (
      <SummaryWidgetSections
        content={teamResolved.content}
        onContentChange={handleTeamContentChange}
        onCreateActionPlan={handleCreateActionPlan}
        canShowFeedback={canRateSummary(currentUser, teamResolved.content)}
        canSeeActions
        canCreateActionPlan
        canManageVersions={manageTeamVersions}
        canRegenerate={canRegenerateTeam}
        canPublishVersion={false}
        publishedVersionMissing={teamResolved.publishedVersionMissing}
        onRegenerateSummary={() => void handleRegenerateTeamSummaryParagraph()}
        onRegenerateAction={(priority) => void handleRegenerateAction(priority)}
        regeneratingSummary={regeneratingSummary}
        regeneratingActionPriority={regeneratingActionPriority}
        showSummaryRegenerateConfirm={showSummaryRegenerateConfirm}
        onToggleSummaryRegenerateConfirm={() =>
          setShowSummaryRegenerateConfirm((open) => !open)
        }
      />
    )
  }

  return (
    <>
      <div ref={rootRef} className={widgetSurfaceClassName}>
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
                  {showCompanyWideBadge && (
                    <span className="ml-2 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-400">
                      Company-wide
                    </span>
                  )}
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
            </div>
          )}
        </div>

        <div ref={contentRef} className="shrink-0 px-4 pb-3">
          {activeTab === 'team' && showMyTeamTab
            ? renderTeamTab()
            : showCompanyTab
              ? renderCompanyTab()
              : null}
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
