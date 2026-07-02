'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { EmpowerPageShell } from '@/components/empower/EmpowerPageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { MOCK_EMPOWER_TEAM, type EmpowerTeamMember } from '@/data/mock-empower';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

export default function EmpowerTeamViewPage() {
  const [search, setSearch] = useState('');

  const columns: IWuTableColumnDef<EmpowerTeamMember>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      filterable: true,
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.original.name}</span>
      ),
    },
    { accessorKey: 'role', header: 'Role', filterable: true },
    { accessorKey: 'department', header: 'Department', filterable: true },
    {
      accessorKey: 'openTasks',
      header: 'Open tasks',
      headerAlign: 'right',
      cellAlign: 'right',
    },
    {
      accessorKey: 'initiativesOwned',
      header: 'Initiatives',
      headerAlign: 'right',
      cellAlign: 'right',
    },
  ];

  return (
    <EmpowerPageShell title="Team view">
      <div className="mb-4">
        <WuInput
          variant="outlined"
          placeholder="Search team members..."
          Icon={<span className="wm-search" />}
          iconPosition="left"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 bg-white"
        />
      </div>
      <WuTable
        data={MOCK_EMPOWER_TEAM as unknown[]}
        columns={columns as unknown as IWuTableColumnDef<unknown>[]}
        variant="striped"
        sort={{ enabled: true }}
        filterText={search}
        NoDataContent={
          <EmptyState
            icon="wm-search-off"
            title="No team members found"
            description="Try adjusting your search"
          />
        }
      />
    </EmpowerPageShell>
  );
}
