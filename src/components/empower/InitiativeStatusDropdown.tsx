'use client'

import dynamic from 'next/dynamic'
import { INITIATIVE_STATUS_OPTIONS, initiativeStatusLabel } from '@/lib/empowerIntegration/helpers'
import type { InitiativeLifecycleStatus } from '@/types/empowerIntegration'

const WuMenu = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })), { ssr: false })
const WuMenuItem = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })), { ssr: false })

interface InitiativeStatusDropdownProps {
  status: InitiativeLifecycleStatus
  onChange: (status: InitiativeLifecycleStatus) => void
}

function StatusDot({ color }: { color: string | null }) {
  return (
    <span
      className="size-2.5 shrink-0 rounded-full"
      style={color ? { backgroundColor: color } : { border: '1px solid #9CA3AF' }}
      aria-hidden
    />
  )
}

export function InitiativeStatusDropdown({ status, onChange }: InitiativeStatusDropdownProps) {
  const current = INITIATIVE_STATUS_OPTIONS.find((option) => option.value === status)

  return (
    <WuMenu
      align="end"
      Trigger={
        <button
          type="button"
          className="flex items-center gap-2 rounded border border-[#D1D5DB] bg-white px-3 py-1.5 text-sm text-[#1B2E4A] hover:bg-[#F9FAFB]"
          aria-label={`Initiative status: ${initiativeStatusLabel(status)}`}
        >
          <StatusDot color={current?.color ?? null} />
          {initiativeStatusLabel(status)}
          <span className="wm-expand-more text-base leading-none text-[#6B7280]" aria-hidden />
        </button>
      }
    >
      {INITIATIVE_STATUS_OPTIONS.map((option) => (
        <WuMenuItem key={option.value} onSelect={() => onChange(option.value)}>
          <span className="flex items-center gap-2">
            <StatusDot color={option.color} />
            {option.label}
          </span>
        </WuMenuItem>
      ))}
    </WuMenu>
  )
}
