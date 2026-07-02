'use client';

import { useState } from 'react';
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
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

export default function EmpowerSettingsPage() {
  const { showToast } = useWuShowToast();
  const [workspaceName, setWorkspaceName] = useState('New folks');
  const [emailDigest, setEmailDigest] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);

  return (
    <EmpowerPageShell title="Settings">
      <WuCard rounded className="p-6 bg-white max-w-xl flex flex-col gap-5">
        <WuInput
          Label="Workspace display name"
          variant="outlined"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
        />
        <WuToggle
          Label="Weekly email digest"
          labelPosition="left"
          checked={emailDigest}
          onChange={setEmailDigest}
        />
        <WuToggle
          Label="Task due date reminders"
          labelPosition="left"
          checked={taskReminders}
          onChange={setTaskReminders}
        />
        <div className="flex justify-end pt-2">
          <WuButton
            onClick={() => showToast({ message: 'Settings saved', variant: 'success' })}
          >
            Save changes
          </WuButton>
        </div>
      </WuCard>
    </EmpowerPageShell>
  );
}
