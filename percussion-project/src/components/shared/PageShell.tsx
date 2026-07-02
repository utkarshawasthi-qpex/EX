'use client'

import { cn } from '@/lib/utils'

type PageShellProps = {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn('min-h-full', className)}>{children}</div>
}
