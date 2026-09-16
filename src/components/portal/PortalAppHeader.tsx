'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import {
  getEnabledPortalProducts,
  isPortalProductEnabled,
  PORTAL_PRODUCT_HREFS,
  PORTAL_PRODUCT_LABELS,
  type PortalProductId,
} from '@/lib/portalAccess'
import { usePortalSettings } from '@/lib/portalSettingsStore'
import { getCurrentUser, type AppUser } from '@/lib/userContext'
import { cn } from '@/lib/utils'

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false },
)
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false },
)

const PRODUCT_ICONS: Record<PortalProductId, string> = {
  employeeExperience: 'wc-employees-list',
  threeSixty: 'wm-360',
  empower: 'wm-lightbulb',
}

function isProductActive(id: PortalProductId, pathname: string) {
  if (id === 'employeeExperience') return pathname.startsWith('/lifecycle/analytics')
  if (id === 'threeSixty') return pathname.startsWith('/360')
  return pathname.startsWith('/empower')
}

function userInitial(user: AppUser | null) {
  const name = user?.name?.trim()
  if (name) return name.charAt(0).toUpperCase()
  return 'U'
}

export function PortalAppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const { portalAccess } = usePortalSettings()
  const [user, setUser] = useState<AppUser | null>(null)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  const enabledProducts = useMemo(
    () => getEnabledPortalProducts(portalAccess),
    [portalAccess],
  )

  const currentProduct =
    (['employeeExperience', 'threeSixty', 'empower'] as PortalProductId[]).find((id) =>
      isProductActive(id, pathname),
    ) ?? 'employeeExperience'

  const triggerLabel = PORTAL_PRODUCT_LABELS[currentProduct]
  const switcherProducts = enabledProducts.length > 0 ? enabledProducts : [currentProduct]

  useEffect(() => {
    setUser(getCurrentUser())
  }, [pathname])

  useEffect(() => {
    setSwitcherOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!switcherRef.current?.contains(event.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function handleLogout() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('pp_authed')
      window.localStorage.removeItem('pp_impersonating')
    }
    showToast({ variant: 'success', message: 'Signed out' })
    router.push('/login')
  }

  function handleExitImpersonation() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('pp_impersonating')
    }
    setUser(getCurrentUser())
    showToast({ variant: 'success', message: 'Returned to admin view' })
    router.push('/lifecycle/roster')
  }

  return (
    <div className="sticky top-0 z-50 w-full">
      <header className="relative flex h-12 items-center justify-between bg-[#041f49] px-4 text-white">
        <button
          type="button"
          className="flex items-center"
          aria-label="QuestionPro Employee Experience portal"
          onClick={() => router.push(PORTAL_PRODUCT_HREFS.employeeExperience)}
        >
          <span className="text-[22px] font-bold leading-none tracking-tight">P</span>
        </button>

        <div className="flex items-center gap-3">
          {switcherProducts.length > 0 ? (
            <div ref={switcherRef} className="relative">
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-white hover:text-white/90"
                aria-haspopup="menu"
                aria-expanded={switcherOpen}
                onClick={() => setSwitcherOpen((open) => !open)}
              >
                <span className="wm-home text-base leading-none" aria-hidden />
                <span>{triggerLabel}</span>
                <span className="text-[10px] leading-none text-white/80" aria-hidden>
                  {switcherOpen ? '▲' : '▼'}
                </span>
              </button>

              {switcherOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-9 z-50 min-w-[220px] rounded-md border border-gray-200 bg-white py-1 text-gray-900 shadow-lg"
                >
                  {switcherProducts.map((id) => {
                    const isActive = isProductActive(id, pathname)
                    const enabled = isPortalProductEnabled(id, portalAccess)
                    return (
                      <button
                        key={id}
                        type="button"
                        role="menuitem"
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50',
                          isActive ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700',
                          !enabled && 'opacity-50',
                        )}
                        onClick={() => {
                          setSwitcherOpen(false)
                          router.push(PORTAL_PRODUCT_HREFS[id])
                        }}
                      >
                        <span className={cn(PRODUCT_ICONS[id], 'text-base leading-none')} aria-hidden />
                        {PORTAL_PRODUCT_LABELS[id]}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          <WuMenu
            Trigger={
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full bg-[#1B87E6] text-sm font-semibold text-white"
                aria-label="Account"
              >
                {userInitial(user)}
              </button>
            }
            align="end"
          >
            <WuMenuItem onSelect={handleLogout}>Sign out</WuMenuItem>
          </WuMenu>
        </div>
      </header>

      {user?.isImpersonating ? (
        <div className="flex w-full items-center justify-between bg-amber-500 px-4 py-2 text-sm text-white">
          <span>
            Viewing portal as {user.name} ({user.email})
          </span>
          <button
            type="button"
            className="cursor-pointer font-medium text-white underline"
            onClick={handleExitImpersonation}
          >
            Exit Employee View
          </button>
        </div>
      ) : null}
    </div>
  )
}
