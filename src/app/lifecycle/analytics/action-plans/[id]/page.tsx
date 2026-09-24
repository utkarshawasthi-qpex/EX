'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib'
import {
  ActionPlanCompleteBanner,
  ActionPlanStatusControl,
} from '@/components/modules/actionPlans/ActionPlanStatusControl'
import { ActionPlanDataFocusNote } from '@/components/modules/actionPlans/ActionPlanDataFocusNote'
import { InitiativeTaskTable } from '@/components/empower/InitiativeTaskTable'
import { ActionPlanCollaboratorsPanel } from '@/components/modules/actionPlans/ActionPlanCollaboratorsPanel'
import { InitiativeReminderSettingsPanel } from '@/components/modules/actionPlans/InitiativeReminderSettingsPanel'
import { TaskFormModal } from '@/components/modules/empower/TaskFormModal'
import { PageContent } from '@/components/shared/PageContent'
import { PageShell } from '@/components/shared/PageShell'
import { computeActionPlanProgress, formatLongDate } from '@/lib/actionPlans'
import { ACTION_PLANS_LIST, ACTION_PLANS_OVERVIEW } from '@/lib/actionPlans/paths'
import { actionPlanningTerminology as t } from '@/lib/actionPlans/terminology'
import { notifyEmpowerDataChanged } from '@/lib/empowerEvents'
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
  InitiativeTask,
  TaskStatus,
} from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false },
)
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false },
)

export default function ActionPlanDetailPage() {
  const params = useParams<{ id: string }>()
  const user = getCurrentUser()
  const { showToast } = useWuShowToast()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskBeingEdited, setTaskBeingEdited] = useState<InitiativeTask | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [requestComplete, setRequestComplete] = useState(false)

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
      <PageShell>
        <PageContent>
          <p className="text-sm text-gray-500">{t.initiativeNotFound}</p>
          <Link href={ACTION_PLANS_OVERVIEW} className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            ← {t.backToModuleHome}
          </Link>
        </PageContent>
      </PageShell>
    )
  }

  const plan = initiative
  const progress = computeActionPlanProgress(plan)

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
    if (!trimmed || trimmed === plan.title) return
    persist({ ...plan, title: trimmed }, `Initiative renamed to "${trimmed}"`)
    showToast({ variant: 'success', message: 'Initiative renamed' })
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
      Trigger: `Tasks (${progress.completed}/${progress.total})`,
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
          </div>
          {plan.tasks.length === 0 ? (
            <p className="rounded border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500">
              No tasks yet. Add the first task to start making progress.
            </p>
          ) : (
            <InitiativeTaskTable
              tasks={plan.tasks}
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
          <WuTextarea
            rows={4}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Write a note for this initiative"
          />
          <WuButton
            variant="secondary"
            onClick={() => showToast({ variant: 'info', message: 'Notes saved locally in this prototype.' })}
          >
            Save note
          </WuButton>
        </div>
      ),
    },
    {
      value: 'collaborators',
      Trigger: 'Collaborators',
      Content: (
        <div className="pt-4">
          <ActionPlanCollaboratorsPanel
            initiative={plan}
            onUpdated={(next) => persist(next, 'Collaborators updated')}
          />
        </div>
      ),
    },
    {
      value: 'reminders',
      Trigger: 'Reminders',
      Content: (
        <div className="pt-4">
          <InitiativeReminderSettingsPanel
            initiative={plan}
            onSave={(next) => {
              persist(next, 'Reminder settings updated')
              showToast({ variant: 'success', message: 'Reminder settings saved' })
            }}
          />
        </div>
      ),
    },
  ]

  return (
    <PageShell>
      <PageContent className="max-w-5xl">
        <div className="mb-6 border-b border-gray-200 bg-white pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href={ACTION_PLANS_OVERVIEW}
                className="flex size-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
                aria-label={t.moduleHome}
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
                  className="min-w-0 flex-1 rounded border border-blue-500 px-2 py-1 text-2xl font-semibold outline-none"
                  aria-label={t.initiativeName}
                />
              ) : (
                <>
                <h1 className="truncate text-2xl font-semibold text-gray-900">{plan.title}</h1>
                <button
                  type="button"
                  className="flex size-7 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
                  onClick={() => {
                    setTitleDraft(plan.title)
                      setIsEditingTitle(true)
                    }}
                    aria-label={t.renameInitiative}
                  >
                    <span className="wm-edit text-base leading-none" aria-hidden />
                  </button>
                </>
              )}
            </div>
            <ActionPlanStatusControl
              plan={plan}
              onPersist={persist}
              requestComplete={requestComplete}
              onRequestCompleteHandled={() => setRequestComplete(false)}
            />
          </div>
          <div className="pl-9">
            <ActionPlanCompleteBanner plan={plan} onMarkComplete={() => setRequestComplete(true)} />
          </div>
          {plan.actionFeedback ? (
            <p className="mb-2 pl-9 text-xs text-gray-500">
              Team feedback collected ({plan.actionFeedback.responses.length} responses)
            </p>
          ) : null}
          <p className="mt-1 pl-9 text-sm text-gray-500">
            By {getEmployeeName(plan.ownerId)} · {formatLongDate(plan.createdAt)}
          </p>
          <p className="mt-2 pl-9 text-sm text-gray-700">
            {progress.completed}/{progress.total} tasks complete ({progress.rate}%)
            {progress.overdueCount > 0 ? (
              <span className="ml-2 font-medium text-red-600">{progress.overdueCount} overdue</span>
            ) : null}
          </p>
          <p className="mt-3 max-w-3xl pl-9 text-sm text-gray-700">{plan.description}</p>
          {(plan.dataFocus || plan.surveyLink) && (
            <div className="mt-3 max-w-2xl pl-9">
              <ActionPlanDataFocusNote
                dataFocus={plan.dataFocus}
                legacySurveyLink={plan.surveyLink}
              />
            </div>
          )}
        </div>

        <WuTab items={tabs} defaultValue="tasks" />

        <TaskFormModal
          open={taskModalOpen}
          onOpenChange={setTaskModalOpen}
          initiativeId={plan.id}
          task={taskBeingEdited}
          onSaved={() => {
            refresh()
            showToast({
              variant: 'success',
              message: taskBeingEdited ? 'Task updated' : 'Task created',
            })
          }}
        />
      </PageContent>
    </PageShell>
  )
}
