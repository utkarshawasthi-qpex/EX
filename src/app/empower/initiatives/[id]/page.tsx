'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib'
import { InitiativeStatusDropdown } from '@/components/empower/InitiativeStatusDropdown'
import { InitiativeSurveyLink } from '@/components/empower/InitiativeSurveyLink'
import { InitiativeTaskTable } from '@/components/empower/InitiativeTaskTable'
import { TaskFormModal } from '@/components/modules/empower/TaskFormModal'
import { notifyEmpowerDataChanged } from '@/lib/empowerEvents'
import { formatLongDate } from '@/lib/empowerIntegration/helpers'
import {
  deleteTaskFromInitiative,
  getEmployeeName,
  getInitiativeById,
  setTaskStatus,
  upsertInitiative,
} from '@/lib/empowerIntegration/storage'
import { canSeeInitiative } from '@/lib/empowerIntegration/visibility'
import { getCurrentUser } from '@/lib/userContext'
import type {
  EmpowerInitiativeRecord,
  InitiativeLifecycleStatus,
  InitiativeTask,
  TaskStatus,
} from '@/types/empowerIntegration'

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false })
const WuMenu = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })), { ssr: false })
const WuMenuItem = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })), { ssr: false })
const WuTab = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })), { ssr: false })
const WuTextarea = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })), { ssr: false })

