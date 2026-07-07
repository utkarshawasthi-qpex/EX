'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import {
  AI_SUMMARY_FILE_SLOTS,
  AI_SUMMARY_MAX_COMBINED_FILE_BYTES,
  AI_SUMMARY_MAX_FILE_BYTES,
  AI_SUMMARY_MAX_TEXT_CHARS,
  AI_SUMMARY_MAX_TOKENS,
  AI_SUMMARY_TEXT_FIELDS,
  AI_SUMMARY_TEXT_WARN_CHARS,
  ORG_CONTEXT_BUDGET_HELPER,
  ORG_CONTEXT_ERROR_E3,
  ORG_CONTEXT_ERROR_E5,
  estimateTokensFromText,
  formatFileSize,
  formatTokenCount,
  orgContextErrorE1,
} from '@/lib/aiSummaryOrgContext/constants'
import {
  getBudgetMeterState,
  getBudgetSegments,
  getBudgetUsagePercent,
  getCombinedFileBytes,
  getTotalTokenUsage,
  wouldExceedTokenBudget,
} from '@/lib/aiSummaryOrgContext/budget'
import {
  assertReadableExtractedText,
  extractDocumentText,
  isAcceptedOrgContextFile,
} from '@/lib/aiSummaryOrgContext/extractDocumentText'
import { getAiSummaryOrgContext, saveAiSummaryOrgContext } from '@/lib/aiSummaryOrgContext/storage'
import { cn } from '@/lib/utils'
import type {
  AiSummaryFileRecord,
  AiSummaryFileSlotKey,
  AiSummaryOrgContext,
} from '@/types'

const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
  { ssr: false },
)

type PendingReplace = {
  slot: AiSummaryFileSlotKey
  file: File
}

type SummaryOrgContextPanelProps = {
  className?: string
}

function formatCharCount(count: number): string {
  return count.toLocaleString()
}

