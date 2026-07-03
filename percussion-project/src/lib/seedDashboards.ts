import type { Dashboard } from '@/types'

export const DEFAULT_DASHBOARD_ID = 'dash_default'
export const ACTIVE_DASHBOARD_STORAGE_KEY = 'pp_active_dashboard'
export const DASHBOARDS_STORAGE_KEY = 'pp_dashboards'

export function createDefaultSeedDashboard(): Dashboard {
  return {
    id: DEFAULT_DASHBOARD_ID,
    name: 'Demo Dashboard',
    access: 'global',
    authorEmail: 'sarah.johnson@questionpro.com',
    createdAt: new Date().toISOString(),
    tabs: [
      {
        id: 'tab_1',
        name: 'Overview',
        order: 1,
        widgets: [],
      },
    ],
  }
}

/** Seed localStorage when no dashboards exist (fresh / incognito production load). */
export function seedDefaultDashboardsIfNeeded(): void {
  if (typeof window === 'undefined') return

  try {
    const existing = window.localStorage.getItem(DASHBOARDS_STORAGE_KEY)
    if (existing) {
      const parsed = JSON.parse(existing) as Dashboard[]
      if (Array.isArray(parsed) && parsed.length > 0) return
    }

    const defaultDashboard = createDefaultSeedDashboard()
    window.localStorage.setItem(DASHBOARDS_STORAGE_KEY, JSON.stringify([defaultDashboard]))
    window.localStorage.setItem(ACTIVE_DASHBOARD_STORAGE_KEY, DEFAULT_DASHBOARD_ID)
  } catch (err) {
    console.error('Failed to seed default dashboards:', err)
  }
}
