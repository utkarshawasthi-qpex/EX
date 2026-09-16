'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  getEnabledPortalLanguages,
  getPortalThemeColor,
  type PortalContentPage,
  type PortalGlobalPage,
  type PortalLanguageCode,
} from '@/data/mock-portal-settings'
import { usePortalSettings } from '@/lib/portalSettingsStore'
import {
  PortalPageEditorModal,
  type PortalPageEditorTarget,
} from '@/components/employees/PortalPageEditorModal'
import { PortalThemeEditorModal } from '@/components/employees/PortalThemeEditorModal'

const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)

function LanguageLinks({
  languages,
  onSelect,
}: {
  languages: { code: PortalLanguageCode }[]
  onSelect: (code: PortalLanguageCode) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {languages.map((language) => (
        <button
          key={language.code}
          type="button"
          className="text-sm text-blue-700 hover:underline"
          onClick={() => onSelect(language.code)}
        >
          {language.code}
        </button>
      ))}
    </div>
  )
}

function OrderInput({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
      className="h-8 w-14 rounded border border-gray-300 bg-white px-2 text-center text-sm text-gray-800 outline-none focus:border-blue-500"
      aria-label="Order"
    />
  )
}

export function PortalContentPage() {
  const { pages, globalPages, languages, patchPage, savePageTranslation, saveGlobalTranslation, setThemeColor } =
    usePortalSettings()
  const [editorTarget, setEditorTarget] = useState<PortalPageEditorTarget | null>(null)
  const [themeOpen, setThemeOpen] = useState(false)

  const enabledLanguages = useMemo(() => getEnabledPortalLanguages(languages), [languages])
  const themeColor = getPortalThemeColor(globalPages)
  const portalPages = pages.filter((page) => page.id)
  const globalPageList = globalPages

  function openPage(page: PortalContentPage, language: PortalLanguageCode = 'en') {
    setEditorTarget({ kind: 'page', page, language })
  }

  function openGlobal(page: PortalGlobalPage, language: PortalLanguageCode = 'en') {
    if (page.id === 'customize-theme') {
      setThemeOpen(true)
      return
    }
    setEditorTarget({ kind: 'global', page, language })
  }

  return (
    <div className="flex flex-col gap-8 px-6 py-5">
      <section>
        <WuHeading size="sm" className="mb-3 text-gray-900">
          Portal
        </WuHeading>
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium">Language</th>
                <th className="px-4 py-3 font-medium">Main Tab</th>
                <th className="px-4 py-3 font-medium">Footer</th>
                <th className="px-4 py-3 font-medium">Order</th>
              </tr>
            </thead>
            <tbody>
              {portalPages.map((page) => (
                <tr key={page.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-blue-700 hover:underline"
                      onClick={() => openPage(page)}
                    >
                      {page.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <LanguageLinks
                      languages={enabledLanguages}
                      onSelect={(code) => openPage(page, code)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <WuToggle
                      checked={page.mainTab}
                      Label=""
                      onChange={(checked) => patchPage(page.id, { mainTab: checked })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <WuToggle
                      checked={page.footer}
                      Label=""
                      onChange={(checked) => patchPage(page.id, { footer: checked })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <OrderInput
                      value={page.order}
                      onChange={(order) => patchPage(page.id, { order })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <WuHeading size="sm" className="mb-3 text-gray-900">
          Global
        </WuHeading>
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium">Language</th>
              </tr>
            </thead>
            <tbody>
              {globalPageList.map((page) => (
                <tr key={page.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-blue-700 hover:underline"
                      onClick={() => openGlobal(page)}
                    >
                      {page.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <LanguageLinks
                      languages={enabledLanguages}
                      onSelect={(code) => openGlobal(page, code)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PortalPageEditorModal
        target={editorTarget}
        onOpenChange={(open) => {
          if (!open) setEditorTarget(null)
        }}
        onSave={(target, title, body) => {
          if (target.kind === 'page') {
            savePageTranslation(target.page.id, target.language, { title, body })
            return
          }
          saveGlobalTranslation(target.page.id, target.language, { title, body })
        }}
      />
      <PortalThemeEditorModal
        open={themeOpen}
        color={themeColor}
        onOpenChange={setThemeOpen}
        onSave={setThemeColor}
      />
    </div>
  )
}
