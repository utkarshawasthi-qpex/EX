'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { preventModalDismiss } from '@/lib/modalProps'
import {
  buildPublicShareUrl,
  createPublicShareLinkDraft,
  deletePublicShareLink,
  getPublicShareLinks,
  isStrongAlphanumericPassword,
  slugifyShareName,
  upsertPublicShareLink,
} from '@/lib/publicShareLinks'
import type { DashboardTab, ID, PublicShareLink } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)
const WuDataTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuDataTable })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalContent })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalFooter })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)

type ModalView = 'list' | 'form'

type StatusOption = { value: 'active' | 'closed'; label: string }

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
]

type FormState = {
  id?: ID
  name: string
  passwordProtected: boolean
  password: string
  shortenUrl: boolean
  shortUrlText: string
  hasExpiry: boolean
  expiresAt: string
  includedTabIds: ID[]
  status: 'active' | 'closed'
}

type DashboardShareModalProps = {
  open: boolean
  onClose: () => void
  dashboardId: ID
  dashboardName: string
  tabs: DashboardTab[]
}

function truncateUrl(url: string, max = 42): string {
  if (url.length <= max) return url
  return `${url.slice(0, max - 1)}…`
}

function getStatusOption(status: 'active' | 'closed'): StatusOption {
  return STATUS_OPTIONS.find((option) => option.value === status) ?? STATUS_OPTIONS[0]!
}

function emptyForm(tabIds: ID[]): FormState {
  const draft = createPublicShareLinkDraft('', tabIds)
  return {
    name: draft.name,
    passwordProtected: draft.passwordProtected,
    password: draft.password ?? '',
    shortenUrl: draft.shortenUrl,
    shortUrlText: draft.shortUrlText ?? '',
    hasExpiry: draft.hasExpiry,
    expiresAt: draft.expiresAt ?? '',
    includedTabIds: draft.includedTabIds,
    status: draft.status,
  }
}

function linkToForm(link: PublicShareLink, tabIds: ID[]): FormState {
  return {
    id: link.id,
    name: link.name,
    passwordProtected: link.passwordProtected,
    password: link.password ?? '',
    shortenUrl: link.shortenUrl,
    shortUrlText: link.shortUrlText ?? '',
    hasExpiry: link.hasExpiry,
    expiresAt: link.expiresAt ?? '',
    includedTabIds:
      link.includedTabIds.length > 0 ? [...link.includedTabIds] : [...tabIds],
    status: link.status,
  }
}

