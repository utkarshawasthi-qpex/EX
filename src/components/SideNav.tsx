'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const WuSidebarContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarContent })),
  { ssr: false }
);
const WuSidebarItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarItem })),
  { ssr: false }
);

const NAV_ITEMS = [
  {
    label: 'Projects',
    href: '/projects',
    icon: <span className="wm-folder-data" />,
  }
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <WuSidebarContent>
      {NAV_ITEMS.map((item) => (
        <WuSidebarItem
          key={item.href}
          Icon={item.icon}
          isActive={pathname.startsWith(item.href)}
        >
          <Link href={item.href}>{item.label}</Link>
        </WuSidebarItem>
      ))}
    </WuSidebarContent>
  );
}
