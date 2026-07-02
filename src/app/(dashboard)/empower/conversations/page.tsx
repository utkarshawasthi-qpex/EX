'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { EmpowerPageShell } from '@/components/empower/EmpowerPageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { MOCK_EMPOWER_CONVERSATIONS, type EmpowerConversation } from '@/data/mock-empower';
import { formatRelativeDate } from '@/data/mock-utils';

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

export default function EmpowerConversationsPage() {
  const { showToast } = useWuShowToast();
  const [search, setSearch] = useState('');

  const columns: IWuTableColumnDef<EmpowerConversation>[] = [
    {
      accessorKey: 'subject',
      header: 'Subject',
      filterable: true,
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-blue-600 hover:underline text-left"
          onClick={() =>
            showToast({
              message: `Opened "${row.original.subject}"`,
              variant: 'success',
            })
          }
        >
          {row.original.subject}
        </button>
      ),
    },
    { accessorKey: 'participants', header: 'Participants', filterable: true },
    {
      accessorKey: 'lastMessageAt',
      header: 'Last activity',
      cell: ({ row }) => formatRelativeDate(row.original.lastMessageAt),
    },
    {
      accessorKey: 'unreadCount',
      header: 'Unread',
      headerAlign: 'right',
      cellAlign: 'right',
      cell: ({ row }) =>
        row.original.unreadCount > 0 ? (
          <span className="inline-flex min-w-5 justify-center rounded-full bg-blue-600 text-white text-xs px-1.5 py-0.5">
            {row.original.unreadCount}
          </span>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <EmpowerPageShell
      title="Conversations"
      toolbar={
        <WuButton
          onClick={() => showToast({ message: 'New conversation started', variant: 'success' })}
        >
          <span className="wm-add" /> New conversation
        </WuButton>
      }
    >
      <div className="mb-4">
        <WuInput
          variant="outlined"
          placeholder="Search conversations..."
          Icon={<span className="wm-search" />}
          iconPosition="left"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 bg-white"
        />
      </div>
      <WuTable
        data={MOCK_EMPOWER_CONVERSATIONS as unknown[]}
        columns={columns as unknown as IWuTableColumnDef<unknown>[]}
        variant="striped"
        sort={{ enabled: true }}
        filterText={search}
        NoDataContent={
          <EmptyState
            icon="wm-forum"
            title="No conversations"
            description="Start a conversation with your team"
            action={
              <WuButton
                onClick={() =>
                  showToast({ message: 'New conversation started', variant: 'success' })
                }
              >
                New conversation
              </WuButton>
            }
          />
        }
      />
    </EmpowerPageShell>
  );
}
