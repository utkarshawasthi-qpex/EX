'use client'

import { useMemo, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib'
import { AccessRuleModal } from '@/components/employees/AccessRuleModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { getVisibleCustomFields } from '@/data/mock-custom-fields'
import { DIRECTORY_LANGUAGES, getEmployeeDisplayName } from '@/data/mock-employee-directory'
import {
  getEmployeeFilterFields,
  summarizeFilterGroups,
  type EmployeeFilterField,
  type EmployeeFilterPreset,
} from '@/data/mock-employee-filters'
import {
  SAMPLE_PORTAL_ACCESS_RULES,
  createBlankFilterAccessRule,
  getPortalFilterAccessLabels,
  type PortalAccessRule,
  type PortalAccessSettings,
  type PortalFilterAccessRule,
} from '@/data/mock-portal-settings'
import { usePortalSettings } from '@/lib/portalSettingsStore'
import { useRosterStore } from '@/lib/rosterStore'
import { cn } from '@/lib/utils'

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuButton })),
  { ssr: false },
)
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((mod) => ({ default: mod.WuToggle })),
  { ssr: false },
)

function HelpButton({ message }: { message: string }) {
  const { showToast } = useWuShowToast()
  return (
    <button
      type="button"
      className="ml-1.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#1B87E6] text-[10px] font-semibold leading-none text-white hover:bg-blue-700"
      aria-label="Help"
      onClick={() => showToast({ message, variant: 'info' })}
    >
      ?
    </button>
  )
}

function AccessToggle({
  checked,
  disabled,
  onChange,
  labelledBy,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  labelledBy: string
}) {
  return (
    <div
      className="flex w-max items-center justify-self-end [&_label]:hidden [&_p]:hidden"
      aria-labelledby={labelledBy}
    >
      <WuToggle
        checked={checked}
        disabled={disabled}
        onChange={(next) => {
          if (disabled) return
          onChange(next)
        }}
      />
    </div>
  )
}

