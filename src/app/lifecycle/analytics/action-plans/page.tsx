'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { HubCreateInitiativeModal } from '@/components/modules/actionPlans/HubCreateInitiativeModal'
import {
  ACTION_PLANS_ANALYTICS,
  ACTION_PLANS_LIST,
  ACTION_PLANS_MY_TASKS,
  ACTION_PLANS_TEAM,
  actionPlanDetailPath,
  computeActionPlanProgress,
  computeHomeAnalytics,
  formatDueDate,
  getEmployeeInitials,
  getUpcomingTasksForUser,
  getVisibleInitiatives,
} from '@/lib/actionPlans'
import {
  initiativeAccessForUser,
  initiativeRoleBadge,
  initiativeVisibilityReason,
  taskInvolvementForUser,
  type InitiativeAccessKind,
} from '@/lib/actionPlans/initiativeAccessLabel'
import { getTeamMemberSnapshots } from '@/lib/actionPlans/teamView'
import { actionPlanningTerminology as t } from '@/lib/actionPlans/terminology'
import { cn } from '@/lib/utils'
import { EMPOWER_DATA_CHANGED_EVENT, notifyEmpowerDataChanged } from '@/lib/empowerEvents'
import { getCurrentUser } from '@/lib/userContext'
import type { EmpowerInitiativeRecord } from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false },
)
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false },
)

