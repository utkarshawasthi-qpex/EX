'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  EMPLOYEE_PORTAL_COUNT,
  MOCK_STUDIES,
  STUDY_FOLDERS,
  type Study,
  type StudyStatus,
} from '@/data/mock-studies';
import { formatStudyDate } from '@/data/mock-utils';
import { StudiesFooter } from '@/components/studies/StudiesFooter';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);
const WuMenuSeparatorItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuSeparatorItem })),
  { ssr: false }
);
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false }
);

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

function StudyStatusSelect({ status }: { status: StudyStatus }) {
  const [value, setValue] = useState(STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0]);

  return (
    <WuSelect
      data={STATUS_OPTIONS}
      accessorKey={{ value: 'value', label: 'label' }}
      value={value}
      onSelect={(v) => setValue(v as (typeof STATUS_OPTIONS)[number])}
      variant="outlined"
      className="wu-min-w-[100px]"
    />
  );
}

function StudyRowActions({ study }: { study: Study }) {
  const { showToast } = useWuShowToast();

  return (
    <WuMenu
      Trigger={
        <button
          type="button"
          className="wu-p-1 wu-rounded-md hover:wu-bg-gray-10"
          aria-label={`Actions for ${study.name}`}
        >
          <span className="wm-more-vert wu-text-gray-subtle" />
        </button>
      }
      align="end"
    >
      <WuMenuItem onSelect={() => showToast({ message: 'Analyze opened', variant: 'success' })}>
        Analyze
      </WuMenuItem>
      <WuMenuItem onSelect={() => showToast({ message: 'Distribute opened', variant: 'success' })}>
        Distribute
      </WuMenuItem>
      <WuMenuSeparatorItem />
      <WuMenuItem onSelect={() => showToast({ message: 'Study duplicated', variant: 'success' })}>
        Copy
      </WuMenuItem>
      <WuMenuItem onSelect={() => showToast({ message: 'Study archived', variant: 'success' })}>
        Archive
      </WuMenuItem>
    </WuMenu>
  );
}

