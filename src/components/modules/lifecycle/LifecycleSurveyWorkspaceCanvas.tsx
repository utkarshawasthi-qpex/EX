'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { LifecycleSurvey, Marker, Question } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)

const MATRIX_HEADERS = ['Not at All', 'Rarely', 'Sometimes', 'Often', 'All the Time']

type LifecycleSurveyWorkspaceCanvasProps = {
  survey: LifecycleSurvey
  onChange: (survey: LifecycleSurvey) => void
}

function questionsForMarker(survey: LifecycleSurvey, marker: Marker): Question[] {
  return marker.questionIds
    .map((id) => survey.questions.find((q) => q.id === id))
    .filter((q): q is Question => Boolean(q))
}

function EditableQuestionText({
  question,
  onSave,
}: {
  question: Question
  onSave: (text: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(question.text)

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== question.text) onSave(trimmed)
    else setDraft(question.text)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setDraft(question.text)
            setEditing(false)
          }
        }}
        className="w-full rounded border border-blue-400 px-2 py-1 text-sm font-medium text-gray-900 outline-none"
      />
    )
  }

  return (
    <button
      type="button"
      className="text-left text-sm font-medium text-gray-900 hover:text-blue-700"
      onClick={() => setEditing(true)}
    >
      {question.required ? <span className="text-red-500">* </span> : null}
      {question.text}
    </button>
  )
}

function MatrixQuestionBody({ question }: { question: Question }) {
  const rows =
    question.matrixRows && question.matrixRows.length > 0
      ? question.matrixRows
      : [question.text]

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs text-gray-500">
            <th className="pb-2 pr-4 text-left font-normal">Left Anchor</th>
            {MATRIX_HEADERS.map((label) => (
              <th key={label} className="px-2 pb-2 text-center font-normal">
                {label}
              </th>
            ))}
            <th className="pb-2 pl-4 text-right font-normal">Right Anchor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row} className="border-b border-gray-100">
              <td className="py-3 pr-4 text-gray-800">{row}</td>
              {MATRIX_HEADERS.map((label) => (
                <td key={label} className="px-2 py-3 text-center">
                  <input type="radio" disabled className="text-blue-600" name={row} aria-label={label} />
                </td>
              ))}
              <td className="py-3 pl-4" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function QuestionBody({ question }: { question: Question }) {
  if (question.type === 'rating_scale') {
    return <MatrixQuestionBody question={question} />
  }
  if (question.type === 'open_text') {
    return (
      <textarea
        disabled
        placeholder="Open text response"
        className="mt-2 w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
        rows={3}
      />
    )
  }
  if (question.type === 'multiple_choice' && question.options) {
    return (
      <ul className="mt-2 space-y-1">
        {question.options.map((option) => (
          <li key={option} className="flex items-center gap-2 text-sm text-gray-700">
            <input type="radio" disabled />
            {option}
          </li>
        ))}
      </ul>
    )
  }
  if (question.type === 'enps') {
    return (
      <div className="mt-2 flex flex-wrap gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <span
            key={i}
            className="flex size-8 items-center justify-center rounded border border-gray-200 text-xs text-gray-500"
          >
            {i}
          </span>
        ))}
      </div>
    )
  }
  return null
}

export function LifecycleSurveyWorkspaceCanvas({
  survey,
  onChange,
}: LifecycleSurveyWorkspaceCanvasProps) {
  const { showToast } = useWuShowToast()
  const [addMenuOpen, setAddMenuOpen] = useState<string | null>(null)
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set())

  const markers =
    survey.markers.length > 0
      ? [...survey.markers].sort((a, b) => a.order - b.order)
      : [{ id: 'mark_default', name: 'Block 1', order: 1, questionIds: [] as string[] }]

  function updateQuestion(questionId: string, patch: Partial<Question>) {
    onChange({
      ...survey,
      questions: survey.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
    })
  }

  function toggleBlock(markerId: string) {
    setCollapsedBlocks((current) => {
      const next = new Set(current)
      if (next.has(markerId)) next.delete(markerId)
      else next.add(markerId)
      return next
    })
  }

  let questionIndex = 0

  return (
    <div className="min-h-full bg-gray-100 px-4 pb-20 pt-6">
      <div className="mx-auto max-w-[900px] space-y-4">
        <div className="relative rounded-lg bg-white p-8 shadow-sm">
          <button
            type="button"
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            aria-label="Cover options"
            onClick={() => showToast({ variant: 'info', message: 'Cover options' })}
          >
            ⋮
          </button>
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex size-[120px] items-center justify-center rounded-lg bg-[#1e3a5f] text-4xl font-bold text-white">
              P
            </div>
            <p className="text-lg font-semibold text-[#1B87E6]">QuestionPro</p>
          </div>
        </div>

        {markers.map((marker) => {
          const blockQuestions = questionsForMarker(survey, marker)
          const collapsed = collapsedBlocks.has(marker.id)
          return (
            <div key={marker.id} className="rounded-lg bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => toggleBlock(marker.id)}
                  aria-expanded={!collapsed}
                >
                  <span
                    className={collapsed ? 'wm-chevron-right' : 'wm-expand-more'}
                    aria-hidden
                  />
                </button>
                <span className="flex-1 text-sm font-semibold text-gray-800">{marker.name}</span>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Block options"
                  onClick={() => showToast({ variant: 'info', message: 'Block options' })}
                >
                  ⋮
                </button>
              </div>
              {!collapsed ? (
                <div className="px-4 pb-4 pt-3">
                  <div className="relative mb-4 flex justify-center">
                    <WuButton
                      variant="primary"
                      onClick={() =>
                        setAddMenuOpen((current) => (current === marker.id ? null : marker.id))
                      }
                    >
                      Add Question ▾
                    </WuButton>
                    {addMenuOpen === marker.id ? (
                      <div className="absolute top-full z-10 mt-1 min-w-[180px] rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                        <button
                          type="button"
                          className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          onClick={() => {
                            showToast({ variant: 'success', message: 'Add question' })
                            setAddMenuOpen(null)
                          }}
                        >
                          Add Question
                        </button>
                        <button
                          type="button"
                          className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          onClick={() => {
                            showToast({ variant: 'info', message: 'Build with AI' })
                            setAddMenuOpen(null)
                          }}
                        >
                          Build with AI
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {blockQuestions.map((question) => {
                    questionIndex += 1
                    const qNum = questionIndex
                    return (
                      <div key={question.id} className="mb-4 rounded-lg border border-gray-100 p-4">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 gap-3">
                            <span className="shrink-0 text-xs font-medium text-gray-400">
                              Q{qNum}
                            </span>
                            <EditableQuestionText
                              question={question}
                              onSave={(text) => updateQuestion(question.id, { text })}
                            />
                          </div>
                          <div className="flex shrink-0 items-center gap-2 text-xs text-blue-600">
                            {['Validation', 'Logic', 'Settings'].map((label) => (
                              <button
                                key={label}
                                type="button"
                                className="hover:underline"
                                onClick={() =>
                                  showToast({ variant: 'info', message: `${label} (placeholder)` })
                                }
                              >
                                {label}
                              </button>
                            ))}
                            <button type="button" className="text-gray-400" aria-label="More">
                              ⋮
                            </button>
                          </div>
                        </div>
                        <QuestionBody question={question} />
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
