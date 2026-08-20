'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ADD_LANGUAGE_OPTIONS, type Survey360 } from '@/data/mock/surveys360'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalContent })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalFooter })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type LanguagesPanelProps = {
  survey: Survey360
  onChange: (survey: Survey360) => void
}

export function LanguagesPanel({ survey, onChange }: LanguagesPanelProps) {
  const { showToast } = useWuShowToast()
  const [addOpen, setAddOpen] = useState(false)
  const [pending, setPending] = useState<string[]>([])

  function togglePending(language: string, checked: boolean) {
    setPending((current) =>
      checked ? [...current, language] : current.filter((item) => item !== language),
    )
  }

  function applyLanguages() {
    const next = [...new Set([...survey.languages, ...pending])]
    onChange({ ...survey, languages: next })
    setPending([])
    setAddOpen(false)
    showToast({ variant: 'success', message: 'Languages added' })
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <WuHeading size="sm">Select your languages</WuHeading>
          <WuText size="sm" as="p" className="mt-1 text-gray-500">
            Choose which languages respondents can take this survey in.
          </WuText>
        </div>
        <div className="flex flex-wrap gap-2">
          <WuButton
            variant="secondary"
            onClick={() =>
              showToast({ variant: 'info', message: 'Default language picker opened' })
            }
          >
            Set Your Default Language
          </WuButton>
          <WuButton variant="primary" onClick={() => setAddOpen(true)}>
            + Add Other Languages
          </WuButton>
          <WuButton
            variant="secondary"
            onClick={() => showToast({ variant: 'info', message: 'Screener question editor opened' })}
          >
            Edit Screener Question
          </WuButton>
          <WuButton
            variant="secondary"
            onClick={() => showToast({ variant: 'info', message: 'Import translations started' })}
          >
            + Import Translations
          </WuButton>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        Screener Question: Select language you would like to continue in.
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Language
        </div>
        {survey.languages.map((language) => (
          <div
            key={language}
            className="flex items-center justify-between border-b border-gray-50 px-4 py-3 last:border-b-0"
          >
            <span className="text-sm text-gray-800">
              {language}
              {language === survey.defaultLanguage && (
                <span className="ml-2 text-xs font-medium uppercase text-blue-600">
                  (Default language)
                </span>
              )}
            </span>
            {language !== survey.defaultLanguage && (
              <button
                type="button"
                className="text-xs text-red-500 hover:underline"
                onClick={() =>
                  onChange({
                    ...survey,
                    languages: survey.languages.filter((item) => item !== language),
                  })
                }
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <WuModal
        open={addOpen}
        onOpenChange={(next) => {
          if (!next) setAddOpen(false)
        }}
        variant="action"
        size="lg"
        maxWidth="760px"
      >
        <WuModalHeader>Add Language Version</WuModalHeader>
        <WuModalContent {...preventModalDismiss}>
          <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
            {ADD_LANGUAGE_OPTIONS.map((language) => {
              const alreadyAdded = survey.languages.includes(language)
              const checked = pending.includes(language) || alreadyAdded
              return (
                <label
                  key={language}
                  className={cn(
                    'flex items-center gap-2 rounded-md border border-gray-100 px-2 py-1.5 text-sm',
                    alreadyAdded ? 'bg-gray-50 text-gray-400' : 'text-gray-700 hover:bg-gray-50',
                  )}
                >
                  <WuCheckbox
                    checked={checked}
                    disabled={alreadyAdded}
                    onChange={(next) => togglePending(language, next)}
                  />
                  {language}
                </label>
              )
            })}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <div className="flex w-full justify-end gap-2">
            <WuButton variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </WuButton>
            <WuButton variant="primary" onClick={applyLanguages}>
              Add
            </WuButton>
          </div>
        </WuModalFooter>
      </WuModal>
    </div>
  )
}
