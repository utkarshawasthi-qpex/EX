'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { computeActionPlanProgress } from '@/lib/actionPlans'
import {
  initiativeAccessForUser,
  initiativeRoleBadge,
  initiativeVisibilityReason,
  taskInvolvementForUser,
} from '@/lib/actionPlans/initiativeAccessLabel'
import { actionPlanDetailPath } from '@/lib/actionPlans/paths'
import { cn } from '@/lib/utils'
import type { AppUser } from '@/lib/userContext'
import type { EmpowerInitiativeRecord } from '@/types/empowerIntegration'

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false },
)

type Props = {
  plan: EmpowerInitiativeRecord
  user: AppUser
}

function roleBadgeClass(kind: ReturnType<typeof initiativeAccessForUser>): string {
  switch (kind) {
    case 'owner':
      return 'bg-blue-100 text-blue-800'
    case 'collaborator':
      return 'bg-purple-100 text-purple-800'
    case 'contributor':
      return 'bg-amber-100 text-amber-900'
    case 'admin':
      return 'bg-gray-200 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function InitiativeOverviewCard({ plan, user }: Props) {
  const progress = computeActionPlanProgress(plan)
  const access = initiativeAccessForUser(user, plan)
  const involvement = taskInvolvementForUser(user.id, plan)
  const roleLabel = initiativeRoleBadge(access, plan, user)
  const adminTooltip =
    access === 'admin' ? initiativeVisibilityReason(user, plan, access) : undefined

  const roleBadge = (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        roleBadgeClass(access),
      )}
    >
      {roleLabel}
    </span>
  )

  return (
    <Link
      href={actionPlanDetailPath(plan.id)}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow"
    >
      <p className="font-medium text-gray-900">{plan.title}</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {adminTooltip ? (
          <WuTooltip content={adminTooltip}>
            <span>{roleBadge}</span>
          </WuTooltip>
        ) : (
          roleBadge
        )}
        {involvement.openAssigned > 0 ? (
          <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            {involvement.openAssigned} open task{involvement.openAssigned === 1 ? '' : 's'} for you
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {progress.completed}/{progress.total} tasks complete on this initiative
        {progress.overdueCount > 0 ? (
          <span className="ml-2 font-medium text-red-600">{progress.overdueCount} overdue</span>
        ) : null}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${progress.rate}%` }}
        />
      </div>
    </Link>
  )
}
