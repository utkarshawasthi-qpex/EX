import type { ActiveFilter, ID, PublicShareLink, ShareTitleAlign } from '@/types'

/** Seed public sharing links for dashboard prototypes. */
export function createMockPublicShareLinks(
  dashboardId: ID,
  dashboardName = 'Demo Dashboard',
  tabIds: ID[] = [],
): PublicShareLink[] {
  const createdAt = '2026-05-14T10:00:00.000Z'
  const includedTabIds = [...tabIds]

  return [
    {
      id: `share_${dashboardId}_1`,
      dashboardId,
      name: 'Strategic Insights Hub',
      displayTitle: dashboardName,
      titleAlign: 'left',
      slug: 'strategic-insights',
      url: '/share/strategic-insights',
      createdAt,
      status: 'active',
      passwordProtected: false,
      shortenUrl: true,
      shortUrlText: 'strategic-insights',
      hasExpiry: false,
      includedTabIds,
      staticDashboardFilters: [],
      staticTabFilters: {},
      allowDynamicDashboardFilters: true,
      allowDynamicTabFilters: true,
    },
    {
      id: `share_${dashboardId}_2`,
      dashboardId,
      name: 'Quarterly Performance Review',
      displayTitle: 'Quarterly Performance Review',
      titleAlign: 'center',
      slug: 'quarterly-review',
      url: '/share/quarterly-review',
      createdAt,
      status: 'active',
      passwordProtected: true,
      password: 'Pulse2026!',
      shortenUrl: true,
      shortUrlText: 'quarterly-review',
      hasExpiry: true,
      expiresAt: '2026-12-31',
      includedTabIds,
      staticDashboardFilters: [
        { fieldId: 'department', fieldLabel: 'Department', value: 'Engineering' },
      ],
      staticTabFilters: {},
      allowDynamicDashboardFilters: false,
      allowDynamicTabFilters: false,
    },
    {
      id: `share_${dashboardId}_3`,
      dashboardId,
      name: 'Business Health Snapshot',
      displayTitle: dashboardName,
      titleAlign: 'left',
      slug: `biz-health-${dashboardId.slice(0, 6)}`,
      url: `/share/biz-health-${dashboardId.slice(0, 6)}`,
      createdAt,
      status: 'active',
      passwordProtected: false,
      shortenUrl: false,
      hasExpiry: false,
      includedTabIds,
      staticDashboardFilters: [],
      staticTabFilters: {},
      allowDynamicDashboardFilters: true,
      allowDynamicTabFilters: false,
    },
    {
      id: `share_${dashboardId}_4`,
      dashboardId,
      name: 'Leadership Pulse',
      displayTitle: 'Leadership Pulse',
      titleAlign: 'right',
      slug: 'leadership-pulse',
      url: '/share/leadership-pulse',
      createdAt,
      status: 'active',
      passwordProtected: false,
      shortenUrl: true,
      shortUrlText: 'leadership-pulse',
      hasExpiry: false,
      includedTabIds,
      staticDashboardFilters: [],
      staticTabFilters: {},
      allowDynamicDashboardFilters: true,
      allowDynamicTabFilters: true,
    },
    {
      id: `share_${dashboardId}_5`,
      dashboardId,
      name: 'Executive Overview',
      displayTitle: 'Executive Overview',
      titleAlign: 'center',
      slug: 'executive-overview',
      url: '/share/executive-overview',
      createdAt,
      status: 'active',
      passwordProtected: true,
      password: 'Exec2026!',
      shortenUrl: true,
      shortUrlText: 'executive-overview',
      hasExpiry: true,
      expiresAt: '2026-09-30',
      includedTabIds,
      staticDashboardFilters: [
        { fieldId: 'location', fieldLabel: 'Location', value: 'Mumbai' },
      ],
      staticTabFilters: {},
      allowDynamicDashboardFilters: true,
      allowDynamicTabFilters: true,
    },
  ]
}

export function slugifyShareName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'shared-dashboard'
  )
}

/** ≥8 chars, at least 1 uppercase, 1 number, and 1 special character. */
export function isStrongSharePassword(password: string): boolean {
  if (password.length < 8) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  if (!/[^A-Za-z0-9]/.test(password)) return false
  return true
}

/** @deprecated use isStrongSharePassword */
export function isStrongAlphanumericPassword(password: string): boolean {
  return isStrongSharePassword(password)
}

export function resolveShareSlug(
  name: string,
  shortenUrl: boolean,
  shortUrlText?: string,
): string {
  if (shortenUrl) {
    return slugifyShareName(shortUrlText || name)
  }
  const token = Math.random().toString(36).slice(2, 8)
  return `${slugifyShareName(name)}-${token}`
}

export function buildPublicShareUrl(
  dashboardId: ID,
  name: string,
  shortenUrl: boolean,
  shortUrlText?: string,
  slugOverride?: string,
): string {
  void dashboardId
  const slug = slugOverride ?? resolveShareSlug(name, shortenUrl, shortUrlText)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/share/${slug}`
  }
  return `/share/${slug}`
}

export function mergeActiveFilters(...groups: ActiveFilter[][]): ActiveFilter[] {
  const map = new Map<string, ActiveFilter>()
  for (const group of groups) {
    for (const filter of group) {
      map.set(`${filter.fieldId}::${filter.value}`, filter)
    }
  }
  return [...map.values()]
}

export const SHARE_TITLE_ALIGN_OPTIONS: { value: ShareTitleAlign; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]