export function DashboardShareModal({
  open,
  onClose,
  dashboardId,
  dashboardName,
  tabs,
}: DashboardShareModalProps) {
  const { showToast } = useWuShowToast()
  const [view, setView] = useState<ModalView>('list')
  const [links, setLinks] = useState<PublicShareLink[]>([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<FormState>(() => emptyForm(tabs.map((tab) => tab.id)))
  const [deleteTarget, setDeleteTarget] = useState<PublicShareLink | null>(null)

  useEffect(() => {
    if (!open) return
    setLinks(getPublicShareLinks(dashboardId))
    setView('list')
    setSearch('')
    setForm(emptyForm(tabs.map((tab) => tab.id)))
    setDeleteTarget(null)
  }, [open, dashboardId, tabs])

  const filteredLinks = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return links
    return links.filter((link) => link.name.toLowerCase().includes(query))
  }, [links, search])

  const shortUrlPreview = form.shortUrlText.trim()
    ? `https://bilabs.questionpro.com/sd/${slugifyShareName(form.shortUrlText)}`
    : 'https://bilabs.questionpro.com/sd/…'

  function openCreate() {
    setForm(emptyForm(tabs.map((tab) => tab.id)))
    setView('form')
  }

  function openEdit(link: PublicShareLink) {
    setForm(linkToForm(link, tabs.map((tab) => tab.id)))
    setView('form')
  }

  function backToList() {
    setView('list')
    setForm(emptyForm(tabs.map((tab) => tab.id)))
  }

  function updateStatus(link: PublicShareLink, status: 'active' | 'closed') {
    if (link.status === status) return
    const updated: PublicShareLink = { ...link, status }
    setLinks(upsertPublicShareLink(dashboardId, updated))
    showToast({
      variant: 'success',
      message:
        status === 'active' ? `"${link.name}" is now Active` : `"${link.name}" is now Closed`,
    })
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      showToast({ variant: 'success', message: 'Link copied to clipboard' })
    } catch {
      showToast({ variant: 'error', message: 'Could not copy link' })
    }
  }

  function toggleTab(tabId: ID, checked: boolean) {
    setForm((current) => {
      const included = new Set(current.includedTabIds)
      if (checked) included.add(tabId)
      else included.delete(tabId)
      return { ...current, includedTabIds: [...included] }
    })
  }

  function handleSave() {
    const name = form.name.trim()
    if (!name) {
      showToast({ variant: 'error', message: 'Enter a name for this sharing link' })
      return
    }
    if (form.passwordProtected) {
      const password = form.password.trim()
      if (!password) {
        showToast({
          variant: 'error',
          message: 'Enter a strong alphanumeric password or turn off password protection',
        })
        return
      }
      if (!isStrongAlphanumericPassword(password)) {
        showToast({
          variant: 'error',
          message:
            'Password must be at least 8 alphanumeric characters and include both letters and numbers',
        })
        return
      }
    }
    if (form.shortenUrl && !form.shortUrlText.trim()) {
      showToast({ variant: 'error', message: 'Enter the text you want for the shortened URL' })
      return
    }
    if (form.hasExpiry && !form.expiresAt) {
      showToast({ variant: 'error', message: 'Select an expiry date or turn off expiry' })
      return
    }
    if (form.includedTabIds.length === 0) {
      showToast({ variant: 'error', message: 'Select at least one tab to include' })
      return
    }

    const existing = form.id ? links.find((link) => link.id === form.id) : undefined
    const shortUrlText = form.shortenUrl ? slugifyShareName(form.shortUrlText) : undefined
    const urlUnchanged =
      existing &&
      existing.shortenUrl === form.shortenUrl &&
      existing.name === name &&
      (existing.shortUrlText ?? '') === (shortUrlText ?? '')

    const saved: PublicShareLink = {
      id: existing?.id ?? `share_${dashboardId}_${Date.now()}`,
      dashboardId,
      name,
      url: urlUnchanged
        ? existing.url
        : buildPublicShareUrl(dashboardId, name, form.shortenUrl, shortUrlText),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      status: form.status,
      passwordProtected: form.passwordProtected,
      password: form.passwordProtected ? form.password.trim() : undefined,
      shortenUrl: form.shortenUrl,
      shortUrlText,
      hasExpiry: form.hasExpiry,
      expiresAt: form.hasExpiry ? form.expiresAt : undefined,
      includedTabIds: form.includedTabIds,
    }

    setLinks(upsertPublicShareLink(dashboardId, saved))
    showToast({
      variant: 'success',
      message: existing ? 'Sharing link updated' : 'Sharing link created',
    })
    setView('list')
  }

  function confirmDelete() {
    if (!deleteTarget) return
    setLinks(deletePublicShareLink(dashboardId, deleteTarget.id))
    showToast({ variant: 'success', message: `"${deleteTarget.name}" deleted` })
    setDeleteTarget(null)
  }

  const columns: IWuTableColumnDef<PublicShareLink>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium text-gray-800">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'url',
      header: 'URLs',
      cell: ({ row }) => (
        <div className="flex max-w-[280px] items-center gap-2 text-gray-500">
          <span className="wm-link shrink-0 text-base leading-none" aria-hidden />
          <span className="truncate text-sm" title={row.original.url}>
            {truncateUrl(row.original.url)}
          </span>
          <button
            type="button"
            className="wm-content-copy shrink-0 text-base leading-none text-gray-400 hover:text-gray-700"
            aria-label={`Copy URL for ${row.original.name}`}
            onClick={() => void copyUrl(row.original.url)}
          />
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created on',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {format(new Date(row.original.createdAt), 'dd/MM/yyyy')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="w-[120px]">
          <WuSelect
            data={STATUS_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={getStatusOption(row.original.status)}
            onSelect={(value: unknown) => {
              const selected = value as StatusOption | StatusOption[]
              const next = Array.isArray(selected) ? selected[0] : selected
              if (!next) return
              updateStatus(row.original, next.value)
            }}
            variant="outlined"
          />
        </div>
      ),
    },
    {
      accessorKey: 'id',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="wm-edit text-lg leading-none text-gray-500 hover:text-blue-600"
            aria-label={`Edit ${row.original.name}`}
            onClick={() => openEdit(row.original)}
          />
          <button
            type="button"
            className="wm-delete text-lg leading-none text-gray-500 hover:text-red-600"
            aria-label={`Delete ${row.original.name}`}
            onClick={() => setDeleteTarget(row.original)}
          />
        </div>
      ),
    },
  ]

  const isEditing = Boolean(form.id)
  const formTitle = isEditing ? 'Edit sharing link' : 'Create sharing link'

  return (
    <>
      <WuModal
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose()
        }}
        variant="action"
        size="lg"
        maxWidth="920px"
      >
        <WuModalHeader>
          {view === 'list' ? (
            'Public Sharing Links'
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={backToList}
                aria-label="Back to sharing links"
                className="flex size-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
              >
                <span className="wm-arrow-back text-xl leading-none" aria-hidden />
              </button>
              <span>{formTitle}</span>
            </div>
          )}
        </WuModalHeader>
        <WuModalContent {...preventModalDismiss}>
          {view === 'list' ? (
            <div className="space-y-4">
              <WuText size="sm" as="p" className="text-gray-500">
                Share &ldquo;{dashboardName}&rdquo; with a public link. Recipients do not need a
                QuestionPro login.
              </WuText>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <WuButton variant="primary" onClick={openCreate}>
                  + Create
                </WuButton>
                <div className="w-full max-w-xs sm:w-72">
                  <WuInput
                    variant="outlined"
                    placeholder="Search by link name..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              {filteredLinks.length === 0 ? (
                <EmptyState
                  title={search.trim() ? 'No matching links' : 'No sharing links yet'}
                  description={
                    search.trim()
                      ? 'Try a different search, or create a new public sharing link.'
                      : 'Click Create to configure a new public sharing link.'
                  }
                  action={
                    search.trim() ? undefined : (
                      <WuButton variant="primary" onClick={openCreate}>
                        + Create
                      </WuButton>
                    )
                  }
                />
              ) : (
                <WuDataTable
                  data={filteredLinks as unknown[]}
                  columns={columns as unknown as IWuTableColumnDef<unknown>[]}
                  size="compact"
                  variant="unstyled"
                />
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <WuText size="sm" as="p" className="mb-1.5 font-medium text-gray-700">
                  Link name
                </WuText>
                <WuInput
                  variant="outlined"
                  placeholder="e.g. Executive Overview"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <WuToggle
                  checked={form.passwordProtected}
                  onChange={(checked) =>
                    setForm((current) => ({ ...current, passwordProtected: checked }))
                  }
                  Label="Password protected"
                />
                {form.passwordProtected && (
                  <div className="mt-3 space-y-1.5">
                    <WuInput
                      variant="outlined"
                      type="password"
                      placeholder="Enter a strong alphanumeric password"
                      value={form.password}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, password: event.target.value }))
                      }
                    />
                    <WuText size="sm" as="p" className="text-xs text-gray-400">
                      Use at least 8 alphanumeric characters with both letters and numbers (A–Z,
                      0–9). No special characters.
                    </WuText>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <WuToggle
                  checked={form.shortenUrl}
                  onChange={(checked) =>
                    setForm((current) => ({ ...current, shortenUrl: checked }))
                  }
                  Label="Shorten URL"
                />
                {form.shortenUrl && (
                  <div className="mt-3 space-y-1.5">
                    <WuText size="sm" as="p" className="font-medium text-gray-700">
                      Custom URL text
                    </WuText>
                    <WuInput
                      variant="outlined"
                      placeholder="e.g. executive-overview"
                      value={form.shortUrlText}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, shortUrlText: event.target.value }))
                      }
                    />
                    <WuText size="sm" as="p" className="text-xs text-gray-400">
                      Preview: {shortUrlPreview}
                    </WuText>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <WuToggle
                  checked={form.hasExpiry}
                  onChange={(checked) =>
                    setForm((current) => ({ ...current, hasExpiry: checked }))
                  }
                  Label="Add expiry date"
                />
                {form.hasExpiry && (
                  <div className="mt-3 max-w-xs">
                    <WuInput
                      variant="outlined"
                      type="date"
                      value={form.expiresAt}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, expiresAt: event.target.value }))
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <WuText size="sm" as="p" className="mb-2 font-medium text-gray-700">
                  Tabs to include
                </WuText>
                <div className="grid gap-2 sm:grid-cols-2">
                  {tabs.map((tab) => (
                    <label
                      key={tab.id}
                      className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    >
                      <WuCheckbox
                        checked={form.includedTabIds.includes(tab.id)}
                        onChange={(checked) => toggleTab(tab.id, checked)}
                      />
                      <span>{tab.name}</span>
                    </label>
                  ))}
                </div>
                {tabs.length === 0 && (
                  <WuText size="sm" as="p" className="text-gray-400">
                    This dashboard has no tabs yet.
                  </WuText>
                )}
              </div>
            </div>
          )}
        </WuModalContent>
        <WuModalFooter>
          {view === 'list' ? (
            <WuButton variant="secondary" onClick={onClose}>
              Close
            </WuButton>
          ) : (
            <div className="flex w-full justify-end gap-2">
              <WuButton variant="secondary" onClick={backToList}>
                Cancel
              </WuButton>
              <WuButton variant="primary" onClick={handleSave}>
                {isEditing ? 'Save changes' : 'Create link'}
              </WuButton>
            </div>
          )}
        </WuModalFooter>
      </WuModal>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null)
        }}
        title="Delete sharing link?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will stop working immediately. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="critical"
        onConfirm={confirmDelete}
      />
    </>
  )
}