function AccessRow({
  label,
  checked,
  onChange,
  disabled = false,
  nested = false,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  nested?: boolean
}) {
  const labelId = `portal-access-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <>
      <span
        id={labelId}
        className={cn(
          'text-sm leading-5',
          nested ? 'pl-2 text-gray-700' : 'whitespace-nowrap font-medium text-gray-800',
          disabled && 'opacity-50',
        )}
      >
        {label}
      </span>
      <AccessToggle
        labelledBy={labelId}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
    </>
  )
}

function AccessNested({ disabled, children }: { disabled: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        'col-span-2 my-0.5 grid grid-cols-subgrid items-center gap-x-4 gap-y-1.5 rounded-md border border-gray-200 bg-[#FAFBFC] py-1',
        disabled && 'opacity-50',
      )}
    >
      {children}
    </div>
  )
}

function namesFor(ids: string[], employees: { id: string; firstName: string; lastName: string }[]) {
  const names = ids
    .map((id) => employees.find((employee) => employee.id === id))
    .filter((employee): employee is NonNullable<typeof employee> => Boolean(employee))
    .map((employee) => getEmployeeDisplayName(employee))
  if (names.length === 0) return '—'
  if (names.length === 1) return names[0]
  return `${names[0]} +${names.length - 1}`
}

function blankDataRule(): PortalAccessRule {
  return {
    id: `rule_new_${Date.now()}`,
    name: '',
    description: '',
    userIds: [],
    allowedEmployeeIds: [],
  }
}

function formatFilterAudiences(
  rule: PortalFilterAccessRule,
  fields: EmployeeFilterField[],
  savedFilters: EmployeeFilterPreset[],
) {
  if (rule.audiences.length === 0) return '—'
  return rule.audiences
    .map((audience) => {
      const savedName =
        audience.source === 'saved'
          ? savedFilters.find((filter) => filter.id === audience.savedFilterId)?.name
          : undefined
      const who =
        audience.source === 'saved'
          ? savedName ?? 'Missing employee group'
          : summarizeFilterGroups(audience.peopleGroups, fields)
      return `${who} → ${getPortalFilterAccessLabels(audience.allowedFilterIds)}`
    })
    .join(' | ')
}

type SortKey = 'name' | 'users' | 'allowed'

function AccessRulesCard<T extends { id: string; name: string; description: string; userIds: string[] }>({
  title,
  helpMessage,
  allowedColumnLabel,
  rules,
  employees,
  formatAllowed,
  onImport,
  onAdd,
  onEdit,
  onDelete,
  onLearnMore,
}: {
  title: string
  helpMessage: string
  allowedColumnLabel: string
  rules: T[]
  employees: { id: string; firstName: string; lastName: string }[]
  formatAllowed: (rule: T) => string
  onImport: () => void
  onAdd: () => void
  onEdit: (rule: T) => void
  onDelete: (rule: T) => void
  onLearnMore: () => void
}) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedRules = useMemo(() => {
    const modifier = sortDir === 'asc' ? 1 : -1
    return [...rules].sort((a, b) => {
      if (sortKey === 'users') return (a.userIds.length - b.userIds.length) * modifier
      if (sortKey === 'allowed') {
        return formatAllowed(a).localeCompare(formatAllowed(b)) * modifier
      }
      return a.name.localeCompare(b.name) * modifier
    })
  }, [formatAllowed, rules, sortDir, sortKey])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  return (
    <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center">
          <h2 className="text-base font-medium text-gray-900">{title}</h2>
          <HelpButton message={helpMessage} />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-blue-700"
            onClick={onImport}
          >
            <span className="wm-person-add text-base" aria-hidden />
            Import rules
          </button>
          <WuButton onClick={onAdd}>+ Add rule</WuButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="w-10 px-2 py-3 font-medium">#</th>
              <th className="px-2 py-3 font-medium">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort('name')}>
                  Rule name
                  <span className="text-[10px] text-gray-400">↕</span>
                </button>
              </th>
              <th className="px-2 py-3 font-medium">Description</th>
              <th className="px-2 py-3 font-medium">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort('users')}>
                  Users
                  <span className="text-[10px] text-gray-400">↕</span>
                </button>
              </th>
              <th className="px-2 py-3 font-medium">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort('allowed')}>
                  {allowedColumnLabel}
                  <span className="text-[10px] text-gray-400">↕</span>
                </button>
              </th>
              <th className="w-16 px-2 py-3 text-right" />
            </tr>
          </thead>
          <tbody>
            {sortedRules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-sm text-gray-500">
                  No data to display.{' '}
                  <button type="button" className="text-blue-700 hover:underline" onClick={onLearnMore}>
                    Learn more
                  </button>
                </td>
              </tr>
            ) : (
              sortedRules.map((rule, index) => (
                <tr key={rule.id} className="border-b border-gray-100">
                  <td className="px-2 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      className="text-blue-700 hover:underline"
                      onClick={() => onEdit(rule)}
                    >
                      {rule.name}
                    </button>
                  </td>
                  <td className="px-2 py-3 text-gray-600">{rule.description || '—'}</td>
                  <td className="px-2 py-3 text-gray-700">{namesFor(rule.userIds, employees)}</td>
                  <td className="px-2 py-3 text-gray-700">{formatAllowed(rule)}</td>
                  <td className="px-2 py-3 text-right">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-600"
                      aria-label={`Delete ${rule.name}`}
                      onClick={() => onDelete(rule)}
                    >
                      <span className="wm-delete" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function FilterAccessRulesCard({
  rules,
  filterFields,
  savedFilters,
  onAdd,
  onEdit,
  onDelete,
  onLearnMore,
  onGoToEmployeeFilters,
}: {
  rules: PortalFilterAccessRule[]
  filterFields: EmployeeFilterField[]
  savedFilters: EmployeeFilterPreset[]
  onAdd: () => void
  onEdit: (rule: PortalFilterAccessRule) => void
  onDelete: (rule: PortalFilterAccessRule) => void
  onLearnMore: () => void
  onGoToEmployeeFilters: () => void
}) {
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedRules = useMemo(() => {
    const modifier = sortDir === 'asc' ? 1 : -1
    return [...rules].sort((a, b) => a.name.localeCompare(b.name) * modifier)
  }, [rules, sortDir])

  return (
    <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center">
          <h2 className="text-base font-medium text-gray-900">Filter access rules</h2>
          <HelpButton message="By default everyone can use every dashboard and tab filter. Add a rule to limit filters for matching employees on every dashboard they create or that is shared with them." />
        </div>
        {savedFilters.length > 0 ? <WuButton onClick={onAdd}>+ Add rule</WuButton> : null}
      </div>

      {savedFilters.length === 0 ? (
        <EmptyState
          icon="wm-filter-list"
          title="No employee groups"
          description="To add an access rule for dashboard filters, create an employee group first."
          action={<WuButton onClick={onGoToEmployeeFilters}>Go to Employee Filters</WuButton>}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="w-10 px-2 py-3 font-medium">#</th>
                  <th className="px-2 py-3 font-medium">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))}
                    >
                      Rule name
                      <span className="text-[10px] text-gray-400">↕</span>
                    </button>
                  </th>
                  <th className="px-2 py-3 font-medium">Applies to</th>
                  <th className="w-16 px-2 py-3 text-right" />
                </tr>
              </thead>
              <tbody>
                {sortedRules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-6 text-sm text-gray-500">
                      No data to display.{' '}
                      <button type="button" className="text-blue-700 hover:underline" onClick={onLearnMore}>
                        Learn more
                      </button>
                    </td>
                  </tr>
                ) : (
                  sortedRules.map((rule, index) => (
                    <tr key={rule.id} className="border-b border-gray-100">
                      <td className="px-2 py-3 text-gray-500">{index + 1}</td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          className="text-blue-700 hover:underline"
                          onClick={() => onEdit(rule)}
                        >
                          {rule.name}
                        </button>
                        {rule.description ? (
                          <p className="mt-0.5 text-xs text-gray-500">{rule.description}</p>
                        ) : null}
                      </td>
                      <td className="px-2 py-3 text-gray-700">
                        {formatFilterAudiences(rule, filterFields, savedFilters)}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-blue-700"
                            aria-label={`Edit ${rule.name}`}
                            onClick={() => onEdit(rule)}
                          >
                            <span className="wm-edit" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-red-600"
                            aria-label={`Delete ${rule.name}`}
                            onClick={() => onDelete(rule)}
                          >
                            <span className="wm-delete" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

export function PortalPermissionsPage({
  onGoToEmployeeFilters,
}: {
  onGoToEmployeeFilters: () => void
}) {
  const { showToast } = useWuShowToast()
  const {
    portalAccess,
    accessRules,
    filterAccessRules,
    patchAccess,
    saveAccessRule,
    deleteAccessRule,
    importAccessRules,
    saveFilterAccessRule,
    deleteFilterAccessRule,
  } = usePortalSettings()
  const { employees, customFields, savedFilters } = useRosterStore()
  const filterFields = useMemo(
    () =>
      getEmployeeFilterFields({
        customFields: getVisibleCustomFields(customFields),
        languageOptions: DIRECTORY_LANGUAGES,
        managerOptions: employees.map((employee) => ({
          value: employee.id,
          label: getEmployeeDisplayName(employee),
        })),
      }),
    [customFields, employees],
  )
  const [editingDataRule, setEditingDataRule] = useState<PortalAccessRule | null>(null)
  const [editingFilterRule, setEditingFilterRule] = useState<PortalFilterAccessRule | null>(null)
  const [dataRuleToDelete, setDataRuleToDelete] = useState<PortalAccessRule | null>(null)
  const [filterRuleToDelete, setFilterRuleToDelete] = useState<PortalFilterAccessRule | null>(null)

  function toggleAccess<K extends keyof PortalAccessSettings>(key: K, checked: boolean) {
    patchAccess({ [key]: checked } as Partial<PortalAccessSettings>)
    if (key === 'culture' && checked) {
      showToast({
        message: 'Culture portal is a placeholder until that portal is built.',
        variant: 'info',
      })
    }
  }

  function handleImportDataRules() {
    const existing = new Set(accessRules.map((rule) => rule.id))
    const incoming = SAMPLE_PORTAL_ACCESS_RULES.filter((rule) => !existing.has(rule.id))
    if (incoming.length === 0) {
      showToast({ message: 'Sample data access rules are already imported', variant: 'info' })
      return
    }
    importAccessRules(incoming)
    showToast({ message: `${incoming.length} data access rules imported`, variant: 'success' })
  }

  return (
    <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-start">
      <section className="w-[300px] shrink-0 self-start rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center">
          <h2 className="text-base font-medium text-gray-900">Portal access</h2>
          <HelpButton message="These toggles decide which portals appear in the portal header switcher for admins and employees. Employee Experience nested toggles control what employees can do in that portal." />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5">
          <AccessRow
            label="Culture"
            checked={portalAccess.culture}
            onChange={(checked) => toggleAccess('culture', checked)}
          />
          <AccessNested disabled={!portalAccess.culture}>
            <AccessRow
              nested
              disabled={!portalAccess.culture}
              label="Understand your culture"
              checked={portalAccess.understandCulture}
              onChange={(checked) => toggleAccess('understandCulture', checked)}
            />
            <AccessRow
              nested
              disabled={!portalAccess.culture}
              label="Analyzing your culture profile"
              checked={portalAccess.analyzingCulture}
              onChange={(checked) => toggleAccess('analyzingCulture', checked)}
            />
            <AccessRow
              nested
              disabled={!portalAccess.culture}
              label="Activate your culture"
              checked={portalAccess.activateCulture}
              onChange={(checked) => toggleAccess('activateCulture', checked)}
            />
          </AccessNested>

          <AccessRow
            label="Employee experience"
            checked={portalAccess.employeeExperience}
            onChange={(checked) => toggleAccess('employeeExperience', checked)}
          />
          <AccessNested disabled={!portalAccess.employeeExperience}>
            <AccessRow
              nested
              disabled={!portalAccess.employeeExperience}
              label="Create dashboard"
              checked={portalAccess.createDashboard}
              onChange={(checked) => toggleAccess('createDashboard', checked)}
            />
            <AccessRow
              nested
              disabled={!portalAccess.employeeExperience}
              label="Create widget"
              checked={portalAccess.createWidget}
              onChange={(checked) => toggleAccess('createWidget', checked)}
            />
            <AccessRow
              nested
              disabled={!portalAccess.employeeExperience}
              label="Driver analysis color code"
              checked={portalAccess.driverAnalysisColorCode}
              onChange={(checked) => toggleAccess('driverAnalysisColorCode', checked)}
            />
          </AccessNested>

          <AccessRow
            label="360"
            checked={portalAccess.threeSixty}
            onChange={(checked) => toggleAccess('threeSixty', checked)}
          />
        </div>
      </section>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <AccessRulesCard
          title="Data access rules"
          helpMessage="By default employees see dashboard data based on hierarchy. Add a rule to give selected users custom access to another employee or group."
          allowedColumnLabel="Allowed employees"
          rules={accessRules}
          employees={employees}
          formatAllowed={(rule) => namesFor(rule.allowedEmployeeIds, employees)}
          onImport={handleImportDataRules}
          onAdd={() => setEditingDataRule(blankDataRule())}
          onEdit={setEditingDataRule}
          onDelete={setDataRuleToDelete}
          onLearnMore={() =>
            showToast({
              message:
                'Data access rules override hierarchy so selected users can see another employee or group’s dashboard data.',
              variant: 'info',
            })
          }
        />
        <FilterAccessRulesCard
          rules={filterAccessRules}
          filterFields={filterFields}
          savedFilters={savedFilters}
          onAdd={() => setEditingFilterRule(createBlankFilterAccessRule())}
          onEdit={setEditingFilterRule}
          onDelete={setFilterRuleToDelete}
          onGoToEmployeeFilters={onGoToEmployeeFilters}
          onLearnMore={() =>
            showToast({
              message:
                'Filter access rules apply to dashboard and tab filters on every dashboard a matching employee creates or that is shared with them. Everyone keeps all filters until they match an employee group.',
              variant: 'info',
            })
          }
        />
      </div>

      <AccessRuleModal
        mode="data"
        rule={editingDataRule}
        employees={employees}
        onOpenChange={(open) => {
          if (!open) setEditingDataRule(null)
        }}
        onSave={saveAccessRule}
      />
      <AccessRuleModal
        mode="filter"
        rule={editingFilterRule}
        employees={employees}
        onOpenChange={(open) => {
          if (!open) setEditingFilterRule(null)
        }}
        onSave={saveFilterAccessRule}
        onGoToEmployeeFilters={onGoToEmployeeFilters}
      />
      <ConfirmModal
        open={Boolean(dataRuleToDelete)}
        onOpenChange={(open) => {
          if (!open) setDataRuleToDelete(null)
        }}
        title="Delete data access rule?"
        description={
          dataRuleToDelete
            ? `${dataRuleToDelete.name} will no longer grant custom dashboard data access.`
            : 'This rule will be removed.'
        }
        confirmLabel="Delete"
        variant="critical"
        onConfirm={() => {
          if (!dataRuleToDelete) return
          deleteAccessRule(dataRuleToDelete.id)
          setDataRuleToDelete(null)
          showToast({ message: 'Data access rule deleted', variant: 'success' })
        }}
      />
      <ConfirmModal
        open={Boolean(filterRuleToDelete)}
        onOpenChange={(open) => {
          if (!open) setFilterRuleToDelete(null)
        }}
        title="Delete filter access rule?"
        description={
          filterRuleToDelete
            ? `${filterRuleToDelete.name} will no longer limit dashboard filters for those users.`
            : 'This rule will be removed.'
        }
        confirmLabel="Delete"
        variant="critical"
        onConfirm={() => {
          if (!filterRuleToDelete) return
          deleteFilterAccessRule(filterRuleToDelete.id)
          setFilterRuleToDelete(null)
          showToast({ message: 'Filter access rule deleted', variant: 'success' })
        }}
      />
    </div>
  )
}
