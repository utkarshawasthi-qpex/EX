'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const moduleOptions = [
  {
    label: 'Employee Experience',
    href: '/lifecycle',
    iconClassName: 'wc-employees-list',
  },
  {
    label: '360 Feedback',
    href: '/360/surveys',
    iconClassName: 'wm-360',
  },
  {
    label: 'Empower',
    href: '/empower/initiatives',
    iconClassName: 'wm-lightbulb',
  },
]

function isOptionActive(href: string, pathname: string) {
  if (href.startsWith('/lifecycle')) {
    return pathname === '/lifecycle' || pathname.startsWith('/lifecycle/')
  }
  if (href.startsWith('/360')) return pathname.startsWith('/360')
  if (href.startsWith('/empower')) return pathname.startsWith('/empower')
  return false
}

type ProductSwitcherProps = {
  /** Module name used to mark the checked row. Rows stay unchecked when it matches no option. */
  activeLabel: string
  /** Trigger text, when it should differ from the active module name. */
  label?: string
  triggerClassName?: string
  chevron?: string
  chevronClassName?: string
}

export function ProductSwitcher({
  activeLabel,
  label,
  triggerClassName,
  chevron = '▼',
  chevronClassName,
}: ProductSwitcherProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  function navigateTo(href: string) {
    setIsOpen(false)
    router.push(href)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {label ?? activeLabel}
        <span className={chevronClassName} aria-hidden>
          {chevron}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-9 z-50 w-72 rounded-xl border border-gray-200 bg-white py-2 text-gray-900 shadow-xl"
        >
          {moduleOptions.map((option) => {
            const isActive = isOptionActive(option.href, pathname)
            return (
              <button
                key={option.href}
                type="button"
                role="menuitem"
                className={cn(
                  'flex w-full items-center justify-between border-l-2 py-2 pl-4 pr-4 text-left text-sm hover:bg-gray-50',
                  isActive
                    ? 'border-blue-600 font-medium text-blue-700'
                    : 'border-transparent text-gray-700',
                )}
                onClick={() => navigateTo(option.href)}
              >
                <span className="flex items-center gap-3">
                  <span className={cn(option.iconClassName, 'text-base')} aria-hidden />
                  {option.label}
                </span>
                <span className={isActive ? 'text-blue-600' : 'text-gray-300'} aria-hidden>
                  {isActive ? '✓' : '›'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
