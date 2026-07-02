'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { mockOrgContext } from '@/data/mock/analyticsData'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'
import {
  countContextByCategory,
  getCategoryMeta,
  ORG_CONTEXT_CATEGORIES,
} from '@/lib/orgContextCategories'
import { getOrgContext, incrementOrgContextVersion, saveOrgContext } from '@/lib/orgContext'
import { isAdminContext } from '@/lib/userContext'
import type { OrgContextCategory, OrgContextFile, OrgContextNote } from '@/types'

const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
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

const MOCK_UPLOAD_NAMES = [
  { name: 'Employee Handbook 2025.pdf', sizeLabel: '890 KB', extension: 'PDF' },
  { name: 'Manager Playbook.docx', sizeLabel: '412 KB', extension: 'DOCX' },
  { name: 'Culture Principles.txt', sizeLabel: '18 KB', extension: 'TXT' },
]

function CategoryPills({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: OrgContextCategory
  onSelect: (category: OrgContextCategory) => void
}) {
  return (
    <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      {ORG_CONTEXT_CATEGORIES.map((category) => {
        const isSelected = selected === category.id
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.label}
          </button>
        )
      })}
    </div>
  )
}

function CategoryBadge({ category }: { category: OrgContextCategory }) {
  const meta = getCategoryMeta(category)
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}>
      {meta.label}
    </span>
  )
}