export default function InitiativeDetailPage() {
  const params = useParams<{ id: string }>()
  const user = getCurrentUser()
  const { showToast } = useWuShowToast()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskBeingEdited, setTaskBeingEdited] = useState<InitiativeTask | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const initiative = useMemo(() => {
    void refreshKey
    return getInitiativeById(params.id)
  }, [params.id, refreshKey])

  function refresh() {
    setRefreshKey((key) => key + 1)
    notifyEmpowerDataChanged()
  }

  if (!initiative || !canSeeInitiative(user, initiative)) {
    return (
      <div className="p-8">
        <p className="text-sm text-[#6B7280]">Initiative not found</p>
        <Link href="/empower/initiatives" className="mt-2 inline-block text-sm text-[#1B87E6] hover:underline">
          ← Back to initiatives
        </Link>
      </div>
    )
  }

  function persist(next: EmpowerInitiativeRecord, event: string) {
    upsertInitiative({
      ...next,
      history: [...next.history, { at: new Date().toISOString(), event }],
    })
    refresh()
  }

  function saveTitle() {
    const trimmed = titleDraft.trim()
    setIsEditingTitle(false)
    if (!initiative || !trimmed || trimmed === initiative.title) return
    persist({ ...initiative, title: trimmed }, `Initiative renamed to "${trimmed}"`)
    showToast({ variant: 'success', message: 'Initiative renamed' })
  }

  function changeStatus(status: InitiativeLifecycleStatus) {
    if (!initiative) return
    persist(
      {
        ...initiative,
        status,
        progress: status === 'completed' ? 'done' : initiative.progress,
      },
      `Status set to ${status}`,
    )
    showToast({ variant: 'success', message: 'Initiative status updated' })
  }

  function handleTaskStatusChange(taskId: string, status: TaskStatus) {
    setTaskStatus(params.id, taskId, status)
    refresh()
    showToast({ variant: 'success', message: 'Task status updated' })
  }

  function handleTaskDelete(taskId: string) {
    deleteTaskFromInitiative(params.id, taskId)
    refresh()
    showToast({ variant: 'success', message: 'Task deleted' })
  }

  const tabs: IWuTabItem[] = [
    {
      value: 'tasks',
      Trigger: 'Tasks',
      Content: (
        <div className="pt-4">
          <div className="mb-4 flex items-center gap-px">
            <WuButton
              variant="primary"
              onClick={() => {
                setTaskBeingEdited(null)
                setTaskModalOpen(true)
              }}
            >
              + New task
            </WuButton>
            <WuMenu
              align="start"
              Trigger={
                <button
                  type="button"
                  className="flex h-9 items-center rounded-r bg-[#1B87E6] px-2 text-white hover:bg-[#1569B8]"
                  aria-label="More task options"
                >
                  <span className="wm-expand-more text-base leading-none" aria-hidden />
                </button>
              }
            >
              <WuMenuItem
                onSelect={() => showToast({ variant: 'info', message: 'Task templates are coming soon.' })}
              >
                Add from template
              </WuMenuItem>
              <WuMenuItem
                onSelect={() => showToast({ variant: 'info', message: 'Task import is coming soon.' })}
              >
                Import tasks
              </WuMenuItem>
            </WuMenu>
          </div>

          {initiative.tasks.length === 0 ? (
            <p className="rounded border border-dashed border-[#D1D5DB] px-6 py-10 text-center text-sm text-[#6B7280]">
              No tasks yet. Create the first one to get this initiative moving.
            </p>
          ) : (
            <InitiativeTaskTable
              tasks={initiative.tasks}
              onStatusChange={handleTaskStatusChange}
              onEdit={(task) => {
                setTaskBeingEdited(task)
                setTaskModalOpen(true)
              }}
              onDelete={handleTaskDelete}
            />
          )}
        </div>
      ),
    },
    {
      value: 'notes',
      Trigger: 'Notes',
      Content: (
        <div className="max-w-2xl space-y-3 pt-4">
          <p className="text-sm text-[#6B7280]">Notes will appear here. Add a note to get started.</p>
          <WuTextarea
            rows={4}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Write a note for this initiative"
          />
          <WuButton
            variant="secondary"
            onClick={() => showToast({ variant: 'info', message: 'Notes are coming soon.' })}
          >
            Add note
          </WuButton>
        </div>
      ),
    },
    {
      value: 'ideation',
      Trigger: 'Ideation',
      Content: (
        <p className="pt-4 text-sm text-[#6B7280]">Ideation for this initiative will appear here.</p>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/empower/initiatives"
              className="flex size-7 items-center justify-center rounded text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]"
              aria-label="Back to initiatives"
            >
              <span className="wm-arrow-back text-lg leading-none" aria-hidden />
            </Link>

            {isEditingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle()
                  if (e.key === 'Escape') setIsEditingTitle(false)
                }}
                className="min-w-0 flex-1 rounded border border-[#1B87E6] px-2 py-1 text-2xl font-semibold text-[#1B2E4A] outline-none"
                aria-label="Initiative name"
              />
            ) : (
              <>
                <h1 className="truncate text-2xl font-semibold text-[#1B2E4A]">{initiative.title}</h1>
                <button
                  type="button"
                  className="flex size-7 shrink-0 items-center justify-center rounded text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1B87E6]"
                  onClick={() => {
                    setTitleDraft(initiative.title)
                    setIsEditingTitle(true)
                  }}
                  aria-label="Rename initiative"
                >
                  <span className="wm-edit text-base leading-none" aria-hidden />
                </button>
              </>
            )}
          </div>

          <InitiativeStatusDropdown status={initiative.status} onChange={changeStatus} />
        </div>

        <p className="mt-1 pl-9 text-sm text-[#6B7280]">
          By {getEmployeeName(initiative.ownerId)} · {formatLongDate(initiative.createdAt)}
        </p>
        <p className="mt-3 max-w-3xl text-sm text-[#374151]">{initiative.description}</p>

        {initiative.surveyLink && (
          <InitiativeSurveyLink
            link={initiative.surveyLink}
            canUnlink={user.id === initiative.createdBy || user.id === initiative.ownerId}
            onUnlink={() => {
              persist({ ...initiative, surveyLink: null }, 'Survey link removed')
              showToast({ variant: 'success', message: 'Survey link removed' })
            }}
          />
        )}
      </div>

      <WuTab items={tabs} defaultValue="tasks" />

      <TaskFormModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        initiativeId={initiative.id}
        task={taskBeingEdited}
        onSaved={() => {
          refresh()
          showToast({
            variant: 'success',
            message: taskBeingEdited ? 'Task updated' : 'Task created',
          })
        }}
      />
    </div>
  )
}
