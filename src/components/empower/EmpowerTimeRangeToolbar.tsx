'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EMPOWER_TIME_RANGES } from '@/data/mock-empower';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

export function EmpowerTimeRangeToolbar() {
  const { showToast } = useWuShowToast();
  const [range, setRange] = useState(EMPOWER_TIME_RANGES[0]);

  return (
    <div className="wu-flex wu-items-center wu-gap-2">
      <WuSelect
        data={EMPOWER_TIME_RANGES}
        accessorKey={{ value: 'value', label: 'label' }}
        value={range}
        onSelect={(v) => setRange(v as (typeof EMPOWER_TIME_RANGES)[number])}
        variant="outlined"
        className="wu-min-w-[160px]"
      />
      <WuButton
        variant="link"
        Icon={<span className="wm-download" />}
        aria-label="Export analytics"
        onClick={() =>
          showToast({ message: 'Export started for selected range', variant: 'success' })
        }
      />
    </div>
  );
}
