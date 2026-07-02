'use client'

import { cn } from '@/lib/utils'

type PageCardProps = {
  children: React.ReactNode
  className?: string
}

export function PageCard({ children, className }: PageCardProps) {
  return (
    <section className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      {children}
    </section>
  )
}
