'use client'

import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { DesignPanel } from '@/components/modules/feedback360/DesignPanel'
import { DistributePanel } from '@/components/modules/feedback360/DistributePanel'
import { LanguagesPanel } from '@/components/modules/feedback360/LanguagesPanel'
import { ManageDataPanel } from '@/components/modules/feedback360/ManageDataPanel'
import { MediaLibraryPanel } from '@/components/modules/feedback360/MediaLibraryPanel'
import { SettingsPanel } from '@/components/modules/feedback360/SettingsPanel'
import { WorkspacePanel } from '@/components/modules/feedback360/WorkspacePanel'
import type { Survey360 } from '@/data/mock/surveys360'
import { getSurvey360ById, saveSurvey360 } from '@/lib/surveys360Storage'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type MainTab = 'edit' | 'distribute' | 'manageData'
type EditSubTab = 'workspace' | 'design' | 'settings' | 'languages' | 'media'

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'distribute', label: 'Distribute' },
  { id: 'manageData', label: 'Manage Data' },
]

const EDIT_SUBTABS: { id: EditSubTab; label: string; icon: string }[] = [
  { id: 'workspace', label: 'Workspace', icon: 'wm-format-list-bulleted' },
  { id: 'design', label: 'Design', icon: 'wm-edit' },
  { id: 'settings', label: 'Settings', icon: 'wm-settings' },
  { id: 'languages', label: 'Languages', icon: 'wm-translate' },
  { id: 'media', label: 'Media Library', icon: 'wm-image' },
]

export default function Survey360EditPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const surveyId = typeof params.id === 'string' ? params.id : ''

  const [survey, setSurvey] = useState<Survey360 | null>(null)
  const [loading, setLoading] = useState(true)
  const [mainTab, setMainTab] = useState<MainTab>('edit')
  const [editSubTab, setEditSubTab] = useState<EditSubTab>('workspace')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab === 'distribute' || tab === 'manageData' || tab === 'edit') {
      setMainTab(tab)
    }
    const loaded = getSurvey360ById(surveyId)
    setSurvey(loaded ?? null)
    setLoading(false)
  }, [surveyId])

  function handleChange(next: Survey360) {
    setSurvey(next)
    saveSurvey360(next)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <WuText size="sm" as="p" className="text-gray-400">
          Loading survey…
        </WuText>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <WuText size="sm" as="p" className="mb-3 text-gray-600">
          Survey not found.
        </WuText>
        <WuButton variant="primary" onClick={() => router.push('/360/surveys')}>
          Back to surveys
        </WuButton>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/360/surveys')}
              className="wm-arrow-back text-xl text-gray-500 hover:text-gray-800"
              aria-label="Back to surveys"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{survey.title}</p>
              <p className="text-xs text-gray-400">
                {survey.source === 'template' ? '360 template' : 'Custom survey'} · {survey.status}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <WuButton
              variant="secondary"
              onClick={() => showToast({ variant: 'info', message: 'Preview opened' })}
            >
              Preview
            </WuButton>
            <WuButton
              variant="primary"
              onClick={() => {
                saveSurvey360(survey)
                showToast({ variant: 'success', message: 'Survey saved' })
              }}
            >
              Save
            </WuButton>
          </div>
        </div>

        <nav className="flex items-center gap-6 border-t border-gray-100 px-4">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMainTab(tab.id)}
              className={cn(
                'border-b-2 py-2.5 text-sm font-medium transition-colors',
                mainTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {mainTab === 'edit' && (
          <div className="flex items-center gap-1 border-t border-gray-100 bg-gray-50 px-3 py-1.5">
            {EDIT_SUBTABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEditSubTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium',
                  editSubTab === tab.id
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:bg-white/70 hover:text-gray-800',
                )}
              >
                <span className={`${tab.icon} text-sm leading-none`} aria-hidden />
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="min-h-0 flex-1 overflow-auto">
        {mainTab === 'edit' && editSubTab === 'workspace' && (
          <WorkspacePanel survey={survey} onChange={handleChange} />
        )}
        {mainTab === 'edit' && editSubTab === 'design' && (
          <DesignPanel survey={survey} onChange={handleChange} />
        )}
        {mainTab === 'edit' && editSubTab === 'settings' && (
          <SettingsPanel survey={survey} onChange={handleChange} />
        )}
        {mainTab === 'edit' && editSubTab === 'languages' && (
          <LanguagesPanel survey={survey} onChange={handleChange} />
        )}
        {mainTab === 'edit' && editSubTab === 'media' && (
          <MediaLibraryPanel survey={survey} onChange={handleChange} />
        )}
        {mainTab === 'distribute' && <DistributePanel survey={survey} />}
        {mainTab === 'manageData' && <ManageDataPanel survey={survey} />}
      </main>
    </div>
  )
}
