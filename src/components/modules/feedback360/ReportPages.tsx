'use client'

import { Fragment } from 'react'
import { format } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  REPORT360_COMPETENCIES,
  REPORT360_RELATIONSHIP_COLORS,
  REPORT360_RELATIONSHIP_LABELS,
  evaluatorTotal,
  getOpenQuestion,
  type Report360Block,
  type Report360Comment,
  type Report360LogoAsset,
  type Report360MasterDesign,
  type Report360Relationship,
  type Report360Subject,
  type Report360Template,
} from '@/data/mock-360-reports'
import {
  AI_MIN_RESPONSES,
  GAP_CLASS_LABELS,
  GAP_SIGNIFICANCE,
  behaviorsWithData,
  classifyGap,
  columnScore,
  commentQuestionsWithData,
  competencyScores,
  computeOverallScore,
  rankedBehaviors,
  ratingToPercent,
  resolveColumnPlan,
  resolveMergeVariables,
  resolvePerformanceCategory,
  resolveReportPlan,
  resolveWeights,
  scoreColumns,
  totalComments,
  weightedBehaviorMean,
  type Report360Audience,
  type Report360Column,
  type Report360ColumnPlan,
} from '@/lib/report360Scoring'
import type { Survey360 } from '@/data/mock/surveys360'

const COMMENTS_PER_PAGE = 6