export default function ActionPlansOverviewPage() {
  const [initiatives, setInitiatives] = useState<EmpowerInitiativeRecord[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const user = getCurrentUser()

  const refresh = useCallback(() => {
    setInitiatives(getVisibleInitiatives(getCurrentUser()))
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(EMPOWER_DATA_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(EMPOWER_DATA_CHANGED_EVENT, refresh)
  }, [refresh])

  const activeInitiatives = useMemo(
    () => initiatives.filter((initiative) => initiative.status === 'active' || initiative.status === 'new'),
    [initiatives],
  )
  const upcomingTasks = useMemo(
    () => getUpcomingTasksForUser(user.id, initiatives),
    [initiatives, user.id],
  )
  const team = useMemo(
    () => getTeamMemberSnapshots(user.id, initiatives),
    [initiatives, user.id],
  )
  const analytics = useMemo(
    () => computeHomeAnalytics(user.id, initiatives),
    [initiatives, user.id],
  )
  const analyticsEmpty =
    analytics.activeInitiatives === 0 && analytics.tasksInProgress === 0 && analytics.newIdeas === 0

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white px-8 py-4">
      <div className="shrink-0">
        <WuHeading size="xl" className="text-gray-900">
          {t.moduleName}
        </WuHeading>
        <div className="mt-4">
          <WuButton variant="primary" onClick={() => setCreateOpen(true)}>
            + {t.newInitiative}
          </WuButton>
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <section className="shrink-0 rounded-xl border border-gray-200 bg-white px-5 py-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">At a glance</h2>
            <Link href={ACTION_PLANS_ANALYTICS} className="shrink-0 text-sm text-[#1B87E6] hover:underline">
              View analytics →
            </Link>
          </div>
          {analyticsEmpty ? (
            <p className="py-2 text-sm text-gray-500">
              Counts show up here once initiatives and tasks are underway.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <GlanceTile value={analytics.activeInitiatives} label="Active initiatives" />
              <GlanceTile value={analytics.tasksInProgress} label="Tasks in progress" />
              <GlanceTile value={analytics.newIdeas} label="Ideas" badge="Coming soon" />
            </div>
          )}
        </section>

        <div className="grid shrink-0 items-stretch gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
          <section className="flex h-[21rem] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-3">
            <div className="mb-2 flex shrink-0 items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Active initiatives</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Ones you created, contribute to, or were invited to.
                </p>
              </div>
              <Link href={ACTION_PLANS_LIST} className="shrink-0 text-sm text-[#1B87E6] hover:underline">
                View all
              </Link>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {activeInitiatives.length === 0 ? (
                <BlockNote
                  text="No active initiatives yet. Create one here, or use Take action on a dashboard or AI Summary."
                  action={
                    <WuButton variant="secondary" onClick={() => setCreateOpen(true)}>
                      + {t.newInitiative}
                    </WuButton>
                  }
                />
              ) : (
                <>
                  <ul
                    className={cn(
                      'grid min-h-0 gap-2 overflow-y-auto sm:grid-cols-2',
                      activeInitiatives.length > 2 ? 'flex-1' : 'max-h-[72%] shrink-0',
                    )}
                  >
                    {activeInitiatives.map((plan) => (
                      <InitiativeCard key={plan.id} plan={plan} userId={user.id} user={user} />
                    ))}
                  </ul>
                  {activeInitiatives.length <= 2 ? (
                    <BlockNote text="Create another initiative, or open the full list to see every one you can access." />
                  ) : null}
                </>
              )}
            </div>
          </section>

          <section className="flex h-[21rem] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-3">
            <div className="mb-2 flex shrink-0 items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Your open tasks</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Next up, where you are the owner or a contributor.
                </p>
              </div>
              <Link href={ACTION_PLANS_MY_TASKS} className="shrink-0 text-sm text-[#1B87E6] hover:underline">
                View all
              </Link>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {upcomingTasks.length === 0 ? (
                <BlockNote
                  text="No open tasks yet. Tasks you own or contribute to will show up here."
                  action={
                    <Link href={ACTION_PLANS_LIST} className="text-sm text-[#1B87E6] hover:underline">
                      Browse initiatives
                    </Link>
                  }
                />
              ) : (
                <>
                  <ul
                    className={cn(
                      'min-h-0 overflow-y-auto',
                      upcomingTasks.length >= 4 ? 'flex-1' : 'max-h-[72%] shrink-0',
                    )}
                  >
                    {upcomingTasks.map(({ task, initiative }) => {
                      const overdue = Boolean(task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10))
                      return (
                        <li key={task.id} className="border-b border-gray-100 last:border-0">
                          <Link
                            href={actionPlanDetailPath(initiative.id)}
                            className="flex items-start gap-3 py-2"
                          >
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#1B87E6]" aria-hidden />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-gray-900">{task.text}</span>
                              <span className="mt-0.5 block truncate text-xs text-gray-500">{initiative.title}</span>
                            </span>
                            <span
                              className={cn(
                                'shrink-0 pt-0.5 text-xs',
                                overdue ? 'font-medium text-red-600' : 'text-gray-500',
                              )}
                            >
                              {formatDueDate(task.dueDate)}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                  {upcomingTasks.length < 4 ? (
                    <BlockNote text="Overdue dates are in red. Open a task to go to its initiative." />
                  ) : null}
                </>
              )}
            </div>
          </section>
        </div>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-3">
          <div className="mb-2 flex shrink-0 items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Team view</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Direct reports, the initiatives they own, and their open tasks.
              </p>
            </div>
            <Link href={ACTION_PLANS_TEAM} className="shrink-0 text-sm text-[#1B87E6] hover:underline">
              View team
            </Link>
          </div>
          {team.length === 0 ? (
            <BlockNote text="No direct reports yet. People who report to you will show up here with the initiatives they own and the tasks still open." />
          ) : (
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {team.map((member) => (
                <li key={member.employee.id}>
                  <Link
                    href={ACTION_PLANS_TEAM}
                    className="flex items-center gap-4 rounded-lg bg-[#F7F8FA] px-4 py-2.5 hover:bg-gray-100"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-600">
                      {getEmployeeInitials(member.employee.id)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">{member.name}</span>
                      <span className="block truncate text-xs text-gray-500">{member.employee.jobTitle}</span>
                    </span>
                    <span className="w-20 shrink-0 text-center">
                      <span className="block text-lg font-semibold leading-none text-gray-900">
                        {member.ownedInitiatives.length}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">Initiatives</span>
                    </span>
                    <span className="w-20 shrink-0 text-center">
                      <span className="block text-lg font-semibold leading-none text-gray-900">
                        {member.openTaskCount}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">Open tasks</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <HubCreateInitiativeModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          refresh()
          notifyEmpowerDataChanged()
        }}
      />
    </div>
  )
}

function GlanceTile({ value, label, badge }: { value: number; label: string; badge?: string }) {
  return (
    <div className="rounded-lg bg-[#F4F6F8] px-4 py-2.5">
      <p className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-gray-900">
        {value}
        {badge ? (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
            {badge}
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
}

function BlockNote({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center">
      <p className="max-w-sm text-sm text-gray-500">{text}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

function roleClass(kind: InitiativeAccessKind): string {
  switch (kind) {
    case 'owner':
      return 'bg-blue-50 text-[#1B87E6]'
    case 'contributor':
      return 'bg-green-50 text-green-700'
    case 'collaborator':
      return 'bg-purple-50 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function InitiativeCard({
  plan,
  userId,
  user,
}: {
  plan: EmpowerInitiativeRecord
  userId: string
  user: ReturnType<typeof getCurrentUser>
}) {
  const progress = computeActionPlanProgress(plan)
  const access = initiativeAccessForUser(user, plan)
  const involvement = taskInvolvementForUser(userId, plan)
  const role = initiativeRoleBadge(access, plan, user)
  const adminReason = access === 'admin' ? initiativeVisibilityReason(user, plan, access) : undefined

  const badge = (
    <span className={cn('inline-flex rounded px-1.5 py-0.5 text-xs font-medium', roleClass(access))}>
      {role}
    </span>
  )

  return (
    <li>
      <Link
        href={actionPlanDetailPath(plan.id)}
        className="block h-full rounded-lg border border-gray-200 px-3 py-2.5 hover:border-gray-300 hover:bg-gray-50"
      >
        <span className="block text-sm font-medium text-gray-900">{plan.title}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {adminReason ? (
            <WuTooltip content={adminReason} position="top" showArrow>
              <span>{badge}</span>
            </WuTooltip>
          ) : (
            badge
          )}
          {involvement.openAssigned > 0 ? (
            <span className="inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
              {involvement.openAssigned} open task{involvement.openAssigned === 1 ? '' : 's'} for you
            </span>
          ) : null}
        </span>
        <span className="mt-2 block text-xs text-gray-500">
          {progress.total === 0
            ? 'No tasks on this initiative'
            : `${progress.completed}/${progress.total} tasks complete on this initiative`}
          {progress.overdueCount > 0 ? (
            <span className="ml-2 font-medium text-red-600">
              {progress.overdueCount} overdue
            </span>
          ) : null}
        </span>
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-gray-100">
          <span
            className="block h-full rounded-full bg-[#1B87E6]"
            style={{ width: `${progress.rate}%` }}
          />
        </span>
      </Link>
    </li>
  )
}
