'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { preventModalDismiss } from '@/lib/modalProps'
import type { ActionFeedbackResponse, EmpowerInitiativeRecord } from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })),
  { ssr: false },
)

type Tri = ActionFeedbackResponse['happened']

type Props = {
  open: boolean
  planTitle: string
  onSkip: () => void
  onSubmit: (mockTeamSummary: EmpowerInitiativeRecord['actionFeedback']) => void
}

function TriButtons({ value, onChange }: { value: Tri; onChange: (v: Tri) => void }) {
  const options: Tri[] = ['yes', 'no', 'unsure']
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-full px-3 py-1 text-xs capitalize ${
            value === opt ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

/** Culture Amp–style optional team feedback (mock aggregated responses). */
export function ActionFeedbackModal({ open, planTitle, onSkip, onSubmit }: Props) {
  const { showToast } = useWuShowToast()
  const [happened, setHappened] = useState<Tri>('yes')
  const [helped, setHelped] = useState<Tri>('yes')
  const [wouldRecommend, setWouldRecommend] = useState<Tri>('yes')

  function send() {
    onSubmit({
      sentAt: new Date().toISOString(),
      responses: [
        { employeeId: 'emp_mock_1', happened, helped, wouldRecommend },
        { employeeId: 'emp_mock_2', happened: 'yes', helped: 'yes', wouldRecommend: 'unsure' },
        { employeeId: 'emp_mock_3', happened: 'yes', helped: 'no', wouldRecommend: 'yes' },
      ],
    })
    showToast({ variant: 'success', message: 'Team feedback request sent (mock)' })
  }

  return (
    <WuModal open={open} onOpenChange={(v) => !v && onSkip()} size="md" {...preventModalDismiss}>
      <WuModalHeader>Action feedback</WuModalHeader>
      <WuModalContent>
        <p className="mb-4 text-sm text-gray-600">
          Optional: send a short 3-question check-in to your team about “{planTitle}”. This helps you
          know if efforts landed (Culture Amp Action Feedback pattern).
        </p>
        <div className="space-y-4 text-sm">
          <div>
            <p className="mb-1 font-medium text-gray-800">Did this action happen?</p>
            <TriButtons value={happened} onChange={setHappened} />
          </div>
          <div>
            <p className="mb-1 font-medium text-gray-800">Did it help the team?</p>
            <TriButtons value={helped} onChange={setHelped} />
          </div>
          <div>
            <p className="mb-1 font-medium text-gray-800">Would you recommend it to another team?</p>
            <TriButtons value={wouldRecommend} onChange={setWouldRecommend} />
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-2">
          <WuButton variant="secondary" onClick={onSkip}>
            Skip and close plan
          </WuButton>
          <WuButton variant="primary" onClick={send}>
            Send feedback & close
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
