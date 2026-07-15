'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'

const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
)

export function InitiativeCategoryChip({ count, initiativeIds }: { count: number; initiativeIds: string[] }) {
  const [open, setOpen] = useState(false)
  const label = count === 1 ? '⚑ 1 active initiative' : `⚑ ${count} active initiatives`

  if (count === 1) {
    return (
      <Link href={`/empower/initiatives/${initiativeIds[0]}`}>
        <WuChip size="sm" variant="secondary" className="cursor-pointer">{label}</WuChip>
      </Link>
    )
  }

  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen((v) => !v)}>
        <WuChip size="sm" variant="secondary" className="cursor-pointer">{label}</WuChip>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {initiativeIds.map((id) => (
            <Link key={id} href={`/empower/initiatives/${id}`} className="block px-3 py-2 text-xs text-blue-600 hover:bg-gray-50" onClick={() => setOpen(false)}>
              View initiative →
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
