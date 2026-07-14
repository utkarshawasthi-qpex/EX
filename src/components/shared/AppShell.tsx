'use client'

import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnalyticsPortalShell } from '@/components/shared/AnalyticsPortalShell'
import { EmpowerSidebar } from '@/components/shared/EmpowerSidebar'
import { LifecycleSidebar } from '@/components/shared/LifecycleSidebar'
import { ThreeSixtyDegSidebar } from '@/components/shared/ThreeSixtyDegSidebar'
import { TopBar } from '@/components/shared/TopBar'
import { isEmployeeContext } from '@/lib/userContext'

const WuToast = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToast })),
  { ssr: false },
)

function CurrentSidebar({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  if (pathname.startsWith('/360')) return <ThreeSixtyDegSidebar collapsed={collapsed} />
  if (pathname.startsWith('/empower')) return <EmpowerSidebar collapsed={collapsed} />
  return <LifecycleSidebar collapsed={collapsed} />
}

function StandardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />
      <div className="flex min-h-0 flex-1">
        <CurrentSidebar pathname={pathname} collapsed={isSidebarCollapsed} />
        <main className="h-[calc(100vh-2.5rem)] min-w-0 flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [employeeMode, setEmployeeMode] = useState(false)
  const isFullPageEditor = /^\/lifecycle\/surveys\/[^/]+\/edit$/.test(pathname)
  const isAnalyticsPortal = pathname.startsWith('/lifecycle/analytics')

  useEffect(() => {
    setEmployeeMode(isEmployeeContext())
  }, [pathname])

  useEffect(() => {
    if (
      employeeMode &&
      !pathname.startsWith('/lifecycle/analytics') &&
      !pathname.startsWith('/360/my-report')
    ) {
      router.replace('/lifecycle/analytics')
    }
  }, [employeeMode, pathname, router])

  if (pathname === '/login' || isFullPageEditor) {
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
        <StandardShell>{children}</StandardShell>
      )}
    </>
  )
}
