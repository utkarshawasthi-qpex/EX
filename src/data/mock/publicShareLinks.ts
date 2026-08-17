import type { ID, PublicShareLink } from '@/types'

/** Seed public sharing links for dashboard prototypes. */
export function createMockPublicShareLinks(dashboardId: ID): PublicShareLink[] {
  const createdAt = '2026-05-14T10:00:00.000Z'

  return [
    {
      id: `share_${dashboardId}_1`,
      dashboardId,
      name: 'Strategic Insights Hub',
      url: 'https://bilabs.questionpro.com/sd/strategic-insights',
      createdAt,
      status: 'active',
      passwordProtected: false,
      shortenUrl: true,
      shortUrlText: 'strategic-insights',
      hasExpiry: false,
      includedTabIds: [],
    },
    {
      id: `share_${dashboardId}_2`,
      dashboardId,
      name: 'Quarterly Performance Review',
      url: 'https://bilabs.questionpro.com/sd/quarterly-review',
      createdAt,
      status: 'active',
      passwordProtected: true,
      password: 'Pulse2026',
      shortenUrl: true,
      shortUrlText: 'quarterly-review',
      hasExpiry: true,
      expiresAt: '2026-12-31',
      includedTabIds: [],
    },
    {
      id: `share_${dashboardId}_3`,
      dashboardId,
      name: 'Business Health Snapshot',
      url: `https://bilabs.questionpro.com/sd/${dashboardId.slice(0, 8)}/business-health`,
      createdAt,
      status: 'active',
      passwordProtected: false,
      shortenUrl: false,
      hasExpiry: false,
      includedTabIds: [],
    },
    {
      id: `share_${dashboardId}_4`,
      dashboardId,
      name: 'Leadership Pulse',
      url: 'https://bilabs.questionpro.com/sd/leadership-pulse',
      createdAt,
      status: 'active',
      passwordProtected: false,
      shortenUrl: true,
      shortUrlText: 'leadership-pulse',
      hasExpiry: false,
      includedTabIds: [],
    },
    {
      id: `share_${dashboardId}_5`,
      dashboardId,
      name: 'Executive Overview',
      url: 'https://bilabs.questionpro.com/sd/executive-overview',
      createdAt,
      status: 'active',
      passwordProtected: true,
      password: 'Exec2026x',
      shortenUrl: true,
      shortUrlText: 'executive-overview',
      hasExpiry: true,
      expiresAt: '2026-09-30',
      includedTabIds: [],
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

/** Alphanumeric only, ≥8 chars, at least one letter and one number. */
export function isStrongAlphanumericPassword(password: string): boolean {
  if (password.length < 8) return false
  if (!/^[A-Za-z0-9]+$/.test(password)) return false
  return /[A-Za-z]/.test(password) && /[0-9]/.test(password)
}

export function buildPublicShareUrl(
  dashboardId: ID,
  name: string,
  shortenUrl: boolean,
  shortUrlText?: string,
): string {
  if (shortenUrl) {
    const custom = slugifyShareName(shortUrlText || name)
    return `https://bilabs.questionpro.com/sd/${custom}`
  }
  const slug = slugifyShareName(name)
  const token = Math.random().toString(36).slice(2, 10)
  return `https://bilabs.questionpro.com/sd/${dashboardId.slice(0, 8)}/${slug}-${token}`
}
