'use client'

import type { ActionPlanDataFocus } from '@/types/empowerIntegration'
import type { SurveyLink } from '@/types/empowerIntegration'

type Props = {
  dataFocus?: ActionPlanDataFocus | null
  /** Legacy seed records only — read-only, not editable. */
  legacySurveyLink?: SurveyLink | null
}

export function ActionPlanDataFocusNote({ dataFocus, legacySurveyLink }: Props) {
  if (dataFocus) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Created from data
        </span>
        <p className="mt-1">
          {dataFocus.dashboardName ? (
            <span className="block text-xs text-gray-500">{dataFocus.dashboardName}</span>
          ) : null}
          <span className="font-medium text-gray-900">{dataFocus.label}</span>
          {dataFocus.favorability != null ? (
            <span className="text-gray-600"> · {dataFocus.favorability}% favorable</span>
          ) : null}
          {dataFocus.surveyName && !dataFocus.dashboardName ? (
            <span className="text-gray-500">
              {' '}
              · {dataFocus.surveyName}
              {dataFocus.cycleLabel ? ` (${dataFocus.cycleLabel})` : ''}
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Snapshot at creation — survey data is not attached to this plan after you create it.
        </p>
      </div>
    )
  }

  if (legacySurveyLink) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Created from data
        </span>
        <p className="mt-1">
          <span className="font-medium text-gray-900">{legacySurveyLink.focus.label}</span>
          {legacySurveyLink.baseline.favorability != null ? (
            <span className="text-gray-600"> · {legacySurveyLink.baseline.favorability}% favorable</span>
          ) : null}
          <span className="text-gray-500">
            {' '}
            · {legacySurveyLink.surveyName} ({legacySurveyLink.cycleLabel})
          </span>
        </p>
      </div>
    )
  }

  return null
}
