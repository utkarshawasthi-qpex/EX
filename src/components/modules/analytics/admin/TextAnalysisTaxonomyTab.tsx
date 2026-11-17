'use client'

import { useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { preventModalDismiss } from '@/lib/modalProps'
import {
  TEXT_ANALYSIS_TAXONOMY_TEMPLATE_CSV,
  type TaxonomyIndustry,
} from '@/data/mock/textAnalysisTaxonomy'
import {
  addIndustry,
  addSubTopic,
  addTopic,
  countTaxonomy,
  mergeTaxonomyRows,
  parseTaxonomyCsv,
  removeIndustry,
  removeSubTopic,
  removeTopic,
} from '@/lib/textAnalysisTaxonomy'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
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
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type AddTarget =
  | { kind: 'industry' }
  | { kind: 'topic'; industryId: string; industryName: string }
  | { kind: 'sub-topic'; industryId: string; topicId: string; topicName: string }

type DeleteTarget =
  | { kind: 'industry'; industryId: string; name: string }
  | { kind: 'topic'; industryId: string; topicId: string; name: string }
  | { kind: 'sub-topic'; industryId: string; topicId: string; subTopicId: string; name: string }

function matchesQuery(name: string, query: string) {
  return name.toLowerCase().includes(query)
}

export function TextAnalysisTaxonomyTab({
  industries,
  onChange,
}: {
  industries: TaxonomyIndustry[]
  onChange: (industries: TaxonomyIndustry[]) => void
}) {
  const { showToast } = useWuShowToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [openIndustryIds, setOpenIndustryIds] = useState<string[]>(() =>
    industries.slice(0, 1).map((industry) => industry.id),
  )
  const [openTopicIds, setOpenTopicIds] = useState<string[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null)
  const [addName, setAddName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const counts = countTaxonomy(industries)
  const normalizedQuery = query.trim().toLowerCase()

  const visibleIndustries = useMemo(() => {
    if (!normalizedQuery) return industries
    return industries
      .map((industry) => {
        const industryMatch = matchesQuery(industry.name, normalizedQuery)
        const topics = industry.topics
          .map((topic) => {
            const topicMatch = matchesQuery(topic.name, normalizedQuery)
            const subTopics = topic.subTopics.filter((item) => matchesQuery(item.name, normalizedQuery))
            if (industryMatch || topicMatch || subTopics.length > 0) {
              return { ...topic, subTopics: industryMatch || topicMatch ? topic.subTopics : subTopics }
            }
            return null
          })
          .filter((topic): topic is NonNullable<typeof topic> => topic !== null)
        if (industryMatch || topics.length > 0) {
          return { ...industry, topics: industryMatch ? industry.topics : topics }
        }
        return null
      })
      .filter((industry): industry is TaxonomyIndustry => industry !== null)
  }, [industries, normalizedQuery])

  function toggleIndustry(id: string) {
    setOpenIndustryIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function toggleTopic(id: string) {
    setOpenTopicIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function downloadTemplate() {
    const blob = new Blob([TEXT_ANALYSIS_TAXONOMY_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'text-analysis-taxonomy-template.csv'
    link.click()
    URL.revokeObjectURL(url)
    showToast({ variant: 'success', message: 'Template downloaded' })
  }

  async function applyUpload() {
    if (!stagedFile) {
      showToast({ variant: 'error', message: 'Choose a CSV file first' })
      return
    }
    const text = await stagedFile.text()
    const rows = parseTaxonomyCsv(text)
    if (rows.length === 0) {
      showToast({ variant: 'error', message: 'No industry rows found in that file' })
      return
    }
    const next = mergeTaxonomyRows(industries, rows)
    onChange(next)
    setUploadOpen(false)
    setStagedFile(null)
    showToast({
      variant: 'success',
      message: `Uploaded ${rows.length} ${rows.length === 1 ? 'row' : 'rows'}`,
    })
  }

  function submitAdd() {
    if (!addTarget || !addName.trim()) return
    if (addTarget.kind === 'industry') {
      const before = industries.length
      const next = addIndustry(industries, addName)
      onChange(next)
      if (next.length === before) {
        showToast({ variant: 'error', message: 'That industry already exists' })
        return
      }
      showToast({ variant: 'success', message: 'Industry added' })
    } else if (addTarget.kind === 'topic') {
      const current = industries.find((industry) => industry.id === addTarget.industryId)
      const before = current?.topics.length ?? 0
      const next = addTopic(industries, addTarget.industryId, addName)
      const after = next.find((industry) => industry.id === addTarget.industryId)?.topics.length ?? 0
      onChange(next)
      if (after === before) {
        showToast({ variant: 'error', message: 'That topic already exists in this industry' })
        return
      }
      setOpenIndustryIds((currentIds) =>
        currentIds.includes(addTarget.industryId) ? currentIds : [...currentIds, addTarget.industryId],
      )
      showToast({ variant: 'success', message: 'Topic added' })
    } else {
      const current = industries
        .find((industry) => industry.id === addTarget.industryId)
        ?.topics.find((topic) => topic.id === addTarget.topicId)
      const before = current?.subTopics.length ?? 0
      const next = addSubTopic(industries, addTarget.industryId, addTarget.topicId, addName)
      const after =
        next
          .find((industry) => industry.id === addTarget.industryId)
          ?.topics.find((topic) => topic.id === addTarget.topicId)?.subTopics.length ?? 0
      onChange(next)
      if (after === before) {
        showToast({ variant: 'error', message: 'That sub-topic already exists' })
        return
      }
      setOpenIndustryIds((currentIds) =>
        currentIds.includes(addTarget.industryId) ? currentIds : [...currentIds, addTarget.industryId],
      )
      setOpenTopicIds((currentIds) =>
        currentIds.includes(addTarget.topicId) ? currentIds : [...currentIds, addTarget.topicId],
      )
      showToast({ variant: 'success', message: 'Sub-topic added' })
    }
    setAddTarget(null)
    setAddName('')
  }

  function confirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.kind === 'industry') {
      onChange(removeIndustry(industries, deleteTarget.industryId))
    } else if (deleteTarget.kind === 'topic') {
      onChange(removeTopic(industries, deleteTarget.industryId, deleteTarget.topicId))
    } else {
      onChange(
        removeSubTopic(
          industries,
          deleteTarget.industryId,
          deleteTarget.topicId,
          deleteTarget.subTopicId,
        ),
      )
    }
    showToast({ variant: 'success', message: `${deleteTarget.name} deleted` })
    setDeleteTarget(null)
  }

  const addTitle =
    addTarget?.kind === 'industry'
      ? 'Add industry'
      : addTarget?.kind === 'topic'
        ? `Add topic to ${addTarget.industryName}`
        : addTarget
          ? `Add sub-topic to ${addTarget.topicName}`
          : 'Add'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <WuText size="sm" as="p" className="text-gray-600">
            Upload or maintain the industry, topic, and sub-topic library used to classify open-ended
            responses.
          </WuText>
          <WuText size="sm" as="p" className="mt-1 text-gray-500">
            {counts.industries} industries · {counts.topics} topics · {counts.subTopics} sub-topics
          </WuText>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WuButton variant="secondary" onClick={downloadTemplate}>
            Download template
          </WuButton>
          <WuButton variant="secondary" onClick={() => setUploadOpen(true)}>
            Upload CSV
          </WuButton>
          <WuButton
            variant="primary"
            onClick={() => {
              setAddName('')
              setAddTarget({ kind: 'industry' })
            }}
          >
            Add industry
          </WuButton>
        </div>
      </div>

      <div className="max-w-sm">
        <WuInput
          variant="outlined"
          value={query}
          placeholder="Search industries, topics, or sub-topics"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {visibleIndustries.length === 0 ? (
        <EmptyState
          title={normalizedQuery ? 'No matching items' : 'No industries yet'}
          description={
            normalizedQuery
              ? 'Try a different search, or upload a CSV to add taxonomy rows.'
              : 'Upload a CSV or add an industry to start the classification library.'
          }
          action={
            <WuButton variant="primary" onClick={() => setUploadOpen(true)}>
              Upload CSV
            </WuButton>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {visibleIndustries.map((industry) => {
            const industryOpen = openIndustryIds.includes(industry.id) || Boolean(normalizedQuery)
            return (
              <div key={industry.id} className="border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => toggleIndustry(industry.id)}
                    aria-expanded={industryOpen}
                  >
                    <span
                      className={cn(
                        'text-base text-gray-500',
                        industryOpen ? 'wm-expand-more' : 'wm-chevron-right',
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 truncate font-medium text-gray-900" title={industry.name}>
                      {industry.name}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {industry.topics.length} {industry.topics.length === 1 ? 'topic' : 'topics'}
                    </span>
                  </button>
                  <WuButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setAddName('')
                      setAddTarget({
                        kind: 'topic',
                        industryId: industry.id,
                        industryName: industry.name,
                      })
                    }}
                  >
                    Add topic
                  </WuButton>
                  <button
                    type="button"
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${industry.name}`}
                    onClick={() =>
                      setDeleteTarget({ kind: 'industry', industryId: industry.id, name: industry.name })
                    }
                  >
                    <span className="wm-delete text-base" aria-hidden />
                  </button>
                </div>

                {industryOpen
                  ? industry.topics.length === 0
                    ? (
                        <WuText size="sm" as="p" className="px-10 pb-3 text-gray-500">
                          No topics in this industry yet.
                        </WuText>
                      )
                    : industry.topics.map((topic) => {
                        const topicOpen = openTopicIds.includes(topic.id) || Boolean(normalizedQuery)
                        return (
                          <div key={topic.id} className="border-t border-gray-50 bg-gray-50/60">
                            <div className="flex items-center gap-2 py-2 pr-3 pl-8 hover:bg-slate-50">
                              <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                onClick={() => toggleTopic(topic.id)}
                                aria-expanded={topicOpen}
                              >
                                <span
                                  className={cn(
                                    'text-base text-gray-500',
                                    topicOpen ? 'wm-expand-more' : 'wm-chevron-right',
                                  )}
                                  aria-hidden
                                />
                                <span className="min-w-0 truncate text-sm text-gray-800" title={topic.name}>
                                  {topic.name}
                                </span>
                                <span className="shrink-0 text-xs text-gray-500">
                                  {topic.subTopics.length}{' '}
                                  {topic.subTopics.length === 1 ? 'sub-topic' : 'sub-topics'}
                                </span>
                              </button>
                              <WuButton
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setAddName('')
                                  setAddTarget({
                                    kind: 'sub-topic',
                                    industryId: industry.id,
                                    topicId: topic.id,
                                    topicName: topic.name,
                                  })
                                }}
                              >
                                Add sub-topic
                              </WuButton>
                              <button
                                type="button"
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                aria-label={`Delete ${topic.name}`}
                                onClick={() =>
                                  setDeleteTarget({
                                    kind: 'topic',
                                    industryId: industry.id,
                                    topicId: topic.id,
                                    name: topic.name,
                                  })
                                }
                              >
                                <span className="wm-delete text-base" aria-hidden />
                              </button>
                            </div>
                            {topicOpen
                              ? topic.subTopics.length === 0
                                ? (
                                    <WuText size="sm" as="p" className="px-14 pb-3 text-gray-500">
                                      No sub-topics yet.
                                    </WuText>
                                  )
                                : topic.subTopics.map((subTopic) => (
                                    <div
                                      key={subTopic.id}
                                      className="flex items-center gap-2 py-1.5 pr-3 pl-14 hover:bg-white"
                                    >
                                      <span className="min-w-0 flex-1 truncate text-sm text-gray-700" title={subTopic.name}>
                                        {subTopic.name}
                                      </span>
                                      <button
                                        type="button"
                                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                        aria-label={`Delete ${subTopic.name}`}
                                        onClick={() =>
                                          setDeleteTarget({
                                            kind: 'sub-topic',
                                            industryId: industry.id,
                                            topicId: topic.id,
                                            subTopicId: subTopic.id,
                                            name: subTopic.name,
                                          })
                                        }
                                      >
                                        <span className="wm-delete text-base" aria-hidden />
                                      </button>
                                    </div>
                                  ))
                              : null}
                          </div>
                        )
                      })
                  : null}
              </div>
            )
          })}
        </div>
      )}

      <WuModal
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open)
          if (!open) setStagedFile(null)
        }}
        size="md"
        {...preventModalDismiss}
      >
        <WuModalHeader>Upload taxonomy</WuModalHeader>
        <WuModalContent>
          <div className="flex flex-col gap-3">
            <WuText size="sm" as="p" className="text-gray-600">
              CSV columns: <span className="font-medium text-gray-800">Industry, Topic, Sub-topic</span>.
              Existing names are merged. Blank topic or sub-topic cells create only the levels you fill in.
            </WuText>
            <button
              type="button"
              className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:bg-gray-100"
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                setStagedFile(event.dataTransfer.files?.[0] ?? null)
              }}
            >
              <span className="wm-upload text-2xl text-gray-400" aria-hidden />
              <span className="mt-2 text-sm text-gray-700">
                {stagedFile ? (
                  <span className="font-medium break-all">{stagedFile.name}</span>
                ) : (
                  <>
                    Drag your file here or <span className="font-medium text-blue-700">browse</span>
                  </>
                )}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                setStagedFile(event.target.files?.[0] ?? null)
                event.target.value = ''
              }}
            />
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton
            variant="secondary"
            onClick={() => {
              setUploadOpen(false)
              setStagedFile(null)
            }}
          >
            Cancel
          </WuButton>
          <WuButton variant="primary" onClick={() => void applyUpload()}>
            Upload
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal
        open={Boolean(addTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setAddTarget(null)
            setAddName('')
          }
        }}
        size="sm"
        {...preventModalDismiss}
      >
        <WuModalHeader>{addTitle}</WuModalHeader>
        <WuModalContent>
          <WuInput
            variant="outlined"
            value={addName}
            placeholder="Name"
            onChange={(event) => setAddName(event.target.value)}
          />
        </WuModalContent>
        <WuModalFooter>
          <WuButton
            variant="secondary"
            onClick={() => {
              setAddTarget(null)
              setAddName('')
            }}
          >
            Cancel
          </WuButton>
          <WuButton variant="primary" disabled={!addName.trim()} onClick={submitAdd}>
            Add
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={deleteTarget ? `Delete ${deleteTarget.name}?` : 'Delete?'}
        description={
          deleteTarget?.kind === 'industry'
            ? 'This industry and all of its topics and sub-topics will be removed.'
            : deleteTarget?.kind === 'topic'
              ? 'This topic and its sub-topics will be removed.'
              : 'This sub-topic will be removed from the library.'
        }
        confirmLabel="Delete"
        variant="critical"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
