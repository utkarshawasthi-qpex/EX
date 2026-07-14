'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CreateActionPlanModal } from '@/components/modules/analytics/CreateActionPlanModal'
import { SummaryWidgetSections } from '@/components/modules/analytics/SummaryWidgetSections'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { SEED_SURVEY_DATA } from '@/data/mock/empowerIntegrationSeed'
import { RATER_GROUP_THRESHOLD } from '@/lib/empowerIntegration/aggregate'
import { build360LinkForCompetency } from '@/lib/empowerIntegration/dashboardLink'
import { getOrgSettings, isMarcusLeeSubject } from '@/lib/empowerIntegration/storage'
import { getCurrentUser } from '@/lib/userContext'
import { normalizeSummaryContent } from '@/lib/summaryStorage'
import type { SummaryAction, SummaryContent } from '@/types'

const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

const SURVEY_ID = 'surv_360_marcus_lee'

const DEV_RECOMMENDATIONS: SummaryAction[] = [
  {
    id: '360_rec_1',
    action: 'Share written priorities before each 1:1',
    timeframe: '30 days',
    owner: 'Manager',
    priority: 1,
    context: 'Closes the direction gap — others rate clarity significantly lower than self.',
  },
  {
    id: '360_rec_2',
    action: 'Practice active listening in team meetings',
    timeframe: '60 days',
    owner: 'Manager',
    priority: 2,
    context: 'Listening gap of −0.7 suggests others experience fewer opportunities to be heard.',
  },
  {
    id: '360_rec_3',
    action: 'Ask for feedback after key decisions',
    timeframe: '30 days',
    owner: 'Manager',
    priority: 3,
    context: 'Builds a feedback loop to validate direction with direct reports.',
  },
  {
    id: '360_rec_4',
    action: 'Schedule skip-level conversations quarterly',
    timeframe: '90 days',
    owner: 'Manager',
    priority: 4,
    context: 'Broadens perspective beyond immediate team on communication style.',
  },
]

function build360SummaryContent(userId: string): SummaryContent {
  const now = new Date().toISOString()
  return normalizeSummaryContent(
    {
      id: 'summary_360_marcus',
      scope: `team:${userId}`,
      createdBy: userId,
      visibility: 'private',
      publishedVersionId: 'v1',
      activeSummaryVersionId: 'v1',
      activeActionVersionIds: { 1: 'a1', 2: 'a2', 3: 'a3', 4: 'a4' },
      summaryVersions: [
        {
          versionId: 'v1',
          summary:
            'Your 360 results show a meaningful gap on direction-setting: others experience less clarity than you intend. Listening scores are closer, while developing others is a relative strength. Focus development plans on closing the direction blind spot with explicit communication habits.',
          generatedAt: now,
        },
      ],
      actionVersions: {
        1: [{ versionId: 'a1', ...DEV_RECOMMENDATIONS[0], generatedAt: now }],
        2: [{ versionId: 'a2', ...DEV_RECOMMENDATIONS[1], generatedAt: now }],
        3: [{ versionId: 'a3', ...DEV_RECOMMENDATIONS[2], generatedAt: now }],
        4: [{ versionId: 'a4', ...DEV_RECOMMENDATIONS[3], generatedAt: now }],
      },
      generatedBy: userId,
      dashboardDataSnapshot: SURVEY_ID,
    },
    { scope: `team:${userId}`, createdBy: userId, visibility: 'private' },
  )
}

