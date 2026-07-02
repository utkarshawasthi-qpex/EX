'use client';

import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  EMPOWER_UPCOMING_INITIATIVE_TITLE,
  MOCK_EMPOWER_UPCOMING_TASKS,
  type EmpowerUpcomingTask,
  type EmpowerUpcomingTaskStatus,
} from '@/data/mock-empower';
import { formatDate } from '@/data/mock-utils';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);

function TaskStatusBadge({ status }: { status: EmpowerUpcomingTaskStatus }) {
  const labels: Record<EmpowerUpcomingTaskStatus, string> = {
    not_started: 'Not started',
    in_progress: 'In progress',
    completed: 'Completed',
    overdue: 'Overdue',
  };
  const styles: Record<EmpowerUpcomingTaskStatus, string> = {
    not_started: 'wu-bg-gray-20 wu-text-gray-lead',
    in_progress: 'wu-bg-blue-p/10 wu-text-blue-q',
    completed: 'wu-bg-green-100 wu-text-green-700',
    overdue: 'wu-bg-amber-100 wu-text-amber-800',
  };
  return (
    <span
      className={`wu-inline-flex wu-px-2 wu-py-0.5 wu-rounded-full wu-text-xs wu-font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function EmpowerHomeMain() {
  const { showToast } = useWuShowToast();

  const columns: IWuTableColumnDef<EmpowerUpcomingTask>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      filterable: true,
      cell: ({ row }) => (
        <span className="wu-font-medium wu-text-gray-lead">{row.original.name}</span>
      ),
    },
    { accessorKey: 'owner', header: 'Owner', filterable: true },
    { accessorKey: 'contributor', header: 'Contributor', filterable: true },
    {
      accessorKey: 'due',
      header: 'Due',
      cell: ({ row }) => formatDate(row.original.due),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <TaskStatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div className="wu-min-w-0 wu-flex wu-flex-col wu-gap-6">
      <div className="wu-flex wu-flex-col sm:wu-flex-row sm:wu-items-center sm:wu-justify-between wu-gap-4">
        <WuHeading size="lg" className="wu-text-gray-lead">
          Welcome to Empower
        </WuHeading>
        <WuButton
          onClick={() => showToast({ message: 'New initiative created', variant: 'success' })}
        >
          <span className="wm-add" /> New initiative
        </WuButton>
      </div>

      <div>
        <WuHeading size="sm" className="wu-text-gray-lead wu-mb-2">
          Upcoming tasks
        </WuHeading>
        <p className="wu-text-sm wu-font-medium wu-text-gray-lead wu-mb-4">
          {EMPOWER_UPCOMING_INITIATIVE_TITLE}
        </p>
        <WuTable
          data={MOCK_EMPOWER_UPCOMING_TASKS as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="striped"
          sort={{ enabled: true }}
        />
      </div>
    </div>
  );
}
