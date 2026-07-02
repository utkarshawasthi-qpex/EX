'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { WidgetCardShell } from '@/components/modules/analytics/widgets/WidgetCardShell'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

export function NotesWidget({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const [draft, setDraft] = useState('')
  const [savedNote, setSavedNote] = useState('')

  function handleSave() {
    console.log('Save note:', draft)
    setSavedNote(draft.trim())
  }

  return (
    <WidgetCardShell title="Notes" onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete}>
      <div className="overflow-y-auto flex-1 min-h-0">
        <div className="flex flex-col gap-3">
        <WuTextarea
          value={draft}
          placeholder="Add a note to this dashboard..."
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
        />
        <div>
          <WuButton variant="primary" size="sm" onClick={handleSave}>
            Save note
          </WuButton>
        </div>
        {savedNote && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <WuText size="sm" as="p" className="text-gray-700">
              {savedNote}
            </WuText>
          </div>
        )}
        </div>
      </div>
    </WidgetCardShell>
  )
}
