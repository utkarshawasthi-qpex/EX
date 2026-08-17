import {
  buildPublicShareUrl,
  createMockPublicShareLinks,
  isStrongAlphanumericPassword,
  slugifyShareName,
} from '@/data/mock/publicShareLinks'
import type { ID, PublicShareLink } from '@/types'

const STORAGE_PREFIX = 'pp_public_share_links_'

function storageKey(dashboardId: ID): string {
  return `${STORAGE_PREFIX}${dashboardId}`
}

function normalizeLink(raw: PublicShareLink): PublicShareLink {
  return {
    id: raw.id,
    dashboardId: raw.dashboardId,
    name: raw.name,
    url: raw.url,
    createdAt: raw.createdAt,
    status: raw.status === 'closed' ? 'closed' : 'active',
    passwordProtected: Boolean(raw.passwordProtected),
    password: raw.password,
    shortenUrl: Boolean(raw.shortenUrl),
    shortUrlText: raw.shortUrlText,
    hasExpiry: Boolean(raw.hasExpiry),
    expiresAt: raw.expiresAt,
    includedTabIds: Array.isArray(raw.includedTabIds) ? raw.includedTabIds : [],
  }
}

function readLinks(dashboardId: ID): PublicShareLink[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(dashboardId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PublicShareLink[]
    return Array.isArray(parsed) ? parsed.map(normalizeLink) : null
  } catch {
    return null
  }
}

function writeLinks(dashboardId: ID, links: PublicShareLink[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(dashboardId), JSON.stringify(links))
}

export function getPublicShareLinks(dashboardId: ID): PublicShareLink[] {
  const stored = readLinks(dashboardId)
  if (stored) return stored
  const seeded = createMockPublicShareLinks(dashboardId)
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
  const exists = current.some((item) => item.id === link.id)
  const next = exists
    ? current.map((item) => (item.id === link.id ? link : item))
    : [link, ...current]
  savePublicShareLinks(dashboardId, next)
  return next
}

export function deletePublicShareLink(dashboardId: ID, linkId: ID): PublicShareLink[] {
  const next = getPublicShareLinks(dashboardId).filter((item) => item.id !== linkId)
  savePublicShareLinks(dashboardId, next)
  return next
}

export function createPublicShareLinkDraft(
  dashboardId: ID,
  tabIds: ID[],
): Omit<PublicShareLink, 'id' | 'url' | 'createdAt'> & {
  name: string
} {
  return {
    dashboardId,
    name: '',
    status: 'active',
    passwordProtected: false,
    password: '',
    shortenUrl: true,
    shortUrlText: '',
    hasExpiry: false,
    expiresAt: undefined,
    includedTabIds: [...tabIds],
  }
}

export { buildPublicShareUrl, isStrongAlphanumericPassword, slugifyShareName }
