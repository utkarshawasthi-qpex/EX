'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  getEnabledPortalLanguages,
  getPortalPageCopy,
  getPortalThemeColor,
  isPortalLanguageCode,
  type PortalContentPageId,
} from '@/data/mock-portal-settings'
import { usePortalSettings } from '@/lib/portalSettingsStore'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

function isContentPageId(value: string): value is PortalContentPageId {
  return (
    value === 'privacy-policy' ||
    value === 'navigation-footer' ||
    value === 'terms-of-use' ||
    value === 'contact' ||
    value === 'about' ||
    value === 'faq' ||
    value === 'landing-page' ||
    value === 'login-page'
  )
}

export function PortalCmsPageView() {
  const params = useParams<{ slug: string }>()
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug
  const { showToast } = useWuShowToast()
  const { pages, globalPages, languages, language, setLanguage } = usePortalSettings()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const page = useMemo(() => {
    if (!slug || !isContentPageId(slug)) return undefined
    return pages.find((item) => item.id === slug)
  }, [pages, slug])

  const enabledLanguages = getEnabledPortalLanguages(languages)
  const themeColor = getPortalThemeColor(globalPages)
  const copy = page ? getPortalPageCopy(page, language) : null

  if (!page || !copy) {
    return (
      <EmptyState
        icon="wm-search-off"
        title="Page not found"
        description="This portal page is not available."
        action={
          <Link href="/lifecycle/analytics/list">
            <WuButton>Open Dashboards</WuButton>
          </Link>
        }
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      {enabledLanguages.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {enabledLanguages.map((item) => (
            <button
              key={item.code}
              type="button"
              className="rounded px-2 py-1 text-sm"
              style={{
                color: language === item.code ? themeColor : '#4B5563',
                backgroundColor: language === item.code ? `${themeColor}14` : undefined,
                fontWeight: language === item.code ? 600 : 400,
              }}
              onClick={() => {
                if (isPortalLanguageCode(item.code)) setLanguage(item.code)
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}

      <WuHeading size="lg" className="mb-4 text-gray-900">
        {copy.title}
      </WuHeading>
      <WuText className="whitespace-pre-wrap text-gray-700">{copy.body}</WuText>

      {page.id === 'landing-page' ? (
        <div className="mt-6">
          <Link href="/lifecycle/analytics/list">
            <WuButton>Open Dashboards</WuButton>
          </Link>
        </div>
      ) : null}

      {page.id === 'login-page' ? (
        <div className="mt-6 flex max-w-sm flex-col gap-3">
          <WuInput
            Label="Email"
            variant="outlined"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <WuInput
            Label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <WuButton
            onClick={() =>
              showToast({
                message:
                  'Sign-in happens from Employee Experience. Use Access portal or Login on the employee list.',
                variant: 'info',
              })
            }
          >
            Sign in
          </WuButton>
        </div>
      ) : null}
    </div>
  )
}
