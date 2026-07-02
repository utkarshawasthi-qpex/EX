'use client';

import dynamic from 'next/dynamic';

const WuAppHeaderSearch = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeaderSearch })),
  { ssr: false }
);

export function ExHeaderSearch() {
  return (
    <WuAppHeaderSearch
      placeholder="Global search for users, surveys, tickets"
      defaultCollapsed={false}
      onSearch={() => {}}
      className="wu-min-w-[280px] lg:wu-min-w-[360px]"
    />
  );
}
