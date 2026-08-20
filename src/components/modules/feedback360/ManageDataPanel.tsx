'use client'

import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { Survey360 } from '@/data/mock/surveys360'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type ManageDataPanelProps = {
  survey: Survey360
}

export function ManageDataPanel({ survey }: ManageDataPanelProps) {
  const { showToast } = useWuShowToast()

  return (
    <div className="mx-auto max-w-3xl p-6">
      <WuHeading size="md">Manage Data</WuHeading>
      <WuText size="sm" as="p" className="mt-2 text-gray-500">
        Export responses, clean incomplete submissions, and manage data retention for{' '}
        <span className="font-medium text-gray-700">{survey.title}</span>.
      </WuText>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[
          { title: 'Export responses', message: 'Export started' },
          { title: 'Download raw data', message: 'Raw data download started' },
          { title: 'Delete incomplete', message: 'Incomplete responses cleared' },
          { title: 'Anonymize closed data', message: 'Anonymization scheduled' },
        ].map((action) => (
          <button
            key={action.title}
            type="button"
            className="rounded-xl border border-gray-200 bg-white px-4 py-5 text-left hover:border-blue-200 hover:bg-blue-50"
            onClick={() => showToast({ variant: 'success', message: action.message })}
          >
            <p className="text-sm font-semibold text-gray-800">{action.title}</p>
            <p className="mt-1 text-xs text-gray-500">Prototype action — no backend</p>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <WuButton
          variant="secondary"
          onClick={() => showToast({ variant: 'info', message: 'Data retention settings opened' })}
        >
          Data retention settings
        </WuButton>
      </div>
    </div>
  )
}
