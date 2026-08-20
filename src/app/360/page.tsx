'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Feedback360HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/360/surveys')
  }, [router])

  return null
}
