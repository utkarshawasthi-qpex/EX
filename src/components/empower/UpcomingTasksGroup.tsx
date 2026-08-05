'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { NoAssignedTasksState } from '@/components/empower/NoAssignedTasksState'
import { empowerTable } from '@/components/empower/primitives/tableStyles'
import { formatDueDate, taskStatusLabel } from '@/lib/empowerIntegration/helpers'
import { getEmployeeName } from '@/lib/empowerIntegration/storage'
import { cn } from '@/lib/utils'
import type { EmpowerInitiativeRecord, InitiativeTask } from '@/types/empowerIntegration'

type SortKey = 'name' | 'owner' | 'contributor' | 'due' | 'status'

interface UpcomingTasksGroupProps {
  initiative: EmpowerInitiativeRecord
  tasks: InitiativeTask[]
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'owner', label: 'Owner' },
  { key: 'contributor', label: 'Contributor' },
  { key: 'due', label: 'Due' },
  { key: 'status', label: 'Status' },
]

function contributorNames(task: InitiativeTask): string {
  const ids = task.contributorIds ?? []
  if (ids.length === 0) return '–'
  return ids.map((id) => getEmployeeName(id)).join(', ')
}

function sortValue(task: InitiativeTask, key: SortKey): string {
  if (key === 'name') return task.text.toLowerCase()
  if (key === 'owner') return getEmployeeName(task.ownerId).toLowerCase()
  if (key === 'contributor') return contributorNames(task).toLowerCase()
  if (key === 'due') return task.dueDate ?? '9999-12-31'
  return taskStatusLabel(task.status)
}

export function UpcomingTasksGroup({ initiative, tasks }: UpcomingTasksGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'due',
    direction: 'asc',
  })

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((left, right) => {
      const comparison = sortValue(left, sort.key).localeCompare(sortValue(right, sort.key))
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }, [tasks, sort])

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    )
  }

  return (
    <section className="mb-8">
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="flex size-5 items-center justify-center text-[10px] text-[#6B7280] hover:text-[#374151]"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${initiative.title}`}
        >
          <span
            className={cn(isExpanded ? 'wm-expand-more' : 'wm-chevron-right', 'text-base leading-none')}
            aria-hidden
          />
        </button>
        <Link
          href={`/empower/initiatives/${initiative.id}`}
          className="text-sm font-medium text-[#1B87E6] hover:underline"
        >
          {initiative.title}
        </Link>
      </div>

      {isExpanded &&
        (sortedTasks.length === 0 ? (
          <NoAssignedTasksState />
        ) : (
          <table className={empowerTable.table}>
            <thead>
              <tr className={empowerTable.headRow}>
                {COLUMNS.map((column) => (
                  <th key={column.label} scope="col" className={empowerTable.headCell}>
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="flex items-center gap-1 uppercase hover:text-[#374151]"
                    >
                      {column.label}
                      <span
                        className={cn(
                          'wm-unfold-more text-sm leading-none',
                          sort.key === column.key ? 'text-[#374151]' : 'text-[#9CA3AF]',
                        )}
                        aria-hidden
                      />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task) => (
                <tr key={task.id} className={empowerTable.row}>
                  <td className={cn(empowerTable.cell, 'max-w-[320px]')}>
                    <span className="block truncate" title={task.text}>
                      {task.text}
                    </span>
                  </td>
                  <td className={empowerTable.mutedCell}>{getEmployeeName(task.ownerId)}</td>
                  <td className={empowerTable.mutedCell}>{contributorNames(task)}</td>
                  <td className={empowerTable.mutedCell}>{formatDueDate(task.dueDate)}</td>
                  <td className={empowerTable.mutedCell}>{taskStatusLabel(task.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </section>
  )
}