export function SummaryOrgContextPanel({ className }: SummaryOrgContextPanelProps) {
  const { showToast } = useWuShowToast()
  const [context, setContext] = useState<AiSummaryOrgContext>(() => getAiSummaryOrgContext())
  const [uploadingSlot, setUploadingSlot] = useState<AiSummaryFileSlotKey | null>(null)
  const [pendingReplace, setPendingReplace] = useState<PendingReplace | null>(null)
  const fileInputRefs = useRef<Record<AiSummaryFileSlotKey, HTMLInputElement | null>>({
    policy: null,
    guidelines: null,
    initiative: null,
  })

  useEffect(() => {
    setContext(getAiSummaryOrgContext())
  }, [])

  const persistContext = useCallback((next: AiSummaryOrgContext) => {
    setContext(next)
    saveAiSummaryOrgContext(next)
  }, [])

  const segments = getBudgetSegments(context)
  const totalTokens = getTotalTokenUsage(context)
  const usagePercent = getBudgetUsagePercent(context)
  const meterState = getBudgetMeterState(context)

  async function commitFileUpload(slot: AiSummaryFileSlotKey, file: File) {
    if (!isAcceptedOrgContextFile(file)) {
      showToast({
        variant: 'error',
        message: 'Unsupported file type. Accepted formats: PDF, DOCX, TXT, MD.',
      })
      return
    }

    if (file.size > AI_SUMMARY_MAX_FILE_BYTES) {
      showToast({ variant: 'error', message: orgContextErrorE1(file.size) })
      return
    }

    const existingBytes = context.files[slot]?.sizeBytes ?? 0
    const combinedWithoutSlot = getCombinedFileBytes(context) - existingBytes
    if (combinedWithoutSlot + file.size > AI_SUMMARY_MAX_COMBINED_FILE_BYTES) {
      showToast({ variant: 'error', message: ORG_CONTEXT_ERROR_E3 })
      return
    }

    setUploadingSlot(slot)

    try {
      const { extractedText, pageCount } = await extractDocumentText(file)
      assertReadableExtractedText(file, extractedText)

      const tokenEstimate = estimateTokensFromText(extractedText)
      if (
        wouldExceedTokenBudget(context, {
          [slot]: tokenEstimate,
        })
      ) {
        showToast({ variant: 'error', message: ORG_CONTEXT_ERROR_E5 })
        return
      }

      const record: AiSummaryFileRecord = {
        name: file.name,
        sizeBytes: file.size,
        pageCount,
        extractedText,
        tokenEstimate,
        uploadedAt: new Date().toISOString(),
      }

      persistContext({
        ...context,
        files: {
          ...context.files,
          [slot]: record,
        },
        updatedAt: new Date().toISOString(),
      })
      showToast({ variant: 'success', message: `${file.name} added to context` })
    } catch (error) {
      showToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Unable to read this file.',
      })
    } finally {
      setUploadingSlot(null)
    }
  }

  function handleFileSelection(slot: AiSummaryFileSlotKey, fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return

    if (context.files[slot]) {
      setPendingReplace({ slot, file })
      return
    }

    void commitFileUpload(slot, file)
  }

  function handleRemoveFile(slot: AiSummaryFileSlotKey) {
    persistContext({
      ...context,
      files: {
        ...context.files,
        [slot]: null,
      },
      updatedAt: new Date().toISOString(),
    })
  }

  function handleTextFieldChange(field: keyof AiSummaryOrgContext['textFields'], value: string) {
    const trimmedValue = value.slice(0, AI_SUMMARY_MAX_TEXT_CHARS)
    const nextTokens = estimateTokensFromText(trimmedValue)

    if (
      wouldExceedTokenBudget(context, {
        [field]: nextTokens,
      })
    ) {
      showToast({ variant: 'error', message: ORG_CONTEXT_ERROR_E5 })
      return
    }

    persistContext({
      ...context,
      textFields: {
        ...context.textFields,
        [field]: trimmedValue,
      },
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className={cn('space-y-5', className)}>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <WuText size="sm" as="p" className="text-sm font-medium text-gray-800">
            Context used: {formatTokenCount(totalTokens)} / {formatTokenCount(AI_SUMMARY_MAX_TOKENS)}{' '}
            tokens
          </WuText>
          <WuText
            size="sm"
            as="span"
            className={cn(
              'text-xs font-medium',
              meterState === 'critical' && 'text-red-600',
              meterState === 'warning' && 'text-amber-600',
              meterState === 'default' && 'text-gray-500',
            )}
          >
            {usagePercent.toFixed(1)}%
          </WuText>
        </div>

        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          {segments.map((segment) => {
            if (segment.tokens <= 0) return null
            const slotMeta =
              AI_SUMMARY_FILE_SLOTS.find((item) => item.key === segment.key) ??
              AI_SUMMARY_TEXT_FIELDS.find((item) => item.key === segment.key)
            const widthPercent = (segment.tokens / AI_SUMMARY_MAX_TOKENS) * 100
            return (
              <div
                key={segment.key}
                className={cn('h-full transition-all', slotMeta?.meterColor ?? 'bg-gray-400')}
                style={{ width: `${widthPercent}%` }}
                title={`${segment.label}: ${formatTokenCount(segment.tokens)} tokens`}
              />
            )
          })}
        </div>

        {meterState === 'warning' && (
          <WuText size="sm" as="p" className="mt-2 text-xs text-amber-600">
            {ORG_CONTEXT_BUDGET_HELPER}
          </WuText>
        )}
        {meterState === 'critical' && (
          <WuText size="sm" as="p" className="mt-2 text-xs text-red-600">
            Context limit nearly reached — remove or shorten inputs before adding more.
          </WuText>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {AI_SUMMARY_FILE_SLOTS.map((slot) => {
          const file = context.files[slot.key]
          const isUploading = uploadingSlot === slot.key

          return (
            <div
              key={slot.key}
              className="flex min-h-[180px] flex-col rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="mb-2">
                <WuText size="sm" as="p" className="text-sm font-medium text-gray-800">
                  {slot.label}
                </WuText>
                <WuText size="sm" as="p" className="mt-0.5 text-xs text-gray-500">
                  {slot.helper}
                </WuText>
              </div>

              {file ? (
                <div className="flex flex-1 flex-col justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatFileSize(file.sizeBytes)}
                      {file.pageCount !== null ? ` · ${file.pageCount} pages` : ''} ·{' '}
                      {formatTokenCount(file.tokenEstimate)} tokens
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-600 hover:underline"
                      onClick={() => fileInputRefs.current[slot.key]?.click()}
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => handleRemoveFile(slot.key)}
                      aria-label={`Remove ${slot.label} document`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 px-3 py-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50',
                    isUploading && 'pointer-events-none opacity-60',
                  )}
                  onClick={() => fileInputRefs.current[slot.key]?.click()}
                >
                  <span className="text-2xl text-blue-400" aria-hidden>
                    ↑
                  </span>
                  <span className="mt-2 text-xs font-medium text-gray-700">
                    {isUploading ? 'Extracting text…' : 'Drop file or browse'}
                  </span>
                  <span className="mt-1 text-[11px] text-gray-400">PDF, DOCX, TXT, MD · max 10 MB</span>
                </button>
              )}

              <input
                ref={(element) => {
                  fileInputRefs.current[slot.key] = element
                }}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.md"
                onChange={(event) => {
                  handleFileSelection(slot.key, event.target.files)
                  event.target.value = ''
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="space-y-4">
        {AI_SUMMARY_TEXT_FIELDS.map((field) => {
          const value = context.textFields[field.key]
          const charCount = value.length
          const counterClass =
            charCount >= AI_SUMMARY_MAX_TEXT_CHARS
              ? 'text-red-600'
              : charCount >= AI_SUMMARY_TEXT_WARN_CHARS
                ? 'text-red-500'
                : 'text-gray-400'

          return (
            <div key={field.key} className="rounded-lg border border-gray-200 bg-white p-4">
              <WuText size="sm" as="p" className="mb-2 text-sm font-medium text-gray-800">
                {field.label}
              </WuText>
              <WuTextarea
                rows={3}
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => handleTextFieldChange(field.key, event.target.value)}
                className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className={cn('mt-1 text-right text-xs', counterClass)}>
                {formatCharCount(charCount)} / {formatCharCount(AI_SUMMARY_MAX_TEXT_CHARS)}
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmModal
        open={Boolean(pendingReplace)}
        onOpenChange={(open) => {
          if (!open) setPendingReplace(null)
        }}
        title="Replace document?"
        description={
          pendingReplace
            ? `Uploading "${pendingReplace.file.name}" will replace the current ${AI_SUMMARY_FILE_SLOTS.find((slot) => slot.key === pendingReplace.slot)?.label ?? 'document'}.`
            : ''
        }
        confirmLabel="Replace"
        onConfirm={() => {
          if (!pendingReplace) return
          const { slot, file } = pendingReplace
          setPendingReplace(null)
          void commitFileUpload(slot, file)
        }}
      />
    </div>
  )
}
