'use client'

import { useEffect, useState, type DragEvent } from 'react'
import dynamic from 'next/dynamic'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'
import { getVisibleCustomFields, type DirectoryCustomField } from '@/data/mock-custom-fields'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalClose = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalClose })),
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

type ReorderCustomFieldsModalProps = {
  open: boolean
  fields: DirectoryCustomField[]
  onOpenChange: (open: boolean) => void
  onSave: (visibleKeysInOrder: string[]) => void
}

function moveItem(list: DirectoryCustomField[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list
  }
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function ReorderCustomFieldsModal({
  open,
  fields,
  onOpenChange,
  onSave,
}: ReorderCustomFieldsModalProps) {
  const [draft, setDraft] = useState<DirectoryCustomField[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setDraft(getVisibleCustomFields(fields))
    setDragIndex(null)
    setOverIndex(null)
  }, [fields, open])

  function handleDragStart(event: DragEvent<HTMLLIElement>, index: number) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
    setDragIndex(index)
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (overIndex !== index) setOverIndex(index)
  }

  function handleDrop(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault()
    const fromRaw = event.dataTransfer.getData('text/plain')
    const from = dragIndex ?? Number.parseInt(fromRaw, 10)
    setDraft((current) => moveItem(current, from, index))
    setDragIndex(null)
    setOverIndex(null)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="md" {...preventModalDismiss}>
      <WuModalHeader>Reorder custom fields</WuModalHeader>
      <WuModalContent>
        {draft.length === 0 ? (
          <WuText size="sm" className="text-gray-500">
            Select at least one custom field to reorder.
          </WuText>
        ) : (
          <>
            <WuText size="sm" as="p" className="mb-3 text-gray-500">
              Drag fields to change their order on the employee list and filters.
            </WuText>
            <ul className="rounded-md border border-gray-200">
              {draft.map((field, index) => (
                <li
                  key={field.key}
                  draggable
                  onDragStart={(event) => handleDragStart(event, index)}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDrop={(event) => handleDrop(event, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex cursor-grab items-center gap-3 border-b border-gray-200 px-3 py-2 last:border-b-0 active:cursor-grabbing',
                    dragIndex === index && 'bg-blue-50 opacity-70',
                    overIndex === index && dragIndex !== index && 'border-t-2 border-t-blue-600',
                  )}
                >
                  <span
                    className="wm-menu text-lg leading-none text-gray-400"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{field.title}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton
          onClick={() => {
            onSave(draft.map((field) => field.key))
            onOpenChange(false)
          }}
          disabled={draft.length === 0}
        >
          Save
        </WuButton>
      </WuModalFooter>
    </WuModal>
  )
}
