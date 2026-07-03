'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { EMPOWER_WORKSPACES } from '@/data/mock-empower';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

export function EmpowerHeaderExtras() {
  const [workspace, setWorkspace] = useState(EMPOWER_WORKSPACES[0]);

  return (
    <div className="flex items-center gap-2">
      <WuSelect
        data={EMPOWER_WORKSPACES}
        accessorKey={{ value: 'value', label: 'label' }}
        value={workspace}
        onSelect={(v) => setWorkspace(v as (typeof EMPOWER_WORKSPACES)[number])}
        variant="outlined"
        className="min-w-[140px] [&_button]:!bg-white/10 [&_button]:!text-white [&_button]:!border-white/30"
      />
    </div>
  );
}
