'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { preventModalDismiss } from '@/lib/modalProps'
import {
  DISPLAY_TYPE_OPTIONS,
  FIELD_TYPE_OPTIONS,
  SCALE_LIBRARY_OPTIONS,
  SURVEY_CUSTOM_VARIABLE_OPTIONS,
  type DirectoryCustomField,
} from '@/data/mock-custom-fields'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuFormGroup })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuInput })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModal })),
  { ssr: false },
)
const WuModalClose = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalClose })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalContent })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalFooter })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuModalHeader })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuSelect })),
  { ssr: false },
)
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuTextarea })),
  { ssr: false },
)

type SelectOption = {
  value: string
  label: string
}

type EditCustomFieldModalProps = {
  field: DirectoryCustomField | null
  onOpenChange: (open: boolean) => void
  onSave: (field: DirectoryCustomField) => void
}

function optionFrom(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value) ?? options[0]
}

function parseOptions(text: string) {
  return Array.from(
    new Set(
      text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  )
}

export function EditCustomFieldModal({ field, onOpenChange, onSave }: EditCustomFieldModalProps) {
  const { showToast } = useWuShowToast()
  const [title, setTitle] = useState('')
  const [fieldType] = useState<SelectOption>(FIELD_TYPE_OPTIONS[0])
  const [scaleLibrary, setScaleLibrary] = useState<SelectOption>(SCALE_LIBRARY_OPTIONS[0])
  const [displayType, setDisplayType] = useState<SelectOption>(DISPLAY_TYPE_OPTIONS[0])
  const [optionsText, setOptionsText] = useState('')
  const [surveyVariable, setSurveyVariable] = useState<SelectOption>(
    SURVEY_CUSTOM_VARIABLE_OPTIONS[0],
  )

  useEffect(() => {
    if (!field) return
    setTitle(field.title)
    setScaleLibrary(optionFrom(SCALE_LIBRARY_OPTIONS, field.scaleLibrary))
    setDisplayType(optionFrom(DISPLAY_TYPE_OPTIONS, field.displayType))
    setOptionsText(field.options.join('\n'))
    setSurveyVariable(optionFrom(SURVEY_CUSTOM_VARIABLE_OPTIONS, field.surveyCustomVariable))
  }, [field])

  function handleUpdate() {
    if (!field) return
    const nextTitle = title.trim()
    if (!nextTitle) {
      showToast({ message: 'Title is required', variant: 'error' })
      return
    }
    const options = parseOptions(optionsText)
    if (options.length === 0) {
      showToast({ message: 'Add at least one option', variant: 'error' })
      return
    }

    const isNew = !field.key
    onSave({
      ...field,
      title: nextTitle,
      scaleLibrary: scaleLibrary.value,
      displayType: displayType.value as DirectoryCustomField['displayType'],
      options,
      surveyCustomVariable: surveyVariable.value,
    })
    showToast({
      message: isNew ? 'Custom field added' : 'Custom field updated',
      variant: 'success',
    })
    onOpenChange(false)
  }

  return (
    <WuModal open={Boolean(field)} onOpenChange={onOpenChange} size="md" {...preventModalDismiss}>
      <WuModalHeader>{field?.key ? 'Edit Custom Field' : 'Add Custom Field'}</WuModalHeader>
      <WuModalContent>
        <div className="flex flex-col gap-4">
          <WuFormGroup
            Label="Title"
            Input={<WuInput value={title} onChange={(event) => setTitle(event.target.value)} />}
          />
          <WuFormGroup
            Label="Field Type"
            Input={
              <WuSelect
                data={FIELD_TYPE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={fieldType}
                variant="outlined"
                disabled
              />
            }
          />
          <WuFormGroup
            Label="Scale Library"
            Input={
              <WuSelect
                data={SCALE_LIBRARY_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={scaleLibrary}
                onSelect={(selected) => {
                  const option = (Array.isArray(selected) ? selected[0] : selected) as SelectOption | null
                  if (option) setScaleLibrary(option)
                }}
                variant="outlined"
              />
            }
          />
          <WuFormGroup
            Label="Display Type"
            Input={
              <WuSelect
                data={DISPLAY_TYPE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={displayType}
                onSelect={(selected) => {
                  const option = (Array.isArray(selected) ? selected[0] : selected) as SelectOption | null
                  if (option) setDisplayType(option)
                }}
                variant="outlined"
              />
            }
          />
          <WuFormGroup
            Label="Options"
            Hint="One Per Line"
            Input={
              <WuTextarea
                rows={8}
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
              />
            }
          />
          <WuFormGroup
            Label="Survey Custom Variable"
            Input={
              <WuSelect
                data={SURVEY_CUSTOM_VARIABLE_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={surveyVariable}
                onSelect={(selected) => {
                  const option = (Array.isArray(selected) ? selected[0] : selected) as SelectOption | null
                  if (option) setSurveyVariable(option)
                }}
                variant="outlined"
                virtualizedThreshold={40}
              />
            }
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleUpdate}>{field?.key ? 'Update' : 'Add'}</WuButton>
      </WuModalFooter>
    </WuModal>
  )
}
