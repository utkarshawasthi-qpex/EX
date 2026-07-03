'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  EMPOWER_DATA_NAV,
  EMPOWER_EDIT_NAV,
  EMPOWER_FOOTER_NAV,
  EMPOWER_HOME,
  isEmpowerNavActive,
} from '@/data/empower-nav';

const WuSidebarContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarContent })),
  { ssr: false }
);
const WuSidebarFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarFooter })),
  { ssr: false }
);
const WuSidebarGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarGroup })),
  { ssr: false }
);
const WuSidebarItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarItem })),
  { ssr: false }
);
const WuSidebarMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarMenu })),
  { ssr: false }
);

function NavLink({
  href,
  label,
  icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
}) {
  return (
    <WuSidebarItem Icon={<span className={icon} />} isActive={isActive}>
      <Link href={href}>{label}</Link>
    </WuSidebarItem>
  );
}

function NavSection({ items, pathname }: { items: typeof EMPOWER_EDIT_NAV; pathname: string }) {
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          isActive={isEmpowerNavActive(pathname, item.href)}
        />
      ))}
    </>
  );
}

export function EmpowerSideNav() {
  const pathname = usePathname();

  return (
    <WuSidebarContent>
      <WuSidebarMenu>
        <NavLink
          href={EMPOWER_HOME.href}
          label={EMPOWER_HOME.label}
          icon={EMPOWER_HOME.icon}
          isActive={isEmpowerNavActive(pathname, EMPOWER_HOME.href)}
        />
      </WuSidebarMenu>

      <WuSidebarGroup label="Edit">
        <WuSidebarMenu>
          <NavSection items={EMPOWER_EDIT_NAV} pathname={pathname} />
        </WuSidebarMenu>
      </WuSidebarGroup>

      <WuSidebarGroup label="Data">
        <WuSidebarMenu>
          <NavSection items={EMPOWER_DATA_NAV} pathname={pathname} />
        </WuSidebarMenu>
      </WuSidebarGroup>

      <WuSidebarFooter>
        <WuSidebarMenu>
          <NavSection items={EMPOWER_FOOTER_NAV} pathname={pathname} />
        </WuSidebarMenu>
      </WuSidebarFooter>
    </WuSidebarContent>
  );
}
