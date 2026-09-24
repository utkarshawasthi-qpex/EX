'use client'

import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ExAppHeader } from '@/components/studies/ExAppHeader'
import { AppFooter } from '@/components/shared/AppFooter'
import { AnalyticsPortalShell } from '@/components/shared/AnalyticsPortalShell'
import { LifecycleSidebar } from '@/components/shared/LifecycleSidebar'
import { isEmployeeListPath, isExLandingPath } from '@/lib/app-header'
import { isEmployeeContext } from '@/lib/userContext'

const WuToast = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToast })),
  { ssr: false },
)

function CurrentSidebar() {
  return <LifecycleSidebar collapsed={false} />
}

function ChromeShell({
  children,
  showSidebar,
}: {
  children: React.ReactNode
  showSidebar: boolean
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ExAppHeader />
      <div className="flex min-h-0 flex-1">
        {showSidebar ? <CurrentSidebar /> : null}
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
  const isLifecycleSurveyEditor = /^\/lifecycle\/surveys\/[^/]+\/edit$/.test(pathname)
  const is360SurveyEditor = /^\/360\/surveys\/[^/]+\/edit/.test(pathname)
  const isAnalyticsPortal = pathname.startsWith('/lifecycle/analytics')
  const isPublicShare = pathname.startsWith('/share/')
  const isLanding = isExLandingPath(pathname)
  const isEmployeeList = isEmployeeListPath(pathname)

  useEffect(() => {
    setEmployeeMode(isEmployeeContext())
  }, [pathname])

  useEffect(() => {
    if (employeeMode && !pathname.startsWith('/lifecycle/analytics') && !isPublicShare) {
      router.replace('/lifecycle/analytics')
    }
  }, [employeeMode, isPublicShare, pathname, router])

  // Public share links are chrome-free so recipients see only the dashboard.
  if (pathname === '/login' || isPublicShare) {
    return (
      <>
        <WuToast />
        {children}
      </>
    )
  }

  if (isLifecycleSurveyEditor || is360SurveyEditor) {
    return (
      <>
        <WuToast />
        <div className="flex min-h-screen flex-col bg-white">
          <ExAppHeader />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
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
        <ChromeShell showSidebar={!isLanding && !isEmployeeList && !pathname.startsWith('/360')}>
          {children}
        </ChromeShell>
      )}
    </>
  )
}
