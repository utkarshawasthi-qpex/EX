'use client'

import { useCallback, useEffect, useState } from 'react'
import { DonutChart } from '@/components/empower/analytics/DonutChart'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { getGoalColor } from '@/lib/empowerIntegration/helpers'
import { computeHomeAnalytics, type HomeAnalytics } from '@/lib/empowerIntegration/storage'
import { getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import { EMPOWER_DATA_CHANGED_EVENT } from '@/lib/empowerEvents'
import { getCurrentUser } from '@/lib/userContext'

const EMPTY: HomeAnalytics = {
  activeInitiatives: 0,
  tasksInProgress: 0,
  newIdeas: 0,
  topGoals: [],
  topContributors: [],
}

export default function ActionPlansAnalyticsPage() {
  const [analytics, setAnalytics] = useState<HomeAnalytics>(EMPTY)

  const recompute = useCallback(() => {
    const user = getCurrentUser()
    setAnalytics(computeHomeAnalytics(user.id, getVisibleInitiatives(user)))
  }, [])

  useEffect(() => {
    recompute()
    window.addEventListener(EMPOWER_DATA_CHANGED_EVENT, recompute)
    return () => window.removeEventListener(EMPOWER_DATA_CHANGED_EVENT, recompute)
  }, [recompute])

  const totalGoalCount = analytics.topGoals.reduce((sum, g) => sum + g.count, 0)

  return (
    <PageShell>
      <PageHeader
        title="Action planning analytics"
        description="Progress across your team's initiatives."
        className="bg-white"
      />
      <PageContent>
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Active initiatives" value={analytics.activeInitiatives} />
          <StatCard label="Tasks in progress" value={analytics.tasksInProgress} />
          <StatCard label="Ideas (coming soon)" value={analytics.newIdeas} />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Top goals</h2>
            {analytics.topGoals.length === 0 ? (
              <p className="text-sm text-gray-500">No goal data yet.</p>
            ) : (
              <div className="flex items-center gap-6">
                <DonutChart
                  centerLabel="Top goals"
                  segments={analytics.topGoals.map((g) => ({
                    percent: totalGoalCount === 0 ? 0 : (g.count / totalGoalCount) * 100,
                    color: getGoalColor(g.goalId),
                  }))}
                />
                <ul className="space-y-1 text-sm text-gray-700">
                  {analytics.topGoals.map((g) => (
                    <li key={g.goalId}>
                      {g.label}: {g.count}
                      {totalGoalCount > 0 ? ` (${Math.round((g.count / totalGoalCount) * 100)}%)` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-800">Top contributors</h2>
            {analytics.topContributors.length === 0 ? (
              <p className="text-sm text-gray-500">No contributor data yet.</p>
            ) : (
              <ol className="space-y-2">
                {analytics.topContributors.map((c, index) => (
                  <li key={c.id} className="flex items-center gap-3 text-sm">
                    <span className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
                      {c.initials}
                    </span>
                    <span className="flex-1 font-medium text-gray-800">
                      {index + 1}. {c.name}
                    </span>
                    <span className="text-gray-500">{c.taskCount} tasks</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </PageContent>
    </PageShell>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
}