type PageProps = {
  block: Report360Block
  subject: Report360Subject
  survey: Survey360
  template: Report360Template
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length)}…` : value
}

function pageContext({ subject, template, survey }: Omit<PageProps, 'block'>) {
  const plan = resolveColumnPlan(subject, template.masterDesign)
  const overall = computeOverallScore(subject, template)
  const category = resolvePerformanceCategory(overall, template.masterDesign.performanceCategories)
  return {
    plan,
    overall,
    category,
    deploymentDate: format(new Date(survey.createdAt), 'MMM dd, yyyy'),
  }
}

function RelationshipBadge({
  column,
  design,
}: {
  column: Report360Column
  design: Report360MasterDesign
}) {
  const letter = column.merged
    ? 'O'
    : (design.relationshipIcons[column.key as Report360Relationship]?.letter ??
      column.label.charAt(0))
  return (
    <span
      className="mr-1.5 inline-flex size-4 items-center justify-center rounded-full text-[9px] font-semibold text-white"
      style={{ background: column.color }}
    >
      {letter}
    </span>
  )
}

function HeaderLogo({ logo }: { logo: Report360LogoAsset | null }) {
  if (!logo) return null
  if (!logo.dataUrl) return <span className="text-gray-400">{logo.name}</span>
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={logo.dataUrl} alt={logo.name} className="h-5 w-auto max-w-[96px] object-contain" />
}

/** Table colors all come from Master Design so one setting changes every table. */
function tableTheme(design: Report360MasterDesign) {
  return {
    table: { borderColor: design.tableBorderColor },
    head: {
      color: design.tableHeadingTextColor,
      borderColor: design.tableBorderColor,
    },
    row: (index: number) => ({
      background: index % 2 === 0 ? design.tableBackground1 : design.tableBackground2,
      borderColor: design.tableBorderColor,
    }),
  }
}

function ReportPage({
  children,
  design,
  pageNumber,
}: {
  children: React.ReactNode
  design: Report360MasterDesign
  pageNumber: number
}) {
  return (
    <article
      className="mx-auto mb-8 min-h-[900px] w-full max-w-[816px] overflow-hidden bg-white shadow-md"
      style={{ color: design.fontColor, fontFamily: design.fontFamily }}
    >
      <div
        className="flex items-center justify-between border-b px-10 py-3 text-xs text-gray-500"
        style={{ borderColor: design.tableBorderColor }}
      >
        <span className="flex items-center gap-2">
          {design.showLogo ? <HeaderLogo logo={design.leftHeaderLogo} /> : null}
          <span>{design.headerText}</span>
        </span>
        {design.showLogo ? <HeaderLogo logo={design.rightHeaderLogo} /> : null}
      </div>
      <div className="px-10 py-8">{children}</div>
      <div className="flex items-center justify-between px-10 py-3 text-xs text-gray-400">
        <span>{design.footerText}</span>
        <span>{design.pageNumbering ? `Page ${pageNumber}` : ''}</span>
      </div>
    </article>
  )
}

function PageTitle({
  block,
  design,
  children,
}: {
  block: Report360Block
  design?: Report360MasterDesign
  children?: React.ReactNode
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold" style={{ color: design?.themeColor ?? '#111827' }}>
        {block.title}
      </h2>
      {block.introduction ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{block.introduction}</p>
      ) : null}
      {children}
    </div>
  )
}

function ClosingText({ block }: { block: Report360Block }) {
  if (!block.closingText) return null
  return <p className="mt-6 text-sm text-gray-500">{block.closingText}</p>
}

function NoDataNotice({ reason }: { reason: string }) {
  return (
    <p className="mt-6 rounded border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
      {reason}
    </p>
  )
}

function SuppressedNote({ plan }: { plan: Report360ColumnPlan }) {
  if (plan.suppressed.length === 0) return null
  const names = plan.suppressed.map((key) => REPORT360_RELATIONSHIP_LABELS[key]).join(' and ')
  const merged = plan.columns.some((column) => column.merged)
  return (
    <p className="mt-4 text-xs text-gray-500">
      {names} had too few responses to report separately and {merged
        ? 'are shown as Combined others'
        : 'are excluded from this report'}{' '}
      to protect rater confidentiality.
    </p>
  )
}

/* ------------------------------------------------------------------ Cover */

function CoverPage({ block, subject, survey, template }: PageProps) {
  const { overall, category, deploymentDate } = pageContext({ subject, survey, template })
  const total = evaluatorTotal(subject)
  const coverText = resolveMergeVariables(block.introduction, {
    subject,
    programName: survey.title,
    overallScore: overall,
    categoryLabel: category?.label ?? '',
    deploymentDate,
  })

  const badge =
    block.showOverallScoreOnCover || block.showPerformanceCategoryOnCover ? (
      <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-lg font-medium">
        {block.showOverallScoreOnCover && overall != null ? <span>{overall}%</span> : null}
        {block.showOverallScoreOnCover && block.showPerformanceCategoryOnCover && category ? (
          <span className="opacity-60">·</span>
        ) : null}
        {block.showPerformanceCategoryOnCover && category ? <span>{category.label}</span> : null}
      </div>
    ) : null

  const details = (
    <>
      <p className="text-sm text-white/80">{survey.title}</p>
      {coverText ? <p className="mt-2 text-sm text-white/90">{coverText}</p> : null}
      <p className="mt-4 text-sm text-white/80">
        {total} evaluators · {deploymentDate}
      </p>
      {badge ? <div className="mt-6">{badge}</div> : null}
    </>
  )

  if (block.coverTemplate === 'centered') {
    return (
      <div
        className="flex min-h-[720px] flex-col items-center justify-center p-10 text-center text-white"
        style={{ background: block.coverBackgroundColor }}
      >
        <p className="text-sm uppercase tracking-[0.2em] text-white/70">360° Development Report</p>
        <h2 className="mt-6 break-words text-4xl font-semibold">{subject.name}</h2>
        <p className="mt-2 text-lg text-white/80">{subject.role}</p>
        <div className="mt-10">{details}</div>
      </div>
    )
  }

  if (block.coverTemplate === 'split') {
    return (
      <div className="flex min-h-[720px] text-white" style={{ background: block.coverBackgroundColor }}>
        <div className="w-1/3 bg-black/25" />
        <div className="flex w-2/3 flex-col justify-center p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">360° Development Report</p>
          <h2 className="mt-6 break-words text-4xl font-semibold">{subject.name}</h2>
          <p className="mt-2 text-lg text-white/80">{subject.role}</p>
          <div className="mt-10">{details}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-[720px] flex-col justify-between p-10 text-white"
      style={{ background: block.coverBackgroundColor }}
    >
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-white/70">360° Development Report</p>
        <h2 className="mt-6 break-words text-4xl font-semibold">{subject.name}</h2>
        <p className="mt-2 text-lg text-white/80">{subject.role}</p>
      </div>
      <div>{details}</div>
    </div>
  )
}

function BackCoverPage({ block, survey, template }: Omit<PageProps, 'subject'>) {
  return (
    <div
      className="flex min-h-[720px] flex-col items-center justify-center gap-4 p-10 text-center text-white"
      style={{ background: block.coverBackgroundColor }}
    >
      {block.backCoverLogo && template.masterDesign.showLogo ? (
        <HeaderLogo logo={template.masterDesign.leftHeaderLogo} />
      ) : null}
      <p className="text-lg font-medium">{survey.title}</p>
      {block.contactName ? <p className="text-sm text-white/80">{block.contactName}</p> : null}
      {block.contactEmail ? <p className="text-sm text-white/80">{block.contactEmail}</p> : null}
      {block.confidentialityNote ? (
        <p className="mt-6 max-w-sm text-xs text-white/70">{block.confidentialityNote}</p>
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------- Static content */

function IntroductionPage({ block, template }: PageProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
        {block.introduction || 'This report summarizes multi-rater feedback for development planning.'}
      </p>
    </div>
  )
}

function CustomContentPage({ block, template }: PageProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
        {block.customBody || 'Add page content in the Report Builder.'}
      </p>
    </div>
  )
}

/* ------------------------------------------------------- Executive summary */

function ExecutiveSummaryPage({ block, subject, survey, template }: PageProps) {
  const { plan, overall, category } = pageContext({ subject, survey, template })
  const ranked = rankedBehaviors(subject, template, block)
  const strengths = ranked.slice(0, 3)
  const growth = [...ranked].reverse().slice(0, 3)
  const largestGap = [...subject.gaps].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0]
  const completed = subject.nominatedRaters.filter((rater) => rater.status === 'Completed').length
  const invited = subject.nominatedRaters.length

  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div
          className="flex size-28 items-center justify-center rounded-full border-8 text-2xl font-semibold"
          style={{ borderColor: category?.color ?? '#1B87E6', color: category?.color ?? '#1B4E8E' }}
        >
          {overall == null ? '—' : `${overall}%`}
        </div>
        <div>
          {category ? (
            <p
              className="inline-block rounded px-3 py-1 text-sm font-medium text-white"
              style={{ background: category.color }}
            >
              {category.label}
            </p>
          ) : null}
          <p className="mt-3 max-w-xl text-sm text-gray-600">{subject.alignmentStatement}</p>
          <p className="mt-2 text-xs text-gray-500">
            {invited > 0
              ? `${completed} of ${invited} nominated evaluators completed their feedback.`
              : `${evaluatorTotal(subject)} evaluations received.`}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Top strengths</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            {strengths.map((item) => (
              <li key={item.behavior.id} className="flex items-start justify-between gap-3">
                <span>{item.behavior.text}</span>
                <span className="shrink-0 font-medium text-gray-900">{item.mean}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Development areas</h3>
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            {growth.map((item) => (
              <li key={item.behavior.id} className="flex items-start justify-between gap-3">
                <span>{item.behavior.text}</span>
                <span className="shrink-0 font-medium text-gray-900">{item.mean}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {largestGap ? (
        <div className="mt-8 rounded border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Largest perception gap</h3>
          <p className="mt-1 text-sm text-gray-700">
            {largestGap.competency} — self {largestGap.selfScore}, others {largestGap.othersAvg} (
            {largestGap.gap > 0 ? `+${largestGap.gap}` : largestGap.gap},{' '}
            {GAP_CLASS_LABELS[classifyGap(largestGap.gap)]})
          </p>
        </div>
      ) : null}

      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b" style={tableTheme(template.masterDesign).head}>
            <th className="py-2 font-medium">Relationship</th>
            <th className="py-2 font-medium">Evaluators</th>
          </tr>
        </thead>
        <tbody>
          {plan.columns.map((column, index) => (
            <tr key={column.key} className="border-b" style={tableTheme(template.masterDesign).row(index)}>
              <td className="py-2">{column.label}</td>
              <td className="py-2">{column.responses}</td>
            </tr>
          ))}
          <tr>
            <td className="py-2 font-medium">Total</td>
            <td className="py-2 font-medium">{evaluatorTotal(subject)}</td>
          </tr>
        </tbody>
      </table>
      <SuppressedNote plan={plan} />
      <ClosingText block={block} />
    </div>
  )
}

/* ------------------------------------------------------- Competency detail */

function CompetencyDetailPage({
  block,
  subject,
  survey,
  template,
  rows,
  continued,
}: PageProps & { rows: ReturnType<typeof behaviorsWithData>; continued: boolean }) {
  const { plan } = pageContext({ subject, survey, template })
  const design = template.masterDesign
  const theme = tableTheme(design)
  const weights = resolveWeights(template, block)
  const meanColumns = scoreColumns(plan, design)
  const chartData = rows.map((row) => {
    const point: Record<string, string | number | null> = { name: truncate(row.text, 28) }
    plan.columns.forEach((column) => {
      point[column.label] = columnScore(row, column)
    })
    point.Mean = weightedBehaviorMean(row, meanColumns, weights)
    return point
  })
  const columnCount =
    1 + plan.columns.length + (block.meanColumn ? 1 : 0) + (block.priorityColumn ? 1 : 0)

  const groupedRows: { key: string; category: string; rows: typeof rows }[] = []
  rows.forEach((row) => {
    const last = groupedRows[groupedRows.length - 1]
    if (last && last.category === row.competency) {
      last.rows.push(row)
      return
    }
    groupedRows.push({ key: `${row.competencyId}-${row.id}`, category: row.competency, rows: [row] })
  })

  return (
    <div>
      <PageTitle block={{ ...block, title: continued ? `${block.title} (continued)` : block.title }} design={template.masterDesign} />
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {block.chartType === 'radar' ? (
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 5]} />
              {plan.columns.map((column) => (
                <Radar
                  key={column.key}
                  name={column.label}
                  dataKey={column.label}
                  stroke={column.color}
                  fill={column.color}
                  fillOpacity={0.12}
                />
              ))}
              <Legend />
            </RadarChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={70}
              />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              {plan.columns.map((column) => (
                <Bar key={column.key} dataKey={column.label} fill={column.color} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {block.tabularData ? (
        <table className="mt-6 w-full text-left text-xs">
          <thead>
            <tr className="border-b" style={theme.head}>
              <th className="py-2 pr-2 font-medium">Behavior</th>
              {plan.columns.map((column) => (
                <th key={column.key} className="py-2 font-medium">
                  {block.relationshipIcons ? (
                    <RelationshipBadge column={column} design={design} />
                  ) : null}
                  {column.label}
                </th>
              ))}
              {block.meanColumn ? <th className="py-2 font-medium">Mean</th> : null}
              {block.priorityColumn ? <th className="py-2 font-medium">Priority</th> : null}
            </tr>
          </thead>
          <tbody>
            {groupedRows.map((group) => (
              <Fragment key={group.key}>
                {design.showCategoryHeaders && group.category ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className="border-b px-0 py-2 text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: design.themeColor, borderColor: design.tableBorderColor }}
                    >
                      {design.categoryHeaderTitle
                        ? `${design.categoryHeaderTitle}: ${group.category}`
                        : group.category}
                    </td>
                  </tr>
                ) : null}
                {group.rows.map((row, rowIndex) => (
                  <tr key={row.id} className="border-b" style={theme.row(rowIndex)}>
                    <td className="py-2 pr-2">{row.text}</td>
                    {plan.columns.map((column) => (
                      <td key={column.key} className="py-2">
                        {columnScore(row, column) ?? '—'}
                      </td>
                    ))}
                    {block.meanColumn ? (
                      <td className="py-2 font-medium">
                        {weightedBehaviorMean(row, meanColumns, weights) ?? '—'}
                      </td>
                    ) : null}
                    {block.priorityColumn ? <td className="py-2">{row.importance}%</td> : null}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      ) : null}

      <SuppressedNote plan={plan} />

      {block.qxBotInsights ? (
        <div className="mt-6 rounded border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium">QxBot Insights</p>
          <p className="mt-1">{subject.qxBot.commentInsights.strengths[0]}</p>
          <p className="mt-1">{subject.qxBot.commentInsights.improvements[0]}</p>
        </div>
      ) : null}
      <ClosingText block={block} />
    </div>
  )
}

/* ------------------------------------------------------ Score-driven pages */

function TopBehaviorsPage({ block, subject, survey, template }: PageProps) {
  const ranked = rankedBehaviors(subject, template, block).slice(0, block.itemCount || 5)
  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <ol className="mt-6 space-y-3">
        {ranked.map((item, index) => (
          <li key={item.behavior.id} className="rounded border border-gray-100 px-4 py-3">
            <p className="text-xs font-semibold text-blue-700">#{index + 1}</p>
            <p className="text-sm text-gray-800">{item.behavior.text}</p>
            <p className="text-xs text-gray-500">
              {item.behavior.competency} · weighted mean {item.mean}
            </p>
          </li>
        ))}
      </ol>
      <SuppressedNote plan={resolveColumnPlan(subject, template.masterDesign)} />
      <ClosingText block={block} />
    </div>
  )
}

function KeyDevelopmentAreasPage({ block, subject, template }: PageProps) {
  const ranked = rankedBehaviors(subject, template, block, {
    excludeSelf:
      template.masterDesign.excludeSelfInPriorityScore ||
      template.masterDesign.excludeSelfInAverageScore,
  })
  const areas = [...ranked].reverse().slice(0, block.itemCount || 5)
  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <div className="mt-6 space-y-3">
        {areas.map((item, index) => (
          <div key={item.behavior.id} className="rounded border border-gray-100 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                  Priority {index + 1}
                </p>
                <p className="mt-1 text-sm text-gray-800">{item.behavior.text}</p>
                <p className="mt-1 text-xs text-gray-500">{item.behavior.competency}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold text-gray-900">{item.mean}</p>
                <p className="text-xs text-gray-500">{ratingToPercent(item.mean)}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ClosingText block={block} />
    </div>
  )
}

function StrengthGrowthPage({ block, subject, template }: PageProps) {
  const ranked = rankedBehaviors(subject, template, block)
  const count = block.itemCount || 5
  const strengths = ranked.slice(0, count)
  const growth = [...ranked].reverse().slice(0, count)
  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded border border-green-100 bg-green-50/50 p-4">
          <h3 className="text-sm font-semibold text-green-800">Strength indicators</h3>
          <ol className="mt-3 space-y-2 text-sm text-gray-700">
            {strengths.map((item) => (
              <li key={item.behavior.id} className="flex items-start justify-between gap-3">
                <span>{item.behavior.text}</span>
                <span className="shrink-0 font-medium">{item.mean}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded border border-orange-100 bg-orange-50/50 p-4">
          <h3 className="text-sm font-semibold text-orange-800">Growth indicators</h3>
          <ol className="mt-3 space-y-2 text-sm text-gray-700">
            {growth.map((item) => (
              <li key={item.behavior.id} className="flex items-start justify-between gap-3">
                <span>{item.behavior.text}</span>
                <span className="shrink-0 font-medium">{item.mean}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <ClosingText block={block} />
    </div>
  )
}

function CompetencyPriorityIndexPage({ block, subject, template }: PageProps) {
  const scores = competencyScores(subject, template, block, {
    excludeSelf:
      template.masterDesign.excludeSelfInPriorityScore ||
      template.masterDesign.excludeSelfInAverageScore,
  })
    .filter((item) => item.mean != null)
    .map((item) => ({
      ...item,
      index: Math.round(item.importance * (1 - (ratingToPercent(item.mean as number) / 100)) ),
    }))
    .sort((a, b) => b.index - a.index)

  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <p className="mt-2 text-sm text-gray-600">
        Competencies ranked by how much they matter to raters relative to how strongly they are
        rated. A high index means high importance and a lower score.
      </p>
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b" style={tableTheme(template.masterDesign).head}>
            <th className="py-2 font-medium">Competency</th>
            <th className="py-2 font-medium">Score</th>
            <th className="py-2 font-medium">Importance</th>
            <th className="py-2 font-medium">Priority index</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((item, index) => (
            <tr key={item.competencyId} className="border-b" style={tableTheme(template.masterDesign).row(index)}>
              <td className="py-2">{item.competency}</td>
              <td className="py-2">{item.mean}</td>
              <td className="py-2">{item.importance}%</td>
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded bg-gray-100">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${Math.min(100, item.index)}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-gray-600">{item.index}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ClosingText block={block} />
    </div>
  )
}

function SpiderChartPage({ block, subject, survey, template }: PageProps) {
  const { plan } = pageContext({ subject, survey, template })
  const standalone = plan.columns.filter((column) => !column.merged)
  const relationships = block.spiderRelationships.filter((relationship) =>
    standalone.some((column) => column.key === relationship),
  )
  const scores = competencyScores(subject, template, block)
  const competencyIds = block.spiderCompetencyIds.length >= 3
    ? block.spiderCompetencyIds
    : REPORT360_COMPETENCIES.map((item) => item.id)

  const data = competencyIds.map((id) => {
    const rows = subject.behaviors.filter((item) => item.competencyId === id)
    const point: Record<string, string | number> = {
      competency: scores.find((item) => item.competencyId === id)?.competency ?? id,
    }
    relationships.forEach((relationship) => {
      const values = rows
        .map((row) => row.scores[relationship])
        .filter((value): value is number => value != null)
      point[REPORT360_RELATIONSHIP_LABELS[relationship]] =
        values.length === 0
          ? 0
          : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
    })
    return point
  })

  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <div className="mt-6 h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="competency" />
            <PolarRadiusAxis domain={[0, 5]} />
            {relationships.map((relationship) => {
              const color =
                template.masterDesign.relationshipIcons[relationship]?.color ??
                REPORT360_RELATIONSHIP_COLORS[relationship]
              return (
              <Radar
                key={relationship}
                name={REPORT360_RELATIONSHIP_LABELS[relationship]}
                dataKey={REPORT360_RELATIONSHIP_LABELS[relationship]}
                stroke={color}
                fill={color}
                fillOpacity={0.08}
                strokeDasharray={
                  block.lineStyles[relationship] === 'dashed'
                    ? '6 4'
                    : block.lineStyles[relationship] === 'dotted'
                      ? '2 4'
                      : undefined
                }
              />
              )
            })}
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <SuppressedNote plan={plan} />
      <ClosingText block={block} />
    </div>
  )
}

function GapAnalysisPage({ block, subject, template }: PageProps) {
  const data = subject.gaps.map((gap) => ({
    name: gap.competency,
    gap: gap.gap,
    fill: classifyGap(gap.gap) === 'blind-spot' ? '#DC2626' : gap.gap >= 0 ? '#16A34A' : '#F59E0B',
  }))
  const blindSpots = subject.gaps.filter((gap) => classifyGap(gap.gap) === 'blind-spot')
  const hiddenStrengths = subject.gaps.filter((gap) => classifyGap(gap.gap) === 'hidden-strength')
  const sorted = [...subject.gaps].sort((a, b) => b.othersAvg - a.othersAvg)
  const confirmedStrengths = sorted.filter((gap) => classifyGap(gap.gap) === 'aligned').slice(0, 3)
  const improvements = [...sorted]
    .reverse()
    .filter((gap) => classifyGap(gap.gap) === 'aligned')
    .slice(0, 3)

  return (
    <div>
      <PageTitle block={block} design={template.masterDesign}>
        <p className="mt-2 text-sm text-gray-600">
          Others minus self. A difference of {GAP_SIGNIFICANCE.toFixed(1)} or more is treated as
          significant rather than measurement noise.
        </p>
      </PageTitle>
      <div className="mt-6 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[-2, 2]} />
            <YAxis type="category" dataKey="name" width={70} />
            <Tooltip />
            <Bar dataKey="gap">
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b" style={tableTheme(template.masterDesign).head}>
            <th className="py-2 font-medium">Competency</th>
            <th className="py-2 font-medium">Self</th>
            <th className="py-2 font-medium">Others</th>
            <th className="py-2 font-medium">Gap</th>
            <th className="py-2 font-medium">Read</th>
          </tr>
        </thead>
        <tbody>
          {subject.gaps.map((gap, index) => (
            <tr key={gap.competencyId} className="border-b" style={tableTheme(template.masterDesign).row(index)}>
              <td className="py-2">{gap.competency}</td>
              <td className="py-2">{gap.selfScore}</td>
              <td className="py-2">{gap.othersAvg}</td>
              <td className="py-2">{gap.gap > 0 ? `+${gap.gap}` : gap.gap}</td>
              <td className="py-2 text-gray-600">{GAP_CLASS_LABELS[classifyGap(gap.gap)]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <QuadrantCard
          title="Confirmed strengths"
          hint="Rated high, self and others agree"
          items={confirmedStrengths.map((gap) => gap.competency)}
          tone="green"
        />
        <QuadrantCard
          title="Blind spots"
          hint={`Self is ${GAP_SIGNIFICANCE.toFixed(1)}+ above others`}
          items={blindSpots.map((gap) => `${gap.competency} (${gap.gap})`)}
          tone="red"
        />
        <QuadrantCard
          title="Development areas"
          hint="Rated low, self and others agree"
          items={improvements.map((gap) => gap.competency)}
          tone="orange"
        />
        <QuadrantCard
          title="Hidden strengths"
          hint={`Others are ${GAP_SIGNIFICANCE.toFixed(1)}+ above self`}
          items={hiddenStrengths.map((gap) => `${gap.competency} (+${gap.gap})`)}
          tone="blue"
        />
      </div>
      <ClosingText block={block} />
    </div>
  )
}

function QuadrantCard({
  title,
  hint,
  items,
  tone,
}: {
  title: string
  hint: string
  items: string[]
  tone: 'green' | 'red' | 'orange' | 'blue'
}) {
  const tones = {
    green: 'border-green-100 bg-green-50/60 text-green-900',
    red: 'border-red-100 bg-red-50/60 text-red-900',
    orange: 'border-orange-100 bg-orange-50/60 text-orange-900',
    blue: 'border-blue-100 bg-blue-50/60 text-blue-900',
  }
  return (
    <div className={`rounded border p-4 ${tones[tone]}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs opacity-70">{hint}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs opacity-60">None identified this cycle.</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PerformanceTrendPage({ block, subject, template }: PageProps) {
  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <div className="mt-6 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={subject.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" />
            <YAxis domain={[50, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="overall" stroke="#111827" strokeWidth={2} />
            <Line type="monotone" dataKey="leadership" stroke="#1B87E6" />
            <Line type="monotone" dataKey="communication" stroke="#7C3AED" />
            <Line type="monotone" dataKey="collaboration" stroke="#16A34A" />
            <Line type="monotone" dataKey="inclusion" stroke="#EA580C" />
            <Line type="monotone" dataKey="influence" stroke="#6B7280" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ClosingText block={block} />
    </div>
  )
}

function RelationshipBreakdownPage({ block, subject, survey, template }: PageProps) {
  const { plan } = pageContext({ subject, survey, template })
  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {plan.columns.map((column) => {
          const ranked = behaviorsWithData(subject)
            .map((behavior) => ({ behavior, score: columnScore(behavior, column) }))
            .filter((item): item is { behavior: (typeof subject.behaviors)[number]; score: number } =>
              item.score != null,
            )
            .sort((a, b) => b.score - a.score)
            .slice(0, block.rankingCount)
          return (
            <div key={column.key} className="rounded border border-gray-100 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: column.color }}
                />
                {column.label}
                <span className="font-normal text-gray-400">({column.responses})</span>
              </h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                {ranked.map((item) => (
                  <li key={item.behavior.id}>
                    {item.behavior.text} <span className="text-gray-400">({item.score})</span>
                  </li>
                ))}
              </ol>
            </div>
          )
        })}
      </div>
      <SuppressedNote plan={plan} />
      <ClosingText block={block} />
    </div>
  )
}

