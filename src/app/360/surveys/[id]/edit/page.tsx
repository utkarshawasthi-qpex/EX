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
import { ReportBuilder } from '@/components/modules/feedback360/ReportBuilder'
import { SettingsPanel } from '@/components/modules/feedback360/SettingsPanel'
import { WorkspacePanel } from '@/components/modules/feedback360/WorkspacePanel'
import {
  LifecycleSurveyBuilderChrome,
  type SurveyBuilderMainTab,
  type SurveyBuilderSubTab,
  type SurveyBuilderWorkspaceTab,
} from '@/components/modules/lifecycle/LifecycleSurveyBuilderChrome'
import type { DistributeSection } from '@/components/modules/feedback360/DistributePanel'

type AnalyticsSection = 'data' | 'individualReports'
import type { Survey360, Survey360Section } from '@/data/mock/surveys360'
import { getSurvey360ById, saveSurvey360 } from '@/lib/surveys360Storage'
import { setSurveyBuilderCrumb } from '@/lib/surveyBuilderCrumb'

const DISTRIBUTE_TABS: SurveyBuilderSubTab[] = [
  { id: 'deployments', label: 'Deployments', icon: 'wm-grid-view' },
  { id: 'send', label: 'Send', icon: 'wm-mail' },
  { id: 'reportOptions', label: 'Report Options', icon: 'wm-build' },
  { id: 'portal', label: 'Portal', icon: 'wm-description' },
]

const ANALYTICS_TABS: SurveyBuilderSubTab[] = [
  { id: 'data', label: 'Data', icon: 'wc-analytics' },
  { id: 'individualReports', label: 'Individual reports', icon: 'wm-person' },
]

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

export default function Survey360EditPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const surveyId = typeof params.id === 'string' ? params.id : ''

  const [survey, setSurvey] = useState<Survey360 | null>(null)
  const [loading, setLoading] = useState(true)
  const [mainTab, setMainTab] = useState<SurveyBuilderMainTab>('edit')
  const [editSubTab, setEditSubTab] = useState<SurveyBuilderWorkspaceTab>('workspace')
  const [distributeSection, setDistributeSection] = useState<DistributeSection>('deployments')
  const [analyticsSection, setAnalyticsSection] = useState<AnalyticsSection>('data')
  const [openReportPreview, setOpenReportPreview] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const search = new URLSearchParams(window.location.search)
    const tab = search.get('tab')
    if (tab === 'distribute' || tab === 'manageData' || tab === 'analytics' || tab === 'edit') {
      setMainTab(tab)
    }
    if (search.get('section') === 'individualReports') {
      setMainTab('analytics')
      setAnalyticsSection('individualReports')
    }
    if (search.get('view') === 'preview') setOpenReportPreview(true)
    const loaded = getSurvey360ById(surveyId)
    setSurvey(loaded ?? null)
    setLoading(false)
  }, [surveyId])

  function handleChange(next: Survey360) {
    setSurvey(next)
    saveSurvey360(next)
  }

  useEffect(() => {
    setSurveyBuilderCrumb(survey?.title ?? '')
    return () => setSurveyBuilderCrumb('')
  }, [survey?.title])

  function handleAddSection() {
    if (!survey) return
    const newSection: Survey360Section = {
      id: `sec_${Date.now()}`,
      title: `Section ${survey.sections.length + 1}`,
      questions: [],
    }
    handleChange({ ...survey, sections: [...survey.sections, newSection] })
    setMainTab('edit')
    setEditSubTab('workspace')
    showToast({ variant: 'success', message: 'Section added' })
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
        <WuButton variant="primary" onClick={() => router.push('/lifecycle')}>
          Back to studies
        </WuButton>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-100">
      <LifecycleSurveyBuilderChrome
        mainTab={mainTab}
        onMainTabChange={setMainTab}
        workspaceTab={editSubTab}
        onWorkspaceTabChange={setEditSubTab}
        onPreview={() => showToast({ variant: 'info', message: 'Preview opened' })}
        onAddSection={handleAddSection}
        subTabs={
          mainTab === 'distribute'
            ? DISTRIBUTE_TABS
            : mainTab === 'analytics'
              ? ANALYTICS_TABS
              : undefined
        }
        subTab={mainTab === 'distribute' ? distributeSection : analyticsSection}
        onSubTabChange={(id) => {
          if (mainTab === 'distribute') setDistributeSection(id as DistributeSection)
          else setAnalyticsSection(id as AnalyticsSection)
        }}
      />

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
        {mainTab === 'distribute' && (
          <DistributePanel survey={survey} section={distributeSection} />
        )}
        {mainTab === 'analytics' && analyticsSection === 'data' && (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <WuText size="sm" as="p" className="max-w-md text-gray-500">
              360 analytics for this survey will appear here.
            </WuText>
          </div>
        )}
        <div className={mainTab === 'analytics' && analyticsSection === 'individualReports' ? undefined : 'hidden'}>
          <ReportBuilder
            key={survey.id}
            survey={survey}
            startInPreview={openReportPreview}
            onGoToDistribute={() => {
              setMainTab('distribute')
              setDistributeSection('deployments')
            }}
          />
        </div>
        {mainTab === 'manageData' && <ManageDataPanel survey={survey} />}
      </main>
    </div>
  )
}
