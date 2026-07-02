'use client';

import dynamic from 'next/dynamic';
import { wickTokens } from '@/lib/wick-ui-tokens';

const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false }
);
const WuCardHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCardHeader })),
  { ssr: false }
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false }
);

type EmpowerWidgetCardProps = {
  title?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function EmpowerWidgetCard({
  title,
  headerRight,
  children,
  className,
}: EmpowerWidgetCardProps) {
  return (
    <WuCard
      rounded
      className={`wu-flex wu-flex-col ${wickTokens.bgSurfaceDefault} ${wickTokens.shadowSm} ${className ?? ''}`}
    >
      {title && (
        <WuCardHeader className="wu-flex wu-flex-row wu-items-center wu-justify-between wu-gap-2">
          <WuHeading size="sm" className={wickTokens.textPrimary}>
            {title}
          </WuHeading>
          {headerRight}
        </WuCardHeader>
      )}
      <div className="wu-flex-1 wu-flex wu-flex-col">{children}</div>
    </WuCard>
  );
}
