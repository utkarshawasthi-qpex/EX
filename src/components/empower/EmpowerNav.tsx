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
  /** Home would otherwise match every nested Empower route. */
  exact?: boolean
}

type EmpowerNavSection = {
  /** Sections without a label render their items with no heading. */
  label?: string
  items: EmpowerNavEntry[]
}

const NAV_SECTIONS: EmpowerNavSection[] = [
  {
    items: [{ label: 'Home', href: '/empower', icon: 'wc-home', exact: true }],
  },
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

function isActivePath(pathname: string, item: EmpowerNavEntry): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

function NavEntry({
  item,
  pathname,
  collapsed,
}: {
  item: EmpowerNavEntry
  pathname: string
  collapsed: boolean
}) {
  const isActive = isActivePath(pathname, item)

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex h-9 items-center border-l-[3px] text-[14px]',
        collapsed ? 'justify-center px-0' : 'gap-3 px-4',
        isActive
          ? 'border-[#1B87E6] bg-[#EFF6FF] font-medium text-[#1B87E6]'
          : 'border-transparent text-[#374151] hover:bg-[#F3F4F6]',
      )}
    >
      <span className={cn(item.icon, 'w-4 shrink-0 text-center text-base leading-none')} aria-hidden />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}

export function EmpowerNav({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(isAdminContext())
  }, [pathname])

  const canSee = (item: EmpowerNavEntry) => !item.adminOnly || isAdmin
  const navSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(canSee),
  })).filter((section) => section.items.length > 0)
  const footerItems = FOOTER_ITEMS.filter(canSee)

  return (
    <nav
      className={cn(
        'flex shrink-0 flex-col overflow-y-auto border-r border-[#E5E7EB] bg-white pb-4 transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-12' : 'w-[200px]',
      )}
    >
      <div className={cn('flex h-12 shrink-0 items-center', collapsed ? 'justify-center' : 'px-2')}>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="wm-menu text-lg leading-none" aria-hidden />
        </button>

        {!collapsed && (
          <Link
            href={EX_PORTAL_PATH}
            className="ml-auto flex size-8 items-center justify-center rounded text-xl font-light leading-none text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]"
            aria-label="Close Empower and return to the EX portal"
          >
            ×
          </Link>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {navSections.map((section, index) => (
          <div key={section.label ?? `section-${index}`} className="mb-4">
            {!collapsed && section.label && (
              <p className="px-4 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                {section.label}
              </p>
            )}
            {section.items.map((item) => (
              <NavEntry key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </div>

      {footerItems.length > 0 && (
        <div className="shrink-0 border-t border-[#E5E7EB] pt-4">
          {footerItems.map((item) => (
            <NavEntry key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
          ))}
        </div>
      )}
    </nav>
  )
}
