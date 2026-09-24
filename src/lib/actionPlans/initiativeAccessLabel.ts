import { getEmployeeName, isTaskAssignedToUser } from '@/lib/empowerIntegration/storage'
import type { EmpowerInitiativeRecord } from '@/types/empowerIntegration'
import type { AppUser } from '@/lib/userContext'
import { isAdminContext } from '@/lib/userContext'

export type InitiativeAccessKind = 'owner' | 'collaborator' | 'contributor' | 'admin' | 'shared'

export type UserTaskInvolvement = {
  openAssigned: number
  totalAssigned: number
  openAsOwner: number
  openAsContributor: number
}

export function taskInvolvementForUser(
  userId: string,
  plan: EmpowerInitiativeRecord,
): UserTaskInvolvement {
  const assigned = plan.tasks.filter((t) => isTaskAssignedToUser(t, userId))
  const openAssigned = assigned.filter((t) => t.status !== 'completed')
  return {
    openAssigned: openAssigned.length,
    totalAssigned: assigned.length,
    openAsOwner: openAssigned.filter((t) => t.ownerId === userId).length,
    openAsContributor: openAssigned.filter(
      (t) => t.ownerId !== userId && (t.contributorIds ?? []).includes(userId),
    ).length,
  }
}

export function initiativeAccessForUser(
  user: AppUser,
  plan: EmpowerInitiativeRecord,
): InitiativeAccessKind {
  if (plan.ownerId === user.id || plan.createdBy === user.id) return 'owner'
  const collab = plan.collaborators?.find((c) => c.userId === user.id && c.acceptedAt)
  if (collab) return 'collaborator'
  if (plan.contributors.includes(user.id)) return 'contributor'
  if (isAdminContext() && !user.isImpersonating) return 'admin'
  return 'shared'
}

export function initiativeRoleBadge(
  kind: InitiativeAccessKind,
  plan: EmpowerInitiativeRecord,
  user: AppUser,
): string {
  switch (kind) {
    case 'owner':
      return 'Initiative owner'
    case 'collaborator': {
      const tier = plan.collaborators?.find((c) => c.userId === user.id && c.acceptedAt)?.tier
      if (tier === 'co_manage') return 'Co-manager'
      if (tier === 'view_assign') return 'Co-manager · can assign'
      return 'Collaborator · view only'
    }
    case 'contributor':
      return 'Initiative contributor'
    case 'admin':
      return 'Administrator view'
    case 'shared':
      return `Initiative owner: ${getEmployeeName(plan.ownerId)}`
  }
}

export function initiativeVisibilityReason(
  user: AppUser,
  plan: EmpowerInitiativeRecord,
  kind: InitiativeAccessKind,
): string {
  switch (kind) {
    case 'owner':
      return plan.createdBy === user.id && plan.ownerId !== user.id
        ? 'You created this initiative.'
        : 'You own this initiative.'
    case 'collaborator': {
      const inviter = plan.collaborators?.find((c) => c.userId === user.id)?.invitedBy
      return inviter
        ? `Invited by ${getEmployeeName(inviter)} to collaborate on this initiative.`
        : 'You were invited to collaborate on this initiative.'
    }
    case 'contributor':
      return 'You are listed as a contributor on this initiative.'
    case 'admin':
      return 'Visible because you have administrator access to all initiatives for reporting.'
    case 'shared':
      if (plan.surveyLink?.scope.kind === 'org') {
        return 'Visible to everyone with access to org-level survey results.'
      }
      if (plan.surveyLink?.scope.kind === 'team') {
        return `Linked to ${getEmployeeName(plan.surveyLink.scope.managerId)}'s team survey scope.`
      }
      return `Owned by ${getEmployeeName(plan.ownerId)}.`
  }
}

export function taskInvolvementSummary(involvement: UserTaskInvolvement): string | null {
  if (involvement.openAssigned === 0) {
    if (involvement.totalAssigned > 0) return 'No open tasks assigned to you on this initiative.'
    return 'No tasks assigned to you on this initiative.'
  }
  const parts: string[] = [
    `${involvement.openAssigned} open task${involvement.openAssigned === 1 ? '' : 's'} assigned to you`,
  ]
  if (involvement.openAsOwner > 0 && involvement.openAsContributor > 0) {
    parts.push(`(${involvement.openAsOwner} as owner, ${involvement.openAsContributor} as contributor)`)
  } else if (involvement.openAsContributor > 0) {
    parts.push(`(${involvement.openAsContributor} as contributor)`)
  }
  return parts.join(' ')
}

/** @deprecated Use initiativeRoleBadge */
export function initiativeAccessLabel(kind: InitiativeAccessKind, plan: EmpowerInitiativeRecord): string {
  switch (kind) {
    case 'owner':
      return 'You own this'
    case 'collaborator':
      return 'Co-managing'
    case 'contributor':
      return 'Contributor'
    case 'admin':
      return 'Administrator view'
    case 'shared':
      return `Owner: ${getEmployeeName(plan.ownerId)}`
  }
}
