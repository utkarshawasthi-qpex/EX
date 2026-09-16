'use client'

import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ExAppHeader } from '@/components/studies/ExAppHeader'
import { AppFooter } from '@/components/shared/AppFooter'
import { AnalyticsPortalShell } from '@/components/shared/AnalyticsPortalShell'
import { LifecycleSidebar } from '@/components/shared/LifecycleSidebar'
import { ThreeSixtyDegSidebar } from '@/components/shared/ThreeSixtyDegSidebar'
import { isEmployeeListPath, isExLandingPath } from '@/lib/app-header'
import { isEmployeeContext } from '@/lib/userContext'

const WuToast = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToast })),
  { ssr: false },
)

function CurrentSidebar({ pathname }: { pathname: string }) {
  if (pathname.startsWith('/360')) return <ThreeSixtyDegSidebar collapsed={false} />
  return <LifecycleSidebar collapsed={false} />
}

function ChromeShell({
  children,
  showSidebar,
}: {
  children: React.ReactNode
  showSidebar: boolean
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col">
      <ExAppHeader />
      <div className="flex min-h-0 flex-1">
        {showSidebar ? <CurrentSidebar pathname={pathname} /> : null}
        <main className="min-h-0 min-w-0 flex-1 overflow-auto bg-white">{children}</main>
      </div>
      <AppFooter />
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [employeeMode, setEmployeeMode] = useState(false)
  const isFullPageEditor =
    /^\/lifecycle\/surveys\/[^/]+\/edit$/.test(pathname) ||
    /^\/360\/surveys\/[^/]+\/edit$/.test(pathname)
  const isAnalyticsPortal = pathname.startsWith('/lifecycle/analytics')
  const isEmpower = pathname.startsWith('/empower')
  const isPublicShare = pathname.startsWith('/share/')
  const isLanding = isExLandingPath(pathname)
  const isEmployeeList = isEmployeeListPath(pathname)

  useEffect(() => {
    setEmployeeMode(isEmployeeContext())
  }, [pathname])

  useEffect(() => {
    if (
      employeeMode &&
      !isEmpower &&
      !pathname.startsWith('/lifecycle/analytics') &&
      !isPublicShare
    ) {
      router.replace('/lifecycle/analytics')
    }
  }, [employeeMode, isEmpower, isPublicShare, pathname, router])

  // Empower ships its own three-column product shell in src/app/empower/layout.tsx.
  // Public share links are also chrome-free so recipients see only the dashboard.
  if (pathname === '/login' || isFullPageEditor || isEmpower || isPublicShare) {
    return (
      <>
        <WuToast />
        {children}
      </>
    )
  }

  if (employeeMode) {
    return (
      <>
        <WuToast />
        <AnalyticsPortalShell>{children}</AnalyticsPortalShell>
      </>
    )
  }

  return (
    <>
      <WuToast />
      {isAnalyticsPortal ? (
        <AnalyticsPortalShell>{children}</AnalyticsPortalShell>
      ) : (
        <ChromeShell showSidebar={!isLanding && !isEmployeeList}>{children}</ChromeShell>
      )}
    </>
  )
}
