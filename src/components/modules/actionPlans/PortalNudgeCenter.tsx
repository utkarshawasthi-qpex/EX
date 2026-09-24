'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  getActiveNudgesForUser,
  recordNudgeDismissed,
  recordNudgeEngaged,
  recordNudgeShown,
  resubscribeNudges,
  getNudgePreferences,
} from '@/lib/actionPlans/nudges'
import { EMPOWER_DATA_CHANGED_EVENT } from '@/lib/empowerEvents'
import { getCurrentUser } from '@/lib/userContext'
import type { PortalNudge } from '@/lib/actionPlans/nudges'

export function PortalNudgeCenter() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [nudges, setNudges] = useState<PortalNudge[]>([])

  const refresh = useCallback(() => {
    const user = getCurrentUser()
    if (!user) {
      setNudges([])
      return
    }
    const active = getActiveNudgesForUser(user)
    setNudges(active)
    if (active.length > 0) recordNudgeShown(user.id, active[0])
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, pathname])

  useEffect(() => {
    window.addEventListener(EMPOWER_DATA_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(EMPOWER_DATA_CHANGED_EVENT, refresh)
  }, [refresh])

  const user = getCurrentUser()
  if (!user) return null

  const prefs = getNudgePreferences(user.id)
  const count = nudges.length

  return (
    <div className="relative">
      <button
        type="button"
        className="relative flex size-8 items-center justify-center rounded text-white hover:bg-white/10"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="wm-notifications text-lg leading-none" aria-hidden />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-[#041f49]">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-md border border-gray-200 bg-white py-2 text-gray-900 shadow-lg">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Nudges
          </p>
          {prefs.unsubscribed ? (
            <div className="px-3 py-2 text-sm text-gray-600">
              Nudges paused after repeated dismissals.{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => {
                  resubscribeNudges(user.id)
                  refresh()
                }}
              >
                Turn back on
              </button>
            </div>
          ) : count === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">You&apos;re caught up this week.</p>
          ) : (
            nudges.map((n) => (
              <div key={n.id} className="border-t border-gray-100 px-3 py-2">
                <p className="text-sm text-gray-800">{n.message}</p>
                <div className="mt-2 flex gap-3">
                  <Link
                    href={n.href}
                    className="text-xs font-medium text-blue-600 hover:underline"
                    onClick={() => {
                      recordNudgeEngaged(user.id)
                      setOpen(false)
                    }}
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      recordNudgeDismissed(user.id)
                      refresh()
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
          <p className="mt-2 border-t border-gray-100 px-3 pt-2 text-[10px] text-gray-400">
            At most one nudge per week · auto-pause after 3 dismissals
          </p>
        </div>
      ) : null}
    </div>
  )
}
