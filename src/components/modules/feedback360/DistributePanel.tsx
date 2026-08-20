'use client'

import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { Survey360 } from '@/data/mock/surveys360'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)

type DistributePanelProps = {
  survey: Survey360
}

const DEMO_SUBJECTS = [
  { name: 'Sarah Mehta', role: 'Sr. Manager', evaluators: 12, status: 'In Progress' },
  { name: 'Arun Sharma', role: 'Director', evaluators: 9, status: 'Completed' },
  { name: 'Priya Nair', role: 'Team Lead', evaluators: 7, status: 'Not Started' },
  { name: 'Raj Patel', role: 'Analyst', evaluators: 5, status: 'In Progress' },
]

export function DistributePanel({ survey }: DistributePanelProps) {
  const { showToast } = useWuShowToast()

  return (
    <div className="flex min-h-[calc(100vh-140px)]">
      <aside className="w-80 shrink-0 border-r border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <WuHeading size="sm">Subjects</WuHeading>
          <WuButton
            variant="primary"
            size="sm"
            onClick={() => showToast({ variant: 'info', message: 'Add subject opened' })}
          >
            + Add Subject
          </WuButton>
        </div>
        <WuInput variant="outlined" placeholder="Search subjects..." className="mb-3" />
        <div className="space-y-2">
          {DEMO_SUBJECTS.map((subject) => (
            <button
              key={subject.name}
              type="button"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left hover:border-blue-200 hover:bg-blue-50"
              onClick={() => showToast({ variant: 'info', message: `${subject.name} selected` })}
            >
              <p className="text-sm font-medium text-gray-800">{subject.name}</p>
              <p className="text-xs text-gray-500">
                {subject.role} · {subject.evaluators} evaluators · {subject.status}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <WuHeading size="md">{survey.title}</WuHeading>
            <WuText size="sm" as="p" className="mt-1 text-gray-500">
              Assign evaluators by relationship, then launch the deployment.
            </WuText>
          </div>
          <div className="flex gap-2">
            <WuButton
              variant="secondary"
              onClick={() => showToast({ variant: 'info', message: 'Reminders sent' })}
            >
              Send Reminders
            </WuButton>
            <WuButton
              variant="primary"
              onClick={() => showToast({ variant: 'success', message: 'Deployment launched' })}
            >
              Launch
            </WuButton>
          </div>
        </div>

        <div className="space-y-3">
          {['Self', 'Manager', 'Direct Reports', 'Peers', 'External'].map((group) => (
            <div key={group} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">{group}</p>
                <button
                  type="button"
                  className="text-xs font-medium text-blue-600 hover:underline"
                  onClick={() => showToast({ variant: 'info', message: `Add evaluator to ${group}` })}
                >
                  + Add Evaluator
                </button>
              </div>
              <WuText size="sm" as="p" className="text-gray-500">
                Evaluator list for this relationship will appear here.
              </WuText>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
