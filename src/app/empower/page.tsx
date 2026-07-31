'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EmpowerEmptyState } from '@/components/empower/EmpowerEmptyState'
import { TaskRow } from '@/components/empower/primitives/TaskRow'
import { CreateInitiativeModal } from '@/components/modules/empower/CreateInitiativeModal'
import { notifyEmpowerDataChanged } from '@/lib/empowerEvents'
import {
  getUpcomingTasksForUser,
  upsertInitiative,
  type UpcomingTask,
} from '@/lib/empowerIntegration/storage'
import { getVisibleInitiatives } from '@/lib/empowerIntegration/visibility'
import { getCurrentUser } from '@/lib/userContext'
import type { EmpowerInitiativeRecord, InitiativeTask } from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)

export default function EmpowerHomePage() {
  const { showToast } = useWuShowToast()
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([])
  const [createOpen, setCreateOpen] = useState(false)

  const refresh = useCallback(() => {
    const user = getCurrentUser()
    setUpcomingTasks(getUpcomingTasksForUser(user.id, getVisibleInitiatives(user)))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function toggleTask(initiative: EmpowerInitiativeRecord, task: InitiativeTask) {
    const done = !task.done
    upsertInitiative({
      ...initiative,
      tasks: initiative.tasks.map((item) => (item.id === task.id ? { ...item, done } : item)),
      history: [
        ...initiative.history,
        {
          at: new Date().toISOString(),
          event: `Task "${task.text}" marked ${done ? 'complete' : 'open'}`,
        },
      ],
    })
    refresh()
    notifyEmpowerDataChanged()
    showToast({
      variant: 'success',
      message: done ? 'Task marked complete' : 'Task reopened',
    })
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-[#1B2E4A]">Welcome to Empower</h1>

      <div className="mb-8">
        <WuButton variant="primary" onClick={() => setCreateOpen(true)}>
          + New initiative
        </WuButton>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-medium text-[#6B7280]">Upcoming tasks</h2>
        {upcomingTasks.length === 0 ? (
          <EmpowerEmptyState
            message="You don't currently have any pending tasks assigned to you"
            link={{ label: 'Go to Initiatives', href: '/empower/initiatives' }}
          />
        ) : (
          <div className="space-y-2">
            {upcomingTasks.map(({ task, initiative }) => (
              <TaskRow
                key={task.id}
                task={task}
                initiative={initiative}
                onToggle={() => toggleTask(initiative, task)}
              />
            ))}
          </div>
        )}
      </section>

      <CreateInitiativeModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          refresh()
          notifyEmpowerDataChanged()
          showToast({ variant: 'success', message: 'Initiative created' })
        }}
      />
    </div>
  )
}
