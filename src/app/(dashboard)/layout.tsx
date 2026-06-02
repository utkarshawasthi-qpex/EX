'use client';

import dynamic from 'next/dynamic';
import { SideNav } from '@/components/SideNav';

const WuAppHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeader })),
  { ssr: false }
);
const WuSidebar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebar })),
  { ssr: false }
);
const WuToast = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToast })),
  { ssr: false }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <WuToast />
      <WuAppHeader productName="Employee Experience" categories={[]} />
      <WuSidebar Sidebar={<SideNav />}>
        <main className="flex-1">{children}</main>
      </WuSidebar>
    </div>
  );
}
