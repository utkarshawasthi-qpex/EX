'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ProductTabs() {
  const pathname = usePathname();

  const isEmployeeExperience = pathname.startsWith('/projects');
  const is360 = pathname.startsWith('/360');
  const isEmpower = pathname.startsWith('/empower');

  const WuMenu = dynamic(
    () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
    { ssr: false }
  );
  const WuMenuItem = dynamic(
    () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
    { ssr: false }
  );

  return (
    <div className="flex items-center px-4">
      <WuMenu
        Trigger={
          <button className="flex items-center gap-3 px-3 py-2 rounded-md bg-white hover:bg-gray-50">
            <span className="wm-app-emp text-lg" />
            <span className="font-medium text-base">Employee Experience</span>
            <span className="wm-arrow-drop-down text-sm text-gray-500" />
          </button>
        }
        align="start"
      >
        <WuMenuItem>
          <Link href="/projects" className={isEmployeeExperience ? 'font-semibold text-blue-700' : 'text-gray-700'}>
            Employee Experience
          </Link>
        </WuMenuItem>
        <WuMenuItem>
          <Link href="/360" className={is360 ? 'font-semibold text-blue-700' : 'text-gray-700'}>
            360 Feedback
          </Link>
        </WuMenuItem>
        <WuMenuItem>
          <Link href="/empower" className={isEmpower ? 'font-semibold text-blue-700' : 'text-gray-700'}>
            Empower
          </Link>
        </WuMenuItem>
      </WuMenu>
    </div>
  );
}
