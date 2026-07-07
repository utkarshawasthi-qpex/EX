'use client'

import { mockSingleQuestionData } from '@/data/mock/analyticsData'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'
import { cn } from '@/lib/utils'

function truncate(text: string, max = 60) {
  return text.length > max ? `${text.slice(0, max)}...` : text
}

export function SingleQuestionWidget({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const { surveyName, questionText, answers } = mockSingleQuestionData

  return (
    <WidgetCardShell
      title={truncate(questionText)}
      flushContent
      onEdit={onEdit}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      subtitle={
        <>
          <span className="block text-gray-500">{surveyName}</span>
          <span className="mt-1 block text-gray-600">{questionText}</span>
        </>
      }
    >
      <div className="overflow-auto shrink-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="pb-2 font-medium">Answer</th>
              <th className="pb-2 font-medium">Count ↕</th>
              <th className="pb-2 font-medium">Percentage ↕</th>
            </tr>
          </thead>
          <tbody>
            {answers.map((answer) => (
              <tr
                key={answer.label}
                className={cn(
                  'border-b border-gray-100',
                  answer.isTotal && 'bg-[#041f49] text-white',
                )}
              >
                <td className="py-2 pr-4">{answer.label}</td>
                <td className="py-2 pr-4">{answer.count}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-10 shrink-0">{answer.percentage}%</span>
                    <div
                      className={cn(
                        'h-2 flex-1 overflow-hidden rounded-sm',
                        answer.isTotal ? 'bg-white/20' : 'bg-gray-200',
                      )}
                    >
                      <div
                        className={cn('h-full', answer.isTotal ? 'bg-white' : 'bg-blue-600')}
                        style={{ width: `${answer.percentage}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetCardShell>
  )
}
