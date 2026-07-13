'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { isAdminContext } from '@/lib/userContext'
import { cn } from '@/lib/utils'

const SIDEBAR_STORAGE_KEY = 'pp_sidebar_expanded'
const SIDEBAR_SHADOW =
  '2px 0px 0px rgba(27,51,128,0.04), 4px 0px 16px rgba(27,51,128,0.04)'

const DASHBOARDS_PATH = '/lifecycle/analytics/list'
const SURVEY_COMPARISON_PATH = '/lifecycle/analytics/survey-comparison'
const BENCHMARKING_PATH = '/lifecycle/analytics/benchmarking'
const PPT_TEMPLATES_PATH = '/lifecycle/analytics/settings'
const ADMIN_PATH = '/lifecycle/analytics/admin'
const SETTINGS_PATH = '/lifecycle/analytics/settings'
const ORG_CONTEXT_PATH = '/lifecycle/analytics/org-context'

/** Figma MCP asset URLs — replace if refreshed from Figma export. */
const imgBalance =
  'https://www.figma.com/api/mcp/asset/balance-icon'
const imgLineGraph =
  'https://www.figma.com/api/mcp/asset/line-graph-icon'
const imgFileTypePpt =
  'https://www.figma.com/api/mcp/asset/file-type-ppt-icon'
const imgShieldPerson =
  'https://www.figma.com/api/mcp/asset/shield-person-icon'
const imgSettings =
  'https://www.figma.com/api/mcp/asset/settings-icon'

type NavItem = {
  label: string
  href: string
  icon: 'dashboard' | 'balance' | 'lineGraph' | 'ppt' | 'orgContext' | 'admin' | 'settings'
  adminOnly?: boolean
  isActive: (pathname: string) => boolean
}

const RESERVED_ANALYTICS_SEGMENTS = new Set([
  'list',
  'survey-comparison',
  'benchmarking',
  'settings',
  'admin',
  'org-context',
])

function isDashboardsActive(pathname: string): boolean {
  if (pathname === '/lifecycle/analytics' || pathname === '/lifecycle/analytics/list') return true
  if (!pathname.startsWith('/lifecycle/analytics/')) return false
  const segment = pathname.slice('/lifecycle/analytics/'.length).split('/')[0]
  return Boolean(segment) && !RESERVED_ANALYTICS_SEGMENTS.has(segment)
}

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M3 5H17M3 10H17M3 15H17"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  )
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth={1.5} />
      <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth={1.5} />
      <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth={1.5} />
      <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  )
}

function OrgContextIcon({ className }: { className?: string }) {
  return <span className={cn('wm-account-tree text-[20px] leading-none', className)} aria-hidden />
}

function IconWithFallback({
  src,
  fallbackIcon,
  active,
}: {
  src: string
  fallbackIcon: NavItem['icon']
  active: boolean
}) {
  const [useFallback, setUseFallback] = useState(false)
  const activeFilter =
    'invert(42%) sepia(93%) saturate(1352%) hue-rotate(186deg) brightness(95%) contrast(91%)'

  if (useFallback) {
    return <NavIconFallback icon={fallbackIcon} active={active} />
  }

  return (
    <img
      src={src}
      alt=""
      className="size-5 object-contain"
      style={active ? { filter: activeFilter } : undefined}
      onError={() => setUseFallback(true)}
    />
  )
}

function NavIcon({
  icon,
  active,
}: {
  icon: NavItem['icon']
  active: boolean
}) {
  switch (icon) {
    case 'dashboard':
      return <DashboardIcon className={active ? 'text-[#1B87E6]' : 'text-[#545E6B]'} />
    case 'orgContext':
      return <OrgContextIcon className={active ? 'text-[#1B87E6]' : 'text-[#545E6B]'} />
    case 'balance':
      return <IconWithFallback src={imgBalance} fallbackIcon="balance" active={active} />
    case 'lineGraph':
      return <IconWithFallback src={imgLineGraph} fallbackIcon="lineGraph" active={active} />
    case 'ppt':
      return <IconWithFallback src={imgFileTypePpt} fallbackIcon="ppt" active={active} />
    case 'admin':
      return <IconWithFallback src={imgShieldPerson} fallbackIcon="admin" active={active} />
    case 'settings':
      return <IconWithFallback src={imgSettings} fallbackIcon="settings" active={active} />
  }
}

function NavIconFallback({ icon, active }: { icon: NavItem['icon']; active: boolean }) {
  const colorClass = active ? 'text-[#1B87E6]' : 'text-[#545E6B]'
  const iconClass =
    icon === 'balance'
      ? 'wc-balancing'
      : icon === 'lineGraph'
        ? 'wc-analytics'
        : icon === 'ppt'
          ? 'wc-file-type-ppt'
          : icon === 'admin'
            ? 'wc-admin'
            : icon === 'settings'
              ? 'wc-settings'
              : 'wc-templates'

  return <span className={cn(iconClass, 'text-[20px] leading-none', colorClass)} aria-hidden />
}

