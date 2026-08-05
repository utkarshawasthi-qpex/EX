'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { UpcomingTasksGroup } from '@/components/empower/UpcomingTasksGroup'
import { EmpowerEmptyState } from '@/components/empower/EmpowerEmptyState'
import { CreateInitiativeModal } from '@/components/empower/CreateInitiativeModal'
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

export default function EmpowerHomePage() {
  const [groups, setGroups] = useState<InitiativeGroup[]>([])
  const [createOpen, setCreateOpen] = useState(false)

  const refresh = useCallback(() => {
    const user = getCurrentUser()
    setGroups(
      getVisibleInitiatives(user).map((initiative) => ({
        initiative,
        tasks: initiative.tasks.filter((task) => isTaskAssignedToUser(task, user.id)),
      })),
    )
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[#1B2E4A]">Welcome to Empower</h1>
        <WuButton variant="primary" onClick={() => setCreateOpen(true)}>
          + New initiative
        </WuButton>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-medium text-[#374151]">Upcoming tasks</h2>

        {groups.length === 0 ? (
          <EmpowerEmptyState
            message="You don't currently have any pending tasks assigned to you"
            link={{ label: 'Go to Initiatives', href: '/empower/initiatives' }}
          />
        ) : (
          groups.map(({ initiative, tasks }) => (
            <UpcomingTasksGroup key={initiative.id} initiative={initiative} tasks={tasks} />
          ))
        )}
      </section>

      <CreateInitiativeModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          refresh()
          notifyEmpowerDataChanged()
        }}
      />
    </div>
  )
}
