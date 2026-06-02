'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { MOCK_PROJECTS, type Project, type ProjectStatus } from '@/data/mock-projects';
import { formatDate } from '@/data/mock-utils';

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false }
);
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
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
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false }
);

function StatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    archived: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <WuCard rounded className="p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </WuCard>
  );
}

function OverviewTab({ project }: { project: Project }) {
  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Responses" value={project.responses.toLocaleString()} />
        <StatCard label="Status" value={<StatusBadge status={project.status} />} />
        <StatCard label="Owner" value={project.owner} />
        <StatCard label="Created" value={formatDate(project.createdAt)} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
        <p className="text-sm text-gray-600">{project.description}</p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-md">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResponsesTab() {
  return (
    <div className="pt-4">
      <EmptyState
        icon="wm-bar-chart"
        title="No responses yet"
        description="Responses will appear here once the project is live and collecting data."
      />
    </div>
  );
}

function SettingsTab({ project }: { project: Project }) {
  const { showToast } = useWuShowToast();
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
  });

  return (
    <div className="pt-4 max-w-lg flex flex-col gap-4">
      <WuInput
        Label="Project Name"
        variant="outlined"
        value={form.name}
        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
      />
      <WuTextarea
        Label="Description"
        variant="outlined"
        value={form.description}
        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
      />
      <div className="flex justify-end">
        <WuButton
          onClick={() => showToast({ message: 'Settings saved', variant: 'success' })}
        >
          Save Changes
        </WuButton>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const project = MOCK_PROJECTS.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="p-6">
        <EmptyState
          icon="wm-error-outline"
          title="Project not found"
          description="This project doesn't exist or has been removed."
          action={
            <Link href="/projects" className="text-sm text-blue-600 hover:underline">
              Back to Projects
            </Link>
          }
        />
      </div>
    );
  }

  const tabs: IWuTabItem[] = [
    {
      value: 'overview',
      Trigger: 'Overview',
      Content: <OverviewTab project={project} />,
    },
    {
      value: 'responses',
      Trigger: 'Responses',
      Content: <ResponsesTab />,
    },
    {
      value: 'settings',
      Trigger: 'Settings',
      Content: <SettingsTab project={project} />,
    },
  ];

  return (
    <div className="p-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <span className="wm-arrow-back text-base" /> Back to Projects
      </Link>
      <PageHeader
        title={project.name}
        description={project.description}
        action={<StatusBadge status={project.status} />}
      />
      <WuTab items={tabs} defaultValue="overview" />
    </div>
  );
}
