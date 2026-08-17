import {
  buildPublicShareUrl,
  createMockPublicShareLinks,
  isStrongSharePassword,
  mergeActiveFilters,
  resolveShareSlug,
  slugifyShareName,
} from '@/data/mock/publicShareLinks'
import type { ActiveFilter, ID, PublicShareLink, ShareTitleAlign } from '@/types'

const STORAGE_PREFIX = 'pp_public_share_links_'
const SLUG_INDEX_KEY = 'pp_public_share_slug_index'

type ShareSlugIndex = Record<string, { dashboardId: ID; linkId: ID }>

function storageKey(dashboardId: ID): string {
  return `${STORAGE_PREFIX}${dashboardId}`
}

function readSlugIndex(): ShareSlugIndex {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(SLUG_INDEX_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ShareSlugIndex
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeSlugIndex(index: ShareSlugIndex): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SLUG_INDEX_KEY, JSON.stringify(index))
}

function registerSlug(slug: string, dashboardId: ID, linkId: ID): void {
  const index = readSlugIndex()
  // Drop prior entries for this linkId
  for (const [key, value] of Object.entries(index)) {
    if (value.linkId === linkId) delete index[key]
  }
  index[slug] = { dashboardId, linkId }
  writeSlugIndex(index)
}

function unregisterSlugForLink(linkId: ID): void {
  const index = readSlugIndex()
  for (const [key, value] of Object.entries(index)) {
    if (value.linkId === linkId) delete index[key]
  }
  writeSlugIndex(index)
}

function normalizeFilters(raw: unknown): ActiveFilter[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is ActiveFilter => {
      if (!item || typeof item !== 'object') return false
      const record = item as Record<string, unknown>
      return (
        typeof record.fieldId === 'string' &&
        typeof record.fieldLabel === 'string' &&
        typeof record.value === 'string'
      )
    })
    .map((item) => ({
      fieldId: item.fieldId,
      fieldLabel: item.fieldLabel,
      value: item.value,
    }))
}

function normalizeTabFilters(raw: unknown): Record<string, ActiveFilter[]> {
  if (!raw || typeof raw !== 'object') return {}
  const result: Record<string, ActiveFilter[]> = {}
  for (const [tabId, filters] of Object.entries(raw as Record<string, unknown>)) {
    result[tabId] = normalizeFilters(filters)
  }
  return result
}

function normalizeTitleAlign(raw: unknown): ShareTitleAlign {
  if (raw === 'center' || raw === 'right' || raw === 'left') return raw
  return 'left'
}

function normalizeLink(raw: PublicShareLink & Record<string, unknown>): PublicShareLink {
  const slug =
    typeof raw.slug === 'string' && raw.slug
      ? raw.slug
      : raw.shortenUrl && raw.shortUrlText
        ? slugifyShareName(String(raw.shortUrlText))
        : slugifyShareName(String(raw.name || 'shared'))

  const url =
    typeof raw.url === 'string' && raw.url.includes('/share/')
      ? raw.url
      : buildPublicShareUrl(raw.dashboardId, raw.name, Boolean(raw.shortenUrl), raw.shortUrlText, slug)

  return {
    id: raw.id,
    dashboardId: raw.dashboardId,
    name: raw.name,
    displayTitle:
      typeof raw.displayTitle === 'string' && raw.displayTitle.trim()
        ? raw.displayTitle
        : raw.name,
    titleAlign: normalizeTitleAlign(raw.titleAlign),
    url,
    slug,
    createdAt: raw.createdAt,
    status: raw.status === 'closed' ? 'closed' : 'active',
    passwordProtected: Boolean(raw.passwordProtected),
    password: typeof raw.password === 'string' ? raw.password : undefined,
    shortenUrl: Boolean(raw.shortenUrl),
    shortUrlText: raw.shortUrlText,
    hasExpiry: Boolean(raw.hasExpiry),
    expiresAt: raw.expiresAt,
    includedTabIds: Array.isArray(raw.includedTabIds) ? (raw.includedTabIds as ID[]) : [],
    staticDashboardFilters: normalizeFilters(raw.staticDashboardFilters),
    staticTabFilters: normalizeTabFilters(raw.staticTabFilters),
    allowDynamicDashboardFilters: Boolean(raw.allowDynamicDashboardFilters),
    allowDynamicTabFilters: Boolean(raw.allowDynamicTabFilters),
  }
}

function readLinks(dashboardId: ID): PublicShareLink[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(dashboardId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Array<PublicShareLink & Record<string, unknown>>
    if (!Array.isArray(parsed)) return null
    return parsed.map((item) => normalizeLink(item))
  } catch {
    return null
  }
}

function writeLinks(dashboardId: ID, links: PublicShareLink[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(dashboardId), JSON.stringify(links))
  for (const link of links) {
    registerSlug(link.slug, dashboardId, link.id)
  }
}

