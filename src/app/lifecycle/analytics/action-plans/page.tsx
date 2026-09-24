'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { UpcomingTasksGroup } from '@/components/empower/UpcomingTasksGroup'
import { HubCreateInitiativeModal } from '@/components/modules/actionPlans/HubCreateInitiativeModal'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { ACTION_PLANS_LIST } from '@/lib/actionPlans'
import { actionPlanningTerminology as t } from '@/lib/actionPlans/terminology'
import { InitiativeOverviewCard } from '@/components/modules/actionPlans/InitiativeOverviewCard'
import { notifyEmpowerDataChanged } from '@/lib/empowerEvents'
import { isTaskAssignedToUser } from '@/lib/empowerIntegration/storage'
import { getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import { getCurrentUser } from '@/lib/userContext'
import type { EmpowerInitiativeRecord, InitiativeTask } from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)

type InitiativeGroup = {
  initiative: EmpowerInitiativeRecord
  tasks: InitiativeTask[]
}

export default function ActionPlansOverviewPage() {
  const [groups, setGroups] = useState<InitiativeGroup[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const user = getCurrentUser()

  const refresh = useCallback(() => {
    const currentUser = getCurrentUser()
    setGroups(
      getVisibleInitiatives(currentUser)
        .map((initiative) => ({
          initiative,
          tasks: initiative.tasks.filter(
            (task) =>
              task.status !== 'completed' && isTaskAssignedToUser(task, currentUser.id),
          ),
        }))
        .filter((g) => g.tasks.length > 0),
    )
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const keyInitiatives = useMemo(() => {
    void groups
    return getVisibleInitiatives(user)
      .filter((i) => i.status === 'active' || i.status === 'new')
      .slice(0, 4)
  }, [user, groups])

  const openTaskCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.tasks.length, 0),
    [groups],
  )

  return (
    <PageShell>
      <PageHeader
        title={t.moduleName}
        description="Turn survey insights into initiatives your team can complete."
        className="bg-white"
      />
      <PageContent>
        <div className="mb-6">
          <WuButton variant="primary" onClick={() => setCreateOpen(true)}>
            + {t.newInitiative}
          </WuButton>
        </div>
        <section className="mb-10">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Active initiatives</h2>
            <Link href={ACTION_PLANS_LIST} className="text-sm text-blue-600 hover:underline">
              View all initiatives →
            </Link>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Includes initiatives you created, contribute to, or were invited to.
          </p>
          {keyInitiatives.length === 0 ? (
            <EmptyState
              icon="wm-flag"
              title="No active initiatives"
              description="Use Take action on a dashboard or AI Summary recommendations, or create a custom initiative here."
              action={
                <WuButton variant="primary" onClick={() => setCreateOpen(true)}>
                  + {t.newInitiative}
                </WuButton>
              }
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {keyInitiatives.map((plan) => (
                <InitiativeOverviewCard key={plan.id} plan={plan} user={user} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Your open tasks</h2>
            {openTaskCount > 0 ? (
              <span className="text-xs text-gray-500">
                {openTaskCount} assigned to you
              </span>
            ) : null}
          </div>
          <p className="mb-4 text-xs text-gray-500">
            Tasks where you are the owner or contributor, grouped by initiative.
          </p>
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
        </section>

        <HubCreateInitiativeModal
          open={createOpen}
          onClose={() => {
            setCreateOpen(false)
            refresh()
            notifyEmpowerDataChanged()
          }}
        />
      </PageContent>
    </PageShell>
  )
}
