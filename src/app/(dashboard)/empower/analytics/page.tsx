'use client';

import dynamic from 'next/dynamic';
import { AnalyticsWidgets } from '@/components/empower/analytics/AnalyticsWidgets';
import { EmpowerTimeRangeToolbar } from '@/components/empower/EmpowerTimeRangeToolbar';
import { wickTokens } from '@/lib/wick-ui-tokens';

const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false }
);

export default function EmpowerAnalyticsPage() {
  return (
    <div className={`wu-min-h-full ${wickTokens.bgSurfacePage}`}>
      <div className={wickTokens.pagePadding}>
        <header className="wu-flex wu-justify-between wu-items-center wu-mb-6">
          <WuHeading size="xl" className={wickTokens.textPrimary}>
            Analytics
          </WuHeading>
          <EmpowerTimeRangeToolbar />
        </header>
        <AnalyticsWidgets />
      </div>
    </div>
  );
}
