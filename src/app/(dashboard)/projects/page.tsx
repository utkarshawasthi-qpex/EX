'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { MOCK_PROJECTS, type Project, type ProjectStatus } from '@/data/mock-projects';
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
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false }
);

type StatusOption = { value: string; label: string };

const STATUS_FILTER_OPTIONS: StatusOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

function StatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    archived: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function RowActions({
  project,
  onArchive,
}: {
  project: Project;
  onArchive: (p: Project) => void;
}) {
  const router = useRouter();
  return (
    <WuMenu
      Trigger={
        <button type="button" className="p-1 rounded-md hover:bg-gray-100">
          <span className="wm-more-vert text-gray-500" />
        </button>
      }
      align="end"
    >
      <WuMenuItem onSelect={() => router.push(`/projects/${project.id}`)}>
        View details
      </WuMenuItem>
      <WuMenuSeparatorItem />
      <WuMenuItem
        onSelect={() => onArchive(project)}
        disabled={project.status === 'archived'}
      >
        Archive
      </WuMenuItem>
    </WuMenu>
  );
}

const DEFAULT_FORM = { name: '', description: '', status: 'draft' as ProjectStatus };

export default function ProjectsPage() {
  const { showToast } = useWuShowToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOption | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [archiveTarget, setArchiveTarget] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    if (!statusFilter || statusFilter.value === 'all') return MOCK_PROJECTS;
    return MOCK_PROJECTS.filter((p) => p.status === statusFilter.value);
  }, [statusFilter]);

  const columns: IWuTableColumnDef<Project>[] = [
    {
      accessorKey: 'name',
      header: 'Project Name',
      filterable: true,
      cell: ({ row }) => (
        <Link
          href={`/projects/${row.original.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      filterable: true,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
      filterable: true,
      cell: ({ row }) => row.original.owner,
    },
    {
      accessorKey: 'responses',
      header: 'Responses',
      headerAlign: 'right',
      cellAlign: 'right',
      cell: ({ row }) => row.original.responses.toLocaleString(),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: 'id',
      header: '',
      cellAlign: 'right',
      cell: ({ row }) => (
        <RowActions project={row.original} onArchive={setArchiveTarget} />
      ),
    },
  ];

  function handleCreate() {
    if (!formData.name.trim()) return;
    setIsCreateOpen(false);
    setFormData(DEFAULT_FORM);
    showToast({ message: `"${formData.name}" created`, variant: 'success' });
  }

  function handleArchive() {
    if (!archiveTarget) return;
    showToast({ message: `"${archiveTarget.name}" archived`, variant: 'success' });
    setArchiveTarget(null);
  }

  const statusFormOptions = [
    { value: 'draft' as const, label: 'Draft' },
    { value: 'active' as const, label: 'Active' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Projects"
        description="Manage and track all your research projects"
        action={
          <WuButton onClick={() => setIsCreateOpen(true)}>
            <span className="wm-add" /> New Project
          </WuButton>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <WuInput
          variant="outlined"
          placeholder="Search projects..."
          Icon={<span className="wm-search" />}
          iconPosition="left"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <WuSelect
          data={STATUS_FILTER_OPTIONS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={statusFilter}
          onSelect={(v) => {
            const item = v as StatusOption;
            setStatusFilter(item.value === 'all' ? null : item);
          }}
          // placeholder="Select Status"
          variant="outlined"
        />
      </div>

      <WuTable
        data={filteredProjects as unknown[]}
        columns={columns as unknown as IWuTableColumnDef<unknown>[]}
        variant="striped"
        sort={{ enabled: true }}
        filterText={search}
        NoDataContent={
          <EmptyState
            icon="wm-search-off"
            title="No projects found"
            description="Try adjusting your search or filter"
          />
        }
      />

      {/* Create project modal */}
      <WuModal open={isCreateOpen} onOpenChange={setIsCreateOpen} size="md">
        <WuModalHeader>New Project</WuModalHeader>
        <WuModalContent>
          <div className="flex flex-col gap-4">
            <WuInput
              Label="Project Name"
              variant="outlined"
              placeholder="e.g. Customer Satisfaction Q2 2025"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <WuTextarea
              Label="Description"
              variant="outlined"
              placeholder="What is this project measuring?"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <WuSelect
              data={statusFormOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={statusFormOptions.find((o) => o.value === formData.status) ?? null}
              onSelect={(v) => {
                const item = v as { value: ProjectStatus; label: string };
                setFormData((prev) => ({ ...prev, status: item.value }));
              }}
              Label="Status"
              variant="outlined"
            />
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuModalClose variant="secondary">Cancel</WuModalClose>
          <WuButton onClick={handleCreate} disabled={!formData.name.trim()}>
            Create Project
          </WuButton>
        </WuModalFooter>
      </WuModal>

      {/* Archive confirmation */}
      <ConfirmModal
        open={archiveTarget !== null}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}
        title="Archive project?"
        description={`"${archiveTarget?.name}" will be archived and no longer accept new responses.`}
        confirmLabel="Archive"
        variant="critical"
        onConfirm={handleArchive}
      />
    </div>
  );
}
