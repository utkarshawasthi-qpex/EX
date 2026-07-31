'use client'

import { EmpowerAnalyticsPanel } from '@/components/empower/EmpowerAnalyticsPanel'
import { EmpowerNav } from '@/components/empower/EmpowerNav'
import { EmpowerTopBar } from '@/components/empower/EmpowerTopBar'

export function EmpowerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <EmpowerTopBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <EmpowerNav />
        <main className="min-w-0 flex-1 overflow-y-auto bg-white">{children}</main>
        <EmpowerAnalyticsPanel />
      </div>
    </div>
  )
}
