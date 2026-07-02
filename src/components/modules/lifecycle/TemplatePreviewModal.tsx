'use client'

import dynamic from 'next/dynamic'
import { preventModalDismiss } from '@/lib/modalProps'
import type { SurveyTemplate } from '@/types'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
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
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type TemplatePreviewModalProps = {
  open: boolean
  template: SurveyTemplate | null
  onOpenChange: (open: boolean) => void
  onUseTemplate: (template: SurveyTemplate) => void
}

type PreviewQuestion = {
  id: string
  text: string
}

const RATING_LABELS = ['Not at All', 'Rarely', 'Sometimes', 'Often', 'All the Time']

const SAMPLE_QUESTIONS_BY_CATEGORY: Record<SurveyTemplate['category'], PreviewQuestion[]> = {
  custom: [],
  culture: [
    { id: 'culture_1', text: 'We can maintain quality and still move quickly.' },
    { id: 'culture_2', text: 'Teams share information openly across the organization.' },
    { id: 'culture_3', text: 'Different perspectives are welcomed here.' },
  ],
  recruiting: [
    { id: 'recruiting_1', text: 'The hiring process made me more interested in joining the company.' },
    { id: 'recruiting_2', text: 'Communication was timely throughout the recruiting process.' },
    { id: 'recruiting_3', text: 'The interview process helped me understand the role clearly.' },
  ],
  onboarding: [
    { id: 'onboarding_1', text: 'My onboarding helped me become productive quickly.' },
    { id: 'onboarding_2', text: 'I understand what is expected of me in my role.' },
    { id: 'onboarding_3', text: 'My manager has been available when I need support.' },
  ],
  wellness: [
    { id: 'wellness_1', text: 'My workload is manageable.' },
    { id: 'wellness_2', text: 'I can maintain a healthy balance between work and personal life.' },
    { id: 'wellness_3', text: 'My manager supports my wellbeing.' },
  ],
  exit: [
    { id: 'exit_1', text: 'I felt supported by my manager.' },
    { id: 'exit_2', text: 'I had opportunities to learn and grow.' },
    { id: 'exit_3', text: 'I would recommend this organization as a place to work.' },
  ],
  engagement: [
    { id: 'engagement_1', text: 'I am motivated to do my best work.' },
    { id: 'engagement_2', text: 'I understand how my work contributes to company goals.' },
    { id: 'engagement_3', text: 'I see a future for myself at this organization.' },
  ],
  partner: [
    { id: 'partner_1', text: 'Customer feedback is shared with employees in a useful way.' },
    { id: 'partner_2', text: 'Teams respond quickly when customer needs change.' },
    { id: 'partner_3', text: 'Leaders connect employee experience improvements to customer outcomes.' },
  ],
}

export function TemplatePreviewModal({
  open,
  template,
  onOpenChange,
  onUseTemplate,
}: TemplatePreviewModalProps) {
  if (!template) return null

  const questions = SAMPLE_QUESTIONS_BY_CATEGORY[template.category].slice(0, 3)

  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="md" maxHeight="85vh">
      <WuModalHeader>{template.title} — Preview</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <div className="sticky top-0 z-10 bg-white pb-5">
            <div className="h-1 overflow-hidden rounded-full bg-blue-100">
              <div className="h-full w-[30%] rounded-full bg-blue-600" />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {questions.map((question, index) => (
              <section key={question.id} className="rounded-lg border border-gray-200 bg-white p-5">
                <WuText size="sm" as="p" className="text-gray-500">
                  Question {index + 1}
                </WuText>
                <WuHeading size="sm" className="mt-2 text-gray-900">
                  {question.text}
                </WuHeading>
                <div className="mt-5 grid grid-cols-5 gap-3">
                  {RATING_LABELS.map((label) => (
                    <label
                      key={label}
                      className="flex flex-col items-center gap-2 text-center text-xs text-gray-500"
                    >
                      <input type="radio" disabled className="size-4" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full items-center justify-between gap-4">
          <WuText size="sm" as="span" className="text-gray-500">
            {template.questionCount} Questions
          </WuText>
          <div className="flex items-center gap-3">
            <WuButton variant="link" onClick={() => onOpenChange(false)}>
              Cancel
            </WuButton>
            <WuButton variant="primary" onClick={() => onUseTemplate(template)}>
              Use Template
            </WuButton>
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
