'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { Survey360 } from '@/data/mock/surveys360'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
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

type SettingsPanelProps = {
  survey: Survey360
  onChange: (survey: Survey360) => void
}

const DISPLAY_FIELDS: {
  key: Exclude<keyof Survey360['displaySettings'], 'showQuestionNumbers'>
  label: string
}[] = [
  { key: 'nextButton', label: 'Next Button' },
  { key: 'exitButton', label: 'Exit Button' },
  { key: 'previousButton', label: 'Previous Button' },
  { key: 'finishButton', label: 'Finish Button' },
  { key: 'thankYouMessage', label: 'Thank you Message' },
  { key: 'invalidLink', label: 'Invalid Link' },
  { key: 'errorMessage', label: 'Error Message' },
  { key: 'terminateMessage', label: 'Terminate Message' },
  { key: 'validationStar', label: 'Validation Text' },
]

export function SettingsPanel({ survey, onChange }: SettingsPanelProps) {
  const { showToast } = useWuShowToast()
  const [customDraft, setCustomDraft] = useState('')

  function updateDisplay<K extends keyof Survey360['displaySettings']>(
    key: K,
    value: Survey360['displaySettings'][K],
  ) {
    onChange({
      ...survey,
      displaySettings: { ...survey.displaySettings, [key]: value },
    })
  }

  function addCustomRelationship() {
    const name = customDraft.trim()
    if (!name) return
    if (survey.customRelationships.includes(name)) {
      showToast({ variant: 'error', message: 'That relationship already exists' })
      return
    }
    onChange({
      ...survey,
      customRelationships: [...survey.customRelationships, name],
    })
    setCustomDraft('')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <WuHeading size="sm">General Display Setting</WuHeading>
          <button
            type="button"
            className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white"
            aria-label="Help"
          >
            ?
          </button>
        </div>

        <div className="space-y-3">
          {DISPLAY_FIELDS.map((field) => (
            <div key={field.key} className="grid grid-cols-[180px_1fr] items-center gap-3">
              <label className="text-sm text-gray-600">{field.label}</label>
              <WuInput
                variant="outlined"
                value={String(survey.displaySettings[field.key] ?? '')}
                onChange={(event) => updateDisplay(field.key, event.target.value)}
              />
            </div>
          ))}
          <div className="grid grid-cols-[180px_1fr] items-center gap-3">
            <label className="text-sm text-gray-600">Question Numbers</label>
            <WuToggle
              checked={survey.displaySettings.showQuestionNumbers}
              onChange={(checked) => updateDisplay('showQuestionNumbers', checked)}
              Label=""
            />
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <WuButton
            variant="primary"
            onClick={() => showToast({ variant: 'success', message: 'Display settings saved' })}
          >
            Save
          </WuButton>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <WuHeading size="sm">Relationships</WuHeading>
          <button
            type="button"
            className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white"
            aria-label="Help"
          >
            ?
          </button>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Default relationships</p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <WuCheckbox
              checked={survey.defaultRelationships.includes('Manager')}
              onChange={(checked) =>
                onChange({
                  ...survey,
                  defaultRelationships: checked ? ['Manager'] : [],
                })
              }
            />
            Manager
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Custom relationships</p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <WuInput
                variant="outlined"
                placeholder="Custom Relationship"
                value={customDraft}
                onChange={(event) => setCustomDraft(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full border border-gray-300 text-gray-500"
              aria-label="Clear custom relationship"
              onClick={() => setCustomDraft('')}
            >
              −
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full border border-gray-300 text-gray-500"
              aria-label="Add custom relationship"
              onClick={addCustomRelationship}
            >
              +
            </button>
          </div>
          {survey.customRelationships.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {survey.customRelationships.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                >
                  {name}
                  <button
                    type="button"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() =>
                      onChange({
                        ...survey,
                        customRelationships: survey.customRelationships.filter(
                          (item) => item !== name,
                        ),
                      })
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-center">
          <WuButton
            variant="primary"
            onClick={() => showToast({ variant: 'success', message: 'Relationships saved' })}
          >
            Save
          </WuButton>
        </div>
      </section>
    </div>
  )
}
