'use client'

import dynamic from 'next/dynamic'
import { format, subDays } from 'date-fns'
import { useMemo, useState } from 'react'
import { mockEmployees } from '@/data/mock/employees'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuDrawer = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuDrawer })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuMenu })),
  { ssr: false },
)
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuMenuItem })),
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

type SelectOption = {
  value: string
  label: string
}

type WidgetKebabMenuProps = {
  title: string
  canEdit?: boolean
  onSettings?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onExportPpt?: () => void
}

function toOptions(values: string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }))
}

export function WidgetKebabMenu({
  title,
  canEdit = true,
  onSettings,
  onEdit,
  onDuplicate,
  onDelete,
  onExportPpt,
}: WidgetKebabMenuProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [departments, setDepartments] = useState<SelectOption[]>([])
  const [locations, setLocations] = useState<SelectOption[]>([])
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 90), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const departmentOptions = useMemo(
    () => toOptions(Array.from(new Set(mockEmployees.map((employee) => employee.department))).sort()),
    [],
  )
  const locationOptions = useMemo(
    () => toOptions(Array.from(new Set(mockEmployees.map((employee) => employee.location))).sort()),
    [],
  )

  return (
    <>
      <WuMenu
        Trigger={
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            aria-label="Widget options"
          >
            ⋮
          </button>
        }
        align="end"
      >
        {!confirmDelete ? (
          <>
            {canEdit && onSettings && (
              <WuMenuItem onSelect={() => onSettings()}>Settings</WuMenuItem>
            )}
            {canEdit && <WuMenuItem onSelect={() => onEdit?.()}>Edit</WuMenuItem>}
            <WuMenuItem onSelect={() => setIsFilterOpen(true)}>Filters</WuMenuItem>
            {onExportPpt && (
              <WuMenuItem onSelect={() => onExportPpt()}>Export PPT</WuMenuItem>
            )}
            {canEdit && <WuMenuItem onSelect={() => onDuplicate?.()}>Duplicate</WuMenuItem>}
            {canEdit && (
              <WuMenuItem onSelect={() => setConfirmDelete(true)}>
                <span className="text-red-600">Delete</span>
              </WuMenuItem>
            )}
          </>
        ) : (
          <div className="w-64 p-3">
            <WuText size="sm" as="p" className="mb-3 text-gray-700">
              Remove this widget from the dashboard?
            </WuText>
            <div className="flex justify-end gap-2">
              <WuButton variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </WuButton>
              <WuButton
                variant="secondary"
                size="sm"
                className="text-red-600"
                onClick={() => {
                  setConfirmDelete(false)
                  onDelete?.()
                }}
              >
                Remove
              </WuButton>
            </div>
          </div>
        )}
      </WuMenu>

      <WuDrawer open={isFilterOpen} onOpenChange={setIsFilterOpen} title={`Widget Filters — ${title}`} side="right">
        <div className="space-y-4 p-4">
          <div>
            <WuText size="sm" as="p" className="mb-2 font-medium text-gray-700">
              Department
            </WuText>
            <WuSelect
              data={departmentOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={departments}
              onSelect={(value) =>
                setDepartments((Array.isArray(value) ? value : value ? [value] : []) as SelectOption[])
              }
              multiple
              variant="outlined"
            />
          </div>
          <div>
            <WuText size="sm" as="p" className="mb-2 font-medium text-gray-700">
              Location
            </WuText>
            <WuSelect
              data={locationOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={locations}
              onSelect={(value) =>
                setLocations((Array.isArray(value) ? value : value ? [value] : []) as SelectOption[])
              }
              multiple
              variant="outlined"
            />
          </div>
          <div>
            <WuText size="sm" as="p" className="mb-2 font-medium text-gray-700">
              Date range
            </WuText>
            <div className="grid grid-cols-2 gap-3">
              <WuInput type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              <WuInput type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <WuButton
              variant="secondary"
              onClick={() => {
                setDepartments([])
                setLocations([])
                console.log('Clear widget filters', title)
              }}
            >
              Clear All
            </WuButton>
            <WuButton
              variant="primary"
              onClick={() => {
                console.log('Apply widget filters', { title, departments, locations, fromDate, toDate })
                setIsFilterOpen(false)
              }}
            >
              Apply
            </WuButton>
          </div>
        </div>
      </WuDrawer>
    </>
  )
}
