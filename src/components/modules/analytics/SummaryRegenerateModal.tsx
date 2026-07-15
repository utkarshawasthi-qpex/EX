'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

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
const WuModalClose = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalClose })),
  { ssr: false },
)
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)

export type RegenerateModalContext = 'full' | 'summary' | 'recommendations'

type SummaryRegenerateModalProps = {
  open: boolean
  context: RegenerateModalContext | null
  summaryRegenerationsUsed: number
  recsRegenerationsUsed: number
  maxRegenerations: number
  onClose: () => void
  onConfirm: (guidance: string) => void
}

function getModalCopy(
  context: RegenerateModalContext,
  summaryRegenerationsUsed: number,
  recsRegenerationsUsed: number,
  maxRegenerations: number,
) {
  switch (context) {
    case 'full':
      return {
        title: 'Update summary & recommendations',
        body: 'Filters have changed. This will generate a new summary and 4 new recommendations based on the current filtered view. This resets your regeneration limits.',
        placeholder: 'Any guidance? e.g. Focus on lowest scoring markers',
      }
    case 'summary':
      return {
        title: 'Regenerate summary',
        body: `This will generate a new summary paragraph. Your 4 recommendations will not change. ${summaryRegenerationsUsed + 1} of ${maxRegenerations} regenerations used after this.`,
        placeholder: 'e.g. Make it more concise, focus on eNPS',
      }
    case 'recommendations':
      return {
        title: 'Regenerate recommendations',
        body: `This will generate 4 new recommendations. Your summary paragraph will not change. ${recsRegenerationsUsed + 1} of ${maxRegenerations} regenerations used after this.`,
        placeholder: 'e.g. More actionable, prioritise manager-owned actions',
      }
  }
}

export function SummaryRegenerateModal({
  open,
  context,
  summaryRegenerationsUsed,
  recsRegenerationsUsed,
  maxRegenerations,
  onClose,
  onConfirm,
}: SummaryRegenerateModalProps) {
  const [guidance, setGuidance] = useState('')

  useEffect(() => {
    if (open) setGuidance('')
  }, [open, context])

  if (!context) return null

  const copy = getModalCopy(
    context,
    summaryRegenerationsUsed,
    recsRegenerationsUsed,
    maxRegenerations,
  )

  return (
    <WuModal open={open} onOpenChange={(next) => !next && onClose()} variant="action" size="sm">
      <WuModalHeader>{copy.title}</WuModalHeader>
      <WuModalContent>
        <p className="text-sm text-gray-600">{copy.body}</p>
        <textarea
          value={guidance}
          onChange={(event) => setGuidance(event.target.value)}
          placeholder={copy.placeholder}
          rows={3}
          className="mt-3 w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-700"
        />
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton
          color="primary"
          onClick={() => {
            onConfirm(guidance.trim())
            onClose()
          }}
        >
          Regenerate
        </WuButton>
      </WuModalFooter>
    </WuModal>
  )
}
