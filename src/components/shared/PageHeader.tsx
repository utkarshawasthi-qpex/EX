'use client'

import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'

const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type PageHeaderProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6 pt-6 pb-4',
        className,
      )}
    >
      <div className="min-w-0">
        <WuHeading size="xl" className="text-gray-900">
          {title}
        </WuHeading>
        {description && (
          <WuText size="sm" as="p" className="mt-1 text-gray-500">
            {description}
          </WuText>
        )}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  )
}
