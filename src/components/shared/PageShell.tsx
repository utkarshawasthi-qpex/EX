'use client'

import { cn } from '@/lib/utils'

type PageShellProps = {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn('flex min-h-full flex-col', className)}>{children}</div>
}
