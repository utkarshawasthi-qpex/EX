'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getCurrentEmpowerUser } from '@/lib/empower/simulation'

type EmpowerPlaceholderPageProps = {
  title: string
  screenName: string
  adminOnly?: boolean
}

export function EmpowerPlaceholderPage({
  title,
  screenName,
  adminOnly = false,
}: EmpowerPlaceholderPageProps) {
  const router = useRouter()
  const user = getCurrentEmpowerUser()
  const blocked = adminOnly && user.role !== 'admin'

  useEffect(() => {
    if (blocked) router.replace('/empower')
  }, [blocked, router])

  if (blocked) return null

  return (
    <div className="min-h-full">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1B2E4A]">{title}</h1>
      </header>
      <div className="rounded border border-dashed border-[#E5E7EB] bg-[#FAFAFA] p-8 text-sm text-[#9CA3AF]">
        This screen is being built — {screenName} will render here
      </div>
    </div>
  )
}
