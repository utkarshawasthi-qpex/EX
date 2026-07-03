'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  EMPOWER_HOME_METRICS,
  EMPOWER_TOP_GOALS,
  MOCK_EMPOWER_TOP_IDEAS,
} from '@/data/mock-empower';
import { EmpowerWidgetCard } from '@/components/empower/EmpowerWidgetCard';
import { DonutChart } from '@/components/empower/analytics/DonutChart';
import { wickTokens } from '@/lib/wick-ui-tokens';

const WuDisplay = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDisplay })),
  { ssr: false }
);
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false }
);

function HomeMetricCard({ value, label }: { value: number; label: string }) {
  return (
    <EmpowerWidgetCard className="wu-h-full">
      <div className="wu-text-center wu-px-2 wu-pb-2 wu-pt-1">
        <WuDisplay size="md" className={wickTokens.textPrimary}>
          {value}
        </WuDisplay>
        <WuText
          size="sm"
          as="p"
          className={`${wickTokens.textSecondary} wu-mt-2 wu-leading-snug`}
        >
          {label}
        </WuText>
      </div>
    </EmpowerWidgetCard>
  );
}

function HomeTopGoalsCard() {
  return (
    <EmpowerWidgetCard title="Top goals">
      <div className="wu-flex wu-flex-col wu-items-center wu-gap-4 wu-px-2 wu-pb-2">
        <DonutChart
          centerLabel="Top goals"
          size={120}
          segments={EMPOWER_TOP_GOALS.map((g) => ({
            percent: g.percent,
            color: g.color,
          }))}
        />
        <ul className="wu-w-full wu-space-y-2">
          {EMPOWER_TOP_GOALS.map((goal) => (
            <li key={goal.name} className="wu-flex wu-items-center wu-gap-2">
              <span
                className="wu-w-3 wu-h-3 wu-rounded-sm wu-shrink-0"
                style={{ backgroundColor: goal.color }}
                aria-hidden
              />
              <WuText size="sm" as="span" className={`${wickTokens.textPrimary} wu-flex-1`}>
                {goal.name}
              </WuText>
              <WuText size="sm" as="span" className={wickTokens.textSecondary}>
                {goal.percent}%
              </WuText>
            </li>
          ))}
        </ul>
      </div>
    </EmpowerWidgetCard>
  );
}

function HomeTopContributorsCard() {
  return (
    <EmpowerWidgetCard title="Top contributors">
      <WuText
        size="sm"
        as="p"
        className={`${wickTokens.textSecondary} wu-leading-relaxed wu-px-2 wu-pb-2`}
      >
        Top contributors are recognized for closing the highest number of tasks each week.
        Stay focused, complete your tasks, and lead your team to the top.
      </WuText>
    </EmpowerWidgetCard>
  );
}

function HomeTopIdeasCard() {
  const featured = MOCK_EMPOWER_TOP_IDEAS[0];

  return (
    <EmpowerWidgetCard title="Top ideas">
      <div className="wu-px-2 wu-pb-2">
        <div
          className={`wu-flex wu-items-center wu-justify-between wu-gap-2 wu-pb-2 wu-border-b wu-border-gray-40`}
        >
          <WuText size="sm" as="span" className={`${wickTokens.textPrimary} wu-font-medium`}>
            Idea
          </WuText>
          <WuText size="sm" as="span" className={wickTokens.textSecondary}>
            Vote
          </WuText>
        </div>
        {featured && (
          <div className="wu-flex wu-items-center wu-justify-between wu-gap-2 wu-py-3">
            <Link
              href="/empower/initiatives"
              className={`${wickTokens.textBrand} wu-text-sm wu-font-medium hover:wu-underline`}
            >
              {featured.name}
            </Link>
            <WuText size="sm" as="span" className={wickTokens.textSecondary}>
              {featured.votes} Vote
            </WuText>
          </div>
        )}
      </div>
    </EmpowerWidgetCard>
  );
}

export function EmpowerHomeSidebar() {
  return (
    <aside className="wu-flex wu-flex-col wu-gap-6 wu-min-w-0">
      <div className={`${wickTokens.gridCols3} ${wickTokens.gridGap6}`}>
        {EMPOWER_HOME_METRICS.map((m) => (
          <HomeMetricCard key={m.label} value={m.value} label={m.label} />
        ))}
      </div>
      <HomeTopGoalsCard />
      <HomeTopContributorsCard />
      <HomeTopIdeasCard />
    </aside>
  );
}
