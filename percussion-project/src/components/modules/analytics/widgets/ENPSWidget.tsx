'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { mockENPSData } from '@/data/mock/analyticsData'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'

const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

function scoreToAngle(score: number) {
  return 180 - ((score + 100) / 200) * 180
}

function ENPSGauge({ score }: { score: number }) {
  const cx = 120
  const cy = 110
  const r = 80
  const needleAngle = scoreToAngle(score)
  const needleRad = (needleAngle * Math.PI) / 180
  const needleX = cx + r * 0.75 * Math.cos(needleRad)
  const needleY = cy - r * 0.75 * Math.sin(needleRad)

  return (
    <svg viewBox="0 0 240 140" className="mx-auto w-full max-w-xs">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#ef4444"
        strokeWidth={16}
        strokeDasharray={`${(66 / 200) * Math.PI * r} ${Math.PI * r}`}
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#eab308"
        strokeWidth={16}
        strokeDasharray={`${(66 / 200) * Math.PI * r} ${Math.PI * r}`}
        strokeDashoffset={-((66 / 200) * Math.PI * r)}
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#22c55e"
        strokeWidth={16}
        strokeDasharray={`${(67 / 200) * Math.PI * r} ${Math.PI * r}`}
        strokeDashoffset={-(((66 + 66) / 200) * Math.PI * r)}
      />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#1e293b" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={5} fill="#1e293b" />
      <text x={cx - r - 4} y={cy + 14} fontSize={10} fill="#64748b">
        -100
      </text>
      <text x={cx - 6} y={cy - r - 6} fontSize={10} fill="#64748b">
        0
      </text>
      <text x={cx + r - 20} y={cy + 14} fontSize={10} fill="#64748b">
        +100
      </text>
    </svg>
  )
}

export function ENPSWidget({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const data = mockENPSData
  const [segmentOpen, setSegmentOpen] = useState(false)

  return (
    <WidgetCardShell title="eNPS" showInfo onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <WuText size="sm" as="p" className="mb-3 flex-shrink-0 italic text-gray-500">
        {data.question}
      </WuText>

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex-1 text-center">
          <ENPSGauge score={data.score} />
          <WuHeading size="lg" className="text-gray-900">
            {data.score}
          </WuHeading>
          <WuText size="sm" as="p" className="text-gray-500">
            eNPS
          </WuText>
        </div>
        <div className="flex shrink-0 flex-col gap-2 pt-4">
          <div>
            <WuText size="sm" as="p" className="text-gray-500">
              Respondents
            </WuText>
            <WuHeading size="md" className="text-gray-900">
              {data.respondents}
            </WuHeading>
          </div>
          <div>
            <WuText size="sm" as="p" className="text-gray-500">
              Company Overall
            </WuText>
            <div className="flex items-center gap-2">
              <WuHeading size="md" className="text-gray-900">
                {data.companyOverall}
              </WuHeading>
              <WuText size="sm" as="span" className="text-red-600">
                ▼ {Math.abs(data.companyDelta)}
              </WuText>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-around gap-4 border-t border-gray-100 pt-4">
        <WuText size="sm" as="div" className="flex items-center gap-1 text-gray-700">
          <span>😞</span>
          <span>Detractors {data.detractors}%</span>
        </WuText>
        <WuText size="sm" as="div" className="flex items-center gap-1 text-gray-700">
          <span>😐</span>
          <span>Passives {data.passives}%</span>
        </WuText>
        <WuText size="sm" as="div" className="flex items-center gap-1 text-gray-700">
          <span>😊</span>
          <span>Promoters {data.promoters}%</span>
        </WuText>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <button
          type="button"
          className="flex w-full items-center justify-between"
          onClick={() => setSegmentOpen((open) => !open)}
        >
          <WuText size="sm" as="span" className="font-medium text-gray-700">
            Segment eNPS
          </WuText>
          <span>{segmentOpen ? '▾' : '▸'}</span>
        </button>
        {segmentOpen && (
          <WuText size="sm" as="p" className="mt-2 text-gray-500">
            No segment data available
          </WuText>
        )}
      </div>
      </div>
    </WidgetCardShell>
  )
}
