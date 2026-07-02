'use client'

import dynamic from 'next/dynamic'
import { PageContent } from '@/components/shared/PageContent'
import { PageShell } from '@/components/shared/PageShell'

const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

export function AuthChecking() {
  return (
    <PageShell>
      <PageContent>
        <WuText size="sm" as="p" className="text-gray-500">
          Checking authentication...
        </WuText>
      </PageContent>
    </PageShell>
  )
}
