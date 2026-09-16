'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CreateSurveyModal } from '@/components/modules/lifecycle/CreateSurveyModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  STUDY_FOLDERS,
  getStudyAnalyzeHref,
  getStudyDistributeHref,
  getStudyHref,
  type Study,
  type StudyStatus,
  type StudyType,
} from '@/data/mock-studies';
import { useRosterStore } from '@/lib/rosterStore';
import { useStudiesStore } from '@/lib/studiesStore';
import { formatStudyDate } from '@/data/mock-utils';
import type { LifecycleSurvey } from '@/types';

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
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false }
);
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })),
  { ssr: false }
);
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })),
  { ssr: false }
);
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })),
  { ssr: false }
);
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })),
  { ssr: false }
);
const WuModalClose = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalClose })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuFormGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFormGroup })),
  { ssr: false }
);

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

function typeIcon(type: StudyType) {
  return type === '360 Review' ? 'wm-360' : 'wm-list';
}

function StudyStatusSelect({ status }: { status: StudyStatus }) {
  const [value, setValue] = useState(STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0]);

  return (
    <WuSelect
      data={STATUS_OPTIONS}
      accessorKey={{ value: 'value', label: 'label' }}
      value={value}
      onSelect={(v) => setValue(v as (typeof STATUS_OPTIONS)[number])}
      variant="outlined"
      className="min-w-[110px]"
    />
  );
}

function RowIconButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      aria-label={label}
      onClick={onClick}
    >
      <span className={`${icon} text-base leading-none`} aria-hidden />
    </button>
  );
}

function StudyRowActions({
  study,
  onDelete,
  onRename,
  onCopy,
}: {
  study: Study;
  onDelete: (study: Study) => void;
  onRename: (study: Study) => void;
  onCopy: (study: Study) => void;
}) {
  const router = useRouter();
  const { showToast } = useWuShowToast();

  return (
    <div className="flex w-[168px] shrink-0 items-center justify-end gap-0.5">
      <RowIconButton
        label={`Edit ${study.name}`}
        icon="wm-edit"
        onClick={() => router.push(getStudyHref(study))}
      />
      <RowIconButton
        label={`Preview ${study.name}`}
        icon="wm-visibility"
        onClick={() => showToast({ message: 'Preview opened', variant: 'success' })}
      />
      <RowIconButton
        label={`Distribute ${study.name}`}
        icon="wm-send"
        onClick={() => router.push(getStudyDistributeHref(study))}
      />
      <RowIconButton
        label={`Analytics for ${study.name}`}
        icon="wc-analytics"
        onClick={() => router.push(getStudyAnalyzeHref(study))}
      />
      <RowIconButton
        label={`Delete ${study.name}`}
        icon="wm-delete"
        onClick={() => onDelete(study)}
      />
      <WuMenu
        Trigger={
          <button
            type="button"
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label={`More actions for ${study.name}`}
          >
            <span className="wm-more-vert text-base leading-none" />
          </button>
        }
        align="end"
      >
        <WuMenuItem onSelect={() => onRename(study)}>Rename</WuMenuItem>
        <WuMenuItem onSelect={() => onCopy(study)}>Copy</WuMenuItem>
        <WuMenuItem onSelect={() => router.push('/lifecycle/settings')}>Settings</WuMenuItem>
        <WuMenuItem
          onSelect={() => showToast({ message: 'Share opened', variant: 'success' })}
        >
          Share
        </WuMenuItem>
      </WuMenu>
    </div>
  );
}

