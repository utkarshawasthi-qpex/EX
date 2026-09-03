'use client'

import { DatasetProvider } from '@/lib/datasetContext'

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <DatasetProvider>{children}</DatasetProvider>
}
