'use client'

import dynamic from 'next/dynamic'
import { mockTextReportData } from '@/data/mock/analyticsData'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'

const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

export function TextReportWidget({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const { surveyName, responses } = mockTextReportData

  return (
    <WidgetCardShell title="Text report" subtitle={surveyName} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete}>
      <div className="shrink-0">
        <div className="flex flex-col gap-4">
        {responses.map((response, index) => (
          <blockquote
            key={index}
            className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <WuText size="sm" as="p" className="italic text-gray-700">
              &ldquo;{response.text}&rdquo;
            </WuText>
            <WuText size="sm" as="p" className="mt-2 text-gray-500">
              {response.attribution}
            </WuText>
          </blockquote>
        ))}
        </div>
      </div>
    </WidgetCardShell>
  )
}
