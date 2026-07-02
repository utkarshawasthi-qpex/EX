'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Surveys', href: '/360/surveys', icon: 'wm-format-list-bulleted' },
  { label: 'Participants', href: '/360/participants', icon: 'wm-groups' },
  { label: 'Deployment', href: '/360/deployment', icon: 'wm-send' },
  { label: 'Reports', href: '/360/reports', icon: 'wc-analytics' },
  { label: 'Settings', href: '/360/settings', icon: 'wc-settings' },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function ThreeSixtyDegSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'shrink-0 border-r border-gray-200 bg-white py-4 transition-all',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = isActivePath(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 border-l-2 py-2 text-sm',
                collapsed ? 'justify-center px-0' : 'px-4',
                isActive
                  ? 'border-blue-600 bg-blue-50 font-medium text-blue-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50',
              )}
              title={item.label}
            >
              <span className={item.icon} aria-hidden />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
