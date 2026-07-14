'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { getMarcusLeeUser } from '@/lib/empowerIntegration/storage'
import { cn } from '@/lib/utils'
import { getCurrentUser, type AppUser } from '@/lib/userContext'

const moduleOptions = [
  {
    label: 'Lifecycle Surveys',
    href: '/lifecycle/surveys',
    iconClassName: 'wm-assignment',
  },
  {
    label: '360 Feedback',
    href: '/360/surveys',
    iconClassName: 'wm-360',
  },
  {
    label: 'Empower',
    href: '/empower/initiatives',
    iconClassName: 'wm-lightbulb',
  },
]

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
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<AppUser | null>(null)
  const switcherRef = useRef<HTMLDivElement>(null)
  const currentModuleName = getModuleName(pathname)
  const breadcrumbs = getBreadcrumbs(pathname)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [pathname])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!switcherRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function navigateTo(href: string) {
    setIsOpen(false)
    router.push(href)
  }

  function handleExitImpersonation() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('pp_impersonating')
    }
    setUser(getCurrentUser())
    showToast({ variant: 'success', message: 'Returned to admin view' })
    router.push('/lifecycle/roster')
  }

  function switchDemoRole(role: 'admin' | 'marcus_360') {
    if (typeof window === 'undefined') return
    if (role === 'admin') {
      window.localStorage.removeItem('pp_impersonating')
      setUser(getCurrentUser())
      showToast({ variant: 'success', message: 'Switched to admin view' })
      router.push('/lifecycle/analytics/list')
      return
    }

    const marcus = getMarcusLeeUser()
    window.localStorage.setItem(
      'pp_impersonating',
      JSON.stringify({
        id: marcus.id,
        name: marcus.name,
        email: marcus.email,
        role: 'employee',
      }),
    )
    setUser(getCurrentUser())
    showToast({ variant: 'success', message: 'Viewing as Marcus Lee — 360 Subject' })
    router.push('/360/my-report')
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
        <button type="button" className="font-semibold text-white" onClick={() => navigateTo('/lifecycle/surveys')} aria-label="Home">
          P
        </button>
        <div ref={switcherRef} className="relative">
          <button
            type="button"
            className={cn(
              'items-center gap-2 rounded-md px-1 py-1 text-xs font-medium text-white hover:bg-white/10',
              isSidebarCollapsed ? 'hidden' : 'flex',
            )}
            onClick={() => setIsOpen((open) => !open)}
          >
            {currentModuleName}
            <span className="text-xs text-white/70">▼</span>
          </button>

          {isOpen && (
            <div className="absolute left-0 top-9 z-50 w-72 rounded-xl border border-gray-200 bg-white py-2 text-gray-900 shadow-xl">
              <div className="flex items-center justify-between bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                <div className="flex items-center gap-3">
                  <span className="wc-employees-list text-lg" aria-hidden />
                  <span>Employee Experience</span>
                </div>
                <span className="text-gray-400" aria-hidden>
                  &gt;
                </span>
              </div>

              <div className="py-2">
                {moduleOptions.map((option) => {
                  const isActive = currentModuleName === option.label
                  return (
                    <button
                      key={option.href}
                      type="button"
                      className={cn(
                        'flex w-full items-center justify-between border-l-2 py-2 pl-10 pr-4 text-left text-sm hover:bg-gray-50',
                        isActive
                          ? 'border-blue-600 font-medium text-blue-700'
                          : 'border-transparent text-gray-700',
                      )}
                      onClick={() => navigateTo(option.href)}
                    >
                      <span className="flex items-center gap-3">
                        <span className={cn(option.iconClassName, 'text-base')} aria-hidden />
                        {option.label}
                      </span>
                      <span className={isActive ? 'text-blue-600' : 'text-gray-300'} aria-hidden>
                        {isActive ? '✓' : '›'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
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
        <button
          type="button"
          className="rounded border border-white/30 px-2 py-0.5 text-[10px] text-white/90 hover:bg-white/10"
          onClick={() => switchDemoRole('marcus_360')}
          title="Demo: Marcus — 360 Subject"
        >
          Marcus — 360 Subject
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
