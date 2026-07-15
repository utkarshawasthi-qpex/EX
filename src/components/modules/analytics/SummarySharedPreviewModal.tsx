'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { preventModalDismiss } from '@/lib/modalProps'
import type { SummaryContent } from '@/types'

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

type SummarySharedPreviewModalProps = {
  open: boolean
  onClose: () => void
  content: SummaryContent
}

export function SummarySharedPreviewModal({
  open,
  onClose,
  content,
}: SummarySharedPreviewModalProps) {
  const snapshot = content.sharedSnapshot
  if (!snapshot) return null

  return (
    <WuModal open={open} onOpenChange={(next) => !next && onClose()} variant="action" size="md">
      <WuModalHeader>Preview what others see</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Shared • Last updated {format(new Date(snapshot.sharedAt), 'MMM d, yyyy')}
          </div>

          <WuText size="sm" as="p" className="leading-relaxed text-gray-700">
            {snapshot.summary}
          </WuText>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuButton variant="primary" onClick={onClose}>
          Close
        </WuButton>
      </WuModalFooter>
    </WuModal>
  )
}
