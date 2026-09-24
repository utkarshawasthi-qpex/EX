'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)

export type SurveyBuilderMainTab = 'edit' | 'distribute' | 'analytics' | 'manageData'
export type SurveyBuilderWorkspaceTab =
  | 'workspace'
  | 'design'
  | 'settings'
  | 'languages'
  | 'media'

const MAIN_TABS: { id: SurveyBuilderMainTab; label: string }[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'distribute', label: 'Distribute' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'manageData', label: 'Manage Data' },
]

const WORKSPACE_TABS: { id: SurveyBuilderWorkspaceTab; label: string; icon: string }[] = [
  { id: 'workspace', label: 'Workspace', icon: 'wm-format-list-bulleted' },
  { id: 'design', label: 'Design', icon: 'wm-palette' },
  { id: 'settings', label: 'Settings', icon: 'wm-settings' },
  { id: 'languages', label: 'Languages', icon: 'wm-translate' },
  { id: 'media', label: 'Media Library', icon: 'wm-image' },
]

export type SurveyBuilderSubTab = {
  id: string
  label: string
  icon: string
}

type LifecycleSurveyBuilderChromeProps = {
  mainTab: SurveyBuilderMainTab
  onMainTabChange: (tab: SurveyBuilderMainTab) => void
  workspaceTab: SurveyBuilderWorkspaceTab
  onWorkspaceTabChange: (tab: SurveyBuilderWorkspaceTab) => void
  onPreview: () => void
  onAddSection: () => void
  /** Secondary tabs for the active main tab, using the same bar as Edit. */
  subTabs?: SurveyBuilderSubTab[]
  subTab?: string
  onSubTabChange?: (id: string) => void
  subTabActions?: ReactNode
}

export function LifecycleSurveyBuilderChrome({
  mainTab,
  onMainTabChange,
  workspaceTab,
  onWorkspaceTabChange,
  onPreview,
  onAddSection,
  subTabs,
  subTab,
  onSubTabChange,
  subTabActions,
}: LifecycleSurveyBuilderChromeProps) {
  const showCustomSubnav = mainTab !== 'edit' && Boolean(subTabs?.length)

  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <nav className="flex items-center gap-6 px-6">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onMainTabChange(tab.id)}
            className={cn(
              'border-b-2 py-3 text-sm font-medium transition-colors',
              mainTab === tab.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {mainTab === 'edit' ? (
        <SubnavBar
          tabs={WORKSPACE_TABS}
          activeId={workspaceTab}
          onChange={(id) => onWorkspaceTabChange(id as SurveyBuilderWorkspaceTab)}
          actions={
            <>
              <WuButton variant="secondary" size="sm" onClick={onPreview}>
                <span className="wm-visibility mr-1 text-sm leading-none" aria-hidden />
                Preview
              </WuButton>
              <WuButton variant="primary" size="sm" onClick={onAddSection}>
                + Add Section
              </WuButton>
            </>
          }
        />
      ) : null}

      {showCustomSubnav ? (
        <SubnavBar
          tabs={subTabs ?? []}
          activeId={subTab ?? ''}
          onChange={(id) => onSubTabChange?.(id)}
          actions={subTabActions}
        />
      ) : null}
    </div>
  )
}

function SubnavBar({
  tabs,
  activeId,
  onChange,
  actions,
}: {
  tabs: SurveyBuilderSubTab[]
  activeId: string
  onChange: (id: string) => void
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-[#f7f9fc] px-4 py-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                isActive ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-800',
              )}
            >
              <span className={`${tab.icon} text-base leading-none`} aria-hidden />
              {tab.label}
            </button>
          )
        })}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