export function StudiesListPage() {
  const { showToast } = useWuShowToast();
  const [folder, setFolder] = useState(STUDY_FOLDERS[0]);

  const columns: IWuTableColumnDef<Study>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cellAlign: 'right',
      headerAlign: 'right',
      cell: ({ row }) => (
        <span className="wu-text-gray-subtle wu-tabular-nums">{row.original.id}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Study Name',
      cell: ({ row }) => (
        <Link
          href={`/studies/${row.original.id}`}
          className="wu-text-blue-q hover:wu-underline wu-font-normal"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="wu-inline-flex wu-items-center wu-gap-1.5 wu-text-gray-lead">
          <span className="wm-list wu-text-base wu-text-gray-subtle" aria-hidden />
          {row.original.type}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="wu-text-gray-lead">{formatStudyDate(row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: 'responses',
      header: 'Responses',
      headerAlign: 'right',
      cellAlign: 'right',
      cell: ({ row }) => (
        <span className="wu-tabular-nums wu-text-gray-lead">
          {row.original.responses.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'deployments',
      header: 'Deployments',
      headerAlign: 'right',
      cellAlign: 'right',
      cell: ({ row }) =>
        row.original.deployments > 0 ? (
          <button
            type="button"
            className="wu-text-blue-q hover:wu-underline wu-tabular-nums"
            onClick={() =>
              showToast({ message: 'Deployments opened', variant: 'success' })
            }
          >
            {row.original.deployments}
          </button>
        ) : (
          <span className="wu-tabular-nums wu-text-gray-lead">0</span>
        ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StudyStatusSelect status={row.original.status} />,
    },
    {
      accessorKey: 'id',
      id: 'actions',
      header: '',
      cellAlign: 'right',
      cell: ({ row }) => <StudyRowActions study={row.original} />,
    },
  ];

  return (
    <div className="wu-flex wu-flex-col wu-min-h-full wu-bg-white">
      <div className="wu-border-b wu-border-gray-40 wu-bg-white wu-px-6 wu-py-3">
        <div className="wu-flex wu-flex-wrap wu-items-center wu-justify-between wu-gap-4">
          <div className="wu-flex wu-flex-wrap wu-items-center wu-gap-4">
            <WuSelect
              data={STUDY_FOLDERS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={folder}
              onSelect={(v) => setFolder(v as (typeof STUDY_FOLDERS)[number])}
              variant="outlined"
              className="wu-min-w-[120px]"
            />
            <Link
              href="/employees"
              className="wu-inline-flex wu-items-center wu-gap-1.5 wu-text-sm wu-text-blue-q hover:wu-underline"
            >
              <span className="wm-person wu-text-base" aria-hidden />
              Employee List ({EMPLOYEE_PORTAL_COUNT} Employees)
            </Link>
          </div>

          <div className="wu-flex wu-flex-col wu-items-end wu-gap-1">
            <div className="wu-flex wu-flex-wrap wu-items-center wu-gap-2">
              <button
                type="button"
                className="wu-inline-flex wu-items-center wu-gap-1 wu-text-sm wu-text-blue-q hover:wu-underline"
                onClick={() => showToast({ message: 'Share folder opened', variant: 'success' })}
              >
                <span className="wm-share wu-text-base" aria-hidden />
                Share Folder
              </button>
              <WuButton
                variant="secondary"
                onClick={() =>
                  showToast({ message: 'Use existing survey opened', variant: 'success' })
                }
              >
                <span className="wm-edit" /> Use Existing Survey
              </WuButton>
              <div className="wu-inline-flex">
                <WuButton
                  onClick={() => showToast({ message: 'New study created', variant: 'success' })}
                  className="wu-rounded-r-none"
                >
                  <span className="wm-add" /> New Study
                </WuButton>
                <WuMenu
                  Trigger={
                    <WuButton className="wu-rounded-l-none wu-border-l wu-border-white/30 wu-px-2">
                      <span className="wm-arrow-drop-down" />
                    </WuButton>
                  }
                  align="end"
                >
                  <WuMenuItem
                    onSelect={() =>
                      showToast({ message: 'New survey from template', variant: 'success' })
                    }
                  >
                    From template
                  </WuMenuItem>
                  <WuMenuItem
                    onSelect={() =>
                      showToast({ message: 'Import survey opened', variant: 'success' })
                    }
                  >
                    Import survey
                  </WuMenuItem>
                </WuMenu>
              </div>
            </div>
            <WuText size="sm" className="wu-text-gray-subtle">
              {MOCK_STUDIES.length} Surveys
            </WuText>
          </div>
        </div>
      </div>

      <div className="wu-flex-1 wu-px-6 wu-py-4">
        <WuTable
          data={MOCK_STUDIES as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="striped"
          sort={{ enabled: true }}
        />
      </div>

      <div className="wu-fixed wu-bottom-6 wu-right-6 wu-flex wu-flex-col wu-items-end wu-gap-3 wu-z-40">
        <button
          type="button"
          className="wu-inline-flex wu-items-center wu-gap-1.5 wu-text-sm wu-text-blue-q hover:wu-underline wu-bg-white wu-px-3 wu-py-1.5 wu-rounded wu-shadow-sm"
          onClick={() => showToast({ message: 'Tutorial video opened', variant: 'success' })}
        >
          <span className="wm-play-circle-outline wu-text-lg" aria-hidden />
          Tutorial video
        </button>
        <button
          type="button"
          aria-label="Voice assistant"
          className="wu-flex wu-h-12 wu-w-12 wu-items-center wu-justify-center wu-rounded-full wu-bg-[#5457cd] wu-text-white wu-shadow-lg hover:wu-opacity-90"
          onClick={() => showToast({ message: 'QxBot listening…', variant: 'success' })}
        >
          <span className="wm-mic wu-text-xl" />
        </button>
      </div>

      <StudiesFooter />
    </div>
  );
}
