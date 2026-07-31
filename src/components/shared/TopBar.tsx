'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ProductSwitcher } from '@/components/shared/ProductSwitcher'
import { cn } from '@/lib/utils'
import { getCurrentUser, type AppUser } from '@/lib/userContext'

type TopBarProps = {
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
}

function getModuleName(pathname: string) {
  if (pathname.startsWith('/lifecycle/analytics')) return 'Analytics Portal'
  if (pathname.startsWith('/360')) return '360 Feedback'
  if (pathname.startsWith('/empower')) return 'Empower'
  return 'Lifecycle Surveys'
}

function getBreadcrumbs(pathname: string) {
  if (pathname.startsWith('/lifecycle/roster/')) {
    return [
      { label: 'New folks', href: '/lifecycle/roster' },
      { label: 'Employee Profile', href: pathname },
    ]
  }
  if (pathname.startsWith('/lifecycle/roster')) {
    return [
      { label: 'New folks', href: '/lifecycle/roster' },
      { label: 'Manage Employee List', href: '/lifecycle/roster' },
    ]
  }
  if (pathname.startsWith('/lifecycle/surveys')) {
    return [
      { label: 'New folks', href: '/lifecycle/surveys' },
      { label: 'Surveys', href: '/lifecycle/surveys' },
    ]
  }
  if (pathname.startsWith('/lifecycle/rules')) {
    return [
      { label: 'New folks', href: '/lifecycle/rules' },
      { label: 'Rules', href: '/lifecycle/rules' },
    ]
  }
  if (pathname.startsWith('/360')) {
    return [
      { label: '360 Feedback', href: '/360/surveys' },
      { label: pathname.includes('/participants') ? 'Participants' : 'Surveys', href: pathname },
    ]
  }
  if (pathname.startsWith('/empower')) {
    return [
      { label: 'Empower', href: '/empower/initiatives' },
      { label: pathname.includes('/tasks') ? 'My Tasks' : 'Initiatives', href: pathname },
    ]
  }
  return [{ label: 'New folks', href: '/lifecycle/surveys' }]
}

export function TopBar({ isSidebarCollapsed, onToggleSidebar }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const [user, setUser] = useState<AppUser | null>(null)
  const currentModuleName = getModuleName(pathname)
  const breadcrumbs = getBreadcrumbs(pathname)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [pathname])

  function handleExitImpersonation() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('pp_impersonating')
    }
    setUser(getCurrentUser())
    showToast({ variant: 'success', message: 'Returned to admin view' })
    router.push('/lifecycle/roster')
  }

  return (
    <div className="sticky top-0 z-50">
      <header className="flex h-10 shrink-0 items-stretch bg-[#041f49] text-white">
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 bg-[#1a6b8a] px-3 transition-all',
          isSidebarCollapsed ? 'w-16 justify-center' : 'w-60',
        )}
      >
        <button type="button" className="font-semibold text-white" onClick={() => router.push('/lifecycle/surveys')} aria-label="Home">
          P
        </button>
        <ProductSwitcher
          activeLabel={currentModuleName}
          triggerClassName={cn(
            'items-center gap-2 rounded-md px-1 py-1 text-xs font-medium text-white hover:bg-white/10',
            isSidebarCollapsed ? 'hidden' : 'flex',
          )}
          chevronClassName="text-xs text-white/70"
        />
      </div>

      <button
        type="button"
        className="flex w-8 items-center justify-center border-r border-white/10 text-white/80 hover:bg-white/10"
        onClick={onToggleSidebar}
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className={isSidebarCollapsed ? 'wm-keyboard-arrow-right' : 'wm-keyboard-arrow-left'} aria-hidden />
      </button>

      <nav className="flex min-w-0 flex-1 items-center gap-2 px-4 text-xs">
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.href}_${index}`} className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                'truncate hover:text-white',
                index === breadcrumbs.length - 1 ? 'text-white' : 'text-white/70',
              )}
              onClick={() => router.push(crumb.href)}
            >
              {crumb.label}
            </button>
            {index < breadcrumbs.length - 1 && <span className="text-white/40">›</span>}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 px-3">
        <button
          type="button"
          className="wm-search flex size-7 items-center justify-center rounded-full border border-white/30 text-sm text-white"
          aria-label="Search"
          onClick={() => console.log('Search clicked')}
        />
        <button
          type="button"
          className="rounded-full bg-[#ffb21a] px-3 py-1 text-xs font-semibold text-white"
          onClick={() => console.log('Upgrade Now clicked')}
        >
          Upgrade Now
        </button>
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-full border border-white/30 text-sm text-white"
          aria-label="Help"
          onClick={() => console.log('Help clicked')}
        >
          ?
        </button>
        <div className="flex size-7 items-center justify-center rounded-full border border-white/30 bg-[#071d35] text-[10px] font-semibold text-white">
          UA
        </div>
      </div>
    </header>

      {user?.isImpersonating && (
        <div className="flex w-full items-center justify-between bg-amber-500 px-4 py-2 text-sm text-white">
          <span>
            👤 Viewing portal as {user.name} ({user.email})
          </span>
          <button
            type="button"
            className="cursor-pointer font-medium text-white underline"
            onClick={handleExitImpersonation}
          >
            ✕ Exit Employee View
          </button>
        </div>
      )}
    </div>
  )
}
