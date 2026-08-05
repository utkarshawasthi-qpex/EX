'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ProductSwitcher } from '@/components/shared/ProductSwitcher'
import { getCurrentUser } from '@/lib/userContext'

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return 'UA'
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase() || 'UA'
}

export function EmpowerTopBar() {
  const { showToast } = useWuShowToast()
  const [initials, setInitials] = useState('UA')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const user = getCurrentUser()
    setInitials(toInitials(user.name))
    setUserName(user.name)
  }, [])

  return (
    <header className="flex h-12 shrink-0 items-center gap-4 bg-[#1B87E6] px-4">
      <div className="flex items-center gap-2 text-white">
        <Link href="/empower" aria-label="Empower home">
          <span className="flex size-6 items-center justify-center rounded bg-white text-sm font-bold text-[#1B87E6]">
            P
          </span>
        </Link>
        <ProductSwitcher
          activeLabel="Empower"
          triggerClassName="flex items-center gap-2 rounded px-1 py-0.5 text-sm font-semibold text-white hover:bg-white/10"
          chevron="▾"
          chevronClassName="text-[10px] text-white/75"
        />
      </div>

      <div className="flex flex-1 items-center" />

      <div className="flex items-center gap-3 text-white">
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-full border border-white/40 text-xs font-medium hover:bg-white/10"
          aria-label="Help"
          onClick={() => showToast({ variant: 'info', message: 'Empower help is coming soon.' })}
        >
          ?
        </button>
        <span
          className="flex size-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold"
          title={userName || undefined}
        >
          {initials}
        </span>
      </div>
    </header>
  )
}
