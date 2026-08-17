import type { ID, PublicShareLink } from '@/types'

/** Seed public sharing links for dashboard prototypes. */
export function createMockPublicShareLinks(dashboardId: ID): PublicShareLink[] {
  const base = `https://bilabs.questionpro.com/sd/${dashboardId.slice(0, 8)}`
  const createdAt = '2026-05-14T10:00:00.000Z'

  return [
    {
      id: `share_${dashboardId}_1`,
      dashboardId,
      name: 'Strategic Insights Hub',
      url: `${base}/strategic-insights`,
      createdAt,
      status: 'active',
      passwordProtected: false,
      includeQrCode: true,
      shortenUrl: true,
      hasExpiry: false,
      includedTabIds: [],
    },
    {
      id: `share_${dashboardId}_2`,
      dashboardId,
      name: 'Quarterly Performance Review',
      url: `${base}/quarterly-review`,
      createdAt,
      status: 'active',
      passwordProtected: true,
      password: 'demo1234',
      includeQrCode: false,
      shortenUrl: true,
      hasExpiry: true,
      expiresAt: '2026-12-31',
      includedTabIds: [],
    },
    {
      id: `share_${dashboardId}_3`,
      dashboardId,
      name: 'Business Health Snapshot',
      url: `${base}/business-health`,
      createdAt,
      status: 'active',
      passwordProtected: false,
      includeQrCode: false,
      shortenUrl: false,
      hasExpiry: false,
      includedTabIds: [],
    },
    {
      id: `share_${dashboardId}_4`,
      dashboardId,
      name: 'Leadership Pulse',
      url: `${base}/leadership-pulse`,
      createdAt,
      status: 'active',
      passwordProtected: false,
      includeQrCode: true,
      shortenUrl: true,
      hasExpiry: false,
      includedTabIds: [],
    },
    {
      id: `share_${dashboardId}_5`,
      dashboardId,
      name: 'Executive Overview',
      url: `${base}/executive-overview`,
      createdAt,
      status: 'active',
      passwordProtected: true,
      password: 'exec2026',
      includeQrCode: false,
      shortenUrl: true,
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

export function buildPublicShareUrl(
  dashboardId: ID,
  name: string,
  shortenUrl: boolean,
): string {
  const slug = slugifyShareName(name)
  const token = Math.random().toString(36).slice(2, 10)
  if (shortenUrl) {
    return `https://bilabs.questionpro.com/sd/${token}`
  }
  return `https://bilabs.questionpro.com/sd/${dashboardId.slice(0, 8)}/${slug}-${token}`
}
