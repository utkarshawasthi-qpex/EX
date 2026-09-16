'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { PageCard } from '@/components/shared/PageCard'
import { useRosterStore } from '@/lib/rosterStore'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuFormGroup })),
  { ssr: false },
)
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuHeading })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuText })),
  { ssr: false },
)

type SelectOption = {
  value: string
  label: string
}

const DEFAULT_LOGO_OPTIONS: SelectOption[] = [
  { value: '', label: '--Select--' },
  { value: 'questionpro', label: 'QuestionPro' },
  { value: 'company-default', label: 'Company default' },
]

type EmployeeSetupPageProps = {
  unsafePasswordCount?: number
}

export function EmployeeSetupPage({ unsafePasswordCount = 1 }: EmployeeSetupPageProps) {
  const { showToast } = useWuShowToast()
  const { setup, setSetup } = useRosterStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [folderName, setFolderName] = useState(setup.folderName)
  const [logoOptions, setLogoOptions] = useState(DEFAULT_LOGO_OPTIONS)
  const [logo, setLogo] = useState<SelectOption>(DEFAULT_LOGO_OPTIONS[0])
  const [accessCode, setAccessCode] = useState(setup.accessCode)
  const [unsafeCount, setUnsafeCount] = useState(unsafePasswordCount)

  useEffect(() => {
    setFolderName(setup.folderName)
    setAccessCode(setup.accessCode)
  }, [setup.accessCode, setup.folderName])

  function saveFolder() {
    if (!folderName.trim()) {
      showToast({ message: 'Folder name is required', variant: 'error' })
      return
    }
    setSetup({ folderName: folderName.trim() })
    showToast({ message: 'Folder settings saved', variant: 'success' })
  }

  function saveAccessCode() {
    setSetup({ accessCode: accessCode.trim() })
    showToast({
      message: accessCode.trim() ? 'Access code saved' : 'Access code cleared',
      variant: 'success',
    })
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const option = { value: `custom-${Date.now()}`, label: file.name }
    setLogoOptions((current) => [...current, option])
    setLogo(option)
    showToast({ message: 'Logo uploaded', variant: 'success' })
  }

  function securePasswords() {
    if (unsafeCount === 0) {
      showToast({ message: 'All employee passwords are already secure', variant: 'info' })
      return
    }
    setUnsafeCount(0)
    showToast({ message: 'Unsafe passwords were reset', variant: 'success' })
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 bg-gray-50 px-6 py-6">
      <PageCard className="p-5">
        <WuHeading size="sm" className="mb-4 text-gray-700">
          Edit folder
        </WuHeading>
        <div className="max-w-xl space-y-4">
          <WuFormGroup
            Label="Name"
            labelPosition="left"
            Input={<WuInput value={folderName} onChange={(event) => setFolderName(event.target.value)} />}
          />
          <WuFormGroup
            Label="Logo"
            labelPosition="left"
            Hint={
              <span>
                239x52 pixels +{' '}
                <button
                  type="button"
                  className="text-blue-700 hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Image
                </button>
              </span>
            }
            Input={
              <WuSelect
                data={logoOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={logo}
                onSelect={(selected) => {
                  const option = (Array.isArray(selected) ? selected[0] : selected) as SelectOption | null
                  if (option) setLogo(option)
                }}
                variant="outlined"
              />
            }
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
        <div className="mt-5 flex justify-end">
          <WuButton onClick={saveFolder}>Save</WuButton>
        </div>
      </PageCard>

      <PageCard className="p-5">
        <WuHeading size="sm" className="mb-4 text-gray-700">
          Add/Edit access code
        </WuHeading>
        <div className="max-w-xl">
          <WuFormGroup
            Label="Access code"
            labelPosition="left"
            Input={<WuInput value={accessCode} onChange={(event) => setAccessCode(event.target.value)} />}
          />
        </div>
        <div className="mt-5 flex justify-end">
          <WuButton onClick={saveAccessCode}>Save</WuButton>
        </div>
      </PageCard>

      <PageCard className="p-5">
        <WuHeading size="sm" className="mb-4 text-gray-700">
          Secure passwords
        </WuHeading>
        <WuText size="sm" as="p" className="text-gray-700">
          Employees with unsafe passwords : {unsafeCount}
        </WuText>
        <div className="mt-5 flex justify-end">
          <WuButton onClick={securePasswords}>Secure passwords</WuButton>
        </div>
      </PageCard>
    </div>
  )
}
