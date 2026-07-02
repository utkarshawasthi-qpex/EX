'use client';

import { EmpowerHomeMain } from '@/components/empower/home/EmpowerHomeMain';
import { EmpowerHomeSidebar } from '@/components/empower/home/EmpowerHomeSidebar';
import { wickTokens } from '@/lib/wick-ui-tokens';

export default function EmpowerHomePage() {
  return (
    <div className={`wu-min-h-full ${wickTokens.bgSurfacePage}`}>
      <div className={wickTokens.pagePadding}>
        <div className="wu-grid wu-grid-cols-1 xl:wu-grid-cols-[minmax(0,1fr)_min(100%,22rem)] wu-gap-6 xl:wu-gap-8">
          <EmpowerHomeMain />
          <EmpowerHomeSidebar />
        </div>
      </div>
    </div>
  );
}
