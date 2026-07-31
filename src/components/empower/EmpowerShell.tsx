'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EmpowerAnalyticsPanel } from '@/components/empower/EmpowerAnalyticsPanel'
import { CreateInitiativeModal } from '@/components/modules/empower/CreateInitiativeModal'
import {
  EMPOWER_OPEN_CREATE_EVENT,
  getCurrentEmpowerUser,
} from '@/lib/empower/simulation'
import { cn } from '@/lib/utils'

type EmpowerShellProps = {
  children: React.ReactNode
}

const NAV_SECTIONS = [
  {
    label: 'Edit',
    items: [
      { label: 'Initiatives', href: '/empower/initiatives', icon: 'wm-flag' },
      { label: 'Team view', href: '/empower/team', icon: 'wc-employees-list' },
    ],
  },
  {
    label: 'Data',
    items: [
      { label: 'Analytics', href: '/empower/analytics', icon: 'wc-analytics' },
      { label: 'Conversations', href: '/empower/conversations', icon: 'wm-forum' },
    ],
  },
] as const

const ADMIN_ITEMS = [
  { label: 'Admin', href: '/empower/admin', icon: 'wc-admin' },
  { label: 'Settings', href: '/empower/settings', icon: 'wc-settings' },
] as const

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function EmpowerNavItem({
  label,
  href,
  icon,
  pathname,
}: {
  label: string
  href: string
  icon: string
  pathname: string
}) {
  const active = isActivePath(pathname, href)
  return (
    <Link
      href={href}
      className={cn(
        'flex h-9 items-center gap-3 border-l-[3px] px-4 text-sm transition-colors',
        active
          ? 'border-[#1B87E6] bg-[#EFF6FF] font-medium text-[#1B87E6]'
          : 'border-transparent text-[#374151] hover:bg-[#F3F4F6]',
      )}
    >
      <span className={cn(icon, 'w-4 text-center text-base leading-none')} aria-hidden />
      <span>{label}</span>
    </Link>
  )
}

export function EmpowerShell({ children }: EmpowerShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const [createOpen, setCreateOpen] = useState(false)
  const user = getCurrentEmpowerUser()

  useEffect(() => {
    const handleOpenCreate = () => setCreateOpen(true)
    window.addEventListener(EMPOWER_OPEN_CREATE_EVENT, handleOpenCreate)
    return () => window.removeEventListener(EMPOWER_OPEN_CREATE_EVENT, handleOpenCreate)
  }, [])

  return (
    <div className="flex h-screen flex-col bg-white font-sans text-[#374151]">
      <header className="grid h-12 shrink-0 grid-cols-[200px_1fr_200px] items-center bg-[#1B87E6] px-4 text-white">
        <Link
          href="/empower"
          className="flex items-center gap-2 text-sm font-semibold text-white"
        >
          <span className="flex size-6 items-center justify-center rounded bg-white text-sm font-bold text-[#1B87E6]">
            P
          </span>
          <span>Empower</span>
          <span className="text-[10px] text-white/75" aria-hidden>▼</span>
        </Link>
        <button
          type="button"
          className="justify-self-start text-sm text-white/80 hover:text-white"
          onClick={() => showToast({ variant: 'info', message: 'Organization switcher' })}
        >
          Employee Experience Portal <span className="text-[10px]" aria-hidden>▼</span>
        </button>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-full border border-white/50 text-xs hover:bg-white/10"
            aria-label="Help"
            onClick={() =>
              showToast({ variant: 'info', message: 'Empower help is coming soon.' })
            }
          >
            ?
          </button>
          <span
            className="flex size-7 items-center justify-center rounded-full bg-white/20 text-[11px] font-semibold"
            title={user.name}
          >
            {user.avatar}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex h-[calc(100vh-48px)] w-[200px] shrink-0 flex-col border-r border-[#E5E7EB] bg-white pb-5">
          <Link
            href="/lifecycle/analytics/list"
            className="flex size-12 items-center justify-center text-2xl font-light text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]"
            aria-label="Close Empower and return to EX Portal"
          >
            ×
          </Link>

          <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-2">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="mb-5">
                <div className="px-[19px] pb-2 text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                  {section.label}
                </div>
                {section.items.map((item) => (
                  <EmpowerNavItem
                    key={item.href}
                    {...item}
                    pathname={pathname}
                  />
                ))}
              </div>
            ))}
          </nav>

          {user.role === 'admin' && (
            <nav className="shrink-0">
              {ADMIN_ITEMS.map((item) => (
                <EmpowerNavItem key={item.href} {...item} pathname={pathname} />
              ))}
            </nav>
          )}
        </aside>

        <main className="h-[calc(100vh-48px)] min-w-0 flex-1 overflow-y-auto bg-white p-8">
          {children}
        </main>
        <EmpowerAnalyticsPanel />
      </div>

      <CreateInitiativeModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          showToast({ variant: 'success', message: 'Initiative created' })
          router.push(`/empower/initiatives/${id}`)
        }}
      />
    </div>
  )
}
