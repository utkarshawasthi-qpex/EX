'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmpowerPageShell } from '@/components/empower/EmpowerPageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  MOCK_EMPOWER_INITIATIVES,
  type EmpowerInitiative,
} from '@/data/mock-empower';
import { formatDate } from '@/data/mock-utils';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

function StatusBadge({ status }: { status: EmpowerInitiative['status'] }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    completed: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function EmpowerInitiativesPage() {
  const { showToast } = useWuShowToast();
  const [search, setSearch] = useState('');

  const columns: IWuTableColumnDef<EmpowerInitiative>[] = [
    {
      accessorKey: 'name',
      header: 'Initiative',
      filterable: true,
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
      filterable: true,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'tasksInProgress',
      header: 'Tasks',
      headerAlign: 'right',
      cellAlign: 'right',
    },
    {
      accessorKey: 'dueDate',
      header: 'Due',
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
  ];

  const data = useMemo(() => MOCK_EMPOWER_INITIATIVES, []);

  return (
    <EmpowerPageShell
      title="Initiatives"
      toolbar={
        <WuButton onClick={() => showToast({ message: 'Initiative created', variant: 'success' })}>
          <span className="wm-add" /> New initiative
        </WuButton>
      }
    >
      <div className="mb-4">
        <WuInput
          variant="outlined"
          placeholder="Search initiatives..."
          Icon={<span className="wm-search" />}
          iconPosition="left"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 bg-white"
        />
      </div>
      <WuTable
        data={data as unknown[]}
        columns={columns as unknown as IWuTableColumnDef<unknown>[]}
        variant="striped"
        sort={{ enabled: true }}
        filterText={search}
        NoDataContent={
          <EmptyState
            icon="wm-search-off"
            title="No initiatives found"
            description="Try adjusting your search"
          />
        }
      />
    </EmpowerPageShell>
  );
}