export function StudiesListPage() {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const { employees, setup } = useRosterStore();
  const { studies, recycleBin, setStudies, setRecycleBin } = useStudiesStore();
  const folders = useMemo(
    () =>
      STUDY_FOLDERS.map((item) =>
        item.value === 'new-folks' ? { ...item, label: setup.folderName } : item,
      ),
    [setup.folderName],
  );
  const [folder, setFolder] = useState(folders[0]);
  const [createOpen, setCreateOpen] = useState(false);
  const [useExistingOpen, setUseExistingOpen] = useState(false);
  const [recycleOpen, setRecycleOpen] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<Study | null>(null);
  const [studyToRename, setStudyToRename] = useState<Study | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    setFolder((current) => {
      const next = folders.find((item) => item.value === current.value) ?? folders[0]
      return next
    })
  }, [folders])

  const visibleStudies = useMemo(() => {
    if (folder.value === 'all-folders') return studies;
    return studies.filter((study) => study.folderId === folder.value);
  }, [folder.value, studies]);

  function handleCreateSurvey(survey: LifecycleSurvey) {
    const study: Study = {
      id: nextStudyId(),
      name: survey.title,
      type: 'Survey',
      status: 'draft',
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      responses: 0,
      deployments: 0,
      folderId: folderIdForNewStudy(),
    };
    setStudies([study, ...studies]);
    showToast({ message: `${survey.title} created`, variant: 'success' });
    router.push('/lifecycle/surveys');
  }

  function handleDeleteStudy() {
    if (!studyToDelete) return;
    setStudies(studies.filter((study) => study.id !== studyToDelete.id));
    setRecycleBin([studyToDelete, ...recycleBin]);
    showToast({ message: 'Study moved to recycle bin', variant: 'success' });
    setStudyToDelete(null);
  }

  function handleRestoreStudy(study: Study) {
    setRecycleBin(recycleBin.filter((item) => item.id !== study.id));
    setStudies([...studies, study].sort((a, b) => Number(a.id) - Number(b.id)));
    showToast({ message: `${study.name} restored`, variant: 'success' });
  }

  function nextStudyId() {
    const ids = [...studies, ...recycleBin].map((study) => Number(study.id));
    return String(Math.max(0, ...ids) + 1);
  }

  function folderIdForNewStudy() {
    return folder.value === 'all-folders' ? 'new-folks' : folder.value;
  }

  function handlePatientSafetyStudy() {
    const study: Study = {
      id: nextStudyId(),
      name: 'Patient Safety',
      type: 'Survey',
      status: 'draft',
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      responses: 0,
      deployments: 0,
      folderId: folderIdForNewStudy(),
    };
    setStudies([study, ...studies]);
    showToast({ message: 'Patient Safety study created', variant: 'success' });
  }

  function handleCopyStudy(study: Study) {
    const copy: Study = {
      ...study,
      id: nextStudyId(),
      name: `${study.name} - COPIED`,
      responses: 0,
      deployments: 0,
    };
    setStudies([copy, ...studies]);
    showToast({ message: 'Study duplicated', variant: 'success' });
  }

  function handleRenameStudy() {
    const nextName = renameValue.trim();
    if (!studyToRename || !nextName) return;
    setStudies(
      studies.map((study) =>
        study.id === studyToRename.id ? { ...study, name: nextName } : study,
      ),
    );
    showToast({ message: 'Study renamed', variant: 'success' });
    setStudyToRename(null);
    setRenameValue('');
  }

  const columns: IWuTableColumnDef<Study>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 56,
      minSize: 48,
      maxSize: 64,
      cellAlign: 'right',
      headerAlign: 'right',
      cell: ({ row }) => (
        <span className="tabular-nums text-gray-500">{row.original.id}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Study name',
      size: 480,
      minSize: 220,
      cell: ({ row }) => (
        <Link
          href={getStudyHref(row.original)}
          className="block min-w-0 truncate font-normal text-blue-700 hover:underline"
          title={row.original.name}
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      size: 140,
      minSize: 120,
      maxSize: 160,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-gray-700">
          <span className={`${typeIcon(row.original.type)} text-base text-gray-500`} aria-hidden />
          {row.original.type}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      size: 120,
      minSize: 110,
      maxSize: 140,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-gray-700">{formatStudyDate(row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: 'responses',
      header: 'Responses',
      size: 100,
      minSize: 90,
      maxSize: 120,
      headerAlign: 'right',
      cellAlign: 'right',
      cell: ({ row }) => (
        <span className="tabular-nums text-gray-700">
          {row.original.responses.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'deployments',
      header: 'Deployments',
      size: 110,
      minSize: 100,
      maxSize: 130,
      headerAlign: 'right',
      cellAlign: 'right',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.deployments > 0 ? (
          <button
            type="button"
            className="tabular-nums text-blue-700 hover:underline"
            onClick={() => router.push(getStudyDistributeHref(row.original))}
          >
            {row.original.deployments}
          </button>
        ) : (
          <span className="tabular-nums text-gray-700">0</span>
        ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 132,
      minSize: 132,
      maxSize: 148,
      cell: ({ row }) => (
        <div className="min-w-[120px] pr-2">
          <StudyStatusSelect status={row.original.status} />
        </div>
      ),
    },
    {
      accessorKey: 'id',
      id: 'actions',
      header: ' ',
      size: 180,
      minSize: 180,
      maxSize: 180,
      cellAlign: 'right',
      enableSorting: false,
      cell: ({ row }) => (
        <StudyRowActions
          study={row.original}
          onDelete={setStudyToDelete}
          onRename={(study) => {
            setStudyToRename(study);
            setRenameValue(study.name);
          }}
          onCopy={handleCopyStudy}
        />
      ),
    },
  ];

  return (
    <div className="flex min-h-full flex-col bg-white pt-5">
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <WuSelect
              data={folders}
              accessorKey={{ value: 'value', label: 'label' }}
              value={folder}
              onSelect={(v) => setFolder(v as (typeof STUDY_FOLDERS)[number])}
              variant="outlined"
              className="min-w-[120px]"
            />
            <Link
              href="/lifecycle/roster"
              className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
            >
              <span className="wm-person text-base" aria-hidden />
              Employee list ({employees.length} Employees)
            </Link>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
                onClick={() => showToast({ message: 'Share folder opened', variant: 'success' })}
              >
                <span className="wm-share text-base" aria-hidden />
                Share folder
              </button>
              <WuButton variant="secondary" onClick={() => setUseExistingOpen(true)}>
                <span className="wm-edit" /> Use Existing Survey
              </WuButton>
              <div className="inline-flex h-8 overflow-hidden rounded leading-none [&_button]:h-8 [&_button]:min-w-0">
                <WuButton onClick={() => setCreateOpen(true)} className="!min-w-0 !rounded-r-none">
                  + New study
                </WuButton>
                <WuMenu
                  Trigger={
                    <button
                      type="button"
                      className="flex h-8 w-8 shrink-0 items-center justify-center border-l border-white/30 bg-[rgb(27,135,230)] text-white hover:bg-[rgb(4,94,191)]"
                      aria-label="More study options"
                    >
                      <span className="wm-arrow-drop-down text-xl leading-none" aria-hidden />
                    </button>
                  }
                  align="end"
                >
                  <WuMenuItem onSelect={() => setCreateOpen(true)}>
                    Employee Experience
                  </WuMenuItem>
                  <WuMenuItem onSelect={handlePatientSafetyStudy}>Patient Safety</WuMenuItem>
                </WuMenu>
              </div>
            </div>
            <WuText size="sm" className="text-gray-500">
              {visibleStudies.length} Surveys
            </WuText>
          </div>
        </div>
      </div>

      <div className="relative min-w-0 flex-1 px-6 py-4">
        {visibleStudies.length === 0 ? (
          <EmptyState
            icon="wm-search-off"
            title="No surveys in this folder"
            description="Create a study or switch folders to see surveys here."
            action={
              <WuButton onClick={() => setCreateOpen(true)}>+ New study</WuButton>
            }
          />
        ) : (
          <div className="w-full min-w-0 [&_table]:w-full [&_th]:px-3 [&_td]:px-3 [&_th:last-child]:w-[180px] [&_th:last-child]:min-w-[180px] [&_td:last-child]:w-[180px] [&_td:last-child]:min-w-[180px] [&_th:nth-last-child(2)]:w-[140px] [&_th:nth-last-child(2)]:min-w-[140px] [&_td:nth-last-child(2)]:w-[140px] [&_td:nth-last-child(2)]:min-w-[140px]">
            <WuTable
              data={visibleStudies as unknown[]}
              columns={columns as unknown as IWuTableColumnDef<unknown>[]}
              variant="striped"
              size="default"
              tableLayout="fixed"
              sort={{ enabled: true }}
              className="w-full"
            />
          </div>
        )}

        <div className="mt-4 flex justify-end gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
            onClick={() =>
              showToast({ message: 'Tutorial video opened', variant: 'success' })
            }
          >
            <span className="wm-play-circle text-lg" aria-hidden />
            Tutorial video
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
            onClick={() => setRecycleOpen(true)}
          >
            <span className="wm-delete text-lg" aria-hidden />
            Recycle bin
          </button>
        </div>
      </div>

      <CreateSurveyModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateSurvey={handleCreateSurvey}
      />

      <ConfirmModal
        open={Boolean(studyToDelete)}
        onOpenChange={(open) => {
          if (!open) setStudyToDelete(null);
        }}
        title="Delete study?"
        description={
          studyToDelete
            ? `${studyToDelete.name} will be moved to the recycle bin.`
            : 'This study will be moved to the recycle bin.'
        }
        confirmLabel="Delete"
        variant="critical"
        onConfirm={handleDeleteStudy}
      />

      <WuModal
        open={Boolean(studyToRename)}
        onOpenChange={(open) => {
          if (!open) {
            setStudyToRename(null);
            setRenameValue('');
          }
        }}
        size="sm"
      >
        <WuModalHeader>Rename</WuModalHeader>
        <WuModalContent>
          <WuFormGroup
            Label="Study name"
            Input={
              <WuInput
                variant="outlined"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
              />
            }
          />
        </WuModalContent>
        <WuModalFooter>
          <WuModalClose variant="secondary">Cancel</WuModalClose>
          <WuButton onClick={handleRenameStudy} disabled={!renameValue.trim()}>
            Save
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal open={useExistingOpen} onOpenChange={setUseExistingOpen} size="md">
        <WuModalHeader>Use Existing Survey</WuModalHeader>
        <WuModalContent>
          <div className="flex max-h-80 flex-col gap-1 overflow-auto">
            {studies.map((study) => (
              <button
                key={study.id}
                type="button"
                className="flex items-center justify-between rounded px-3 py-2 text-left hover:bg-gray-50"
                onClick={() => {
                  setUseExistingOpen(false);
                  router.push(getStudyHref(study));
                }}
              >
                <span className="inline-flex items-center gap-2 text-sm text-gray-800">
                  <span className={`${typeIcon(study.type)} text-base text-gray-500`} aria-hidden />
                  {study.name}
                </span>
                <span className="text-xs text-gray-400">{study.type}</span>
              </button>
            ))}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuModalClose variant="secondary">Cancel</WuModalClose>
        </WuModalFooter>
      </WuModal>

      <WuModal open={recycleOpen} onOpenChange={setRecycleOpen} size="md">
        <WuModalHeader>Recycle bin</WuModalHeader>
        <WuModalContent>
          {recycleBin.length === 0 ? (
            <EmptyState
              icon="wm-delete"
              title="Recycle bin is empty"
              description="Deleted studies will appear here so you can restore them."
            />
          ) : (
            <div className="flex max-h-80 flex-col gap-1 overflow-auto">
              {recycleBin.map((study) => (
                <div
                  key={study.id}
                  className="flex items-center justify-between rounded px-3 py-2"
                >
                  <span className="text-sm text-gray-800">{study.name}</span>
                  <WuButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRestoreStudy(study)}
                  >
                    Restore
                  </WuButton>
                </div>
              ))}
            </div>
          )}
        </WuModalContent>
        <WuModalFooter>
          <WuModalClose variant="secondary">Close</WuModalClose>
        </WuModalFooter>
      </WuModal>
    </div>
  );
}
