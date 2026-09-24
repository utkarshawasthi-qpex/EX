'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { redirectPathFromEmpower } from '@/lib/actionPlans/paths'

/** Legacy Empower URLs redirect into the EX portal action planning module. */
export default function EmpowerRedirectLayout() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    router.replace(redirectPathFromEmpower(pathname))
  }, [pathname, router])

  return null
}
