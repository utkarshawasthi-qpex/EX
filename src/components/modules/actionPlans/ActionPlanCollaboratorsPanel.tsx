'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { mockEmployees } from '@/data/mock/employees'
import { getEmployeeName } from '@/lib/empowerIntegration/storage'
import { getCurrentUser } from '@/lib/userContext'
import type {
  ActionPlanCollaborator,
  ActionPlanCollaboratorTier,
  EmpowerInitiativeRecord,
} from '@/types/empowerIntegration'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
)
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
)

type SelectOption = { value: string; label: string }

const TIER_OPTIONS: SelectOption[] = [
  { value: 'view', label: 'View only' },
  { value: 'view_assign', label: 'View + assign tasks' },
  { value: 'co_manage', label: 'Co-manage' },
]

function tierLabel(tier: ActionPlanCollaboratorTier): string {
  return TIER_OPTIONS.find((o) => o.value === tier)?.label ?? tier
}

type Props = {
  initiative: EmpowerInitiativeRecord
  onUpdated: (next: EmpowerInitiativeRecord) => void
}

export function ActionPlanCollaboratorsPanel({ initiative, onUpdated }: Props) {
  const { showToast } = useWuShowToast()
  const user = getCurrentUser()
  const [selectedManager, setSelectedManager] = useState<SelectOption | null>(null)
  const [selectedTier, setSelectedTier] = useState<SelectOption>(TIER_OPTIONS[0])

  const collaborators = initiative.collaborators ?? []

  const managerOptions = useMemo((): SelectOption[] => {
    const existing = new Set([
      initiative.ownerId,
      ...collaborators.map((c) => c.userId),
    ])
    return mockEmployees
      .filter((e) => e.id !== user?.id && !existing.has(e.id))
      .slice(0, 12)
      .map((e) => ({
        value: e.id,
        label: `${e.firstName} ${e.lastName}`,
      }))
  }, [collaborators, initiative.ownerId, user?.id])

  function invite() {
    if (!selectedManager || !user) return
    const entry: ActionPlanCollaborator = {
      userId: selectedManager.value,
      tier: selectedTier.value as ActionPlanCollaboratorTier,
      invitedAt: new Date().toISOString(),
      invitedBy: user.id,
      acceptedAt: new Date().toISOString(),
    }
    onUpdated({
      ...initiative,
      collaborators: [...collaborators, entry],
    })
    setSelectedManager(null)
    showToast({ variant: 'success', message: `Invited ${selectedManager.label} (${tierLabel(entry.tier)})` })
  }

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-gray-600">
        Invite other managers to view or co-own this plan. Tiers: view, assign tasks, or co-manage.
      </p>
      {collaborators.length === 0 ? (
        <p className="text-sm text-gray-500">No collaborators yet.</p>
      ) : (
        <ul className="divide-y rounded border border-gray-200">
          {collaborators.map((c) => (
            <li key={c.userId} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="font-medium text-gray-800">{getEmployeeName(c.userId)}</span>
              <span className="text-gray-500">{tierLabel(c.tier)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px]">
          <WuSelect
            data={managerOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedManager ?? undefined}
            onSelect={(v) => setSelectedManager(v as SelectOption)}
            variant="outlined"
            placeholder="Select manager"
          />
        </div>
        <div className="min-w-[180px]">
          <WuSelect
            data={TIER_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedTier}
            onSelect={(v) => setSelectedTier(v as SelectOption)}
            variant="outlined"
          />
        </div>
        <WuButton variant="secondary" onClick={invite} disabled={!selectedManager}>
          Invite
        </WuButton>
      </div>
    </div>
  )
}
