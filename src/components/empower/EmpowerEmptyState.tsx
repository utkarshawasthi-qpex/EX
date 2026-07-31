'use client'

import Link from 'next/link'

type EmpowerEmptyStateProps = {
  message: string
  icon?: string
  link?: { label: string; href: string }
}

export function EmpowerEmptyState({
  message,
  icon = 'wm-check-circle',
  link,
}: EmpowerEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFBFC] px-6 py-12 text-center">
      <span className={`${icon} text-4xl text-[#D1D5DB]`} aria-hidden />
      <p className="text-sm text-[#6B7280]">{message}</p>
      {link && (
        <Link href={link.href} className="text-sm font-medium text-[#1B87E6] hover:underline">
          {link.label}
        </Link>
      )}
    </div>
  )
}
