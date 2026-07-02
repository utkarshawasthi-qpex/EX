import type { Metadata } from 'next'
import '@npm-questionpro/wick-ui-lib/dist/style.css'
import '@npm-questionpro/wick-ui-icon/dist/wu-icon.css'
import './globals.css'
import { AppShell } from '@/components/shared/AppShell'

export const metadata: Metadata = {
  title: 'Percussion Project',
  description: 'QuestionPro EX platform replica placeholder',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
