'use client'

import dynamic from 'next/dynamic'
import { preventModalDismiss } from '@/lib/modalProps'
import type { Survey360Source } from '@/data/mock/surveys360'

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
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
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

type Create360SurveyModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (source: Survey360Source) => void
}

const OPTIONS: {
  source: Survey360Source
  title: string
  description: string
  icon: string
}[] = [
  {
    source: 'custom',
    title: 'Custom survey',
    description: 'Start from a blank canvas and build your own sections and questions.',
    icon: 'wm-edit',
  },
  {
    source: 'template',
    title: '360 template',
    description: 'Start from the Inclusive Leadership template with ready-made competency items.',
    icon: 'wm-360',
  },
]

export function Create360SurveyModal({ open, onClose, onSelect }: Create360SurveyModalProps) {
  return (
    <WuModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      variant="action"
      size="md"
      maxWidth="640px"
    >
      <WuModalHeader>Create survey</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <WuText size="sm" as="p" className="mb-4 text-gray-500">
          Choose how you want to start. Either option opens the survey editor.
        </WuText>
        <div className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((option) => (
            <button
              key={option.source}
              type="button"
              onClick={() => onSelect(option.source)}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <span
                className={`${option.icon} mb-3 block text-2xl leading-none text-blue-600`}
                aria-hidden
              />
              <WuHeading size="sm" className="text-gray-900">
                {option.title}
              </WuHeading>
              <WuText size="sm" as="p" className="mt-1 text-gray-500">
                {option.description}
              </WuText>
            </button>
          ))}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuButton variant="secondary" onClick={onClose}>
          Cancel
        </WuButton>
      </WuModalFooter>
    </WuModal>
  )
}
