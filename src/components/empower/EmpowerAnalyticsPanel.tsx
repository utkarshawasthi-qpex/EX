'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { DonutChart } from '@/components/empower/analytics/DonutChart'
import { getGoalColor } from '@/lib/empowerIntegration/helpers'
import { computeHomeAnalytics, type HomeAnalytics } from '@/lib/empowerIntegration/storage'
import { getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import { EMPOWER_DATA_CHANGED_EVENT } from '@/lib/empowerEvents'
import { getCurrentUser } from '@/lib/userContext'

const EMPTY_ANALYTICS: HomeAnalytics = {
  activeInitiatives: 0,
  tasksInProgress: 0,
  newIdeas: 0,
  topGoals: [],
  topContributors: [],
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-medium text-[#1B2E4A]">{children}</h2>
}

export function EmpowerAnalyticsPanel() {
  const pathname = usePathname()
  const [analytics, setAnalytics] = useState<HomeAnalytics>(EMPTY_ANALYTICS)

  const recompute = useCallback(() => {
    const user = getCurrentUser()
    setAnalytics(computeHomeAnalytics(user.id, getVisibleInitiatives(user)))
  }, [])

  useEffect(() => {
    recompute()
  }, [recompute, pathname])

  useEffect(() => {
    window.addEventListener(EMPOWER_DATA_CHANGED_EVENT, recompute)
    return () => window.removeEventListener(EMPOWER_DATA_CHANGED_EVENT, recompute)
  }, [recompute])

  const stats = [
    { value: analytics.activeInitiatives, label: 'Active initiatives' },
    { value: analytics.tasksInProgress, label: 'Tasks in progress' },
    { value: analytics.newIdeas, label: 'New ideas' },
  ]

  const totalGoalCount = analytics.topGoals.reduce((sum, goal) => sum + goal.count, 0)

  return (
    <aside className="w-[280px] shrink-0 overflow-y-auto border-l border-[#E5E7EB] bg-[#F4F6F9] p-6">
      <div className="grid grid-cols-3 rounded border border-[#E5E7EB] bg-white py-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={index > 0 ? 'border-l border-[#E5E7EB] px-2 text-center' : 'px-2 text-center'}
          >
            <p className="text-[28px] font-bold leading-none text-[#1B2E4A]">{stat.value}</p>
            <p className="mt-2 text-[11px] leading-tight text-[#6B7280]">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded border border-[#E5E7EB] bg-white p-4">
        <SectionHeading>Top goals</SectionHeading>
        {analytics.topGoals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="wc-analytics text-2xl leading-none text-[#D1D5DB]" aria-hidden />
            <p className="text-xs text-[#9CA3AF]">No Data</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <DonutChart
              centerLabel="Top goals"
              size={120}
              segments={analytics.topGoals.map((goal) => ({
                percent: totalGoalCount === 0 ? 0 : (goal.count / totalGoalCount) * 100,
                color: getGoalColor(goal.goalId),
              }))}
            />
            <ul className="w-full space-y-2">
              {analytics.topGoals.map((goal) => (
                <li key={goal.goalId} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: getGoalColor(goal.goalId) }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate text-[#374151]">{goal.label}</span>
                  <span className="text-[#6B7280]">
                    {totalGoalCount === 0 ? '0%' : `${Math.round((goal.count / totalGoalCount) * 100)}%`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-6 rounded border border-[#E5E7EB] bg-white p-4">
        <SectionHeading>Top contributors</SectionHeading>
        {analytics.topContributors.length === 0 ? (
          <p className="text-xs leading-relaxed text-[#6B7280]">
            Top contributors are recognized for closing the highest number of tasks each week. Stay
            focused, complete your tasks, and lead your team to the top.
          </p>
        ) : (
          <ul className="space-y-3">
            {analytics.topContributors.map((contributor) => (
              <li key={contributor.id} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1B87E6] text-[11px] font-semibold text-white">
                  {contributor.initials}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-[#374151]">
                  {contributor.name}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {contributor.taskCount} {contributor.taskCount === 1 ? 'task' : 'tasks'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}
