export const ACTION_PLANS_BASE = '/lifecycle/analytics/action-plans'

export const ACTION_PLANS_OVERVIEW = ACTION_PLANS_BASE

export const ACTION_PLANS_LIST = `${ACTION_PLANS_BASE}/list`

export const ACTION_PLANS_MY_TASKS = `${ACTION_PLANS_BASE}/my-tasks`

export const ACTION_PLANS_ANALYTICS = `${ACTION_PLANS_BASE}/analytics`

export function actionPlanDetailPath(id: string): string {
  return `${ACTION_PLANS_BASE}/${id}`
}

/** Legacy Empower URLs → portal action plans */
export function redirectPathFromEmpower(pathname: string): string {
  if (pathname === '/empower' || pathname === '/empower/') {
    return ACTION_PLANS_OVERVIEW
  }
  if (pathname.startsWith('/empower/initiatives/') && pathname !== '/empower/initiatives') {
    const id = pathname.split('/').pop()
    return id ? actionPlanDetailPath(id) : ACTION_PLANS_LIST
  }
  if (pathname.startsWith('/empower/initiatives')) return ACTION_PLANS_LIST
  if (pathname.startsWith('/empower/tasks')) return ACTION_PLANS_OVERVIEW
  if (pathname.startsWith('/empower/analytics')) return ACTION_PLANS_ANALYTICS
  if (pathname.startsWith('/empower/admin')) return '/lifecycle/analytics/admin'
  return ACTION_PLANS_OVERVIEW
}