export default function OrganizationContextPage() {
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<OrgContextFile[]>(mockOrgContext.files)
  const [notes, setNotes] = useState<OrgContextNote[]>(mockOrgContext.notes)
  const [uploadCategory, setUploadCategory] = useState<OrgContextCategory>('policy')
  const [noteCategory, setNoteCategory] = useState<OrgContextCategory>('policy')
  const [noteDraft, setNoteDraft] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const categoryCounts = useMemo(
    () => countContextByCategory({ files, notes }),
    [files, notes],
  )

  const overviewCategories = useMemo(
    () => ORG_CONTEXT_CATEGORIES.filter((category) => categoryCounts[category.id] > 0),
    [categoryCounts],
  )

  const persistContext = useCallback(
    (nextFiles: OrgContextFile[], nextNotes: OrgContextNote[], toastMessage?: string) => {
      saveOrgContext({ files: nextFiles, notes: nextNotes })
      incrementOrgContextVersion()
      if (toastMessage) {
        showToast({ variant: 'success', message: toastMessage })
      }
    },
    [showToast],
  )

  useEffect(() => {
    if (!isAdminContext()) {
      router.replace('/lifecycle/analytics')
    }
  }, [router])

  useEffect(() => {
    const stored = getOrgContext()
    setFiles(stored.files)
    setNotes(stored.notes)
  }, [])

  if (!isAdminContext()) {
    return null
  }

  function handleMockUpload(category: OrgContextCategory) {
    const template = MOCK_UPLOAD_NAMES[files.length % MOCK_UPLOAD_NAMES.length]
    const newFile: OrgContextFile = {
      id: `file_${Date.now()}`,
      name: template.name,
      sizeLabel: template.sizeLabel,
      extension: template.extension,
      category,
      uploadedAt: new Date().toISOString(),
    }
    const nextFiles = [...files, newFile]
    setFiles(nextFiles)
    persistContext(nextFiles, notes, `${template.name} added to context`)
  }

  function handleDeleteFile(fileId: string) {
    const nextFiles = files.filter((file) => file.id !== fileId)
    setFiles(nextFiles)
    persistContext(nextFiles, notes)
  }

  function handleAddNote() {
    const trimmed = noteDraft.trim()
    if (!trimmed) return

    const newNote: OrgContextNote = {
      id: `note_${Date.now()}`,
      text: trimmed,
      category: noteCategory,
      addedAt: new Date().toISOString(),
    }
    const nextNotes = [...notes, newNote]
    setNotes(nextNotes)
    setNoteDraft('')
    persistContext(files, nextNotes, 'Note added to context')
  }

  function handleDeleteNote(noteId: string) {
    const nextNotes = notes.filter((note) => note.id !== noteId)
    setNotes(nextNotes)
    persistContext(files, nextNotes)
  }

  function handleNoteKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      handleAddNote()
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Org Context"
        description="Provide background information — documents and notes — your AI will use when generating the dashboard summary."
      />

      <PageContent className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <WuHeading size="md" className="text-gray-800">
                  Upload Documents
                </WuHeading>
                <WuText size="sm" as="p" className="mt-0.5 text-gray-500">
                  PDF, DOCX, DOC, TXT — up to 20 MB per file
                </WuText>
              </div>
              <CategoryPills
                label="Tag uploads as"
                selected={uploadCategory}
                onSelect={setUploadCategory}
              />
            </div>

            <div
              className={`mb-4 cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setIsDragOver(false)
                handleMockUpload(uploadCategory)
              }}
            >
              <span className="wm-upload text-3xl text-blue-500" aria-hidden />
              <p className="mt-3 text-sm font-medium text-gray-800">Drag &amp; drop files here</p>
              <button
                type="button"
                className="mt-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                onClick={(event) => {
                  event.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                browse to upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={() => handleMockUpload(uploadCategory)}
              />
            </div>

            {files.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-gray-400 uppercase">
                  Uploaded ({files.length})
                </p>
                <ul>
                  {files.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center gap-3 border-b border-gray-100 py-2.5 last:border-b-0"
                    >
                      <span className="wm-description shrink-0 text-gray-400" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {file.sizeLabel} · {file.extension}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <CategoryBadge category={file.category} />
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => handleDeleteFile(file.id)}
                          aria-label={`Remove ${file.name}`}
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <WuHeading size="md" className="text-gray-800">
                  Text &amp; Notes
                </WuHeading>
                <WuText size="sm" as="p" className="mt-0.5 text-gray-500">
                  Paste policies, to-dos, not-to-dos, and initiatives directly
                </WuText>
              </div>
              <CategoryPills
                label="Categorise as"
                selected={noteCategory}
                onSelect={setNoteCategory}
              />
            </div>

            <WuTextarea
              className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={6}
              value={noteDraft}
              placeholder="e.g. All new hires must complete the data privacy module within their first 5 days."
              onChange={(event) => setNoteDraft(event.target.value)}
              onKeyDown={handleNoteKeyDown}
            />

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-400">⌘ Enter to add quickly</p>
              <button
                type="button"
                className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleAddNote}
                disabled={!noteDraft.trim()}
              >
                + Add to context
              </button>
            </div>

            {notes.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium tracking-wide text-gray-400 uppercase">
                  Added ({notes.length})
                </p>
                <ul>
                  {notes.map((note) => (
                    <li
                      key={note.id}
                      className="flex items-start gap-3 border-b border-gray-100 py-2.5 last:border-b-0"
                    >
                      <p className="min-w-0 flex-1 text-sm text-gray-700">{note.text}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <CategoryBadge category={note.category} />
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => handleDeleteNote(note.id)}
                          aria-label="Remove note"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <WuHeading size="md" className="mb-1 text-gray-800">
              How AI uses this
            </WuHeading>
            <WuText size="sm" as="p" className="mb-4 text-gray-500">
              The Dashboard Summary is generated from two inputs: your organisation context and
              the dashboard data on the page.
            </WuText>

            <div className="space-y-2">
              <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-100">
                  <span className="text-xs text-blue-600" aria-hidden>
                    ≡
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Dashboard Data</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Survey responses · scores · trends
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <span className="text-lg text-gray-300" aria-hidden>
                  ↓
                </span>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-purple-100 bg-purple-50 p-3">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-purple-100">
                  <span className="text-xs text-purple-600" aria-hidden>
                    ✦
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Organisation Context</p>
                  <p className="mt-0.5 text-xs text-gray-500">Policies · goals · constraints</p>
                </div>
              </div>

              <div className="flex justify-center">
                <span className="text-lg text-gray-300" aria-hidden>
                  ↓
                </span>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-green-100 bg-green-50 p-3">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-green-100">
                  <span className="text-xs text-green-600" aria-hidden>
                    ✓
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Dashboard Summary</p>
                  <p className="mt-0.5 text-xs text-gray-500">Context-aware AI insights</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <WuHeading size="md" className="mb-1 text-gray-800">
              Context Overview
            </WuHeading>
            <WuText size="sm" as="p" className="mb-4 text-gray-500">
              {files.length} document{files.length === 1 ? '' : 's'} · {notes.length} note
              {notes.length === 1 ? '' : 's'}
            </WuText>

            <div className="mb-4 space-y-2">
              {overviewCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between border-b border-gray-50 py-1.5 last:border-b-0"
                >
                  <span className={`text-sm font-medium ${category.textClass}`}>
                    {category.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {categoryCounts[category.id]}{' '}
                    {categoryCounts[category.id] === 1 ? 'item' : 'items'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500" aria-hidden />
              <span className="text-xs text-gray-500">Active — applied to next summary</span>
            </div>
          </div>
        </div>
      </PageContent>
    </PageShell>
  )
}