/* ---------------------------------------------------------------- Comments */

type CommentItem = {
  questionId: string
  questionText: string
  comment: Report360Comment
}

function buildCommentPages(subject: Report360Subject, block: Report360Block): CommentItem[][] {
  const items: CommentItem[] = []
  commentQuestionsWithData(subject, block).forEach((question) => {
    question.comments.forEach((comment) => {
      items.push({ questionId: question.id, questionText: question.text, comment })
    })
  })
  const pages: CommentItem[][] = []
  for (let index = 0; index < items.length; index += COMMENTS_PER_PAGE) {
    pages.push(items.slice(index, index + COMMENTS_PER_PAGE))
  }
  return pages.length > 0 ? pages : [[]]
}

function PriorityCommentsPage({
  block,
  template,
  items,
  carriedQuestionId,
}: PageProps & { items: CommentItem[]; carriedQuestionId: string | null }) {
  const grouped = block.commentDisplayMode === 'grouped' && block.commentQuestionIds.length > 1

  if (!grouped) {
    return (
      <div>
        <PageTitle block={block} design={template.masterDesign} />
        <ul className="mt-6 space-y-3">
          {items.map((item, index) => (
            <li key={`${item.questionId}-${index}`} className="rounded border border-gray-100 px-4 py-3">
              {block.showRelationshipLabel ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {REPORT360_RELATIONSHIP_LABELS[item.comment.relationship]}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-gray-800">{item.comment.text}</p>
            </li>
          ))}
        </ul>
        <ClosingText block={block} />
      </div>
    )
  }

  const groups: { questionId: string; questionText: string; comments: Report360Comment[] }[] = []
  items.forEach((item) => {
    const last = groups[groups.length - 1]
    if (last && last.questionId === item.questionId) {
      last.comments.push(item.comment)
      return
    }
    groups.push({
      questionId: item.questionId,
      questionText: item.questionText,
      comments: [item.comment],
    })
  })

  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <div className="mt-6 space-y-6">
        {groups.map((group, index) => (
          <section key={`${group.questionId}-${index}`}>
            <h3 className="border-b border-gray-200 pb-1 text-sm font-semibold text-gray-900">
              {group.questionText}
              {index === 0 && carriedQuestionId === group.questionId ? ' (continued)' : ''}
            </h3>
            <ul className="mt-3 space-y-3">
              {group.comments.map((comment, commentIndex) => (
                <li
                  key={`${comment.text}-${commentIndex}`}
                  className="rounded border border-gray-100 px-4 py-3"
                >
                  {block.showRelationshipLabel ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {REPORT360_RELATIONSHIP_LABELS[comment.relationship]}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-gray-800">{comment.text}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <ClosingText block={block} />
    </div>
  )
}

/* --------------------------------------------------------------- Roster/AI */

function ResponseSummaryPage({ block, subject, survey, template }: PageProps) {
  const { plan } = pageContext({ subject, survey, template })
  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b" style={tableTheme(template.masterDesign).head}>
            <th className="py-2 font-medium">Relationship</th>
            <th className="py-2 font-medium">Responses</th>
          </tr>
        </thead>
        <tbody>
          {plan.columns.map((column, index) => (
            <tr key={column.key} className="border-b" style={tableTheme(template.masterDesign).row(index)}>
              <td className="py-2">{column.label}</td>
              <td className="py-2">{column.responses}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm text-gray-500">Total evaluations: {evaluatorTotal(subject)}</p>
      <SuppressedNote plan={plan} />
      <ClosingText block={block} />
    </div>
  )
}

function EvaluatorRosterPage({ block, subject, template }: PageProps) {
  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b" style={tableTheme(template.masterDesign).head}>
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Relationship</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {subject.nominatedRaters.map((rater, index) => (
            <tr key={`${rater.name}-${rater.relationship}`} className="border-b" style={tableTheme(template.masterDesign).row(index)}>
              <td className="py-2">{rater.name}</td>
              <td className="py-2">{rater.relationship}</td>
              <td className="py-2">{rater.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ClosingText block={block} />
    </div>
  )
}

function AiRecommendationsPage({ block, subject, template }: PageProps) {
  const responses = totalComments(subject)
  const belowThreshold = responses < AI_MIN_RESPONSES
  const sentimentTotal =
    subject.qxBot.sentimentPositive + subject.qxBot.sentimentNeutral + subject.qxBot.sentimentNegative
  const allPositive = subject.qxBot.sentimentNegative === 0
  const cards = subject.qxBot.cards.slice(0, block.aiRecommendationCount)

  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <p className="mt-2 text-xs text-gray-500">
        Source: {block.aiDataSource}
        {subject.qxBot.generatedAt
          ? ` · generated ${format(new Date(subject.qxBot.generatedAt), 'MMM dd, yyyy')}`
          : ' · not generated yet'}
      </p>

      {belowThreshold ? (
        <NoDataNotice
          reason={`Only ${responses} open-ended response${responses === 1 ? '' : 's'} were submitted. QxBot needs at least ${AI_MIN_RESPONSES} before it will generate recommendations.`}
        />
      ) : (
        <>
          {block.showSentimentBar ? (
            <div className="mt-6">
              <div className="overflow-hidden rounded-full bg-gray-100">
                <div className="flex h-4 text-[0px]">
                  <div
                    className="bg-green-600"
                    style={{ width: `${(subject.qxBot.sentimentPositive / sentimentTotal) * 100}%` }}
                  />
                  <div
                    className="bg-gray-400"
                    style={{ width: `${(subject.qxBot.sentimentNeutral / sentimentTotal) * 100}%` }}
                  />
                  <div
                    className="bg-red-500"
                    style={{ width: `${(subject.qxBot.sentimentNegative / sentimentTotal) * 100}%` }}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Positive {subject.qxBot.sentimentPositive}% · Neutral {subject.qxBot.sentimentNeutral}%
                · Negative {subject.qxBot.sentimentNegative}%
              </p>
            </div>
          ) : null}

          {allPositive && block.includeReinforcement ? (
            <p className="mt-4 rounded border border-green-100 bg-green-50 px-4 py-2 text-sm text-green-800">
              Feedback this cycle was uniformly positive, so these are reinforcement
              recommendations rather than development areas.
            </p>
          ) : null}

          <div className="mt-6 grid gap-4">
            {cards.map((card) => (
              <div key={card.title} className="rounded border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-gray-900">{card.title}</h3>
                  {block.showThemeTags ? (
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {card.tag}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-gray-600">{card.body}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                  {card.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </>
      )}
      <ClosingText block={block} />
    </div>
  )
}

function ActionPlanPage({ block, subject, template }: PageProps) {
  const items = subject.actionPlanItems.filter(
    (item) =>
      block.actionPlanPriorities.length === 0 ||
      block.actionPlanPriorities.includes(item.priority) ||
      block.actionPlanPriorities.includes('#1 to #3'),
  )
  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.priority} className="rounded border border-gray-100 p-4">
            <p className="text-xs font-semibold text-blue-700">{item.priority}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{item.behavior}</p>
            <p className="mt-1 text-sm text-gray-600">{item.action}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400">
                Success measure
              </div>
              <div className="rounded border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400">
                Review date
              </div>
            </div>
          </div>
        ))}
      </div>
      <ClosingText block={block} />
    </div>
  )
}

/* ------------------------------------------------------------------ Stack */

function blockBodies(props: PageProps): React.ReactNode[] {
  const { block, subject, template } = props

  switch (block.type) {
    case 'cover': {
      const pages: React.ReactNode[] = [<CoverPage key="cover" {...props} />]
      return pages
    }
    case 'introduction':
      return [<IntroductionPage key="intro" {...props} />]
    case 'customContent':
      return [<CustomContentPage key="custom" {...props} />]
    case 'executiveSummary':
      return [<ExecutiveSummaryPage key="exec" {...props} />]
    case 'competencyDetail': {
      const rows = behaviorsWithData(subject)
      const perPage = Math.max(1, block.behavioursPerPage || 5)
      const chunks: (typeof rows)[] = []
      for (let index = 0; index < rows.length; index += perPage) {
        chunks.push(rows.slice(index, index + perPage))
      }
      if (chunks.length === 0) chunks.push([])
      return chunks.map((chunk, index) => (
        <CompetencyDetailPage
          key={`competency-${index}`}
          {...props}
          rows={chunk}
          continued={index > 0}
        />
      ))
    }
    case 'overallData':
      return [<TopBehaviorsPage key="top" {...props} />]
    case 'keyDevelopmentAreas':
      return [<KeyDevelopmentAreasPage key="kda" {...props} />]
    case 'strengthGrowthIndicators':
      return [<StrengthGrowthPage key="sgi" {...props} />]
    case 'competencyPriorityIndex':
      return [<CompetencyPriorityIndexPage key="cpi" {...props} />]
    case 'spiderChart':
      return [<SpiderChartPage key="spider" {...props} />]
    case 'gapAnalysis':
      return [<GapAnalysisPage key="gap" {...props} />]
    case 'performanceTrend':
      return subject.trend.length >= 2
        ? [<PerformanceTrendPage key="trend" {...props} />]
        : [
            <div key="trend-empty">
              <PageTitle block={block} design={template.masterDesign} />
              <NoDataNotice reason="No prior cycle to compare against." />
            </div>,
          ]
    case 'rankingByRelationship':
      return [<RelationshipBreakdownPage key="ranking" {...props} />]
    case 'priorityComments': {
      const pages = buildCommentPages(subject, block)
      let previousLastQuestion: string | null = null
      return pages.map((items, index) => {
        const carried =
          index > 0 && items[0] && previousLastQuestion === items[0].questionId
            ? previousLastQuestion
            : null
        previousLastQuestion = items[items.length - 1]?.questionId ?? previousLastQuestion
        if (items.length === 0) {
          return (
            <div key="comments-empty">
              <PageTitle block={block} design={template.masterDesign} />
              <NoDataNotice reason="No open-ended responses for the selected questions." />
            </div>
          )
        }
        return (
          <PriorityCommentsPage
            key={`comments-${index}`}
            {...props}
            items={items}
            carriedQuestionId={carried}
          />
        )
      })
    }
    case 'surveyRespondents':
      return [<ResponseSummaryPage key="respondents" {...props} />]
    case 'nominatedRaters':
      return [<EvaluatorRosterPage key="roster" {...props} />]
    case 'aiRecommendations':
      return [<AiRecommendationsPage key="ai" {...props} />]
    case 'actionPlan':
      return [<ActionPlanPage key="action" {...props} />]
    default:
      return [
        <div key="unknown">
          <PageTitle block={block} design={template.masterDesign} />
          <NoDataNotice reason="This block has no renderer yet." />
        </div>,
      ]
  }
}

export function ReportPageStack({
  survey,
  subject,
  template,
  audience = 'admin',
}: {
  survey: Survey360
  subject: Report360Subject
  template: Report360Template
  audience?: Report360Audience
}) {
  const plan = resolveReportPlan(subject, template, audience)
  const coverBlock = plan.blocks.find((block) => block.type === 'cover')
  let pageNumber = 0

  return (
    <div className="py-8">
      {plan.blocks.map((block) => {
        const bodies = blockBodies({ block, subject, survey, template })
        return bodies.map((body, index) => {
          pageNumber += 1
          if (block.type === 'cover') {
            return (
              <article
                key={`${block.id}-${index}`}
                className="mx-auto mb-8 w-full max-w-[816px] overflow-hidden bg-white shadow-md"
              >
                {body}
              </article>
            )
          }
          return (
            <ReportPage
              key={`${block.id}-${index}`}
              design={template.masterDesign}
              pageNumber={pageNumber}
            >
              {body}
            </ReportPage>
          )
        })
      })}

      {coverBlock?.includeBackCover ? (
        <article className="mx-auto mb-8 w-full max-w-[816px] overflow-hidden bg-white shadow-md">
          <BackCoverPage block={coverBlock} survey={survey} template={template} />
        </article>
      ) : null}
    </div>
  )
}

export function getReportPagePlan(
  subject: Report360Subject,
  template: Report360Template,
  audience: Report360Audience = 'admin',
) {
  return resolveReportPlan(subject, template, audience)
}

export { getOpenQuestion }
