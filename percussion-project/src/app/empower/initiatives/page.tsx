'use client'

import { redirect } from 'next/navigation'
import { PlaceholderPage } from '@/components/shared/PlaceholderPage'
import { isEmployeeContext } from '@/lib/userContext'

export default function EmpowerInitiativesPage() {
  if (isEmployeeContext()) {
    redirect('/lifecycle/analytics')
  }

  return <PlaceholderPage title="Initiatives" />
}
