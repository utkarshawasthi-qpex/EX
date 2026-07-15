import type { EmpowerInitiativeRecord, SurveyLinkScope } from '@/types/empowerIntegration'

function scopesMatch(a: SurveyLinkScope, b: SurveyLinkScope): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'org' && b.kind === 'org') return true
  if (a.kind === 'team' && b.kind === 'team') return a.managerId === b.managerId
  if (a.kind === 'filter' && b.kind === 'filter') {
    return JSON.stringify(a.filters) === JSON.stringify(b.filters)
  }
  return false
}

export function initiativeMatchesScope(
  initiative: EmpowerInitiativeRecord,
  scope: SurveyLinkScope,
): boolean {
  if (!initiative.surveyLink) {
    if (scope.kind === 'team') return initiative.ownerId === scope.managerId
    if (scope.kind === 'org') return true
    return false
  }
  return scopesMatch(initiative.surveyLink.scope, scope)
}

export function toSurveyLinkScope(scope: {
  kind: 'org' | 'team' | 'filter'
  managerId?: string
  filters?: Record<string, string>
}): SurveyLinkScope {
  if (scope.kind === 'org') return { kind: 'org' }
  if (scope.kind === 'team') return { kind: 'team', managerId: scope.managerId ?? '' }
  return { kind: 'filter', filters: scope.filters ?? {} }
}
