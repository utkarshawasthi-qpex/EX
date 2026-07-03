'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuFormGroup })),
  { ssr: false },
)
const WuTypography = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    window.setTimeout(() => {
      const isValidEmail = email.includes('@')
      const isValidPassword = password.length >= 6

      if (!isValidEmail || !isValidPassword) {
        setError('Enter a valid email and a password with at least 6 characters.')
        setIsLoading(false)
        return
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('pp_authed', 'true')
      }
      router.push('/lifecycle')
    }, 800)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <WuTypography size="lg" as="div" className="font-semibold text-gray-900">
            QuestionPro
          </WuTypography>
          <WuTypography size="md" as="div" className="mt-1 text-gray-500">
            Percussion Project
          </WuTypography>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <WuFormGroup
            Label="Email"
            Input={
              <WuInput
                type="email"
                variant="outlined"
                placeholder="sarah.johnson@questionpro.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                invalid={Boolean(error)}
              />
            }
          />

          <WuFormGroup
            Label="Password"
            Input={
              <WuInput
                type="password"
                variant="outlined"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                invalid={Boolean(error)}
              />
            }
          />

          {error && (
            <WuTypography size="sm" as="div" className="text-red-600">
              {error}
            </WuTypography>
          )}

          <WuButton type="submit" variant="primary" loading={isLoading} disabled={isLoading}>
            Sign In
          </WuButton>
        </form>
      </section>
    </main>
  )
}
