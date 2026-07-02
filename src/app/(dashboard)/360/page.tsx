'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { MOCK_360_SURVEYS } from '@/data/mock-360';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);

const columns: IWuTableColumnDef<(typeof MOCK_360_SURVEYS)[0]>[] = [
  {
    accessorKey: 'name',
    header: '360 Survey Name',
    cell: (info) => (
      <Link href={`/360/${info.row.original.id}`} className="text-blue-600 hover:underline">
        {info.getValue() as string}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue() as string;
      const statusClass =
        status === 'active'
          ? 'text-green-600 font-medium'
          : status === 'draft'
            ? 'text-gray-600'
            : 'text-orange-600';
      return <span className={statusClass}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
    },
  },
  {
    accessorKey: 'subjectsCount',
    header: 'Subjects',
  },
  {
    accessorKey: 'completionRate',
    header: 'Completion Rate',
    cell: (info) => `${info.getValue()}%`,
  },
  {
    accessorKey: 'evaluatorsAssigned',
    header: 'Evaluators',
  },
];

export default function Page360List() {
  return (
    <div>
      <PageHeader
        title="360 Feedback"
        description="Manage 360-degree feedback surveys and reports"
        action={<WuButton>New 360 Survey</WuButton>}
      />
      <div className="mt-6">
        <WuTable data={MOCK_360_SURVEYS as unknown[]} columns={columns as unknown as IWuTableColumnDef<unknown>[]} />
      </div>
    </div>
  );
}