function CollapsedNavItem({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const active = item.isActive(pathname)

  return (
    <div
      className="relative flex h-8 items-center pl-[14px]"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link
        href={item.href}
        aria-label={item.label}
        className={cn(
          'flex size-8 items-center justify-center rounded-[2px]',
          active && 'bg-[rgba(27,135,230,0.08)]',
        )}
      >
        <NavIcon icon={item.icon} active={active} />
      </Link>
      {showTooltip && (
        <div className="absolute left-14 z-50 whitespace-nowrap rounded bg-[#1F2E4D] px-2 py-1 text-xs text-white">
          {item.label}
        </div>
      )}
    </div>
  )
}

function ExpandedNavItem({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const active = item.isActive(pathname)

  return (
    <Link
      href={item.href}
      className={cn(
        'flex h-8 w-[224px] items-center rounded-[2px] px-1.5',
        active ? 'bg-[rgba(27,135,230,0.08)] font-medium text-[#1B87E6]' : 'font-normal text-[#545E6B]',
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center">
        <NavIcon icon={item.icon} active={active} />
      </span>
      <span className="font-['Fira_Sans',sans-serif] text-[14px] leading-4">{item.label}</span>
    </Link>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-8 w-[224px] items-end px-2 pb-1">
      <span className="font-['Fira_Sans',sans-serif] text-[11px] uppercase tracking-wide text-[#545E6B]">
        {children}
      </span>
    </div>
  )
}

function AnalyticsSidebar({
  pathname,
  isExpanded,
  onToggle,
}: {
  pathname: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const showAdmin = isAdminContext()
  const showOrgContext = isAdminContext()

  const analyticsItems: NavItem[] = [
    {
      label: 'Dashboards',
      href: DASHBOARDS_PATH,
      icon: 'dashboard',
      isActive: isDashboardsActive,
    },
  ]

  const dataItems: NavItem[] = [
    {
      label: 'Survey comparison',
      href: SURVEY_COMPARISON_PATH,
      icon: 'balance',
      isActive: (path) => path.startsWith(SURVEY_COMPARISON_PATH),
    },
    {
      label: 'Benchmarking',
      href: BENCHMARKING_PATH,
      icon: 'lineGraph',
      isActive: (path) => path.startsWith(BENCHMARKING_PATH),
    },
    {
      label: 'PPT templates',
      href: PPT_TEMPLATES_PATH,
      icon: 'ppt',
      isActive: (path) => path.startsWith(PPT_TEMPLATES_PATH),
    },
    ...(showOrgContext
      ? [
          {
            label: 'Org Context',
            href: ORG_CONTEXT_PATH,
            icon: 'orgContext' as const,
            adminOnly: true,
            isActive: (path: string) => path.startsWith(ORG_CONTEXT_PATH),
          },
        ]
      : []),
  ]

  const systemItems: NavItem[] = [
    ...(showAdmin
      ? [
          {
            label: 'Admin',
            href: ADMIN_PATH,
            icon: 'admin' as const,
            adminOnly: true,
            isActive: (path: string) => path.startsWith(ADMIN_PATH),
          },
        ]
      : []),
    {
      label: 'Settings',
      href: SETTINGS_PATH,
      icon: 'settings',
      isActive: (path) => path.startsWith(SETTINGS_PATH),
    },
  ]

  const collapsedNavItems = [...analyticsItems, ...dataItems]
  const collapsedSystemItems = systemItems

  return (
    <aside
      className={cn(
        'fixed left-0 top-10 z-30 flex flex-col bg-[#EEF3FB] transition-[width] duration-200 ease-in-out',
        isExpanded ? 'w-[240px]' : 'w-12',
      )}
      style={{
        boxShadow: SIDEBAR_SHADOW,
        height: 'calc(100vh - 2.5rem)',
      }}
    >
      <div className="flex h-12 shrink-0 items-center px-2">
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-[2px] text-[#545E6B] hover:bg-[rgba(27,135,230,0.08)]"
          onClick={onToggle}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <HamburgerIcon />
        </button>
      </div>

      {!isExpanded ? (
        <>
          <nav className="flex flex-col overflow-hidden pt-8">
            {collapsedNavItems.map((item) => (
              <CollapsedNavItem key={item.label} item={item} pathname={pathname} />
            ))}
          </nav>
          <nav className="mt-auto flex flex-col pb-4">
            {collapsedSystemItems.map((item) => (
              <CollapsedNavItem key={item.label} item={item} pathname={pathname} />
            ))}
          </nav>
        </>
      ) : (
        <>
          <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
            <SectionLabel>Analytics</SectionLabel>
            {analyticsItems.map((item) => (
              <ExpandedNavItem key={item.label} item={item} pathname={pathname} />
            ))}

            <div className="mt-2">
              <SectionLabel>Data</SectionLabel>
              {dataItems.map((item) => (
                <ExpandedNavItem key={item.label} item={item} pathname={pathname} />
              ))}
            </div>
          </nav>

          <nav className="shrink-0 px-2 pb-4 pt-2">
            {systemItems.map((item) => (
              <ExpandedNavItem key={item.label} item={item} pathname={pathname} />
            ))}
          </nav>
        </>
      )}
    </aside>
  )
}

export function AnalyticsPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    setIsExpanded(stored === 'true')
    setIsHydrated(true)
  }, [])

  const toggleSidebar = useCallback(() => {
    setIsExpanded((current) => {
      const next = !current
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      }
      return next
    })
  }, [])

  const sidebarExpanded = isHydrated ? isExpanded : false

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar isSidebarCollapsed onToggleSidebar={() => {}} />
      <div className="relative min-h-0 flex-1">
        <AnalyticsSidebar
          pathname={pathname}
          isExpanded={sidebarExpanded}
          onToggle={toggleSidebar}
        />
        <main
          className={cn(
            'h-[calc(100vh-2.5rem)] min-w-0 overflow-auto bg-white transition-[margin-left] duration-200 ease-in-out',
            sidebarExpanded ? 'ml-[240px]' : 'ml-12',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
