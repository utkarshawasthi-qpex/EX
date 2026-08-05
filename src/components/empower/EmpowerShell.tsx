'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { EmpowerAnalyticsPanel } from '@/components/empower/EmpowerAnalyticsPanel'
import { EmpowerNav } from '@/components/empower/EmpowerNav'
import { EmpowerTopBar } from '@/components/empower/EmpowerTopBar'

const SIDEBAR_STORAGE_KEY = 'pp_empower_sidebar_expanded'

export function EmpowerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) setIsExpanded(stored === 'true')
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

  const sidebarExpanded = isHydrated ? isExpanded : true

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <EmpowerTopBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <EmpowerNav collapsed={!sidebarExpanded} onToggle={toggleSidebar} />
        <main className="min-w-0 flex-1 overflow-y-auto bg-white">{children}</main>
        {pathname === '/empower' && <EmpowerAnalyticsPanel />}
      </div>
    </div>
  )
}
