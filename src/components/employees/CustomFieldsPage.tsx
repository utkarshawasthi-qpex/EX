'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { EditCustomFieldModal } from '@/components/employees/EditCustomFieldModal'
import { ReorderCustomFieldsModal } from '@/components/employees/ReorderCustomFieldsModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import {
  createBlankCustomField,
  getVisibleCustomFields,
  isCustomFieldVisible,
  reorderVisibleCustomFields,
  type DirectoryCustomField,
} from '@/data/mock-custom-fields'
import { useRosterStore } from '@/lib/rosterStore'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
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
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTable })),
  { ssr: false },
)
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)

export function CustomFieldsPage() {
  const { showToast } = useWuShowToast()
  const { customFields, saveCustomField, setCustomFields, deleteCustomField } = useRosterStore()
  const [editingField, setEditingField] = useState<DirectoryCustomField | null>(null)
  const [fieldToDelete, setFieldToDelete] = useState<DirectoryCustomField | null>(null)
  const [reorderOpen, setReorderOpen] = useState(false)

  const visibleFields = useMemo(() => getVisibleCustomFields(customFields), [customFields])
  const allVisible = customFields.length > 0 && visibleFields.length === customFields.length
  const someVisible = visibleFields.length > 0 && !allVisible

  function setFieldVisible(key: string, visible: boolean) {
    setCustomFields(
      customFields.map((field) => (field.key === key ? { ...field, visible } : field)),
    )
  }

  function toggleAll(visible: boolean) {
    setCustomFields(customFields.map((field) => ({ ...field, visible })))
  }

  const columns: IWuTableColumnDef<DirectoryCustomField>[] = [
    {
      accessorKey: 'key',
      id: 'select',
      header: () => (
        <WuCheckbox checked={allVisible} partial={someVisible} onChange={toggleAll} />
      ),
      size: 44,
      minSize: 44,
      maxSize: 48,
      enableSorting: false,
      cell: ({ row }) => (
        <WuCheckbox
          checked={isCustomFieldVisible(row.original)}
          onChange={(checked) => setFieldVisible(row.original.key, checked)}
        />
      ),
    },
    {
      accessorKey: 'key',
      id: 'index',
      header: 'Id',
      size: 64,
      minSize: 56,
      maxSize: 72,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums text-gray-500">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => <span className="text-gray-800">{row.original.title}</span>,
    },
    {
      accessorKey: 'key',
      id: 'actions',
      header: ' ',
      size: 88,
      minSize: 88,
      maxSize: 96,
      enableSorting: false,
      cellAlign: 'right',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <WuTooltip content="Edit" position="top" showArrow>
            <button
              type="button"
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-700"
              aria-label={`Edit ${row.original.title}`}
              onClick={() => setEditingField(row.original)}
            >
              <span className="wm-edit text-base leading-none" aria-hidden />
            </button>
          </WuTooltip>
          <WuTooltip content="Delete" position="top" showArrow>
            <button
              type="button"
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
              aria-label={`Delete ${row.original.title}`}
              onClick={() => setFieldToDelete(row.original)}
            >
              <span className="wm-delete text-base leading-none" aria-hidden />
            </button>
          </WuTooltip>
        </div>
      ),
    },
  ]

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col px-8 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WuHeading size="sm">Employee custom fields</WuHeading>
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800"
            aria-label="Help"
            onClick={() =>
              showToast({
                message:
                  'Checked fields appear on the employee list, edit form, import format, and filters.',
                variant: 'info',
              })
            }
          >
            <span className="wm-help text-lg leading-none" aria-hidden />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <WuButton
            variant="secondary"
            onClick={() => {
              if (visibleFields.length === 0) {
                showToast({
                  message: 'Select at least one custom field to reorder',
                  variant: 'error',
                })
                return
              }
              setReorderOpen(true)
            }}
          >
            Reorder
          </WuButton>
          <WuButton onClick={() => setEditingField(createBlankCustomField())}>
            + Add custom field
          </WuButton>
        </div>
      </div>

      {customFields.length === 0 ? (
        <EmptyState
          icon="wm-view-column"
          title="No custom fields"
          description="Add a field to use it on the employee list, import, and filters."
          action={
            <WuButton onClick={() => setEditingField(createBlankCustomField())}>
              + Add custom field
            </WuButton>
          }
        />
      ) : (
        <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
          <WuTable
            data={customFields as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            variant="striped"
            size="compact"
          />
        </div>
      )}

      <EditCustomFieldModal
        field={editingField}
        onOpenChange={(open) => {
          if (!open) setEditingField(null)
        }}
        onSave={(field) => {
          saveCustomField(field)
        }}
      />
      <ReorderCustomFieldsModal
        open={reorderOpen}
        fields={customFields}
        onOpenChange={setReorderOpen}
        onSave={(visibleKeysInOrder) => {
          setCustomFields(reorderVisibleCustomFields(customFields, visibleKeysInOrder))
          showToast({ message: 'Custom field order updated', variant: 'success' })
        }}
      />
      <ConfirmModal
        open={Boolean(fieldToDelete)}
        onOpenChange={(open) => {
          if (!open) setFieldToDelete(null)
        }}
        title="Delete custom field?"
        description={
          fieldToDelete
            ? `${fieldToDelete.title} will be removed from the list, edit employee form, import format, and filters.`
            : 'This custom field will be removed.'
        }
        confirmLabel="Delete"
        variant="critical"
        onConfirm={() => {
          if (!fieldToDelete) return
          deleteCustomField(fieldToDelete.key)
          setFieldToDelete(null)
          showToast({ message: 'Custom field deleted', variant: 'success' })
        }}
      />
    </div>
  )
}
