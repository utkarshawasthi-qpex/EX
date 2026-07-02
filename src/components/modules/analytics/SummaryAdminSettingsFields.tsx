'use client'

import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import type { DashboardWidget, ID, SummaryAdminConfig, SummaryContent, SummaryVisibilityMode } from '@/types'

const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)

const VISIBILITY_OPTIONS = [
  {
    mode: 'private' as const,
    icon: '🔒',
    title: 'Private',
    description: 'Only visible to you',
    selectedClass: 'border-gray-700 bg-gray-50',
  },
  {
    mode: 'everyone' as const,
    icon: '🌐',
    title: 'Everyone',
    description: 'All users with dashboard access',
    selectedClass: 'border-blue-500 bg-blue-50',
  },
]

export type SummaryAdminSettingsFieldValues = {
  visibility: SummaryVisibilityMode
  allowEmployeeSummaries: boolean
}

type SummaryAdminSettingsFieldsProps = {
  values: SummaryAdminSettingsFieldValues
  onChange: (patch: Partial<SummaryAdminSettingsFieldValues>) => void
  dataWidgets?: DashboardWidget[]
  showDataCheck?: boolean
}

export function SummaryAdminSettingsFields({
  values,
  onChange,
  dataWidgets = [],
  showDataCheck = false,
}: SummaryAdminSettingsFieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <WuText size="sm" as="p" className="mb-3 text-sm font-medium text-gray-800">
          Summary visibility
        </WuText>
        <div className="grid grid-cols-2 gap-3">
          {VISIBILITY_OPTIONS.map((option) => (
            <button
              key={option.mode}
              type="button"
              className={cn(
                'rounded-lg border p-4 text-left transition-colors',
                values.visibility === option.mode
                  ? option.selectedClass
                  : 'border-gray-200 bg-white hover:bg-gray-50',
              )}
              onClick={() => onChange({ visibility: option.mode })}
            >
              <span className="text-xl" aria-hidden>
                {option.icon}
              </span>
              <WuText size="sm" as="p" className="mt-2 font-semibold text-gray-900">
                {option.title}
              </WuText>
              <WuText size="sm" as="p" className="mt-1 text-xs text-gray-500">
                {option.description}
              </WuText>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <WuText
          size="sm"
          as="p"
          className="text-xs font-medium tracking-wide text-gray-400 uppercase"
        >
          Manager settings
        </WuText>

        <div className="mt-4 flex items-start gap-3 rounded-lg bg-gray-50 p-3">
          <WuToggle
            checked={values.allowEmployeeSummaries}
            onChange={(checked) => onChange({ allowEmployeeSummaries: checked })}
          />
          <div>
            <WuText size="sm" as="p" className="text-sm font-medium text-gray-800">
              Allow managers to create their own team summary
            </WuText>
            <WuText size="sm" as="p" className="mt-1 text-xs text-gray-500">
              When enabled, managers viewing this dashboard will see a &apos;My Team&apos; tab on the
              summary widget and can generate a summary based on their own data view.
            </WuText>
          </div>
        </div>
      </div>

      {showDataCheck && (
        <>
          {dataWidgets.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <WuText size="sm" as="p" className="font-medium text-amber-700">
                ⚠️ No data widgets on this tab
              </WuText>
              <WuText size="sm" as="p" className="mt-1 text-sm text-amber-700">
                Add at least one data widget before creating a summary.
              </WuText>
            </div>
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <WuText size="sm" as="p" className="font-medium text-green-700">
                ✓ {dataWidgets.length} data widgets found on this tab
              </WuText>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function buildSummaryAdminConfigFromFields(
  values: SummaryAdminSettingsFieldValues,
  createdBy: ID,
  overrides?: {
    companyContent?: SummaryContent
    isGenerating?: boolean
    generationError?: 'no_data' | 'api_error'
  },
): SummaryAdminConfig {
  return {
    visibility: values.visibility,
    allowEmployeeSummaries: values.allowEmployeeSummaries,
    createdBy,
    isGenerating: overrides?.isGenerating ?? false,
    generationError: overrides?.generationError,
    companyContent: overrides?.companyContent,
  }
}

export function summaryAdminConfigToFields(
  config: SummaryAdminConfig,
): SummaryAdminSettingsFieldValues {
  return {
    visibility: config.visibility,
    allowEmployeeSummaries: config.allowEmployeeSummaries,
  }
}
