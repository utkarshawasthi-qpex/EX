'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { UpcomingTasksGroup } from '@/components/empower/UpcomingTasksGroup'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { ACTION_PLANS_LIST, ACTION_PLANS_OVERVIEW, getVisibleInitiatives } from '@/lib/actionPlans'
import { actionPlanningTerminology as t } from '@/lib/actionPlans/terminology'
import { EMPOWER_DATA_CHANGED_EVENT } from '@/lib/empowerEvents'
import { isTaskAssignedToUser } from '@/lib/empowerIntegration/storage'
import { getCurrentUser } from '@/lib/userContext'
import type { EmpowerInitiativeRecord, InitiativeTask } from '@/types/empowerIntegration'

type InitiativeGroup = {
  initiative: EmpowerInitiativeRecord
  tasks: InitiativeTask[]
}

export default function MyTasksPage() {
  const [groups, setGroups] = useState<InitiativeGroup[]>([])

  const refresh = useCallback(() => {
    const currentUser = getCurrentUser()
    setGroups(
      getVisibleInitiatives(currentUser)
        .map((initiative) => ({
          initiative,
          tasks: initiative.tasks.filter(
            (task) => task.status !== 'completed' && isTaskAssignedToUser(task, currentUser.id),
          ),
        }))
        .filter((group) => group.tasks.length > 0),
    )
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(EMPOWER_DATA_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(EMPOWER_DATA_CHANGED_EVENT, refresh)
  }, [refresh])

  const openTaskCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.tasks.length, 0),
    [groups],
  )

  return (
    <PageShell>
      <PageHeader
        title="Your open tasks"
        description="Tasks where you are the owner or contributor, grouped by initiative."
        className="bg-white"
      />
      <PageContent>
        <Link
          href={ACTION_PLANS_OVERVIEW}
          className="mb-4 inline-block text-sm text-blue-600 hover:underline"
        >
          ← {t.moduleHome}
        </Link>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {openTaskCount > 0 ? `${openTaskCount} assigned to you` : 'Nothing assigned right now'}
          </p>
        </div>
        {groups.length === 0 ? (
          <EmptyState
            icon="wm-task"
            title="No open tasks assigned to you"
            description="When someone assigns you a task on an initiative, it appears here."
            action={
              <Link href={ACTION_PLANS_LIST} className="text-sm text-blue-600 hover:underline">
                Browse all initiatives
              </Link>
            }
          />
        ) : (
          groups.map(({ initiative, tasks }) => (
            <UpcomingTasksGroup key={initiative.id} initiative={initiative} tasks={tasks} />
          ))
        )}
      </PageContent>
    </PageShell>
  )
}
