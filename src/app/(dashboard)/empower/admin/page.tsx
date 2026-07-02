'use client';

import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmpowerPageShell } from '@/components/empower/EmpowerPageShell';

const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const ADMIN_SECTIONS = [
  {
    title: 'Users & roles',
    description: 'Manage who can access Empower and their permissions.',
    action: 'Manage users',
  },
  {
    title: 'Workspaces',
    description: 'Configure workspaces such as New folks and department groups.',
    action: 'Manage workspaces',
  },
  {
    title: 'Integrations',
    description: 'Connect HRIS, Slack, and other tools.',
    action: 'View integrations',
  },
];

export default function EmpowerAdminPage() {
  const { showToast } = useWuShowToast();

  return (
    <EmpowerPageShell title="Admin">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADMIN_SECTIONS.map((section) => (
          <WuCard key={section.title} rounded className="p-5 bg-white flex flex-col gap-3">
            <h2 className="text-sm font-medium text-gray-800">{section.title}</h2>
            <p className="text-sm text-gray-500 flex-1">{section.description}</p>
            <WuButton
              variant="secondary"
              onClick={() =>
                showToast({ message: `${section.action} opened`, variant: 'success' })
              }
            >
              {section.action}
            </WuButton>
          </WuCard>
        ))}
      </div>
    </EmpowerPageShell>
  );
}
