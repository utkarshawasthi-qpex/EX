'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EmpowerSideNav } from '@/components/empower/EmpowerSideNav';
import { isEmpowerPath } from '@/lib/app-header';

const WuSidebarContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarContent })),
  { ssr: false }
);
const WuSidebarItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarItem })),
  { ssr: false }
);

export function SideNav() {
  const pathname = usePathname();

  if (isEmpowerPath(pathname)) {
    return <EmpowerSideNav />;
  }

  return (
    <WuSidebarContent>
      <WuSidebarItem
        Icon={<span className="wm-folder-data" />}
        isActive={pathname.startsWith('/projects')}
      >
        <Link href="/projects">Projects</Link>
      </WuSidebarItem>
    </WuSidebarContent>
  );
}
