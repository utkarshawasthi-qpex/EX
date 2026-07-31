'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { SurveyLink } from '@/types/empower'

type SurveyLinkPanelProps = {
  surveyLinks: SurveyLink[]
  onUnlink?: (linkIndex: number) => void
}

function scopeLabel(link: SurveyLink): string {
  if (link.scope.kind === 'org') return 'Organization'
  if (link.scope.kind === 'team') return 'My Team'
  return link.scope.filters?.map((filter) => `${filter.field}: ${filter.value}`).join(', ') || 'Filter'
}

export function SurveyLinkPanel({ surveyLinks, onUnlink }: SurveyLinkPanelProps) {
  if (surveyLinks.length === 0) return null

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-gray-900">Linked Survey Data</h2>
      {surveyLinks.map((link, index) => {
        const delta = link.latest
          ? link.latest.favorability - link.baseline.favorability
          : null

        return (
          <div
            key={`${link.surveyId}_${link.focus.id}_${index}`}
            className="rounded-lg border border-gray-100 bg-gray-50 p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{link.surveyName}</span>
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-500">
                    {scopeLabel(link)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{link.focus.label}</p>
              </div>

              {onUnlink && (
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => onUnlink(index)}
                >
                  Unlink
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span>Baseline {link.baseline.favorability}%</span>
              <span className="text-gray-300">→</span>
              <span>
                {link.latest ? `Latest ${link.latest.favorability}%` : 'Awaiting next cycle'}
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  delta === null
                    ? 'bg-gray-100 text-gray-500'
                    : delta >= 0
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-600',
                )}
              >
                {delta === null ? '—' : `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}%`}
              </span>
            </div>

            <Link
              href="/lifecycle/analytics/list"
              className="mt-3 inline-block text-xs font-medium text-blue-600 hover:underline"
            >
              View in dashboard →
            </Link>
          </div>
        )
      })}
    </section>
  )
}
