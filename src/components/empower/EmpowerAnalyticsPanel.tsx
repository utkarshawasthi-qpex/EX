'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import {
  EMPOWER_SIMULATION_CHANGED_EVENT,
  getCurrentEmpowerUser,
  getHomeAnalytics,
} from '@/lib/empower/simulation'
import { EMPOWER_GOALS } from '@/types/empower'

const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuText })),
  { ssr: false },
)

function EmptyAnalyticsState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center py-7 text-center">
      <span className="wc-analytics text-3xl text-gray-300" aria-hidden />
      <WuText size="sm" as="p" className="mt-2 text-xs leading-5 text-gray-400">
        {message}
      </WuText>
    </div>
  )
}

export function EmpowerAnalyticsPanel() {
  const [refreshKey, setRefreshKey] = useState(0)
  const user = getCurrentEmpowerUser()
  const analytics = getHomeAnalytics(user.id)
  void refreshKey
  const maxGoalCount = Math.max(1, ...analytics.topGoals.map((goal) => goal.count))

  useEffect(() => {
    const handleChange = () => setRefreshKey((current) => current + 1)
    window.addEventListener(EMPOWER_SIMULATION_CHANGED_EVENT, handleChange)
    return () => window.removeEventListener(EMPOWER_SIMULATION_CHANGED_EVENT, handleChange)
  }, [])

  const stats = [
    { value: analytics.activeInitiatives, label: 'Active initiatives' },
    { value: analytics.tasksInProgress, label: 'Tasks in progress' },
    { value: analytics.newIdeas, label: 'New ideas' },
  ]

  return (
    <aside className="h-[calc(100vh-48px)] w-[280px] shrink-0 overflow-y-auto border-l border-[#E5E7EB] bg-[#F4F6F9] p-6">
      <div className="grid grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={index > 0 ? 'border-l border-[#E5E7EB] pl-3' : 'pr-3'}
          >
            <div className="text-[28px] font-bold leading-none text-[#1B2E4A]">
              {stat.value}
            </div>
            <div className="mt-2 text-[11px] leading-4 text-[#6B7280]">{stat.label}</div>
          </div>
        ))}
      </div>

      <section className="mt-8 border-t border-[#E5E7EB] pt-6">
        <WuHeading size="sm" className="text-[#374151]">
          Top goals
        </WuHeading>
        {analytics.topGoals.length > 0 ? (
          <div className="mt-4 space-y-3">
            {analytics.topGoals.map((goal) => {
              const color =
                EMPOWER_GOALS.find((item) => item.id === goal.goalId)?.color ?? '#6B7280'
              return (
                <div key={goal.goalId}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-[#6B7280]">{goal.label}</span>
                    <span className="font-medium text-[#374151]">{goal.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: color,
                        width: `${Math.max(12, (goal.count / maxGoalCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyAnalyticsState message="No Data" />
        )}
      </section>

      <section className="mt-8 border-t border-[#E5E7EB] pt-6">
        <WuHeading size="sm" className="text-[#374151]">
          Top contributors
        </WuHeading>
        {analytics.topContributors.length > 0 ? (
          <div className="mt-4 space-y-3">
            {analytics.topContributors.slice(0, 3).map(({ user: contributor, taskCount }) => (
              <div key={contributor.id} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1B87E6] text-[11px] font-semibold text-white">
                  {contributor.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <WuText size="sm" as="p" className="truncate font-medium text-[#374151]">
                    {contributor.name}
                  </WuText>
                  <WuText size="sm" as="p" className="text-[11px] text-[#6B7280]">
                    {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                  </WuText>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyAnalyticsState message="Top contributors are recognized for closing the highest number of tasks each week. Stay focused, complete your tasks, and lead your team to the top." />
        )}
      </section>
    </aside>
  )
}
