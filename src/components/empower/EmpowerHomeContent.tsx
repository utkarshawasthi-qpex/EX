'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { TaskRow } from '@/components/empower/primitives/TaskRow'
import {
  EMPOWER_OPEN_CREATE_EVENT,
  getCurrentEmpowerUser,
  getUpcomingTasks,
  updateTaskStatus,
} from '@/lib/empower/simulation'
import type { TaskStatus } from '@/types/empower'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuButton })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuText })),
  { ssr: false },
)

export function EmpowerHomeContent() {
  const [refreshKey, setRefreshKey] = useState(0)
  const user = getCurrentEmpowerUser()
  const upcomingTasks = getUpcomingTasks(user.id)
  void refreshKey

  const handleStatusChange = (
    taskId: string,
    initiativeId: string,
    status: TaskStatus,
  ) => {
    updateTaskStatus(taskId, initiativeId, status)
    setRefreshKey((current) => current + 1)
  }

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <div className="flex items-start justify-between gap-6">
        <div>
          <WuHeading size="xl" className="text-[#1B2E4A]">
            Welcome to Empower
          </WuHeading>
          <WuText size="sm" as="p" className="mt-2 text-[#6B7280]">
            Turn employee feedback into focused initiatives and measurable action.
          </WuText>
        </div>
        <WuButton
          variant="primary"
          onClick={() => window.dispatchEvent(new Event(EMPOWER_OPEN_CREATE_EVENT))}
        >
          + New initiative
        </WuButton>
      </div>

      <section className="mt-12">
        <WuHeading size="md" className="text-[#374151]">
          Upcoming tasks
        </WuHeading>
        {upcomingTasks.length > 0 ? (
          <div className="mt-4 space-y-2">
            {upcomingTasks.map(({ task, initiative }) => (
              <TaskRow
                key={task.id}
                task={task}
                initiative={initiative}
                showInitiative
                onStatusChange={(status) =>
                  handleStatusChange(task.id, initiative.id, status)
                }
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 flex min-h-56 flex-col items-center justify-center rounded border border-[#E5E7EB] bg-[#FAFAFA] px-6 text-center">
            <span className="wm-check-circle text-4xl text-gray-300" aria-hidden />
            <WuHeading size="sm" className="mt-3 text-[#374151]">
              No upcoming tasks
            </WuHeading>
            <WuText size="sm" as="p" className="mt-1 text-[#6B7280]">
              You are all caught up. New tasks will appear here.
            </WuText>
          </div>
        )}
      </section>
    </div>
  )
}
