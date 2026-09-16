'use client'

import Link from 'next/link'
import {
  getPortalCmsHref,
  getPortalFooterPages,
  getPortalFooterText,
  getPortalPageCopy,
  getPortalThemeColor,
} from '@/data/mock-portal-settings'
import { usePortalSettings } from '@/lib/portalSettingsStore'

export function PortalAppFooter() {
  const { pages, globalPages, language } = usePortalSettings()
  const themeColor = getPortalThemeColor(globalPages)
  const footerText = getPortalFooterText(globalPages, language)
  const footerPages = getPortalFooterPages(pages)

  return (
    <footer className="shrink-0 border-t border-gray-200 bg-white px-6 py-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-xs text-gray-500">{footerText}</p>
        {footerPages.length > 0 ? (
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {footerPages.map((page) => (
              <Link
                key={page.id}
                href={getPortalCmsHref(page.id)}
                className="text-xs hover:underline"
                style={{ color: themeColor }}
              >
                {getPortalPageCopy(page, language).title}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  )
}