export function getPublicShareLinks(
  dashboardId: ID,
  options?: { dashboardName?: string; tabIds?: ID[] },
): PublicShareLink[] {
  const stored = readLinks(dashboardId)
  if (stored) {
    writeLinks(dashboardId, stored)
    return stored
  }
  const seeded = createMockPublicShareLinks(
    dashboardId,
    options?.dashboardName,
    options?.tabIds,
  ).map((link) =>
    normalizeLink({
      ...link,
      url: buildPublicShareUrl(
        dashboardId,
        link.name,
        link.shortenUrl,
        link.shortUrlText,
        link.slug,
      ),
    }),
  )
  writeLinks(dashboardId, seeded)
  return seeded
}

export function savePublicShareLinks(dashboardId: ID, links: PublicShareLink[]): void {
  writeLinks(dashboardId, links)
}

export function upsertPublicShareLink(
  dashboardId: ID,
  link: PublicShareLink,
): PublicShareLink[] {
  const current = getPublicShareLinks(dashboardId)
  const normalized = normalizeLink(link as PublicShareLink & Record<string, unknown>)
  const exists = current.some((item) => item.id === normalized.id)
  const next = exists
    ? current.map((item) => (item.id === normalized.id ? normalized : item))
    : [normalized, ...current]
  savePublicShareLinks(dashboardId, next)
  return next
}

export function deletePublicShareLink(dashboardId: ID, linkId: ID): PublicShareLink[] {
  unregisterSlugForLink(linkId)
  const next = getPublicShareLinks(dashboardId).filter((item) => item.id !== linkId)
  savePublicShareLinks(dashboardId, next)
  return next
}

function scanAllStoredLinks(): PublicShareLink[] {
  if (typeof window === 'undefined') return []
  const links: PublicShareLink[] = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key?.startsWith(STORAGE_PREFIX)) continue
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as Array<PublicShareLink & Record<string, unknown>>
      if (!Array.isArray(parsed)) continue
      for (const item of parsed) {
        links.push(normalizeLink(item))
      }
    } catch {
      // ignore corrupt entries
    }
  }
  return links
}

export function resolveShareLinkBySlug(slug: string): PublicShareLink | null {
  if (!slug) return null
  const index = readSlugIndex()
  const entry = index[slug]
  if (entry) {
    const links = getPublicShareLinks(entry.dashboardId)
    const match = links.find((link) => link.id === entry.linkId || link.slug === slug)
    if (match) return match
  }

  const scanned = scanAllStoredLinks().find((link) => link.slug === slug)
  if (scanned) {
    registerSlug(scanned.slug, scanned.dashboardId, scanned.id)
    return scanned
  }

  // Seed common demo dashboards so canned mock slugs resolve on first visit.
  const demoDashboardIds = ['dash_default', 'dash_multi_survey']
  for (const dashboardId of demoDashboardIds) {
    const links = getPublicShareLinks(dashboardId)
    const match = links.find((link) => link.slug === slug)
    if (match) return match
  }

  return null
}

export function createPublicShareLinkDraft(
  dashboardId: ID,
  tabIds: ID[],
  dashboardName: string,
): Omit<PublicShareLink, 'id' | 'url' | 'createdAt' | 'slug'> & {
  name: string
  shortUrlText: string
} {
  return {
    dashboardId,
    name: '',
    displayTitle: dashboardName,
    titleAlign: 'left',
    status: 'active',
    passwordProtected: false,
    password: '',
    shortenUrl: true,
    shortUrlText: '',
    hasExpiry: false,
    expiresAt: undefined,
    includedTabIds: [...tabIds],
    staticDashboardFilters: [],
    staticTabFilters: {},
    allowDynamicDashboardFilters: true,
    allowDynamicTabFilters: true,
  }
}

export function isShareLinkExpired(link: PublicShareLink, now = new Date()): boolean {
  if (!link.hasExpiry || !link.expiresAt) return false
  const expiry = new Date(link.expiresAt)
  if (Number.isNaN(expiry.getTime())) return false
  // Treat date-only as end of day local
  expiry.setHours(23, 59, 59, 999)
  return now.getTime() > expiry.getTime()
}

export function isShareLinkUnlocked(slug: string): boolean {
  if (typeof window === 'undefined') return false
  return window.sessionStorage.getItem(`pp_share_unlocked_${slug}`) === '1'
}

export function unlockShareLink(slug: string): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(`pp_share_unlocked_${slug}`, '1')
}

export function buildEffectiveShareFilters(
  link: PublicShareLink,
  activeTabId: ID,
  dynamicDashboardFilters: ActiveFilter[],
  dynamicTabFilters: ActiveFilter[],
): ActiveFilter[] {
  return mergeActiveFilters(
    link.staticDashboardFilters,
    link.staticTabFilters[activeTabId] ?? [],
    dynamicDashboardFilters,
    dynamicTabFilters,
  )
}

export {
  buildPublicShareUrl,
  isStrongSharePassword,
  mergeActiveFilters,
  resolveShareSlug,
  slugifyShareName,
}
