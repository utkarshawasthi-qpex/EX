'use client';

import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';

const WuAppHeaderSearch = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeaderSearch })),
  { ssr: false }
);

export function ExHeaderSearch() {
  const { showToast } = useWuShowToast();

  return (
    <WuAppHeaderSearch
      placeholder="Search surveys, folders, or tools."
      defaultCollapsed={false}
      onSearch={(query) => {
        const value = query.trim();
        if (!value) return;
        showToast({ message: `No matches for “${value}”`, variant: 'info' });
      }}
      className="wu-w-[240px] lg:wu-w-[280px]"
    />
  );
}
