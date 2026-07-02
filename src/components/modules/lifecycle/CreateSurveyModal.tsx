'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { TemplatePreviewModal } from '@/components/modules/lifecycle/TemplatePreviewModal'
import { mockSurveyTemplates } from '@/data/mock/surveyTemplates'
import { saveCreatedSurvey } from '@/lib/mockDb'
import { preventModalDismiss } from '@/lib/modalProps'
import { cn } from '@/lib/utils'
import type { LifecycleSurvey, Question, SurveyTemplate, SurveyType } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuFormGroup })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
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
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
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
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuCheckbox })),
  { ssr: false },
)

type SurveyTypeOption = {
  value: Extract<SurveyType, 'onboarding' | 'exit' | 'pulse' | 'engagement'>
  label: string
}

type CreateSurveyModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateSurvey: (survey: LifecycleSurvey) => void
}

type TemplateMarker = NonNullable<SurveyTemplate['markers']>[number]
type TemplateBuildingBlock = TemplateMarker['buildingBlocks'][number]

const SURVEY_TYPE_OPTIONS: SurveyTypeOption[] = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'exit', label: 'Exit' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'engagement', label: 'Engagement' },
]

function getQuestionKey(blockId: string, questionIndex: number) {
  return `${blockId}::${questionIndex}`
}

function getAllQuestionKeys(template: SurveyTemplate) {
  return (template.markers ?? []).flatMap((marker) =>
    marker.buildingBlocks.flatMap((block) =>
      block.questions.map((_, questionIndex) => getQuestionKey(block.id, questionIndex)),
    ),
  )
}

function getInitialExpandedBlocks(template: SurveyTemplate) {
  const firstMarker = template.markers?.[0]
  return new Set(firstMarker?.buildingBlocks.map((block) => block.id) ?? [])
}

function createDraftSurvey({
  name,
  type,
  description,
  template,
  selectedQuestionIds,
}: {
  name: string
  type: SurveyTypeOption['value']
  description: string
  template?: SurveyTemplate | null
  selectedQuestionIds?: Set<string>
}): LifecycleSurvey {
  const now = new Date().toISOString()
  const id = `surv_${Date.now()}`
  const questions: Question[] = []
  const markers = (template?.markers ?? [])
    .map((marker, markerIndex) => {
      const questionIds: string[] = []

      marker.buildingBlocks.forEach((block) => {
        block.questions.forEach((questionText, questionIndex) => {
          const questionKey = getQuestionKey(block.id, questionIndex)
          if (!selectedQuestionIds?.has(questionKey)) return

          const questionId = `${id}_${questionKey.replace(/[^a-zA-Z0-9]/g, '_')}`
          questionIds.push(questionId)
          questions.push({
            id: questionId,
            text: questionText,
            type: 'rating_scale',
            required: true,
            markerId: `${id}_${marker.id}`,
            ratingScale: {
              min: 1,
              max: 5,
              labels: {
                1: 'Not at All',
                2: 'Rarely',
                3: 'Sometimes',
                4: 'Often',
                5: 'All the Time',
              },
            },
          })
        })
      })

      return {
        id: `${id}_${marker.id}`,
        name: marker.name,
        order: markerIndex + 1,
        questionIds,
      }
    })
    .filter((marker) => marker.questionIds.length > 0)

  return {
    id,
    title: name,
    type,
    status: 'draft',
    markers:
      markers.length > 0
        ? markers
        : [
            {
              id: `${id}_marker_overview`,
              name: description.trim() ? description.trim() : 'Overview',
              order: 1,
              questionIds: [],
            },
          ],
    questions,
    anonymityThreshold: 5,
    languages: ['en'],
    createdAt: now,
    updatedAt: now,
    createdBy: 'emp_017',
    responseCount: 0,
    responseRate: 0,
  }
}

function getSurveyTypeOption(type: SurveyTemplate['surveyType']) {
  return SURVEY_TYPE_OPTIONS.find((option) => option.value === type) ?? SURVEY_TYPE_OPTIONS[0]
}

