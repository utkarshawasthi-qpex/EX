'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { getSurveyById } from '@/lib/mockDb'
import { cn } from '@/lib/utils'
import type { LifecycleSurvey, Marker, Question } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
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

type BuilderBlock = {
  id: string
  name: string
  questions: Question[]
}

type SurveyBuilderEditPageProps = {
  params: { id: string }
}

const WORKSPACE_TOOLS = [
  { label: 'Workspace', iconClassName: 'wc-templates', active: true },
  { label: 'Design', iconClassName: 'wc-design', active: false },
  { label: 'Languages', iconClassName: 'wm-language', active: false },
  { label: 'Media Library', iconClassName: 'wm-photo-library', active: false },
  { label: 'Completion', iconClassName: 'wc-completion', active: false },
  { label: 'Settings', iconClassName: 'wc-settings', active: false },
]

const NAV_TABS = ['Edit', 'Distribute', 'Analytics', 'Manage Data']
const SCALE_LABELS = ['Not at All', 'Rarely', 'Sometimes', 'Often', 'All the Time']
const MATRIX_SUBQUESTIONS = [
  'This statement is clear and easy to answer.',
  'This experience is consistent across teams.',
  'Leaders support improvement in this area.',
]

function buildBlocks(survey: LifecycleSurvey): BuilderBlock[] {
  if (survey.markers.length === 0) {
    return [{ id: 'block_1', name: 'Block 1', questions: survey.questions }]
  }

  return survey.markers.map((marker: Marker, index) => ({
    id: marker.id,
    name: marker.name || `Block ${index + 1}`,
    questions: marker.questionIds
      .map((questionId) => survey.questions.find((question) => question.id === questionId))
      .filter((question): question is Question => Boolean(question)),
  }))
}

function QuestionInsertLine({ position }: { position: number }) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-3 py-2"
      onClick={() => console.log(`Add question at position ${position}`)}
    >
      <span className="h-px flex-1 bg-transparent transition group-hover:bg-blue-200" />
      <span className="flex size-6 items-center justify-center rounded-full border border-transparent text-sm text-transparent transition group-hover:border-blue-300 group-hover:text-blue-600">
        +
      </span>
      <span className="h-px flex-1 bg-transparent transition group-hover:bg-blue-200" />
    </button>
  )
}

