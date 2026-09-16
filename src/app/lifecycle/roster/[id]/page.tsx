'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { MOCK_DIRECTORY_EMPLOYEES, getEmployeeDisplayName } from '@/data/mock-employee-directory'
import { mockEmployees } from '@/data/mock/employees'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false },
)

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const employee = useMemo(
    () =>
      MOCK_DIRECTORY_EMPLOYEES.find((item) => item.id === params.id) ??
      mockEmployees.find((item) => item.id === params.id),
    [params.id],
  )

  if (!employee) {
    return (
      <div className="px-6 py-10">
        <WuHeading size="md">Employee not found</WuHeading>
        <WuButton className="mt-4" variant="secondary" onClick={() => router.push('/lifecycle/roster')}>
          Back to Employee list
        </WuButton>
      </div>
    )
  }

  return (
    <div className="px-6 py-8">
      <WuHeading size="lg">{getEmployeeDisplayName(employee)}</WuHeading>
      <WuText size="sm" as="p" className="mt-1 text-gray-500">
        {employee.email}
      </WuText>
      <WuText size="sm" as="p" className="mt-4 text-gray-700">
        {employee.jobTitle} · {employee.department} · {employee.location}
      </WuText>
      <WuButton className="mt-6" variant="secondary" onClick={() => router.push('/lifecycle/roster')}>
        Back to Employee list
      </WuButton>
    </div>
  )
}
