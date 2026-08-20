'use client'

import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import type { Survey360, Survey360Question, Survey360Section } from '@/data/mock/surveys360'
import { DEFAULT_SCALE_LABELS } from '@/data/mock/surveys360'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)

type WorkspacePanelProps = {
  survey: Survey360
  onChange: (survey: Survey360) => void
}

export function WorkspacePanel({ survey, onChange }: WorkspacePanelProps) {
  const { showToast } = useWuShowToast()
  const section = survey.sections[0]

  function updateSection(next: Survey360Section) {
    onChange({
      ...survey,
      sections: survey.sections.map((item) => (item.id === next.id ? next : item)),
    })
  }

  function addSection() {
    const newSection: Survey360Section = {
      id: `sec_${Date.now()}`,
      title: `Section ${survey.sections.length + 1}`,
      questions: [],
    }
    onChange({ ...survey, sections: [...survey.sections, newSection] })
    showToast({ variant: 'success', message: 'Section added' })
  }

  function addQuestion(target: Survey360Section) {
    const question: Survey360Question = {
      id: `q_${Date.now()}`,
      text: 'New question',
      required: true,
      scaleLabels: DEFAULT_SCALE_LABELS,
    }
    updateSection({ ...target, questions: [...target.questions, question] })
    showToast({ variant: 'success', message: 'Question added' })
  }

  function removeQuestion(target: Survey360Section, questionId: string) {
    updateSection({
      ...target,
      questions: target.questions.filter((question) => question.id !== questionId),
    })
  }

  function updateQuestionText(
    target: Survey360Section,
    questionId: string,
    text: string,
  ) {
    updateSection({
      ...target,
      questions: target.questions.map((question) =>
        question.id === questionId ? { ...question, text } : question,
      ),
    })
  }

  if (!section) {
    return (
      <div className="p-6">
        <WuText size="sm" as="p" className="text-gray-500">
          No sections yet.
        </WuText>
        <WuButton variant="primary" className="mt-3" onClick={addSection}>
          + Add Section
        </WuButton>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-end gap-2">
        <WuButton variant="secondary" onClick={() => showToast({ variant: 'info', message: 'Preview opened' })}>
          <span className="wm-visibility mr-1 text-sm" aria-hidden />
          Preview
        </WuButton>
        <WuButton variant="primary" onClick={addSection}>
          + Add Section
        </WuButton>
      </div>

      {survey.sections.map((sec) => (
        <div
          key={sec.id}
          className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <span className="text-gray-300" aria-hidden>
              ⠿
            </span>
            <WuInput
              variant="outlined"
              value={sec.title}
              onChange={(event) =>
                updateSection({ ...sec, title: event.target.value })
              }
              className="font-semibold"
            />
            <button
              type="button"
              className="ml-auto px-1 text-gray-400 hover:text-gray-600"
              aria-label="Section menu"
            >
              ⋮
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {sec.questions.map((question, index) => (
              <div key={question.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-2 w-6 shrink-0 text-sm font-medium text-gray-500">
                    {index + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <WuInput
                        variant="outlined"
                        value={question.text}
                        onChange={(event) =>
                          updateQuestionText(sec, question.id, event.target.value)
                        }
                      />
                      {question.required && (
                        <span className="mt-2 text-red-500" aria-label="Required">
                          *
                        </span>
                      )}
                    </div>
                    {question.scaleLabels && index === 2 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {question.scaleLabels.map((label) => (
                          <span
                            key={label}
                            className={cn(
                              'rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-600',
                            )}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="wm-edit text-lg text-gray-400 hover:text-blue-600"
                      aria-label="Edit question"
                      onClick={() =>
                        showToast({ variant: 'info', message: 'Question editor opened' })
                      }
                    />
                    <button
                      type="button"
                      className="flex size-6 items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-500"
                      aria-label="Remove question"
                      onClick={() => removeQuestion(sec, question.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              onClick={() => addQuestion(sec)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + Add New Question
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
