'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AuthChecking } from '@/components/shared/AuthChecking'

export default function Feedback360Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem('pp_authed') !== 'true') {
      router.replace('/login')
      return
    }

    setIsCheckingAuth(false)
  }, [router])

  if (isCheckingAuth) {
    return <AuthChecking />
  }

  return children
}
