'use client'

import dynamic from 'next/dynamic'
import { preventModalDismiss } from '@/lib/modalProps'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
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
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type ImportEmployeesModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportEmployeesModal({ open, onOpenChange }: ImportEmployeesModalProps) {
  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="md">
      <WuModalHeader>Import Employees</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <span className="wc-data-import text-4xl text-blue-600" aria-hidden />
          <WuText size="lg" as="div" className="mt-4 font-medium text-gray-900">
            Drop CSV or Excel file here
          </WuText>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-blue-700 hover:underline"
            onClick={() => console.log('Download employee import template')}
          >
            Download template
          </button>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-3">
          <WuButton variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </WuButton>
          <WuButton variant="primary" onClick={() => console.log('Upload employee import')}>
            Upload
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