function RatingScaleDisplay({ question }: { question: Question }) {
  const labels = SCALE_LABELS.map(
    (fallbackLabel, index) => question.ratingScale?.labels?.[index + 1] ?? fallbackLabel,
  )
  const rows = [question.text, ...MATRIX_SUBQUESTIONS]

  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500">
          <tr>
            <th className="w-56 border-b border-gray-200 p-3 text-left font-medium">Statement</th>
            {labels.map((label) => (
              <th key={label} className="border-b border-gray-200 p-3 text-center font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${question.id}_${rowIndex}`} className="border-t border-gray-100">
              <td className="p-3 text-gray-700">{row}</td>
              {labels.map((label) => (
                <td key={`${row}_${label}`} className="p-3 text-center">
                  <input type="radio" disabled className="size-4" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function QuestionResponseDisplay({ question }: { question: Question }) {
  if (question.type === 'open_text') {
    return (
      <textarea
        disabled
        placeholder="Respondent answer"
        className="mt-5 h-24 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500"
      />
    )
  }

  if (question.type === 'multiple_choice') {
    return (
      <div className="mt-5 flex flex-col gap-3">
        {(question.options ?? ['Option 1', 'Option 2', 'Option 3']).map((option) => (
          <label key={option} className="flex items-center gap-3 text-sm text-gray-700">
            <input type="radio" disabled className="size-4" />
            {option}
          </label>
        ))}
      </div>
    )
  }

  if (question.type === 'enps') {
    return (
      <div className="mt-5 flex flex-wrap gap-2">
        {Array.from({ length: 11 }, (_, score) => (
          <button
            key={score}
            type="button"
            disabled
            className="size-9 rounded border border-gray-200 bg-gray-50 text-sm text-gray-500"
          >
            {score}
          </button>
        ))}
      </div>
    )
  }

  return <RatingScaleDisplay question={question} />
}

export default function SurveyBuilderEditPage({ params }: SurveyBuilderEditPageProps) {
  const router = useRouter()
  const survey = useMemo(() => getSurveyById(params.id), [params.id])
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [questionTexts, setQuestionTexts] = useState<Record<string, string>>({})
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Set<string>>(new Set())
  const [openAddMenuBlockId, setOpenAddMenuBlockId] = useState<string | null>(null)

  useEffect(() => {
    if (!survey) router.replace('/lifecycle/surveys')
  }, [router, survey])

  useEffect(() => {
    if (!survey) return

    setQuestionTexts(
      Object.fromEntries(survey.questions.map((question) => [question.id, question.text])),
    )
  }, [survey])

  const blocks = useMemo(() => (survey ? buildBlocks(survey) : []), [survey])
  const renderedBlocks = blocks.length > 0 ? blocks : [{ id: 'block_1', name: 'Block 1', questions: [] }]

  if (!survey) return null

  function logPlaceholder(action: string) {
    console.log(action)
  }

  function toggleBlock(blockId: string) {
    setCollapsedBlockIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(blockId)) nextIds.delete(blockId)
      else nextIds.add(blockId)
      return nextIds
    })
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 text-gray-900">
      <header className="flex h-14 items-center justify-between gap-6 bg-[#071d35] px-5 text-white">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded bg-blue-600 font-semibold">P</div>
          <WuText size="sm" as="span" className="truncate text-blue-100">
            New folks &gt; {survey.title}
          </WuText>
        </div>

        <nav className="flex h-full items-center gap-6">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                'flex h-full items-center border-b-2 px-1 text-sm transition',
                tab === 'Edit'
                  ? 'border-blue-400 text-white'
                  : 'border-transparent text-blue-100 hover:text-white',
              )}
              onClick={() => (tab === 'Edit' ? undefined : logPlaceholder(`${tab} tab clicked`))}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-4">
          <button
            type="button"
            className="text-sm text-blue-100"
            onClick={() => logPlaceholder('Tools menu clicked')}
          >
            Tools ▾
          </button>
          <WuText size="sm" as="span" className="text-blue-100">
            Responses: 0
          </WuText>
          <WuButton size="sm" variant="primary" onClick={() => logPlaceholder('Preview survey')}>
            Preview
          </WuButton>
        </div>
      </header>

      <div className="flex h-20 items-center justify-center gap-10 border-b border-gray-200 bg-white px-6">
        {WORKSPACE_TOOLS.map((tool) => (
          <button
            key={tool.label}
            type="button"
            className={cn(
              'flex min-w-20 flex-col items-center gap-1 text-xs transition',
              tool.active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600',
            )}
            onClick={() => (tool.active ? undefined : logPlaceholder(`${tool.label} clicked`))}
          >
            <span className={cn(tool.iconClassName, 'text-xl')} aria-hidden />
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto bg-gray-50 px-8 py-8">
        <div className="mx-auto flex max-w-[900px] flex-col gap-6 pb-20">
          <section className="relative flex min-h-72 flex-col items-center justify-center rounded-xl bg-white p-10 shadow-sm">
            <button
              type="button"
              className="absolute right-5 top-4 text-xl text-gray-400"
              onClick={() => logPlaceholder('Cover menu clicked')}
            >
              ⋮
            </button>
            <div className="flex size-32 items-center justify-center rounded-2xl bg-[#071d35] text-6xl font-semibold text-white">
              P
            </div>
            <WuHeading size="md" className="mt-5 text-blue-700">
              QuestionPro
            </WuHeading>
          </section>

          {renderedBlocks.map((block) => {
            const isCollapsed = collapsedBlockIds.has(block.id)
            return (
              <section key={block.id} className="rounded-xl bg-white shadow-sm">
                <header className="flex items-center justify-between border-b border-gray-100 p-5">
                  <div className="flex items-center gap-3">
                    <button type="button" className="text-lg text-gray-500" onClick={() => toggleBlock(block.id)}>
                      {isCollapsed ? '›' : '×'}
                    </button>
                    <WuHeading size="sm">{block.name}</WuHeading>
                  </div>
                  <button
                    type="button"
                    className="text-xl text-gray-400"
                    onClick={() => logPlaceholder(`${block.name} menu clicked`)}
                  >
                    ⋮
                  </button>
                </header>

                {!isCollapsed && (
                  <div className="p-5">
                    <div className="relative mb-4 flex justify-center">
                      <WuButton
                        variant="secondary"
                        onClick={() => setOpenAddMenuBlockId(openAddMenuBlockId === block.id ? null : block.id)}
                      >
                        Add Question ▾
                      </WuButton>
                      {openAddMenuBlockId === block.id && (
                        <div className="absolute top-11 z-20 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                            onClick={() => logPlaceholder(`Add question to ${block.name}`)}
                          >
                            Add Question
                          </button>
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                            onClick={() => logPlaceholder('Build with AI')}
                          >
                            Build with AI
                          </button>
                        </div>
                      )}
                    </div>

                    {block.questions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center">
                        <WuText size="md" as="p" className="text-gray-500">
                          No questions yet. Use Add Question to start building this block.
                        </WuText>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <QuestionInsertLine position={1} />
                        {block.questions.map((question, index) => (
                          <div key={question.id}>
                            <article className="rounded-lg border border-gray-200 p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                  <WuText size="sm" as="span" className="mt-1 shrink-0 text-gray-400">
                                    Q{index + 1}
                                  </WuText>
                                  {question.required && <span className="mt-1 text-red-500">*</span>}
                                  <div className="min-w-0 flex-1">
                                    {editingQuestionId === question.id ? (
                                      <WuInput
                                        value={questionTexts[question.id] ?? question.text}
                                        autoFocus
                                        onChange={(event) =>
                                          setQuestionTexts((currentTexts) => ({
                                            ...currentTexts,
                                            [question.id]: event.target.value,
                                          }))
                                        }
                                        onBlur={() => setEditingQuestionId(null)}
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        className="text-left text-base font-medium text-gray-900 hover:text-blue-700"
                                        onClick={() => setEditingQuestionId(question.id)}
                                      >
                                        {questionTexts[question.id] ?? question.text}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2 text-xs text-blue-700">
                                  {['Validation', 'Logic', 'Settings'].map((action) => (
                                    <button key={action} type="button" onClick={() => logPlaceholder(`${action} clicked`)}>
                                      {action}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    className="text-gray-400"
                                    onClick={() => logPlaceholder('Question menu clicked')}
                                  >
                                    ⋮
                                  </button>
                                </div>
                              </div>
                              <QuestionResponseDisplay
                                question={{ ...question, text: questionTexts[question.id] ?? question.text }}
                              />
                            </article>
                            <QuestionInsertLine position={index + 2} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}