function StepBreadcrumb({ currentStep, totalSteps }: { currentStep: number; totalSteps: 2 | 3 }) {
  const stepItems = [
    { step: 1, label: 'Choose Template', iconClassName: 'wc-templates' },
    { step: 2, label: 'Name Survey', iconClassName: 'wc-settings' },
    ...(totalSteps === 3
      ? [{ step: 3, label: 'Select Content', iconClassName: 'wc-categories' }]
      : []),
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      {stepItems.map((item, index) => {
        const isActive = currentStep === item.step
        const isCompleted = currentStep > item.step
        const isHighlighted = isActive || isCompleted

        return (
          <div key={item.step} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-2',
                isHighlighted ? 'text-blue-600' : 'text-gray-400',
              )}
            >
              <span
                className={cn(isCompleted ? 'wm-check-circle' : item.iconClassName, 'text-base')}
                aria-hidden
              />
              <WuText size="sm" as="span" className={cn(isActive && 'font-medium')}>
                {item.label}
              </WuText>
            </div>
            {index < stepItems.length - 1 && (
              <span className="text-sm text-gray-300" aria-hidden>
                &gt;
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function CreateSurveyModal({ open, onOpenChange, onCreateSurvey }: CreateSurveyModalProps) {
  const router = useRouter()
  const { showToast } = useWuShowToast()
  const [step, setStep] = useState(1)
  const [templateSearch, setTemplateSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<SurveyTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<SurveyTemplate | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [surveyName, setSurveyName] = useState('')
  const [surveyType, setSurveyType] = useState<SurveyTypeOption>(SURVEY_TYPE_OPTIONS[0])
  const [description, setDescription] = useState('')
  const [nameError, setNameError] = useState('')
  const [activeMarkerId, setActiveMarkerId] = useState('')
  const [expandedBlockIds, setExpandedBlockIds] = useState<Set<string>>(new Set())
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())

  const isTemplatePath = Boolean(selectedTemplate && selectedTemplate.category !== 'custom')
  const totalSteps: 2 | 3 = isTemplatePath ? 3 : 2
  const selectedMarker = selectedTemplate?.markers?.find((marker) => marker.id === activeMarkerId)

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = templateSearch.trim().toLowerCase()

    if (!normalizedSearch) return mockSurveyTemplates

    return mockSurveyTemplates.filter((template) =>
      template.title.toLowerCase().includes(normalizedSearch),
    )
  }, [templateSearch])

  function resetForm() {
    setStep(1)
    setTemplateSearch('')
    setSelectedTemplate(null)
    setPreviewTemplate(null)
    setIsPreviewOpen(false)
    setSurveyName('')
    setSurveyType(SURVEY_TYPE_OPTIONS[0])
    setDescription('')
    setNameError('')
    setActiveMarkerId('')
    setExpandedBlockIds(new Set())
    setSelectedQuestionIds(new Set())
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) resetForm()
  }

  function initializeTemplateContent(template: SurveyTemplate) {
    setActiveMarkerId(template.markers?.[0]?.id ?? '')
    setExpandedBlockIds(getInitialExpandedBlocks(template))
    setSelectedQuestionIds(new Set(getAllQuestionKeys(template)))
  }

  function selectTemplate(template: SurveyTemplate) {
    setSelectedTemplate(template)
    initializeTemplateContent(template)
  }

  function prefillFromTemplate(template: SurveyTemplate) {
    setNameError('')

    if (template.category === 'custom') {
      setSurveyName('')
      setSurveyType(SURVEY_TYPE_OPTIONS[0])
      setDescription('')
    } else {
      setSurveyName(template.title)
      setSurveyType(getSurveyTypeOption(template.surveyType))
      setDescription(template.description)
    }
  }

  function handleUseTemplate(template: SurveyTemplate) {
    selectTemplate(template)
    prefillFromTemplate(template)
    setIsPreviewOpen(false)
    setStep(2)
  }

  function handleNext() {
    if (!selectedTemplate) return
    prefillFromTemplate(selectedTemplate)
    setStep(2)
  }

  function handleCreate() {
    const trimmedName = surveyName.trim()

    if (!trimmedName) {
      setNameError('Survey name is required.')
      return
    }

    const newSurvey = createDraftSurvey({
      name: trimmedName,
      type: surveyType.value,
      description,
      template: isTemplatePath ? selectedTemplate : null,
      selectedQuestionIds,
    })

    onCreateSurvey(newSurvey)
    saveCreatedSurvey(newSurvey)
    showToast({ message: 'Survey created. Opening builder...', variant: 'success' })
    handleOpenChange(false)
    router.push(`/lifecycle/surveys/${newSurvey.id}/edit`)
  }

  function handleSurveyTypeSelect(value: unknown) {
    const selected = value as SurveyTypeOption | SurveyTypeOption[]
    const nextValue = Array.isArray(selected) ? selected[0] : selected
    setSurveyType(nextValue ?? SURVEY_TYPE_OPTIONS[0])
  }

  function toggleBlock(block: TemplateBuildingBlock, checked: boolean) {
    setSelectedQuestionIds((currentSelection) => {
      const nextSelection = new Set(currentSelection)
      block.questions.forEach((_, questionIndex) => {
        const questionKey = getQuestionKey(block.id, questionIndex)
        if (checked) nextSelection.add(questionKey)
        else nextSelection.delete(questionKey)
      })
      return nextSelection
    })
  }

  function toggleQuestion(blockId: string, questionIndex: number, checked: boolean) {
    const questionKey = getQuestionKey(blockId, questionIndex)
    setSelectedQuestionIds((currentSelection) => {
      const nextSelection = new Set(currentSelection)
      if (checked) nextSelection.add(questionKey)
      else nextSelection.delete(questionKey)
      return nextSelection
    })
  }

  function toggleBlockExpanded(blockId: string) {
    setExpandedBlockIds((currentBlocks) => {
      const nextBlocks = new Set(currentBlocks)
      if (nextBlocks.has(blockId)) nextBlocks.delete(blockId)
      else nextBlocks.add(blockId)
      return nextBlocks
    })
  }

  return (
    <>
      <WuModal open={open} onOpenChange={handleOpenChange} size="lg" maxHeight="90vh">
        <WuModalHeader>Create Survey</WuModalHeader>
        <WuModalContent {...preventModalDismiss}>
          <div className="flex flex-col gap-6 p-1">
            {step === 1 ? (
              <div className="flex max-h-[calc(90vh-12rem)] flex-col gap-4 overflow-y-auto pr-1">
                <div className="sticky top-0 z-10 bg-white pb-4">
                  <WuHeading size="sm">Choose Template</WuHeading>
                  <WuText size="sm" as="p" className="mt-1 text-gray-500">
                    Select one of our templates or start from scratch to create your study
                  </WuText>
                  <div className="mt-6">
                    <WuInput
                      type="search"
                      variant="outlined"
                      placeholder="Search templates..."
                      value={templateSearch}
                      onChange={(event) => setTemplateSearch(event.target.value)}
                    />
                  </div>
                </div>

                {filteredTemplates.length === 0 ? (
                  <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-gray-200 text-center">
                    <WuText size="md" as="p" className="text-gray-500">
                      No templates found. Try a different search.
                    </WuText>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {filteredTemplates.map((template) => {
                      const isSelected = selectedTemplate?.id === template.id
                      const isCustomStudy = template.category === 'custom'

                      return (
                        <div
                          key={template.id}
                          role="button"
                          tabIndex={0}
                          className={cn(
                            'group relative flex min-h-48 flex-col overflow-hidden rounded-xl border bg-white p-4 text-left transition hover:border-blue-500',
                            isSelected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200',
                          )}
                          onClick={() => selectTemplate(template)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              selectTemplate(template)
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {isCustomStudy ? (
                              <span
                                className="wm-add-circle text-3xl text-blue-600"
                                aria-hidden
                              />
                            ) : (
                              <span
                                className={cn(
                                  'flex size-9 items-center justify-center rounded-lg text-sm font-semibold text-white',
                                  template.isPartnerContent ? 'bg-purple-600' : 'bg-blue-600',
                                )}
                              >
                                {template.provider.charAt(0)}
                              </span>
                            )}
                            <WuText size="sm" as="span" className="text-gray-500">
                              {template.provider}
                            </WuText>
                          </div>

                          <WuHeading size="sm" className="mt-4 text-gray-900">
                            {template.title}
                          </WuHeading>
                          <WuText size="sm" as="p" className="mt-2 line-clamp-2 text-gray-500">
                            {template.description}
                          </WuText>

                          {!isCustomStudy && (
                            <div className="absolute inset-0 hidden items-center justify-center bg-gray-950/55 group-hover:flex">
                              <div className="flex items-center gap-3">
                                <WuButton
                                  size="sm"
                                  variant="primary"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleUseTemplate(template)
                                  }}
                                >
                                  Use Template
                                </WuButton>
                                <WuButton
                                  size="sm"
                                  variant="secondary"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setPreviewTemplate(template)
                                    setIsPreviewOpen(true)
                                  }}
                                >
                                  Preview
                                </WuButton>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : step === 2 ? (
              <div className="flex flex-col gap-4">
                <WuHeading size="sm">Name Your Survey</WuHeading>
                <WuFormGroup
                  Label="Survey name"
                  Error={nameError || undefined}
                  Input={
                    <WuInput
                      variant="outlined"
                      placeholder="e.g. New Hire Check-in"
                      value={surveyName}
                      invalid={Boolean(nameError)}
                      onChange={(event) => {
                        setSurveyName(event.target.value)
                        if (nameError) setNameError('')
                      }}
                    />
                  }
                />
                <WuFormGroup
                  Label="Survey type"
                  Input={
                    <WuSelect
                      data={SURVEY_TYPE_OPTIONS}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={surveyType}
                      onSelect={handleSurveyTypeSelect}
                      variant="outlined"
                    />
                  }
                />
                <WuFormGroup
                  Label="Description"
                  Hint="Optional"
                  Input={
                    <WuTextarea
                      variant="outlined"
                      placeholder="What is this survey intended to measure?"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  }
                />
              </div>
            ) : (
              <div className="flex max-h-[calc(90vh-12rem)] flex-col gap-4 overflow-hidden">
                <div>
                  <WuText size="sm" as="p" className="text-gray-500">
                    Choose a Study &gt; {selectedTemplate?.title}
                  </WuText>
                  <WuHeading size="sm" className="mt-2">
                    Marker & Building Block Selector
                  </WuHeading>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)] overflow-hidden rounded-lg border border-gray-200">
                  <aside className="overflow-y-auto border-r border-gray-200 bg-gray-50 p-3">
                    <div className="flex flex-col gap-1">
                      {(selectedTemplate?.markers ?? []).map((marker) => (
                        <button
                          key={marker.id}
                          type="button"
                          className={cn(
                            'border-l-2 px-3 py-2 text-left text-sm transition',
                            marker.id === activeMarkerId
                              ? 'border-blue-600 bg-white font-medium text-blue-700'
                              : 'border-transparent text-gray-600 hover:bg-white',
                          )}
                          onClick={() => setActiveMarkerId(marker.id)}
                        >
                          {marker.name}
                        </button>
                      ))}
                    </div>
                  </aside>

                  <section className="min-h-0 overflow-y-auto p-5">
                    <WuHeading size="sm">{selectedMarker?.name ?? 'Select a marker'}</WuHeading>
                    <div className="mt-4 flex flex-col gap-3">
                      {(selectedMarker?.buildingBlocks ?? []).map((block) => {
                        const questionKeys = block.questions.map((_, questionIndex) =>
                          getQuestionKey(block.id, questionIndex),
                        )
                        const selectedCount = questionKeys.filter((key) =>
                          selectedQuestionIds.has(key),
                        ).length
                        const isBlockChecked = selectedCount === questionKeys.length
                        const isBlockPartial = selectedCount > 0 && !isBlockChecked
                        const isExpanded = expandedBlockIds.has(block.id)

                        return (
                          <div key={block.id} className="rounded-lg border border-gray-200 bg-white">
                            <div className="flex items-center justify-between gap-3 p-4">
                              <div className="flex items-center gap-3">
                                <WuCheckbox
                                  checked={isBlockChecked}
                                  partial={isBlockPartial}
                                  onChange={(checked) => toggleBlock(block, checked)}
                                />
                                <WuText size="sm" as="span" className="font-medium text-gray-900">
                                  {block.name}
                                </WuText>
                              </div>
                              <button
                                type="button"
                                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                onClick={() => toggleBlockExpanded(block.id)}
                                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${block.name}`}
                              >
                                {isExpanded ? '⌃' : '⌄'}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-gray-100 px-4 py-3">
                                <div className="flex flex-col gap-3">
                                  {block.questions.map((question, questionIndex) => {
                                    const questionKey = getQuestionKey(block.id, questionIndex)
                                    return (
                                      <label key={questionKey} className="flex items-start gap-3">
                                        <WuCheckbox
                                          checked={selectedQuestionIds.has(questionKey)}
                                          onChange={(checked) =>
                                            toggleQuestion(block.id, questionIndex, checked)
                                          }
                                        />
                                        <WuText size="sm" as="span" className="text-gray-700">
                                          {question}
                                        </WuText>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </WuModalContent>
        <WuModalFooter>
          {step === 1 ? (
            <div className="flex w-full items-center justify-between gap-4">
              <StepBreadcrumb currentStep={step} totalSteps={totalSteps} />
              <WuButton variant="primary" disabled={!selectedTemplate} onClick={handleNext}>
                Next
              </WuButton>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between gap-4">
              <StepBreadcrumb currentStep={step} totalSteps={totalSteps} />
              <div className="flex items-center gap-3">
                <WuButton variant="secondary" onClick={() => setStep(step === 3 ? 2 : 1)}>
                  Back
                </WuButton>
                {step === 2 && isTemplatePath ? (
                  <WuButton variant="primary" onClick={() => setStep(3)}>
                    Next
                  </WuButton>
                ) : (
                  <WuButton variant="primary" onClick={handleCreate}>
                    {step === 3 ? 'Create' : 'Create Survey'}
                  </WuButton>
                )}
              </div>
            </div>
          )}
        </WuModalFooter>
      </WuModal>

      <TemplatePreviewModal
        open={isPreviewOpen}
        template={previewTemplate}
        onOpenChange={setIsPreviewOpen}
        onUseTemplate={handleUseTemplate}
      />
    </>
  )
}
