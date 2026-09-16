'use client'

import dynamic from 'next/dynamic'
import type { DirectoryCustomField } from '@/data/mock-custom-fields'
import { getEmployeeImportFormatFields } from '@/data/mock-employee-import-format'

const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalContent })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)

type EmployeeImportFormatModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customFields?: DirectoryCustomField[]
}

export function EmployeeImportFormatModal({
  open,
  onOpenChange,
  customFields,
}: EmployeeImportFormatModalProps) {
  const fields = getEmployeeImportFormatFields(customFields)
  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="md" maxHeight="80vh">
      <WuModalHeader>Employee Import Format</WuModalHeader>
      <WuModalContent>
        <ul className="flex flex-col gap-3 text-sm text-gray-800">
          {fields.map((field) => (
            <li key={field.label}>
              <p>
                {field.label}
                {field.required ? <span className="text-red-600">*</span> : null}
              </p>
              {field.examples ? (
                <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
                  <li>
                    {field.examples.length > 0 ? `${field.examples.join(' , ')} , . . .` : null}
                  </li>
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </WuModalContent>
    </WuModal>
  )
}
