'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { Survey360 } from '@/data/mock/surveys360'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
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

type MediaLibraryPanelProps = {
  survey: Survey360
  onChange: (survey: Survey360) => void
}

export function MediaLibraryPanel({ survey, onChange }: MediaLibraryPanelProps) {
  const { showToast } = useWuShowToast()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const files = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return survey.mediaFiles
    return survey.mediaFiles.filter((file) => file.name.toLowerCase().includes(query))
  }, [search, survey.mediaFiles])

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    )
  }

  function addFile() {
    const next = {
      id: `media_${Date.now()}`,
      name: 'qp.png',
    }
    onChange({ ...survey, mediaFiles: [next, ...survey.mediaFiles] })
    showToast({ variant: 'success', message: 'File uploaded' })
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WuHeading size="sm">Media library</WuHeading>
          <button
            type="button"
            className="flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white"
            aria-label="Info"
          >
            i
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-56">
            <WuInput
              variant="outlined"
              placeholder="Type file name to search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <WuText size="sm" as="span" className="text-gray-500">
            {files.length} Files
          </WuText>
        </div>
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <WuCheckbox
          checked={files.length > 0 && selectedIds.length === files.length}
          onChange={(checked) =>
            setSelectedIds(checked ? files.map((file) => file.id) : [])
          }
        />
        Select all
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <button
          type="button"
          onClick={addFile}
          className="flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-3xl text-gray-400 hover:border-blue-300 hover:text-blue-500"
          aria-label="Upload file"
        >
          +
        </button>
        {files.map((file) => (
          <div
            key={file.id}
            className="relative overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <div className="absolute left-2 top-2 z-10">
              <WuCheckbox
                checked={selectedIds.includes(file.id)}
                onChange={(checked) => toggleSelect(file.id, checked)}
              />
            </div>
            <div className="flex aspect-square items-center justify-center bg-blue-50 text-3xl text-blue-400">
              ?
            </div>
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="truncate text-xs text-gray-600">{file.name}</span>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                aria-label="File menu"
                onClick={() => showToast({ variant: 'info', message: 'File options opened' })}
              >
                ⋮
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