export default function My360ReportPage() {
  const router = useRouter()
  const user = getCurrentUser()
  const survey = SEED_SURVEY_DATA.surveys360[SURVEY_ID]
  const settings = getOrgSettings()
  const [actionOpen, setActionOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<SummaryAction | null>(null)
  const [selectedCompetencyId, setSelectedCompetencyId] = useState('comp_direction')
  const [content, setContent] = useState<SummaryContent>(() => build360SummaryContent(user.id))

  useEffect(() => {
    if (!isMarcusLeeSubject(user)) {
      router.replace('/360/surveys')
    }
  }, [user, router])

  const linkContext = useMemo(() => {
    return build360LinkForCompetency(SURVEY_ID, selectedCompetencyId)
  }, [selectedCompetencyId])

  if (!isMarcusLeeSubject(user) || !survey) return null

  function handleCreatePlan(action: SummaryAction) {
    const competencyId =
      action.priority === 1 ? 'comp_direction' : action.priority === 2 ? 'comp_listening' : 'comp_direction'
    setSelectedCompetencyId(competencyId)
    setSelectedAction(action)
    setActionOpen(true)
  }

  return (
    <PageShell>
      <PageHeader
        title={survey.subjectName}
        description={`${survey.cycleLabel} · ${survey.totalRatersResponded} of ${survey.totalRatersInvited} raters responded`}
      />
      <PageContent>
        <section className="mb-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-2">Competency</th>
                <th className="px-3 py-2">Self</th>
                <th className="px-3 py-2">Manager</th>
                <th className="px-3 py-2">Peers</th>
                <th className="px-3 py-2">Direct Reports</th>
                <th className="px-3 py-2">Others avg</th>
                <th className="px-3 py-2">Gap</th>
              </tr>
            </thead>
            <tbody>
              {survey.competencies.map((comp) => {
                const renderGroup = (value: number | undefined, count: number | undefined) => {
                  if ((count ?? 0) < RATER_GROUP_THRESHOLD) {
                    return (
                      <span title="Below rater minimum" className="text-gray-400">
                        —
                      </span>
                    )
                  }
                  return value?.toFixed(1) ?? '—'
                }

                const gapColor =
                  comp.gap !== null && comp.gap < 0
                    ? 'text-red-600'
                    : comp.gap !== null && comp.gap > 0
                      ? 'text-green-600'
                      : 'text-gray-600'

                return (
                  <tr key={comp.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{comp.label}</td>
                    <td className="px-3 py-3">{comp.scores.self?.toFixed(1) ?? '—'}</td>
                    <td className="px-3 py-3">
                      {renderGroup(comp.scores.manager, comp.scores.respondentCounts.manager)}
                    </td>
                    <td className="px-3 py-3">
                      {renderGroup(comp.scores.peers, comp.scores.respondentCounts.peers)}
                    </td>
                    <td className="px-3 py-3">
                      {renderGroup(comp.scores.directReports, comp.scores.respondentCounts.directReports)}
                    </td>
                    <td className="px-3 py-3">{comp.othersAvg?.toFixed(1) ?? '—'}</td>
                    <td className={`px-3 py-3 font-medium ${gapColor}`}>
                      {comp.gap !== null ? comp.gap.toFixed(1) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <section className="mb-6 grid gap-3 md:grid-cols-3">
          {survey.competencies
            .filter((comp) => comp.gap !== null && comp.gap < 0)
            .sort((a, b) => (a.gap ?? 0) - (b.gap ?? 0))
            .slice(0, 3)
            .map((comp) => (
              <div key={comp.id} className="rounded-lg border border-red-100 bg-red-50 p-4">
                <WuText size="sm" as="p" className="font-medium text-red-900">
                  Blind spot: {comp.label}
                </WuText>
                <WuText size="sm" as="p" className="mt-1 text-sm text-red-800">
                  Others rate you {Math.abs(comp.gap ?? 0).toFixed(1)} points lower than your self-rating.
                </WuText>
              </div>
            ))}
        </section>

        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <WuText size="sm" as="div" className="mb-3 font-semibold text-gray-900">
            AI Summary &amp; Recommendations
          </WuText>
          <SummaryWidgetSections
            content={content}
            onContentChange={setContent}
            onCreateActionPlan={handleCreatePlan}
            canCreateActionPlan
            canSeeActions
            canShowFeedback={false}
          />
        </section>

        <footer className="rounded border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
          Your individual results and development plans are private.
          {settings.shareDevelopmentWithManager ? ' Visible to you and your manager.' : ''}
        </footer>
      </PageContent>

      {selectedAction && linkContext?.link && linkContext.meetsThreshold && (
        <CreateActionPlanModal
          open={actionOpen}
          onClose={() => setActionOpen(false)}
          action={selectedAction}
          inheritedLink={linkContext.link}
          scopeLabel={linkContext.scopeLabel}
          provenance={{
            sourceSummaryVersionId: 'v1',
            sourceWidgetId: 'widget_360_summary',
            promptVersion: '1.0',
            recommendationPriority: selectedAction.priority,
          }}
          initiativeClass="development"
          lockOwner
          visibilityNote={
            settings.shareDevelopmentWithManager
              ? 'Visible to you and your manager'
              : 'Private to you'
          }
        />
      )}
    </PageShell>
  )
}
