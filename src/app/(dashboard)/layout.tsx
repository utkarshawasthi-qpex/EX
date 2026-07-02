'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { SideNav } from '@/components/SideNav';
import { EmpowerHeaderExtras } from '@/components/empower/EmpowerHeaderExtras';
import { ExHeaderSearch } from '@/components/studies/ExHeaderSearch';
import {
  getHeaderCategories,
  getHeaderHomeLink,
  getHeaderProductName,
  isEmpowerPath,
  isStudiesPath,
} from '@/lib/app-header';
import { MOCK_HEADER_USER } from '@/data/mock-header-user';

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
  const pathname = usePathname();
  const hideSidebar = isStudiesPath(pathname) || pathname === '/employees';
  const showExHeader = isStudiesPath(pathname) || pathname === '/employees';

  return (
    <div className="flex flex-col min-h-screen">
      <WuToast />
      <WuAppHeader
        productName={getHeaderProductName(pathname)}
        categories={getHeaderCategories()}
        homeLink={getHeaderHomeLink(pathname)}
        user={showExHeader || isEmpowerPath(pathname) ? MOCK_HEADER_USER : undefined}
      >
        {isEmpowerPath(pathname) ? (
          <EmpowerHeaderExtras />
        ) : showExHeader ? (
          <ExHeaderSearch />
        ) : null}
      </WuAppHeader>
      {hideSidebar ? (
        <main className="flex-1">{children}</main>
      ) : (
        <WuSidebar Sidebar={<SideNav />}>
          <main className="flex-1">{children}</main>
        </WuSidebar>
      )}
    </div>
  );
}
