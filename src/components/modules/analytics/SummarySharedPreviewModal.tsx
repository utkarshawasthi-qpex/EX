'use client'

import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { preventModalDismiss } from '@/lib/modalProps'
import { SummaryHighlightStrip } from '@/components/modules/analytics/SummaryWidgetSections'
import type { DashboardFacts } from '@/lib/buildSummaryPrompt'
import type { SummaryContent, SummaryInsight } from '@/types'

const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalContent })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalFooter })),
  { ssr: false },
)
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type SummarySharedPreviewModalProps = {
  open: boolean
  onClose: () => void
  content: SummaryContent
  dashboardFacts?: DashboardFacts
}

function PreviewInsightCard({
  title,
  emoji,
  items,
  theme,
}: {
  title: string
  emoji: string
  items: SummaryInsight[]
  theme: 'green' | 'red'
}) {
  const styles =
    theme === 'green'
      ? {
          border: '#DCFCE7',
          bg: '#F0FDF4',
          heading: '#166534',
          area: '#15803D',
          desc: '#166534',
        }
      : {
          border: '#FEE2E2',
          bg: '#FEF2F2',
          heading: '#991B1B',
          area: '#B91C1C',
          desc: '#991B1B',
        }

  if (items.length === 0) return null

  return (
    <div
      style={{
        border: `1px solid ${styles.border}`,
        borderRadius: 8,
        padding: '12px 14px',
        background: styles.bg,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>{emoji}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: styles.heading,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </span>
      </div>
      {items.map((item, i) => (
        <div key={`${item.area}-${i}`} style={{ marginBottom: i < items.length - 1 ? 8 : 0 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: styles.area, marginBottom: 2 }}>
            {item.area}
          </p>
          <p style={{ fontSize: 11.5, color: styles.desc, lineHeight: 1.5, opacity: 0.85 }}>
            {item.description}
          </p>
        </div>
      ))}
    </div>
  )
}

export function SummarySharedPreviewModal({
  open,
  onClose,
  content,
  dashboardFacts,
}: SummarySharedPreviewModalProps) {
  const snapshot = content.sharedSnapshot
  if (!snapshot) return null

  const strengths = snapshot.strengths ?? []
  const opportunities = snapshot.opportunities ?? []

  return (
    <WuModal open={open} onOpenChange={(next) => !next && onClose()} variant="action" size="md">
      <WuModalHeader>Preview what others see</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Shared • Last updated {format(new Date(snapshot.sharedAt), 'MMM d, yyyy')}
          </div>

          <SummaryHighlightStrip facts={dashboardFacts} />

          <WuText size="sm" as="p" className="leading-relaxed text-gray-700">
            {snapshot.summary}
          </WuText>

          {(strengths.length > 0 || opportunities.length > 0) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                alignItems: 'stretch',
              }}
            >
              <PreviewInsightCard
                title="Strengths"
                emoji="💪"
                items={strengths}
                theme="green"
              />
              <PreviewInsightCard
                title="Opportunities"
                emoji="⚠️"
                items={opportunities}
                theme="red"
              />
            </div>
          )}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuButton variant="primary" onClick={onClose}>
          Close
        </WuButton>
      </WuModalFooter>
    </WuModal>
  )
}
