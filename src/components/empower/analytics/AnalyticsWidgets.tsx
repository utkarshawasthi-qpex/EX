'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  EMPOWER_GOAL_STATUS_OPTIONS,
  EMPOWER_HOME_SNAPSHOT,
  EMPOWER_TOP_GOALS,
} from '@/data/mock-empower';
import { wickTokens } from '@/lib/wick-ui-tokens';
import { DonutChart } from './DonutChart';

const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false }
);
const WuCardHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCardHeader })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuRadioGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuRadioGroup })),
  { ssr: false }
);
const WuSwitcher = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSwitcher })),
  { ssr: false }
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false }
);
const WuDisplay = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDisplay })),
  { ssr: false }
);
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false }
);

function AnalyticsWidgetCard({
  title,
  headerRight,
  children,
}: {
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <WuCard
      rounded
      className={`wu-h-full wu-flex wu-flex-col ${wickTokens.bgSurfaceDefault} ${wickTokens.shadowSm}`}
    >
      <WuCardHeader className="wu-flex wu-flex-row wu-items-center wu-justify-between wu-gap-2">
        <WuHeading size="sm" className={wickTokens.textPrimary}>
          {title}
        </WuHeading>
        {headerRight}
      </WuCardHeader>
      <div className="wu-flex-1 wu-flex wu-flex-col">{children}</div>
    </WuCard>
  );
}

function SnapshotWidget() {
  const metrics = [
    { value: EMPOWER_HOME_SNAPSHOT.activeInitiatives, label: 'Active initiatives' },
    { value: EMPOWER_HOME_SNAPSHOT.tasksInProgress, label: 'Tasks in progress' },
    { value: EMPOWER_HOME_SNAPSHOT.newIdeas, label: 'New ideas' },
  ];

  return (
    <AnalyticsWidgetCard title="Snapshot">
      <div className={`wu-grid wu-grid-cols-3 wu-gap-4 wu-text-center wu-px-2 wu-pb-2`}>
        {metrics.map((m) => (
          <div key={m.label}>
            <WuDisplay size="md" className={wickTokens.textPrimary}>
              {m.value}
            </WuDisplay>
            <WuText size="sm" as="p" className={`${wickTokens.textSecondary} wu-mt-2 wu-leading-snug`}>
              {m.label}
            </WuText>
          </div>
        ))}
      </div>
    </AnalyticsWidgetCard>
  );
}

function TopContributorsWidget() {
  return (
    <AnalyticsWidgetCard title="Top contributors">
      <WuText size="sm" as="p" className={`${wickTokens.textSecondary} wu-leading-relaxed wu-px-2 wu-pb-2`}>
        Top contributors are recognized for closing the highest number of tasks each week.
        Stay focused, complete your tasks, and lead your team to the top.
      </WuText>
    </AnalyticsWidgetCard>
  );
}

function TopGoalsWidget() {
  const [status, setStatus] = useState(EMPOWER_GOAL_STATUS_OPTIONS[0]);
  const [viewMode, setViewMode] = useState('percent');

  return (
    <AnalyticsWidgetCard
      title="Top goals"
      headerRight={
        <div className="wu-flex wu-items-center wu-gap-3 wu-shrink-0">
          <WuSelect
            data={EMPOWER_GOAL_STATUS_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={status}
            onSelect={(v) => setStatus(v as (typeof EMPOWER_GOAL_STATUS_OPTIONS)[number])}
            variant="outlined"
            className="wu-min-w-[120px]"
          />
          <WuRadioGroup
            options={[
              { value: 'percent', label: 'Percent' },
              { value: 'count', label: 'Count' },
            ]}
            defaultValue="percent"
            onChange={(v) => setViewMode(v)}
          />
        </div>
      }
    >
      <div className="wu-flex wu-flex-col wu-items-center wu-gap-4 wu-px-2 wu-pb-2">
        <DonutChart
          centerLabel="Top goals"
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
                {viewMode === 'percent' ? `${goal.percent}%` : Math.round(goal.percent / 10)}
              </WuText>
            </li>
          ))}
        </ul>
      </div>
    </AnalyticsWidgetCard>
  );
}

function StatusSummaryWidget() {
  const [summaryView, setSummaryView] = useState<'tasks' | 'initiatives'>('initiatives');
  const [goalFilter, setGoalFilter] = useState(EMPOWER_GOAL_STATUS_OPTIONS[0]);

  return (
    <AnalyticsWidgetCard
      title="Status summary"
      headerRight={
        <div className={`wu-flex wu-items-center wu-gap-4 ${wickTokens.textSecondary}`}>
          <span className="wu-flex wu-items-center wu-gap-1.5">
            <span className="wu-w-2 wu-h-2 wu-rounded-full wu-bg-blue-p/20" aria-hidden />
            <WuText size="sm" as="span">
              Active
            </WuText>
          </span>
          <span className="wu-flex wu-items-center wu-gap-1.5">
            <span className="wu-w-2 wu-h-2 wu-rounded-full wu-bg-blue-q" aria-hidden />
            <WuText size="sm" as="span">
              Completed
            </WuText>
          </span>
        </div>
      }
    >
      <div className="wu-flex wu-items-center wu-justify-between wu-gap-4 wu-mb-4 wu-flex-wrap wu-px-2">
        <div className="wu-flex wu-items-center wu-gap-2">
          <WuText size="sm" as="span" className={wickTokens.textPrimary}>
            Goals
          </WuText>
          <WuSelect
            data={EMPOWER_GOAL_STATUS_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={goalFilter}
            onSelect={(v) => setGoalFilter(v as (typeof EMPOWER_GOAL_STATUS_OPTIONS)[number])}
            variant="outlined"
            className="wu-min-w-[120px]"
          />
        </div>
        <WuSwitcher
          type="tab"
          value={summaryView}
          onChange={(v) => setSummaryView(v as 'tasks' | 'initiatives')}
          options={[
            { value: 'tasks', label: 'Tasks' },
            { value: 'initiatives', label: 'Initiatives' },
          ]}
        />
      </div>
      <EmptyState
        icon="wm-inbox"
        title="No Data"
        description={
          summaryView === 'initiatives'
            ? 'Initiative status will appear here once goals have activity.'
            : 'Task status will appear here once work is tracked.'
        }
      />
    </AnalyticsWidgetCard>
  );
}

export function AnalyticsWidgets() {
  return (
    <>
      <div className={`${wickTokens.gridCols3} ${wickTokens.gridGap6}`}>
        <SnapshotWidget />
        <TopContributorsWidget />
        <TopGoalsWidget />
      </div>
      <div className={wickTokens.mtSection}>
        <StatusSummaryWidget />
      </div>
    </>
  );
}
