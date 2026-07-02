'use client'

import { cn } from '@/lib/utils'

type PageContentProps = {
  children: React.ReactNode
  className?: string
}

export function PageContent({ children, className }: PageContentProps) {
  return <div className={cn('flex flex-col gap-6 px-6 pt-4 pb-6', className)}>{children}</div>
}
