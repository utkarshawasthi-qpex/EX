'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import {
  createInitiative,
  getAllUsers,
  getCurrentEmpowerUser,
} from '@/lib/empower/simulation'
import { preventModalDismiss } from '@/lib/modalProps'
import { EMPOWER_GOALS, type InitiativeGoal } from '@/types/empower'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuButton })),
  { ssr: false },
)
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuFormGroup })),
  { ssr: false },
)
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuInput })),
  { ssr: false },
)
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuModal })),
  { ssr: false },
)
const WuModalContent = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((module) => ({
      default: module.WuModalContent,
    })),
  { ssr: false },
)
const WuModalFooter = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((module) => ({
      default: module.WuModalFooter,
    })),
  { ssr: false },
)
const WuModalHeader = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((module) => ({
      default: module.WuModalHeader,
    })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((module) => ({ default: module.WuSelect })),
  { ssr: false },
)
const WuTextarea = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((module) => ({
      default: module.WuTextarea,
    })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

type CreateInitiativeModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (id: string) => void
}

export function CreateInitiativeModal({
  open,
  onOpenChange,
  onCreated,
}: CreateInitiativeModalProps) {
  const currentUser = getCurrentEmpowerUser()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState<SelectOption | null>(null)
  const [owner, setOwner] = useState<SelectOption | null>(null)
  const [error, setError] = useState<string | null>(null)

  const goalOptions = useMemo(
    () => EMPOWER_GOALS.map((item) => ({ value: item.id, label: item.label })),
    [],
  )
  const ownerOptions = useMemo(
    () => getAllUsers().map((user) => ({ value: user.id, label: `${user.name} · ${user.dept}` })),
    [],
  )

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
    setGoal(goalOptions[0] ?? null)
    setOwner(
      ownerOptions.find((option) => option.value === currentUser.id) ??
        ownerOptions[0] ??
        null,
    )
    setError(null)
  }, [currentUser.id, goalOptions, open, ownerOptions])

  function handleCreate() {
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!goal || !owner) {
      setError('Choose a goal and owner.')
      return
    }

    const initiative = createInitiative({
      name,
      description,
      goalId: goal.value as InitiativeGoal,
      createdBy: currentUser.id,
      ownerId: owner.value,
    })
    onCreated?.(initiative.id)
    onOpenChange(false)
  }

  return (
    <WuModal open={open} onOpenChange={onOpenChange} size="md">
      <WuModalHeader>Create Initiative</WuModalHeader>
      <WuModalContent {...preventModalDismiss}>
        <div className="space-y-4">
          <WuFormGroup
            Label="Name"
            Input={
              <WuInput
                variant="outlined"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Improve manager communication"
              />
            }
          />
          <WuFormGroup
            Label="Description"
            Input={
              <WuTextarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What should this initiative change?"
              />
            }
          />
          <WuFormGroup
            Label="Goal"
            Input={
              <WuSelect
                data={goalOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={goal}
                onSelect={(value) => setGoal(value as SelectOption)}
                variant="outlined"
              />
            }
          />
          <WuFormGroup
            Label="Owner"
            Input={
              <WuSelect
                data={ownerOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={owner}
                onSelect={(value) => setOwner(value as SelectOption)}
                variant="outlined"
              />
            }
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className="flex w-full justify-end gap-2">
          <WuButton variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </WuButton>
          <WuButton variant="primary" onClick={handleCreate}>
            Create Initiative
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  )
}
