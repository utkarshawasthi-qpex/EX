'use client'

import dynamic from 'next/dynamic'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import {
  LifecycleSurveyBuilderChrome,
  type SurveyBuilderMainTab,
  type SurveyBuilderWorkspaceTab,
} from '@/components/modules/lifecycle/LifecycleSurveyBuilderChrome'
import { LifecycleSurveyWorkspaceCanvas } from '@/components/modules/lifecycle/LifecycleSurveyWorkspaceCanvas'
import { getSurveyById } from '@/lib/mockDb'
import { setSurveyBuilderCrumb } from '@/lib/surveyBuilderCrumb'
import type { LifecycleSurvey } from '@/types'

const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false },
)
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)

function emptySurvey(id: string, title: string): LifecycleSurvey {
  const now = new Date().toISOString().slice(0, 10)
  return {
    id,
    title,
    type: 'engagement',
    status: 'draft',
    markers: [{ id: 'mark_default', name: 'Block 1', order: 1, questionIds: [] }],
    questions: [],
    anonymityThreshold: 5,
    languages: ['en'],
    responseCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: 'emp_017',
  }
}

export default function LifecycleSurveyEditPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { showToast } = useWuShowToast()
  const surveyId = params.id

  const [survey, setSurvey] = useState<LifecycleSurvey | null>(null)
  const [mainTab, setMainTab] = useState<SurveyBuilderMainTab>('edit')
  const [workspaceTab, setWorkspaceTab] = useState<SurveyBuilderWorkspaceTab>('workspace')

  useEffect(() => {
    if (typeof window === 'undefined' || !surveyId) return
    const loaded = getSurveyById(surveyId)
    if (loaded) {
      setSurvey(loaded)
      return
    }
    const title = searchParams.get('title') ?? 'Untitled survey'
    setSurvey(emptySurvey(surveyId, title))
  }, [surveyId, searchParams])

  useEffect(() => {
    setSurveyBuilderCrumb(survey?.title ?? '')
    return () => setSurveyBuilderCrumb('')
  }, [survey?.title])

  function handleAddSection() {
    if (!survey) return
    const marker = {
      id: `mark_${Date.now()}`,
      name: `Block ${survey.markers.length + 1}`,
      order: survey.markers.length + 1,
      questionIds: [] as string[],
    }
    setSurvey({ ...survey, markers: [...survey.markers, marker] })
    setMainTab('edit')
    setWorkspaceTab('workspace')
    showToast({ variant: 'success', message: 'Section added' })
  }

  if (!survey) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <WuText size="sm" as="p" className="text-gray-400">
          Loading survey…
        </WuText>
      </div>
    )
  }

  function handleMainTab(tab: SurveyBuilderMainTab) {
    if (tab !== 'edit') {
      showToast({ variant: 'info', message: `${tab} (placeholder)` })
      console.log('Survey builder tab:', tab)
    }
    setMainTab(tab)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-100">
      <LifecycleSurveyBuilderChrome
        mainTab={mainTab}
        onMainTabChange={handleMainTab}
        workspaceTab={workspaceTab}
        onWorkspaceTabChange={(tab) => {
          if (tab !== 'workspace') {
            showToast({ variant: 'info', message: `${tab} (placeholder)` })
          }
          setWorkspaceTab(tab)
        }}
        onPreview={() => showToast({ variant: 'info', message: 'Preview opened' })}
        onAddSection={handleAddSection}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        {mainTab === 'edit' && workspaceTab === 'workspace' ? (
          <LifecycleSurveyWorkspaceCanvas survey={survey} onChange={setSurvey} />
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <WuText size="sm" as="p" className="max-w-md text-gray-500">
              {mainTab !== 'edit'
                ? 'This tab is a placeholder in the prototype.'
                : 'Switch to Workspace to edit questions.'}
            </WuText>
            {mainTab !== 'edit' ? (
              <WuButton variant="secondary" className="mt-4" onClick={() => setMainTab('edit')}>
                Back to Edit
              </WuButton>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
