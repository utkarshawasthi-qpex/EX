'use client'

import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ExHeaderSearch } from '@/components/studies/ExHeaderSearch'
import { MOCK_HEADER_USER } from '@/data/mock-header-user'
import {
  getHeaderBreadcrumbs,
  getHeaderCategories,
  getHeaderHomeLink,
  getHeaderProductName,
} from '@/lib/app-header'
import { cn } from '@/lib/utils'
import { useRosterStore } from '@/lib/rosterStore'
import { getCurrentUser, type AppUser } from '@/lib/userContext'
import {
  getSurveyBuilderCrumb,
  subscribeSurveyBuilderCrumb,
} from '@/lib/surveyBuilderCrumb'

const WuAppHeaderMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeaderMenu })),
  { ssr: false },
)
const WuAppHeaderBar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeaderBar })),
  { ssr: false },
)
const WuAppHeaderHelp = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeaderHelp })),
  { ssr: false },
)
const WuAppHeaderAccount = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeaderAccount })),
  { ssr: false },
)

export function ExAppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const [user, setUser] = useState<AppUser | null>(null)
  const { setup } = useRosterStore()

  const surveyCrumb = useSyncExternalStore(
    subscribeSurveyBuilderCrumb,
    getSurveyBuilderCrumb,
    () => '',
  )
  const isSurveyEditor =
    /^\/lifecycle\/surveys\/[^/]+\/edit/.test(pathname) ||
    /^\/360\/surveys\/[^/]+\/edit/.test(pathname)
  const breadcrumbs = isSurveyEditor
    ? [
        { label: setup.folderName || 'New folks', href: '/lifecycle' },
        { label: surveyCrumb || 'Survey', href: pathname },
      ]
    : getHeaderBreadcrumbs(pathname, setup.folderName)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [pathname])

  function handleLogout() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('pp_authed')
      window.localStorage.removeItem('pp_impersonating')
    }
    showToast({ variant: 'success', message: 'Signed out' })
    router.push('/login')
  }

  function handleExitImpersonation() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('pp_impersonating')
    }
    setUser(getCurrentUser())
    showToast({ variant: 'success', message: 'Returned to admin view' })
    router.push('/lifecycle')
  }

  return (
    <div className="sticky top-0 z-50 w-full">
      <header className="relative flex h-12 items-center justify-between bg-[#041f49] text-white wu-bg-blue-switcher">
        <WuAppHeaderMenu
          productCategories={getHeaderCategories()}
          activeProductName={getHeaderProductName(pathname)}
          homeLink={getHeaderHomeLink(pathname)}
        />
        <nav className="flex min-w-0 flex-1 items-center gap-2 px-4 text-xs text-white" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.href}_${index}`} className="flex min-w-0 items-center gap-2">
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
              {index < breadcrumbs.length - 1 && (
                <span className="text-white/40" aria-hidden>
                  ›
                </span>
              )}
            </span>
          ))}
        </nav>
        <section className="flex shrink-0 items-center justify-end gap-2 pr-4">
          <WuAppHeaderBar className="!w-auto !min-w-0 !flex-none">
            <ExHeaderSearch />
          </WuAppHeaderBar>
          <button
            type="button"
            className="rounded-full bg-[#ffb21a] px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
            onClick={() => showToast({ variant: 'info', message: 'Upgrade options opened' })}
          >
            Upgrade Now
          </button>
          <WuAppHeaderHelp />
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full border border-white text-white transition-colors hover:bg-white hover:text-[#041f49]"
            aria-label="Notifications"
            onClick={() => showToast({ variant: 'info', message: 'No new notifications' })}
          >
            <span className="wm-notifications text-xl" aria-hidden />
          </button>
          <WuAppHeaderAccount user={MOCK_HEADER_USER} onLogout={handleLogout} />
        </section>
      </header>

      {user?.isImpersonating && (
        <div className="flex w-full items-center justify-between bg-amber-500 px-4 py-2 text-sm text-white">
          <span>
            Viewing portal as {user.name} ({user.email})
          </span>
          <button
            type="button"
            className="cursor-pointer font-medium text-white underline"
            onClick={handleExitImpersonation}
          >
            Exit Employee View
          </button>
        </div>
      )}
    </div>
  )
}
