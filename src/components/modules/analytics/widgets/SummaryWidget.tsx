'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CreateActionPlanModal } from '@/components/modules/analytics/CreateActionPlanModal'
import { useDashboardWidgetContext } from '@/components/modules/analytics/DashboardWidgetContext'
import { SummarySettingsModal } from '@/components/modules/analytics/SummarySettingsModal'
import {
  SummaryRegenerateModal,
  type RegenerateModalContext,
} from '@/components/modules/analytics/SummaryRegenerateModal'
import {
  MAX_REGENERATIONS,
  SummaryWidgetSections,
} from '@/components/modules/analytics/SummaryWidgetSections'
import { useReportWidgetHeight } from '@/components/modules/analytics/useReportWidgetHeight'
import { WidgetKebabMenu } from '@/components/modules/analytics/widgets/WidgetKebabMenu'
import { widgetSurfaceClassName } from '@/components/modules/analytics/widgets/WidgetCardShell'
import {
  getSourceWidgetIdsForAction,
  resolveDashboardScope,
  resolveSurveyLinkForAction,
} from '@/lib/empowerIntegration/dashboardLink'
import {
  generateDashboardSummary,
  generateFullUpdate,
  generateRecommendationsOnlyRegeneration,
  generateSummaryOnlyRegeneration,
} from '@/lib/buildSummaryPrompt'
import { activeFiltersToLabels } from '@/lib/dashboardFilters'
import { normalizeSummaryAdminConfig } from '@/lib/normalizeSummaryConfig'
import {
  canGenerateSummary,
  canRateSummary,
  canRegenerateSummary,
  isSharedSummaryViewer,
} from '@/lib/summaryPermissions'
import {
  applyFullUpdate,
  applyRecommendationsRegeneration,
  applySummaryRegeneration,
  markSummaryStale,
  resolveSummaryContentForViewer,
  setLinkedInitiativeOnRecommendation,
} from '@/lib/summaryContent'
import {
  clearCachedCompanySummary,
  getCachedCompanySummary,
  getCachedManagerSummary,
  normalizeSummaryContent,
  saveCachedCompanySummary,
  saveCachedManagerSummary,
} from '@/lib/summaryStorage'
import { canSeeCompanySummary } from '@/lib/summaryVisibility'
import { getCurrentUser, isManagerUser } from '@/lib/userContext'
import { cn } from '@/lib/utils'
import type {
  ActiveFilter,
  DashboardWidget,
  ManagerSummaryCache,
  SummaryAction,
  SummaryContent,
  SummaryPriority,
  ViewerCapabilities,
} from '@/types'
import type {
  InitiativeProvenance,
  SurveyLink,
  SurveyLinkCandidate,
} from '@/types/empowerIntegration'

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
  activeFilters?: ActiveFilter[]
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
  const isFirstFilterRender = useRef(true)

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
  const [regenerateModalContext, setRegenerateModalContext] =
    useState<RegenerateModalContext | null>(null)
  const [regeneratingSummary, setRegeneratingSummary] = useState(false)
  const [regeneratingRecommendations, setRegeneratingRecommendations] = useState(false)
  const [actionPlanOpen, setActionPlanOpen] = useState(false)
  const [actionPlanAction, setActionPlanAction] = useState<SummaryAction | null>(null)
  const [actionPlanLink, setActionPlanLink] = useState<SurveyLink | null>(null)
  const [actionPlanCandidates, setActionPlanCandidates] = useState<SurveyLinkCandidate[]>([])
  const [actionPlanProvenance, setActionPlanProvenance] = useState<InitiativeProvenance | null>(null)

  const [isGeneratingTeam, setIsGeneratingTeam] = useState(false)
  const [teamError, setTeamError] = useState<'api_error' | null>(null)

  const canGenerateCompany = canGenerateSummary(config, currentUser, isAdmin, 'company')
  const canGenerateTeam = canGenerateSummary(config, currentUser, isAdmin, 'team')

  const canSeeActions = activeTab === 'company' ? isAdmin : activeTab === 'team'
  const canRegenerateCompany = canRegenerateSummary(
    config,
    currentUser,
    isAdmin,
    'company',
    Boolean(config.companyContent?.summary),
  )
  const canRegenerateTeam = canRegenerateSummary(
    config,
    currentUser,
    isAdmin,
    'team',
    Boolean(myTeamCache?.content.summary),
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
    isFirstFilterRender.current = true
  }, [widget.id])

  useEffect(() => {
    if (showMyTeamTab) {
      setActiveTab('team')
    } else if (showCompanyTab) {
      setActiveTab('company')
    }
  }, [showCompanyTab, showMyTeamTab])

  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false
      return
    }

    if (config.companyContent?.summary) {
      const normalized = normalizeSummaryContent(config.companyContent, config.createdBy)
      handleCompanyContentChange(markSummaryStale(normalized))
    }

    if (myTeamCache?.content.summary) {
      handleTeamContentChange(markSummaryStale(myTeamCache.content))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters])

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

  async function runRegeneration(context: RegenerateModalContext, guidance: string) {
    const viewType = activeTab === 'team' ? 'team' : 'company'
    const currentContent =
      activeTab === 'company'
        ? config.companyContent
          ? normalizeSummaryContent(config.companyContent, config.createdBy)
          : null
        : myTeamCache
          ? normalizeSummaryContent(myTeamCache.content, myTeamCache.userId)
          : null

    if (!currentContent) return

    if (
      context === 'summary' &&
      currentContent.summaryRegenerationsUsed >= MAX_REGENERATIONS
    ) {
      return
    }

    if (
      context === 'recommendations' &&
      currentContent.recsRegenerationsUsed >= MAX_REGENERATIONS
    ) {
      return
    }

    if (context === 'full') {
      setRegeneratingSummary(true)
      setRegeneratingRecommendations(true)
      try {
        const { summary, actions } = await generateFullUpdate(dataWidgets, activeFilters, {
          viewType,
          guidance: guidance || undefined,
        })
        const updated = applyFullUpdate(
          currentContent,
          summary,
          actions,
          activeTab === 'company' ? config.createdBy : currentUser.id,
        )
        if (activeTab === 'company') {
          handleCompanyContentChange(updated)
        } else {
          handleTeamContentChange(updated)
        }
      } finally {
        setRegeneratingSummary(false)
        setRegeneratingRecommendations(false)
      }
      return
    }

    if (context === 'summary') {
      setRegeneratingSummary(true)
      try {
        const summary = await generateSummaryOnlyRegeneration(
          dataWidgets,
          activeFilters,
          viewType,
          guidance || undefined,
        )
        const updated = applySummaryRegeneration(currentContent, summary)
        if (activeTab === 'company') {
          handleCompanyContentChange(updated)
        } else {
          handleTeamContentChange(updated)
        }
      } finally {
        setRegeneratingSummary(false)
      }
      return
    }

    setRegeneratingRecommendations(true)
    try {
      const actions = await generateRecommendationsOnlyRegeneration(
        dataWidgets,
        activeFilters,
        currentContent.summary,
        guidance || undefined,
      )
      const updated = applyRecommendationsRegeneration(currentContent, actions)
      if (activeTab === 'company') {
        handleCompanyContentChange(updated)
      } else {
        handleTeamContentChange(updated)
      }
    } finally {
      setRegeneratingRecommendations(false)
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
    const tabScope = resolveDashboardScope(activeTab, currentUser.id)
    const sourceWidgetIds = getSourceWidgetIdsForAction(action, dashboardWidgets)
    const resolution = resolveSurveyLinkForAction(sourceWidgetIds, dashboardWidgets, tabScope, action)

    const contentForProvenance =
      activeTab === 'company' ? config.companyContent : myTeamCache?.content
    const versionId = contentForProvenance?.generatedAt ?? 'current'
    const primaryWidgetId = sourceWidgetIds[0] ?? widget.id

    setActionPlanAction(action)
    setActionPlanProvenance({
      sourceSummaryVersionId: versionId,
      sourceWidgetId: primaryWidgetId,
      promptVersion: '1.0',
      recommendationPriority: action.priority,
    })

    if (resolution.type === 'auto') {
      setActionPlanLink(resolution.link)
      setActionPlanCandidates([])
    } else if (resolution.type === 'confirm') {
      setActionPlanLink(null)
      setActionPlanCandidates(resolution.candidates)
    } else {
      setActionPlanLink(null)
      setActionPlanCandidates([])
    }
    setActionPlanOpen(true)
  }

  function handleActionPlanCreated(initiativeId: string, priority: SummaryPriority) {
    if (activeTab === 'company' && config.companyContent) {
      const normalized = normalizeSummaryContent(config.companyContent, config.createdBy)
      handleCompanyContentChange(setLinkedInitiativeOnRecommendation(normalized, priority, initiativeId))
    } else if (activeTab === 'team' && myTeamCache) {
      handleTeamContentChange(
        setLinkedInitiativeOnRecommendation(myTeamCache.content, priority, initiativeId),
      )
    }
  }

  const companyContent = config.companyContent
    ? normalizeSummaryContent(config.companyContent, config.createdBy)
    : undefined

  const companyResolved = companyContent
    ? resolveSummaryContentForViewer(companyContent, {
        isSharedViewer: isSharedSummaryViewer(currentUser, config),
        visibility: config.visibility,
      })
    : null

  const teamContent = myTeamCache
    ? normalizeSummaryContent(myTeamCache.content, myTeamCache.userId)
    : undefined

  const teamResolved = teamContent
    ? resolveSummaryContentForViewer(teamContent, {
        isSharedViewer: false,
        visibility: 'private',
      })
    : null

  const companyGenerating = config.isGenerating
  const companyError = config.generationError

  const companySharedViewer = isSharedSummaryViewer(currentUser, config)
  const canCreateActionPlan =
    canSeeActions && !(activeTab === 'company' && companySharedViewer) && !currentUser.isImpersonating

  const showCompanyWideBadge =
    !isAdmin && activeTab === 'company' && Boolean(companyContent)

  const activeContent =
    activeTab === 'team' && showMyTeamTab ? teamResolved?.content : companyResolved?.content

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
      regeneratingRecommendations,
      activeContent?.isStale,
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
            The dashboard owner has not shared a summary for viewers yet.
          </p>
        </div>
      )
    }

    const displayContent = companyResolved.content

    return (
      <SummaryWidgetSections
        content={displayContent}
        onContentChange={handleCompanyContentChange}
        onCreateActionPlan={handleCreateActionPlan}
        canShowFeedback={canRateSummary(currentUser, config)}
        canSeeActions={canSeeActions}
        canCreateActionPlan={canCreateActionPlan}
        showRestrictedNote={!canSeeActions && !isAdmin}
        canRegenerate={canRegenerateCompany}
        onOpenRegenerateModal={setRegenerateModalContext}
        regeneratingSummary={regeneratingSummary}
        regeneratingRecommendations={regeneratingRecommendations}
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
      const filterLabels = activeFiltersToLabels(activeFilters)
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
          {filterLabels.length > 0 && (
            <div className="mb-4 flex flex-wrap justify-center gap-1">
              {filterLabels.map((filter) => (
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

    return (
      <SummaryWidgetSections
        content={teamResolved.content}
        onContentChange={handleTeamContentChange}
        onCreateActionPlan={handleCreateActionPlan}
        canShowFeedback={canRateSummary(currentUser, config)}
        canSeeActions
        canCreateActionPlan
        canRegenerate={canRegenerateTeam}
        onOpenRegenerateModal={setRegenerateModalContext}
        regeneratingSummary={regeneratingSummary}
        regeneratingRecommendations={regeneratingRecommendations}
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

        <div ref={contentRef} className="min-h-0 flex-1 overflow-auto px-4 pb-3">
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

      <SummaryRegenerateModal
        open={regenerateModalContext !== null}
        context={regenerateModalContext}
        summaryRegenerationsUsed={activeContent?.summaryRegenerationsUsed ?? 0}
        recsRegenerationsUsed={activeContent?.recsRegenerationsUsed ?? 0}
        maxRegenerations={MAX_REGENERATIONS}
        onClose={() => setRegenerateModalContext(null)}
        onConfirm={(guidance) => {
          if (regenerateModalContext) {
            void runRegeneration(regenerateModalContext, guidance)
          }
        }}
      />

      {actionPlanAction && actionPlanProvenance && (
        <CreateActionPlanModal
          open={actionPlanOpen}
          onClose={() => {
            setActionPlanOpen(false)
            setActionPlanAction(null)
            setActionPlanProvenance(null)
          }}
          action={actionPlanAction}
          inheritedLink={actionPlanLink}
          linkCandidates={actionPlanCandidates}
          provenance={actionPlanProvenance}
          activeTab={activeTab}
          onCreated={(initiativeId) =>
            handleActionPlanCreated(initiativeId, actionPlanAction.priority)
          }
        />
      )}
    </>
  )
}
