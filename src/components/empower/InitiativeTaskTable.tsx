'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { empowerTable } from '@/components/empower/primitives/tableStyles'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import {
  TASK_STATUS_OPTIONS,
  formatDueDate,
  taskStatusLabel,
} from '@/lib/empowerIntegration/helpers'
import { getEmployeeName } from '@/lib/empowerIntegration/storage'
import { cn } from '@/lib/utils'
import type { InitiativeTask, TaskStatus } from '@/types/empowerIntegration'

const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })), { ssr: false })

type SelectOption = { value: string; label: string }

interface InitiativeTaskTableProps {
  tasks: InitiativeTask[]
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onEdit: (task: InitiativeTask) => void
  onDelete: (taskId: string) => void
}

const COLUMNS = ['Name', 'Owner', 'Contributors', 'Due', 'Status', 'Completed']

function contributorNames(task: InitiativeTask): string {
  const ids = task.contributorIds ?? []
  if (ids.length === 0) return '–'
  return ids.map((id) => getEmployeeName(id)).join(', ')
}

export function InitiativeTaskTable({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
}: InitiativeTaskTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingDelete, setPendingDelete] = useState<InitiativeTask | null>(null)

  const allSelected = tasks.length > 0 && selectedIds.length === tasks.length

  function toggleAll() {
    setSelectedIds(allSelected ? [] : tasks.map((task) => task.id))
  }

  function toggleOne(taskId: string) {
    setSelectedIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    )
  }

  return (
    <>
      <table className={empowerTable.table}>
        <thead>
          <tr className={empowerTable.headRow}>
            <th scope="col" className={cn(empowerTable.headCell, 'w-10')}>
              <input
                type="checkbox"
                className="size-4 accent-[#1B87E6]"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all tasks"
              />
            </th>
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className={empowerTable.headCell}>
                {column}
              </th>
            ))}
            <th scope="col" className={cn(empowerTable.headCell, 'w-20')}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className={cn(empowerTable.row, 'group hover:bg-[#F9FAFB]')}>
              <td className={empowerTable.cell}>
                <input
                  type="checkbox"
                  className="size-4 accent-[#1B87E6]"
                  checked={selectedIds.includes(task.id)}
                  onChange={() => toggleOne(task.id)}
                  aria-label={`Select ${task.text}`}
                />
              </td>
              <td className={cn(empowerTable.cell, 'max-w-[360px] whitespace-normal')}>{task.text}</td>
              <td className={empowerTable.mutedCell}>{getEmployeeName(task.ownerId)}</td>
              <td className={empowerTable.mutedCell}>{contributorNames(task)}</td>
              <td className={empowerTable.mutedCell}>{formatDueDate(task.dueDate)}</td>
              <td className={cn(empowerTable.cell, 'w-[160px]')}>
                <WuSelect
                  data={TASK_STATUS_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={{ value: task.status, label: taskStatusLabel(task.status) }}
                  onSelect={(v) => onStatusChange(task.id, (v as SelectOption).value as TaskStatus)}
                  variant="outlined"
                />
              </td>
              <td className={empowerTable.mutedCell}>
                {task.completedAt ? formatDueDate(task.completedAt) : 'N/A'}
              </td>
              <td className={empowerTable.cell}>
                <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#DC2626]"
                    onClick={() => setPendingDelete(task)}
                    aria-label={`Delete ${task.text}`}
                  >
                    <span className="wm-delete text-base leading-none" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="flex size-7 items-center justify-center rounded text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1B87E6]"
                    onClick={() => onEdit(task)}
                    aria-label={`Edit ${task.text}`}
                  >
                    <span className="wm-edit text-base leading-none" aria-hidden />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmModal
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this task?"
        description={pendingDelete ? `"${pendingDelete.text}" will be removed from this initiative.` : ''}
        confirmLabel="Delete"
        variant="critical"
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </>
  )
}
