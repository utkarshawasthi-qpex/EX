'use client'

import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { THEME_COLORS, type Survey360 } from '@/data/mock/surveys360'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)

type DesignPanelProps = {
  survey: Survey360
  onChange: (survey: Survey360) => void
}

const FONT_OPTIONS = [
  { value: 'Fira Sans', label: 'Fira Sans' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
]

export function DesignPanel({ survey, onChange }: DesignPanelProps) {
  const { showToast } = useWuShowToast()
  const fontValue = FONT_OPTIONS.find((option) => option.value === survey.font) ?? FONT_OPTIONS[0]!

  return (
    <div className="flex min-h-[calc(100vh-140px)]">
      <aside className="w-72 shrink-0 border-r border-gray-200 bg-white p-4">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-md bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-700"
          >
            Standard Themes
          </button>
          <button
            type="button"
            className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
          >
            Custom Themes
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {THEME_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...survey, themeColor: color })}
              className={cn(
                'flex size-8 items-center justify-center rounded-full border',
                survey.themeColor === color ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200',
              )}
              style={{ background: color }}
              aria-label={`Theme ${color}`}
            >
              {survey.themeColor === color && (
                <span className="text-xs font-bold text-white drop-shadow">✓</span>
              )}
            </button>
          ))}
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full border border-dashed border-gray-300 text-xs text-gray-400"
            aria-label="Custom color"
            onClick={() => showToast({ variant: 'info', message: 'Custom color picker opened' })}
          >
            ✦
          </button>
        </div>

        <button
          type="button"
          className="mb-4 flex w-full items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => showToast({ variant: 'success', message: 'Accessible theme applied' })}
        >
          <span className="wm-accessibility text-lg text-blue-600" aria-hidden />
          Accessible Theme
        </button>

        <WuText size="sm" as="p" className="mb-1.5 font-medium text-gray-700">
          Font:
        </WuText>
        <WuSelect
          data={FONT_OPTIONS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={fontValue}
          onSelect={(value: unknown) => {
            const selected = value as { value: string; label: string } | { value: string; label: string }[]
            const next = Array.isArray(selected) ? selected[0] : selected
            if (!next) return
            onChange({ ...survey, font: next.value })
          }}
          variant="outlined"
        />

        <WuButton
          variant="primary"
          className="mt-6 w-full"
          onClick={() => showToast({ variant: 'success', message: 'Design settings saved' })}
        >
          Save
        </WuButton>
      </aside>

      <div className="flex flex-1 items-start justify-center bg-gray-100 p-8">
        <div className="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
          <div className="h-1.5" style={{ background: survey.themeColor }} />
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">COMPANY Logo</p>
            <WuHeading size="md" className="mt-2" style={{ color: survey.themeColor }}>
              {survey.title}
            </WuHeading>
          </div>
          <div className="px-5 py-6" style={{ fontFamily: survey.font }}>
            <WuText size="sm" as="p" className="mb-4 text-xs text-gray-400">
              Questions marked with a * are required.
            </WuText>
            <p className="mb-3 text-sm font-medium text-gray-800">
              * Do you like working with this team?
            </p>
            <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="preview" defaultChecked />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="preview" />
              No
            </label>
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-500"
              >
                ←
              </button>
              <button
                type="button"
                className="rounded-md px-4 py-1.5 text-sm font-medium text-white"
                style={{ background: survey.themeColor }}
              >
                Next
              </button>
            </div>
          </div>
          <div className="border-t border-gray-100 px-5 py-2 text-center text-[10px] text-gray-400">
            Powered by QuestionPro
          </div>
        </div>
      </div>
    </div>
  )
}
