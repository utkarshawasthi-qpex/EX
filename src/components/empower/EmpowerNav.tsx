'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isAdminContext } from '@/lib/userContext'
import { cn } from '@/lib/utils'

const EX_PORTAL_PATH = '/lifecycle/analytics/list'

type EmpowerNavEntry = {
  label: string
  href: string
  icon: string
  adminOnly?: boolean
}

const NAV_SECTIONS: { label: string; items: EmpowerNavEntry[] }[] = [
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
      { label: 'Analytics', href: '/empower/analytics', icon: 'wc-analytics', adminOnly: true },
      { label: 'Conversations', href: '/empower/conversations', icon: 'wm-forum' },
    ],
  },
]

const FOOTER_ITEMS: EmpowerNavEntry[] = [
  { label: 'Admin', href: '/empower/admin', icon: 'wc-admin', adminOnly: true },
  { label: 'Settings', href: '/empower/settings', icon: 'wc-settings', adminOnly: true },
]

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavEntry({ item, pathname }: { item: EmpowerNavEntry; pathname: string }) {
  const isActive = isActivePath(pathname, item.href)

  return (
    <Link
      href={item.href}
      className={cn(
        'flex h-9 items-center gap-3 border-l-[3px] px-4 text-[14px]',
        isActive
          ? 'border-[#1B87E6] bg-[#EFF6FF] font-medium text-[#1B87E6]'
          : 'border-transparent text-[#374151] hover:bg-[#F3F4F6]',
      )}
    >
      <span className={cn(item.icon, 'w-4 shrink-0 text-center text-base leading-none')} aria-hidden />
      <span>{item.label}</span>
    </Link>
  )
}

export function EmpowerNav() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(isAdminContext())
  }, [pathname])

  const canSee = (item: EmpowerNavEntry) => !item.adminOnly || isAdmin
  const footerItems = FOOTER_ITEMS.filter(canSee)

  return (
    <nav className="flex w-[200px] shrink-0 flex-col overflow-y-auto border-r border-[#E5E7EB] bg-white pb-4">
      <Link
        href={EX_PORTAL_PATH}
        className="flex size-12 shrink-0 items-center justify-center text-2xl font-light leading-none text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]"
        aria-label="Close Empower and return to the EX portal"
      >
        ×
      </Link>

      <div className="flex flex-1 flex-col gap-5">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter(canSee)
          if (items.length === 0) return null

          return (
            <div key={section.label}>
              <p className="px-4 pb-2 text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                {section.label}
              </p>
              {items.map((item) => (
                <NavEntry key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          )
        })}
      </div>

      {footerItems.length > 0 && (
        <div className="shrink-0 border-t border-[#E5E7EB] pt-4">
          {footerItems.map((item) => (
            <NavEntry key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      )}
    </nav>
  )
}
