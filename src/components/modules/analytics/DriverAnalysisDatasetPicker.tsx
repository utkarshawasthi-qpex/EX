'use client'

import dynamic from 'next/dynamic'
import { DATASETS, SPECIAL_DATASET_IDS, type DatasetId } from '@/data/mock/driverAnalysisDatasets'
import { useCurrentDataset } from '@/lib/datasetContext'

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTooltip })),
  { ssr: false },
)

type DatasetOption = {
  value: DatasetId
  label: string
}

const DATASET_OPTIONS: DatasetOption[] = DATASETS.map((dataset) => ({
  value: dataset.id,
  label: dataset.label,
}))

export function DriverAnalysisDatasetPicker() {
  const { currentDatasetId, setCurrentDatasetId, currentDataset } = useCurrentDataset()
  const selected =
    DATASET_OPTIONS.find((option) => option.value === currentDatasetId) ?? DATASET_OPTIONS[0]!
  const isSpecial = SPECIAL_DATASET_IDS.includes(currentDatasetId)

  return (
    <div className="flex min-w-0 items-center gap-2">
      <WuText size="sm" as="span" className="shrink-0 text-gray-500">
        Comparison dataset:
      </WuText>
      <div className="min-w-[220px] max-w-[280px]">
        <WuSelect
          data={DATASET_OPTIONS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={selected}
          onSelect={(value) => {
            const option = value as DatasetOption
            if (option?.value) setCurrentDatasetId(option.value)
          }}
          variant="outlined"
        />
      </div>
      <WuTooltip content={currentDataset.description} position="bottom" showArrow>
        <button
          type="button"
          className="flex size-6 shrink-0 items-center justify-center text-gray-400 hover:text-gray-600"
          aria-label={currentDataset.description}
        >
          <i className="wc-info-circle text-base leading-none" aria-hidden />
        </button>
      </WuTooltip>
      {isSpecial && (
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
          Stress test
        </span>
      )}
    </div>
  )
}
