'use client'

import dynamic from 'next/dynamic'
import { PageContent } from '@/components/shared/PageContent'
import { PageHeader } from '@/components/shared/PageHeader'
import { PageShell } from '@/components/shared/PageShell'

const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type PlaceholderPageProps = {
  title: string
  description?: string
}

export function PlaceholderPage({
  title,
  description = 'This section is under development.',
}: PlaceholderPageProps) {
  return (
    <PageShell>
      <PageHeader title={title} description={description} />
      <PageContent>
        <WuText size="sm" as="p" className="text-gray-400">
          {description}
        </WuText>
      </PageContent>
    </PageShell>
  )
}
