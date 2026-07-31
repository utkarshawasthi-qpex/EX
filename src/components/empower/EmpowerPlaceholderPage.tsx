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
    <div className="min-h-full p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      </header>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-400">
        This screen is being built — {screenName} will render here
      </div>
    </div>
  )
}
