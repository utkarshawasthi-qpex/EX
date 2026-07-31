'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { CreateInitiativeModal } from '@/components/modules/empower/CreateInitiativeModal'
import { getCurrentEmpowerUser } from '@/lib/empower/simulation'
import { cn } from '@/lib/utils'

type EmpowerShellProps = {
  children: React.ReactNode
}

const NAV_ITEMS = [
  { label: 'Home', href: '/empower', icon: '🏠', adminOnly: false },
  { label: 'Initiatives', href: '/empower/initiatives', icon: '📋', adminOnly: false },
  { label: 'Ideation', href: '/empower/ideation', icon: '💡', adminOnly: false },
  { label: 'Analytics', href: '/empower/analytics', icon: '📊', adminOnly: true },
  { label: 'Conversations', href: '/empower/conversations', icon: '💬', adminOnly: false },
  { label: 'Settings', href: '/empower/settings', icon: '⚙️', adminOnly: true },
] as const

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/empower') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function EmpowerShell({ children }: EmpowerShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const [createOpen, setCreateOpen] = useState(false)
  const user = getCurrentEmpowerUser()
  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || user.role === 'admin')

  return (
    <div
      className="flex min-h-screen flex-col bg-[#F4F6FA] text-gray-900"
      style={{ fontFamily: "'Fira Sans', Arial, sans-serif" }}
    >
      <header className="flex h-14 shrink-0 items-center bg-[#1B2E4A] px-5 text-white">
        <Link
          href="/lifecycle/analytics"
          className="text-sm text-white/80 transition-colors hover:text-white"
        >
          ← Back to Portal
        </Link>
        <div className="ml-8 text-sm font-bold tracking-[0.16em]">EMPOWER</div>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full border border-white/30 text-sm hover:bg-white/10"
            aria-label="Help"
            onClick={() =>
              showToast({ variant: 'info', message: 'Empower help is coming soon.' })
            }
          >
            ?
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-white/80 sm:inline">{user.name}</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-[#1B87E6] text-xs font-semibold">
              {user.avatar}
            </span>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[220px] shrink-0 flex-col bg-[#1B2E4A] pb-4 text-white">
          <nav className="flex flex-1 flex-col gap-1 py-5">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 border-l-[3px] px-5 py-2.5 text-sm transition-colors',
                    active
                      ? 'border-[#1B87E6] bg-white/10 font-medium text-white'
                      : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <button
            type="button"
            className="mx-4 rounded-lg bg-[#1B87E6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1676ca]"
            onClick={() => setCreateOpen(true)}
          >
            + Create
          </button>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
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
