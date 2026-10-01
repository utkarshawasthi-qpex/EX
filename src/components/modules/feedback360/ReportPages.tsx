'use client'

import { Fragment } from 'react'
import { format } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import {
  REPORT360_COMPETENCIES,
  REPORT360_RELATIONSHIPS,
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
  behaviorsWithData,
  classifyGap,
  columnScore,
  commentQuestionsWithData,
  competencyScores,
  rankedBehaviors,
  ratingToPercent,
  resolveColumnPlan,
  resolveMergeVariables,
  resolveReportPlan,
  resolveWeights,
  scoreColumns,
  weightedBehaviorMean,
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
  deploymentDate?: string
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length)}…` : value
}

function pageContext({ subject, template, survey, deploymentDate }: Omit<PageProps, 'block'>) {
  const plan = resolveColumnPlan(subject, template.masterDesign)
  return {
    plan,
    deploymentDate: deploymentDate ?? format(new Date(survey.createdAt), 'MMM dd, yyyy'),
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
      background: `${design.themeColor}14`,
      borderColor: design.tableBorderColor,
    },
    row: (index: number) => ({
      background: index % 2 === 0 ? design.tableBackground1 : design.tableBackground2,
      borderColor: design.tableBorderColor,
    }),
  }
}

const CHART_TICK = { fontSize: 11, fill: '#64748b' }

function DotLegend({ payload }: { payload?: ReadonlyArray<{ value?: string; color?: string }> }) {
  if (!payload?.length) return null
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2">
      {payload.map((item) => (
        <span key={item.value} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600">
          <span className="size-2 rounded-full" style={{ background: item.color }} />
          {item.value}
        </span>
      ))}
    </div>
  )
}

function ScoreChart({
  data,
  series,
  layout,
  height,
  domain = [0, 5],
}: {
  data: Record<string, string | number | null>[]
  series: { key: string; color: string }[]
  layout: 'bar' | 'horizontalBar'
  height: number
  domain?: [number, number]
}) {
  const horizontal = layout === 'horizontalBar'
  return (
    <div className="mt-6 w-full rounded-xl border border-gray-100 bg-slate-50/80 px-2 py-3" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={horizontal ? { top: 4, right: 16, left: 4, bottom: 4 } : { top: 8, right: 8, left: 0, bottom: 8 }}
          barCategoryGap="32%"
          barGap={3}
        >
          <CartesianGrid stroke="#e8eef5" vertical={false} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" domain={domain} axisLine={false} tickLine={false} tick={CHART_TICK} />
              <YAxis
                type="category"
                dataKey="name"
                width={148}
                axisLine={false}
                tickLine={false}
                tick={CHART_TICK}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={CHART_TICK}
                interval={0}
                height={56}
                angle={-28}
                textAnchor="end"
              />
              <YAxis domain={domain} axisLine={false} tickLine={false} tick={CHART_TICK} width={32} />
            </>
          )}
          {series.length > 1 ? <Legend content={<DotLegend />} /> : null}
          {series.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              fill={item.color}
              radius={horizontal ? [0, 7, 7, 0] : [7, 7, 0, 0]}
              maxBarSize={16}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function reportSheetStyle(pageSize: Report360MasterDesign['pageSize']): React.CSSProperties {
  if (pageSize === 'Letter') return { width: '8.5in', minHeight: '11in' }
  return { width: '210mm', minHeight: '297mm' }
}

const REPORT_SHEET = 'mx-auto mb-8 flex max-w-full flex-col overflow-hidden bg-white shadow-md'

function QuestionProLogo() {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label="QuestionPro">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <circle cx="8" cy="8" r="7" fill="#1B87E6" />
        <path d="M8 4.2a3.8 3.8 0 1 0 2.7 6.5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M10.2 8.2h2.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="text-[11px] font-semibold tracking-tight text-[#1B3A6B]">
        question<span className="text-[#1B87E6]">pro</span>
      </span>
    </span>
  )
}

function ReportFooter({
  footerText,
  pageNumber,
}: {
  footerText?: string
  pageNumber?: number
}) {
  return (
    <div className="mt-auto flex items-center justify-between border-t border-gray-200 bg-white px-10 py-3 text-xs text-gray-400">
      <span>
        {footerText}
        {pageNumber ? ` · Page ${pageNumber}` : ''}
      </span>
      <QuestionProLogo />
    </div>
  )
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
      className={REPORT_SHEET}
      style={{ ...reportSheetStyle(design.pageSize), color: design.fontColor, fontFamily: design.fontFamily }}
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
      <div className="flex-1 px-10 py-8">{children}</div>
      <ReportFooter footerText={design.footerText} pageNumber={design.pageNumbering ? pageNumber : undefined} />
    </article>
  )
}

function RichText({ html, className }: { html: string; className?: string }) {
  if (!html.trim()) return null
  return (
    <div
      className={`[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: coverBodyHtml(html) }}
    />
  )
}

function RelationshipMarks({ template }: { template: Report360Template }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {REPORT360_RELATIONSHIPS.map((key) => {
        const icon = template.masterDesign.relationshipIcons[key]
        return (
          <span key={key} className="inline-flex items-center gap-1 text-[11px] text-gray-600">
            <span
              className="flex size-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: icon?.color }}
            >
              {icon?.letter}
            </span>
            {REPORT360_RELATIONSHIP_LABELS[key]}
          </span>
        )
      })}
    </div>
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
      <RichText html={block.introduction} className="mt-2 text-sm leading-6 text-gray-600" />
      {children}
    </div>
  )
}

function ClosingText({ block }: { block: Report360Block }) {
  return <RichText html={block.closingText} className="mt-6 text-sm leading-6 text-gray-500" />
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

function coverBodyHtml(value: string) {
  if (!value) return ''
  if (/<[a-z][\s\S]*>/i.test(value)) return value
  return value.replace(/\n/g, '<br>')
}

function CoverPhoto({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
    </div>
  )
}

function CoverTable({
  title,
  columns,
  rows,
  numericLast = false,
}: {
  title: string
  columns: string[]
  rows: string[][]
  numericLast?: boolean
}) {
  if (rows.length === 0) return null
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-white">{title}</p>
      <table className="w-full border-collapse text-left text-sm text-white/85">
        <thead>
          <tr className="border-b border-white/30 text-[11px] tracking-wide text-white/60">
            {columns.map((column, index) => (
              <th
                key={column}
                className={`py-1.5 font-medium ${index === columns.length - 1 && numericLast ? 'text-right' : 'pr-4 text-left'}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-white/15">
              {row.map((cell, index) => (
                <td
                  key={`${cell}-${index}`}
                  className={`py-1.5 ${index === row.length - 1 && numericLast ? 'text-right tabular-nums' : 'pr-4'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CoverPage({ block, subject, survey, template, deploymentDate }: PageProps) {
  const { deploymentDate: dateLabel } = pageContext({ subject, survey, template, deploymentDate })
  const total = evaluatorTotal(subject)
  const coverText = resolveMergeVariables(block.coverBody, {
    subject,
    programName: survey.title,
    deploymentDate: dateLabel,
  })
  const respondentRows = REPORT360_RELATIONSHIPS.map((key) => ({
    key,
    label: REPORT360_RELATIONSHIP_LABELS[key],
    count: subject.evaluatorCounts[key] ?? 0,
  })).filter((row) => !block.excludeZeroResponses || row.count > 0)
  const responded = block.excludeZeroResponses
    ? respondentRows.reduce((sum, row) => sum + row.count, 0)
    : total
  const totalSent = subject.nominatedRaters.length

  const portraitSrc = block.coverImage?.dataUrl || undefined
  const portraitAlt = block.coverImage?.name || subject.name
  const respondentTableRows = block.showSurveyRespondents
    ? respondentRows.map((row) => [row.label, String(row.count)])
    : []
  if (block.showTotalSent) respondentTableRows.push(['Total sent', String(totalSent)])

  const message = coverText ? (
    <div
      className="max-w-md break-words text-sm leading-6 text-white/75 [&_p]:m-0 [&_p+p]:mt-2"
      dangerouslySetInnerHTML={{ __html: coverBodyHtml(coverText) }}
    />
  ) : null

  const identity = (
    <div className="min-w-0">
      {block.coverLabel ? (
        <p className="text-[11px] font-medium tracking-wide text-white/60">{block.coverLabel}</p>
      ) : null}
      <h2
        className={`break-words text-5xl font-semibold leading-[1.02] tracking-tight ${block.coverLabel ? 'mt-4' : ''}`}
      >
        {subject.name}
      </h2>
      {message ? <div className="mt-4">{message}</div> : null}
    </div>
  )

  const marks = block.relationshipIcons ? (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {REPORT360_RELATIONSHIPS.map((key) => {
        const icon = template.masterDesign.relationshipIcons[key]
        return (
          <span key={key} className="inline-flex items-center gap-1.5 text-xs text-white/90">
            <span
              className="flex size-7 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: icon?.color }}
            >
              {icon?.letter}
            </span>
            {REPORT360_RELATIONSHIP_LABELS[key]}
          </span>
        )
      })}
    </div>
  ) : null

  const details = (
    <div className="max-w-lg space-y-5">
      {marks}
      {respondentTableRows.length > 0 ? (
        <CoverTable
          title={block.showSurveyRespondents ? `Survey respondents · ${responded}` : 'Survey respondents'}
          columns={['Relationship', 'Count']}
          rows={respondentTableRows}
          numericLast
        />
      ) : null}
      {block.showNominatedRatersOnCover ? (
        <CoverTable
          title="Nominated raters"
          columns={['Name', 'Relationship']}
          rows={subject.nominatedRaters.map((rater) => [rater.name, rater.relationship])}
        />
      ) : null}
    </div>
  )

  if (block.coverTemplate === 'centered') {
    return (
      <div
        className="flex flex-1 flex-col text-white"
        style={{ background: block.coverBackgroundColor }}
      >
        {portraitSrc ? <CoverPhoto src={portraitSrc} alt={portraitAlt} className="h-[92mm] w-full shrink-0" /> : null}
        <div
          className={`flex flex-1 flex-col items-center p-10 text-center ${portraitSrc ? '' : 'justify-center'}`}
        >
          {identity}
          <div className="mt-10 w-full max-w-lg text-left">{details}</div>
        </div>
      </div>
    )
  }

  if (block.coverTemplate === 'split') {
    return (
      <div className="flex min-h-0 flex-1 text-white" style={{ background: block.coverBackgroundColor }}>
        {portraitSrc ? (
          <CoverPhoto src={portraitSrc} alt={portraitAlt} className="relative w-1/3 self-stretch" />
        ) : (
          <div className="w-1/3 bg-black/25" />
        )}
        <div className="flex w-2/3 flex-col justify-center p-10">
          {identity}
          <div className="mt-10">{details}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-1 flex-col justify-between p-10 text-white"
      style={{ background: block.coverBackgroundColor }}
    >
      {portraitSrc ? (
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0 flex-1">{identity}</div>
          <CoverPhoto src={portraitSrc} alt={portraitAlt} className="h-[78mm] w-[58mm] shrink-0" />
        </div>
      ) : (
        identity
      )}
      {details}
    </div>
  )
}

function BackCoverPage({ block, survey, template }: Omit<PageProps, 'subject'>) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center text-white"
      style={{ background: block.coverBackgroundColor }}
    >
      {block.backCoverLogo && template.masterDesign.showLogo ? (
        <HeaderLogo logo={template.masterDesign.leftHeaderLogo} />
      ) : null}
      <p className="text-lg font-medium">{survey.title}</p>
      {block.contactName ? <p className="text-sm text-white/80">{block.contactName}</p> : null}
      {block.contactEmail ? <p className="text-sm text-white/80">{block.contactEmail}</p> : null}
      <RichText
        html={block.confidentialityNote}
        className="mt-6 max-w-sm text-xs leading-5 text-white/70"
      />
    </div>
  )
}

/* ---------------------------------------------------------- Static content */

function IntroductionPage({ block, template }: PageProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      <RichText
        html={block.introduction || 'This report summarizes multi-rater feedback for development planning.'}
        className="mt-4 text-sm leading-6 text-gray-700"
      />
      {block.relationshipIcons ? (
        <div className="mt-6">
          <RelationshipMarks template={template} />
        </div>
      ) : null}
    </div>
  )
}

function CustomContentPage({ block, template }: PageProps) {
  return (
    <div>
      <PageTitle
        block={{ ...block, introduction: block.introduction || block.customBody }}
        design={template.masterDesign}
      />
      <ClosingText block={block} />
    </div>
  )
}

/* ------------------------------------------------------- Executive summary */

function participationRows(subject: Report360Subject) {
  return REPORT360_RELATIONSHIPS.map((key) => {
    const label = REPORT360_RELATIONSHIP_LABELS[key]
    const responded = subject.evaluatorCounts[key] ?? 0
    const nominated = subject.nominatedRaters.filter((rater) => rater.relationship === label)
    const pending = nominated.filter((rater) => rater.status !== 'Completed').length
    const invited = key === 'self' ? Math.max(responded, 1) : Math.max(responded + pending, responded)
    const rate = invited === 0 ? 0 : Math.round((responded / invited) * 100)
    return { key, label, invited, responded, rate }
  }).filter((row) => row.invited > 0)
}

function developmentBarColor(score: number) {
  if (score <= 2.6) return '#EF4444'
  if (score <= 2.9) return '#F97316'
  return '#F59E0B'
}

function ScoreMeter({ label, score, color }: { label: string; score: number; color: string }) {
  const width = `${Math.max(6, Math.min(100, (score / 5) * 100))}%`
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="w-[9.5rem] shrink-0 text-sm text-gray-700">
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full" style={{ width, background: color }} />
      </div>
      <span className="w-8 text-right text-sm font-semibold tabular-nums" style={{ color }}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}

function ExecutiveSummaryPage({ block, subject, template }: PageProps) {
  const ranked = rankedBehaviors(subject, template, { ...block, useBlockWeights: false })
  const strengths = ranked.slice(0, 3)
  const strengthIds = new Set(strengths.map((item) => item.behavior.id))
  const growth = [...ranked].reverse().filter((item) => !strengthIds.has(item.behavior.id)).slice(0, 3)
  const rows = participationRows(subject)

  return (
    <div className="-mx-10 -my-8 bg-[#f4f6f8] px-6 py-6">
      <h2 className="text-lg font-semibold text-gray-900">
        {block.title} — {subject.name}
      </h2>
      <RichText html={block.introduction} className="mt-2 text-sm leading-6 text-gray-600" />

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Participation summary</h3>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] tracking-wide text-gray-400">
                <th className="pb-2 font-medium">Relationship</th>
                <th className="pb-2 font-medium">Invited</th>
                <th className="pb-2 font-medium">Responded</th>
                <th className="pb-2 text-right font-medium">Completion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-gray-100">
                  <td className="py-2.5 text-gray-800">{row.label}</td>
                  <td className="py-2.5 text-gray-600">{row.invited}</td>
                  <td className="py-2.5 text-gray-600">{row.responded}</td>
                  <td className="py-2.5 text-right">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        color: row.rate >= 100 ? '#16A34A' : row.rate >= 80 ? '#1B87E6' : '#EA580C',
                        background: row.rate >= 100 ? '#dcfce7' : 'transparent',
                      }}
                    >
                      {row.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
            Top 3 Strengths
          </h3>
          <div className="mt-2">
            {strengths.map((item) => (
              <ScoreMeter
                key={item.behavior.id}
                label={item.behavior.text}
                score={item.mean}
                color="#22C55E"
              />
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="size-2 rounded-full bg-rose-500" aria-hidden />
            Top 3 Development Areas
          </h3>
          <div className="mt-2">
            {growth.map((item) => (
              <ScoreMeter
                key={item.behavior.id}
                label={item.behavior.text}
                score={item.mean}
                color={developmentBarColor(item.mean)}
              />
            ))}
          </div>
        </section>
      </div>

      <ExecutiveGapSection subject={subject} />
      <ClosingText block={block} />
    </div>
  )
}

/* ------------------------------------------------------- Competency detail */

function AllItemsAiSummary({ block, subject, template }: PageProps) {
  const ranked = rankedBehaviors(subject, template, block)
  const strong = ranked.filter((item) => item.mean >= 4)
  const weak = ranked.filter((item) => item.mean < 3)
  const usingBands = strong.length > 0 || weak.length > 0
  const strengths = usingBands
    ? strong
    : ranked.slice(0, Math.min(3, Math.ceil(ranked.length / 2)))
  const improvements = usingBands
    ? [...weak].reverse()
    : [...ranked.slice(-Math.min(3, Math.floor(ranked.length / 2)))].reverse()

  return (
    <section className="mt-6 rounded border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900">AI insights</h3>
      {ranked.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No scored items to summarize.</p>
      ) : (
        <>
          <h4 className="mt-4 text-xs font-semibold tracking-wide text-gray-500">Strengths</h4>
          {strengths.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">None identified.</p>
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-800">
              {strengths.map((item) => (
                <li key={item.behavior.id}>
                  {item.behavior.text}{' '}
                  <span className="text-gray-500">
                    {item.behavior.competency} · mean {item.mean.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <h4 className="mt-4 text-xs font-semibold tracking-wide text-gray-500">
            Areas of improvement
          </h4>
          {improvements.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">None identified.</p>
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-800">
              {improvements.map((item) => (
                <li key={item.behavior.id}>
                  {item.behavior.text}{' '}
                  <span className="text-gray-500">
                    {item.behavior.competency} · mean {item.mean.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

function CompetencyDetailPage({
  block,
  subject,
  survey,
  template,
  rows,
  continued,
  showAiSummary,
}: PageProps & { rows: ReturnType<typeof behaviorsWithData>; continued: boolean; showAiSummary: boolean }) {
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
      <ScoreChart
        data={chartData}
        series={plan.columns.map((column) => ({ key: column.label, color: column.color }))}
        layout={block.chartType}
        height={block.chartType === 'horizontalBar' ? Math.max(320, chartData.length * 52) : 340}
      />

      {block.tabularData ? (
        <div className="mt-6">
          {block.tabularDataHeading ? (
            <h3 className="mb-2 text-sm font-semibold text-gray-900">{block.tabularDataHeading}</h3>
          ) : null}
        <table className="mt-6 w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-gray-200 text-left text-[13px]">
          <thead>
            <tr className="border-b" style={theme.head}>
              <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Behavior</th>
              {plan.columns.map((column) => (
                <th key={column.key} className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">
                  {block.relationshipIcons ? (
                    <RelationshipBadge column={column} design={design} />
                  ) : null}
                  {column.label}
                </th>
              ))}
              {block.meanColumn ? <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Mean</th> : null}
              {block.priorityColumn ? (
                <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">{block.priorityText || 'Priority'}</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {groupedRows.map((group) => (
              <Fragment key={group.key}>
                {design.showCategoryHeaders && group.category ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className="border-b px-0 py-2 text-[11px] font-semibold tracking-wide"
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
                    <td className="px-3 py-3">{row.text}</td>
                    {plan.columns.map((column) => (
                      <td key={column.key} className="px-3 py-3 tabular-nums">
                        {columnScore(row, column) ?? '—'}
                      </td>
                    ))}
                    {block.meanColumn ? (
                      <td className="px-3 py-3 font-semibold tabular-nums">
                        {weightedBehaviorMean(row, meanColumns, weights) ?? '—'}
                      </td>
                    ) : null}
                    {block.priorityColumn ? <td className="px-3 py-3 tabular-nums">{row.importance}%</td> : null}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
        </div>
      ) : null}

      <SuppressedNote plan={plan} />

      {block.qxBotInsights && showAiSummary ? (
        <AllItemsAiSummary block={block} subject={subject} survey={survey} template={template} />
      ) : null}
      <ClosingText block={block} />
    </div>
  )
}

/* ------------------------------------------------------ Score-driven pages */

function TopBehaviorsPage({ block, subject, template }: PageProps) {
  const plan = resolveColumnPlan(subject, template.masterDesign)
  const design = template.masterDesign
  const theme = tableTheme(design)
  const weights = resolveWeights(template, block)
  const meanColumns = scoreColumns(plan, design)
  const competency = REPORT360_COMPETENCIES.find((item) => item.name === block.dataSource)
  const ranked = rankedBehaviors(subject, template, block)
  const scoped = competency
    ? ranked.filter((item) => item.behavior.competencyId === competency.id)
    : ranked
  const pool = scoped.length > 0 ? scoped : ranked
  const count = Math.min(5, Math.max(1, block.itemCount || 5))
  const picked = (block.behaviorDisplay === 'bottom' ? [...pool].reverse() : pool).slice(0, count)
  const rows = picked.map((item) => item.behavior)
  const chartData = rows.map((row) => {
    const point: Record<string, string | number | null> = { name: truncate(row.text, 28) }
    plan.columns.forEach((column) => {
      point[column.label] = columnScore(row, column)
    })
    return point
  })
  return (
    <div>
      <PageTitle block={block} design={design} />
      <ScoreChart
        data={chartData}
        series={plan.columns.map((column) => ({ key: column.label, color: column.color }))}
        layout={block.chartType}
        height={block.chartType === 'horizontalBar' ? Math.max(280, chartData.length * 52) : 320}
      />

      <table className="mt-6 w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-gray-200 text-left text-[13px]">
        <thead>
          <tr className="border-b" style={theme.head}>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Behavior</th>
            {plan.columns.map((column) => (
              <th key={column.key} className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">
                {block.relationshipIcons ? <RelationshipBadge column={column} design={design} /> : null}
                {column.label}
              </th>
            ))}
            {block.meanColumn ? <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Mean</th> : null}
            {block.priorityColumn ? (
              <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">{block.priorityText || 'Priority'}</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id} className="border-b" style={theme.row(rowIndex)}>
              <td className="px-3 py-3">{row.text}</td>
              {plan.columns.map((column) => (
                <td key={column.key} className="px-3 py-3 tabular-nums">
                  {columnScore(row, column) ?? '—'}
                </td>
              ))}
              {block.meanColumn ? (
                <td className="px-3 py-3 font-semibold tabular-nums">{weightedBehaviorMean(row, meanColumns, weights) ?? '—'}</td>
              ) : null}
              {block.priorityColumn ? <td className="px-3 py-3 tabular-nums">{row.importance}%</td> : null}
            </tr>
          ))}
        </tbody>
      </table>

      <SuppressedNote plan={plan} />
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
  const competency = REPORT360_COMPETENCIES.find((item) => item.name === block.dataSource)
  const scoped = competency
    ? ranked.filter((item) => item.behavior.competencyId === competency.id)
    : ranked
  const pool = scoped.length > 0 ? scoped : ranked
  const areas = [...pool].reverse().slice(0, block.itemCount || 5)
  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <div className="mt-6 space-y-3">
        {areas.map((item, index) => (
          <div key={item.behavior.id} className="rounded border border-gray-100 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-orange-600">
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
  const competency = REPORT360_COMPETENCIES.find((item) => item.name === block.dataSource)
  const scoped = competency ? ranked.filter((item) => item.behavior.competencyId === competency.id) : ranked
  const pool = scoped.length > 0 ? scoped : ranked
  const count = block.itemCount || 5
  const strengths = pool.slice(0, count)
  const growth = [...pool].reverse().slice(0, count)
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
    .filter((item) => {
      const competency = REPORT360_COMPETENCIES.find((entry) => entry.name === block.dataSource)
      return !competency || item.competencyId === competency.id
    })
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
      <table className="mt-6 w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-gray-200 text-left text-[13px]">
        <thead>
          <tr className="border-b" style={tableTheme(template.masterDesign).head}>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Competency</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Score</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Importance</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">{block.priorityText || 'Priority index'}</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((item, index) => (
            <tr key={item.competencyId} className="border-b" style={tableTheme(template.masterDesign).row(index)}>
              <td className="px-3 py-3 tabular-nums">{item.competency}</td>
              <td className="px-3 py-3 tabular-nums">{item.mean}</td>
              <td className="px-3 py-3 tabular-nums">{item.importance}%</td>
              <td className="px-3 py-3 tabular-nums">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, item.index)}%`,
                        background: template.masterDesign.themeColor,
                      }}
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
  const competencyIds = block.spiderCompetencyIds
  const selectedQuestions = new Set(block.spiderQuestionIds)

  const data = competencyIds.map((id) => {
    const rows = subject.behaviors.filter((item) => {
      if (item.competencyId !== id) return false
      return selectedQuestions.has(item.id)
    })
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
      {block.spiderCompetencyIds.length < 3 ? (
        <p className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
          Select at least 3 data sources.
        </p>
      ) : relationships.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
          Select relationships to include on this chart.
        </p>
      ) : null}
      {block.spiderCompetencyIds.length >= 3 && relationships.length > 0 ? (
      <div className="mt-6 h-96 w-full rounded-xl border border-gray-100 bg-slate-50/80 px-2 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="competency" tick={{ fill: '#475569', fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickCount={6} />
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
                fillOpacity={0.16}
                strokeWidth={2}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
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
            <Legend content={<DotLegend />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      ) : null}
      <SuppressedNote plan={plan} />
      <ClosingText block={block} />
    </div>
  )
}

function ExecutiveGapSection({ subject }: { subject: Report360Subject }) {
  const data = subject.gaps.map((gap) => ({
    name: gap.competency,
    gap: gap.gap,
    fill: classifyGap(gap.gap) === 'blind-spot' ? '#DC2626' : gap.gap >= 0 ? '#16A34A' : '#F59E0B',
  }))
  const blindSpots = subject.gaps.filter((gap) => classifyGap(gap.gap) === 'blind-spot')
  const hiddenStrengths = subject.gaps.filter((gap) => classifyGap(gap.gap) === 'hidden-strength')
  const sorted = [...subject.gaps].sort((a, b) => b.othersAvg - a.othersAvg)
  const confirmedStrengths = sorted.filter((gap) => classifyGap(gap.gap) === 'aligned').slice(0, 2)
  const improvements = [...sorted]
    .reverse()
    .filter((gap) => classifyGap(gap.gap) === 'aligned')
    .slice(0, 2)

  return (
    <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Gap analysis</h3>
      <p className="mt-1 text-xs text-gray-500">How other raters compare with the self-rating.</p>
      {data.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No self and others scores to compare.</p>
      ) : (
        <>
          <div className="mt-3 h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
                <CartesianGrid stroke="#e8eef5" horizontal={false} />
                <XAxis type="number" domain={[-2, 2]} axisLine={false} tickLine={false} tick={CHART_TICK} />
                <YAxis type="category" dataKey="name" width={96} axisLine={false} tickLine={false} tick={CHART_TICK} />
                <ReferenceLine x={0} stroke="#cbd5e1" />
                <Bar dataKey="gap" radius={[4, 4, 4, 4]} maxBarSize={12}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <QuadrantCard
              title="Confirmed strengths"
              items={confirmedStrengths.map((gap) => gap.competency)}
              tone="green"
            />
            <QuadrantCard
              title="Blind spots"
              items={blindSpots.map((gap) => gap.competency)}
              tone="red"
            />
            <QuadrantCard
              title="Development areas"
              items={improvements.map((gap) => gap.competency)}
              tone="orange"
            />
            <QuadrantCard
              title="Hidden strengths"
              items={hiddenStrengths.map((gap) => gap.competency)}
              tone="blue"
            />
          </div>
        </>
      )}
    </section>
  )
}

function QuadrantCard({
  title,
  items,
  tone,
}: {
  title: string
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
    <div className={`rounded border px-3 py-2 ${tones[tone]}`}>
      <h4 className="text-xs font-semibold">{title}</h4>
      {items.length === 0 ? (
        <p className="mt-1 text-xs opacity-60">None</p>
      ) : (
        <p className="mt-1 text-xs">{items.join(', ')}</p>
      )}
    </div>
  )
}

function RelationshipBreakdownPage({ block, subject, template }: PageProps) {
  const plan = resolveColumnPlan(subject, template.masterDesign)
  const design = template.masterDesign
  const theme = tableTheme(design)
  const weights = resolveWeights(template, block)
  const meanColumns = scoreColumns(plan, design)
  const competency = REPORT360_COMPETENCIES.find((item) => item.name === block.dataSource)
  const selected = new Set(block.rankingRelationships)
  const columns = plan.columns.filter((column) =>
    column.relationships.some((relationship) => selected.has(relationship)),
  )
  const count = Math.min(5, Math.max(1, block.rankingCount || 5))
  const managerComments = Object.entries(subject.comments).flatMap(([questionId, list]) =>
    list
      .filter((comment) => comment.relationship === 'manager')
      .map((comment) => ({
        questionId,
        question: getOpenQuestion(questionId)?.text ?? questionId,
        text: comment.text,
      })),
  )

  return (
    <div>
      <PageTitle block={block} design={design} />
      {columns.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
          Select relationships to include in this ranking.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {columns.map((column) => {
            const pool = behaviorsWithData(subject)
              .filter((behavior) => !competency || behavior.competencyId === competency.id)
              .map((behavior) => ({ behavior, score: columnScore(behavior, column) }))
              .filter((item): item is { behavior: (typeof subject.behaviors)[number]; score: number } =>
                item.score != null,
              )
              .sort((a, b) => (block.behaviorDisplay === 'bottom' ? a.score - b.score : b.score - a.score))
            const ranked = (pool.length > 0 ? pool : []).slice(0, count)
            const chartData = ranked.map((item) => ({
              name: truncate(item.behavior.text, 28),
              [column.label]: item.score,
            }))
            return (
              <section key={column.key}>
                <h3 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                  {block.relationshipIcons ? <RelationshipBadge column={column} design={design} /> : null}
                  {column.label}
                </h3>
                <ScoreChart
                  data={chartData}
                  series={[{ key: column.label, color: column.color }]}
                  layout={block.chartType}
                  height={block.chartType === 'horizontalBar' ? Math.max(220, chartData.length * 48) : 260}
                />
                <table className="mt-4 w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-gray-200 text-left text-[13px]">
                  <thead>
                    <tr className="border-b" style={theme.head}>
                      <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Behavior</th>
                      <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">{column.label}</th>
                      {block.meanColumn ? <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Mean</th> : null}
                      {block.priorityColumn ? (
                        <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">{block.priorityText || 'Priority'}</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((item, rowIndex) => (
                      <tr key={item.behavior.id} className="border-b" style={theme.row(rowIndex)}>
                        <td className="px-3 py-3">{item.behavior.text}</td>
                        <td className="px-3 py-3 tabular-nums">{item.score}</td>
                        {block.meanColumn ? (
                          <td className="px-3 py-3 font-semibold tabular-nums">
                            {weightedBehaviorMean(item.behavior, meanColumns, weights) ?? '—'}
                          </td>
                        ) : null}
                        {block.priorityColumn ? <td className="px-3 py-3 tabular-nums">{item.behavior.importance}%</td> : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )
          })}
        </div>
      )}

      {block.showManagerComments ? (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900">Manager comments</h3>
          {managerComments.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No manager comments for this subject.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {managerComments.map((comment) => (
                <li key={`${comment.questionId}-${comment.text}`} className="rounded border border-gray-100 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500">{comment.question}</p>
                  <p className="mt-1 text-sm text-gray-800">{comment.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

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
                <p className="text-xs font-semibold tracking-wide text-blue-700">
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
                    <p className="text-xs font-semibold tracking-wide text-blue-700">
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

function ResponseSummaryPage({ block, subject, template }: PageProps) {
  const plan = resolveColumnPlan(subject, template.masterDesign)
  const rows = REPORT360_RELATIONSHIPS.map((key) => ({
    key,
    label: REPORT360_RELATIONSHIP_LABELS[key],
    responses: subject.evaluatorCounts[key] ?? 0,
    sent:
      key === 'self'
        ? subject.evaluatorCounts.self > 0
          ? 1
          : 0
        : subject.nominatedRaters.filter((rater) => rater.relationship === REPORT360_RELATIONSHIP_LABELS[key]).length,
  })).filter((row) => !block.excludeZeroResponses || row.responses > 0)
  const totalSent = rows.reduce((sum, row) => sum + row.sent, 0)

  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <table className="mt-6 w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-gray-200 text-left text-[13px]">
        <thead>
          <tr className="border-b" style={tableTheme(template.masterDesign).head}>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Relationship</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Responses</th>
            {block.showTotalSent ? <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Total sent</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key} className="border-b" style={tableTheme(template.masterDesign).row(index)}>
              <td className="px-3 py-3 tabular-nums">{row.label}</td>
              <td className="px-3 py-3 tabular-nums">{row.responses}</td>
              {block.showTotalSent ? <td className="px-3 py-3 tabular-nums">{row.sent}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm text-gray-500">
        Total evaluations: {rows.reduce((sum, row) => sum + row.responses, 0)}
        {block.showTotalSent ? ` · Total sent: ${totalSent}` : ''}
      </p>
      <SuppressedNote plan={plan} />
      <ClosingText block={block} />
    </div>
  )
}

function EvaluatorRosterPage({ block, subject, template }: PageProps) {
  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <table className="mt-6 w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-gray-200 text-left text-[13px]">
        <thead>
          <tr className="border-b" style={tableTheme(template.masterDesign).head}>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Name</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Relationship</th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody>
          {subject.nominatedRaters.map((rater, index) => (
            <tr key={`${rater.name}-${rater.relationship}`} className="border-b" style={tableTheme(template.masterDesign).row(index)}>
              <td className="px-3 py-3 tabular-nums">{rater.name}</td>
              <td className="px-3 py-3 tabular-nums">{rater.relationship}</td>
              <td className="px-3 py-3 tabular-nums">{rater.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ClosingText block={block} />
    </div>
  )
}

type SourcedComment = Report360Comment & { questionId: string }

function commentsForDataSource(subject: Report360Subject, dataSource: string): SourcedComment[] {
  return Object.entries(subject.comments).flatMap(([questionId, list]) =>
    list
      .filter((comment) => !dataSource || dataSource === 'All' || comment.source === dataSource)
      .map((comment) => ({ ...comment, questionId })),
  )
}

function recommendationFor(text: string): string {
  if (/^stop\b/i.test(text)) {
    return `Replace this pattern with a named owner and a deadline. ${text}`
  }
  if (/^start\b/i.test(text)) {
    return `Add this to the next 30 days and review it in the next 1:1. ${text}`
  }
  return `Turn this into a written commitment with a success measure. ${text}`
}

function SummaryGroup({
  title,
  comments,
  showRecommendations,
}: {
  title: string
  comments: SourcedComment[]
  showRecommendations: boolean
}) {
  const strengths = comments.filter((comment) => comment.questionId === 'q_open_continue')
  const improvements = comments.filter((comment) => comment.questionId !== 'q_open_continue')
  return (
    <section className="mt-6 rounded border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {comments.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No comments in this group for the selected data source.</p>
      ) : (
        <>
          <h4 className="mt-4 text-xs font-semibold tracking-wide text-gray-500">Strengths</h4>
          {strengths.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">None identified.</p>
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-800">
              {strengths.map((comment) => (
                <li key={comment.text}>{comment.text}</li>
              ))}
            </ul>
          )}
          <h4 className="mt-4 text-xs font-semibold tracking-wide text-gray-500">Areas of improvement</h4>
          {improvements.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">None identified.</p>
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-800">
              {improvements.map((comment) => (
                <li key={comment.text}>{comment.text}</li>
              ))}
            </ul>
          )}
          {showRecommendations ? (
            <>
              <h4 className="mt-4 text-xs font-semibold tracking-wide text-gray-500">Recommendations</h4>
              {improvements.length === 0 ? (
                <p className="mt-1 text-sm text-gray-500">No areas of improvement to recommend against.</p>
              ) : (
                <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-gray-800">
                  {improvements.map((comment) => (
                    <li key={`rec-${comment.text}`}>{recommendationFor(comment.text)}</li>
                  ))}
                </ol>
              )}
            </>
          ) : null}
        </>
      )}
    </section>
  )
}

function AiRecommendationsPage({ block, subject, template }: PageProps) {
  const comments = commentsForDataSource(subject, block.dataSource)
  const merged = block.commentDisplayMode === 'combined'
  const manager = comments.filter((comment) => comment.relationship === 'manager')
  const others = comments.filter((comment) => comment.relationship !== 'manager')
  return (
    <div>
      <PageTitle block={block} design={template.masterDesign} />
      <p className="mt-2 text-xs text-gray-500">Data source: {block.dataSource || 'All'}</p>
      {merged ? (
        <SummaryGroup
          title="Insights"
          comments={comments}
          showRecommendations={block.generateRecommendations}
        />
      ) : (
        <>
          <SummaryGroup
            title="Manager comments"
            comments={manager}
            showRecommendations={block.generateRecommendations}
          />
          <SummaryGroup
            title="Other comments"
            comments={others}
            showRecommendations={block.generateRecommendations}
          />
        </>
      )}
      <ClosingText block={block} />
    </div>
  )
}

function selectedActionItems(block: Report360Block, subject: Report360Subject) {
  const selected = block.actionPlanPriorities
  if (selected.length === 0) return []
  const includeRanked = selected.includes('#1 to #3')
  const allowed = subject.actionPlanItems.filter(
    (item) => includeRanked || selected.includes(item.priority),
  )
  const competency = REPORT360_COMPETENCIES.find((item) => item.name === block.dataSource)
  if (!competency) return allowed
  const matched = allowed.filter((item) => {
    const behavior = subject.behaviors.find((row) => row.text === item.behavior)
    return behavior?.competencyId === competency.id
  })
  return matched.length > 0 ? matched : allowed
}

function ActionPlanPage({
  block,
  subject,
  template,
  rows,
  continued,
}: PageProps & { rows: Report360Subject['actionPlanItems']; continued: boolean }) {
  const plan = resolveColumnPlan(subject, template.masterDesign)
  const design = template.masterDesign
  const theme = tableTheme(design)
  const chartData = rows.map((item) => {
    const behavior = subject.behaviors.find((row) => row.text === item.behavior)
    const point: Record<string, string | number | null> = { name: truncate(item.behavior, 28) }
    plan.columns.forEach((column) => {
      point[column.label] = behavior ? columnScore(behavior, column) : null
    })
    return point
  })
  const managerComments = !continued
    ? Object.entries(subject.comments).flatMap(([questionId, list]) =>
        list
          .filter((comment) => comment.relationship === 'manager')
          .map((comment) => ({
            questionId,
            question: getOpenQuestion(questionId)?.text ?? questionId,
            text: comment.text,
          })),
      )
    : []

  return (
    <div>
      <PageTitle
        block={{ ...block, title: continued ? `${block.title} (continued)` : block.title }}
        design={design}
      />
      {block.actionPlanPriorities.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
          Select priorities to include in this plan.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
          No action items match the selected priorities.
        </p>
      ) : (
        <>
          <ScoreChart
            data={chartData}
            series={plan.columns.map((column) => ({ key: column.label, color: column.color }))}
            layout={block.chartType}
            height={block.chartType === 'horizontalBar' ? Math.max(240, chartData.length * 48) : 280}
          />
          <div className="mt-6 space-y-4">
            {rows.map((item, index) => {
              const behavior = subject.behaviors.find((row) => row.text === item.behavior)
              return (
                <div key={`${item.priority}-${index}`} className="rounded border border-gray-100 p-4" style={theme.row(index)}>
                  <p className="text-xs font-semibold text-blue-700">{item.priority}</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{item.behavior}</p>
                  <p className="mt-1 text-sm text-gray-600">{item.action}</p>
                  {block.priorityColumn ? (
                    <p className="mt-2 text-xs text-gray-500">
                      {block.priorityText || 'Priority'}: {behavior ? `${behavior.importance}%` : '—'}
                    </p>
                  ) : null}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400">
                      Success measure
                    </div>
                    <div className="rounded border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400">
                      Review date
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {block.showManagerComments ? (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900">Manager comments</h3>
          {managerComments.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No manager comments for this subject.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {managerComments.map((comment) => (
                <li key={`${comment.questionId}-${comment.text}`} className="rounded border border-gray-100 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500">{comment.question}</p>
                  <p className="mt-1 text-sm text-gray-800">{comment.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

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
          showAiSummary={index === chunks.length - 1}
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
    case 'rankingByRelationship':
      return [<RelationshipBreakdownPage key="ranking" {...props} />]
    case 'priorityComments': {
      if (block.actionPlanPriorities.length === 0) {
        return [
          <div key="comments-priorities">
            <PageTitle block={block} design={template.masterDesign} />
            <p className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
              Select priorities to include in this report.
            </p>
            <ClosingText block={block} />
          </div>,
        ]
      }
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
    case 'actionPlan': {
      const items = selectedActionItems(block, subject)
      const perPage = Math.max(1, block.behavioursPerPage || 5)
      const chunks: (typeof items)[] = []
      for (let index = 0; index < items.length; index += perPage) {
        chunks.push(items.slice(index, index + perPage))
      }
      if (chunks.length === 0) chunks.push([])
      return chunks.map((chunk, index) => (
        <ActionPlanPage key={`action-${index}`} {...props} rows={chunk} continued={index > 0} />
      ))
    }
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
  deploymentDate,
}: {
  survey: Survey360
  subject: Report360Subject
  template: Report360Template
  deploymentDate?: string
}) {
  const plan = resolveReportPlan(subject, template)
  const coverBlock = plan.blocks.find((block) => block.type === 'cover')
  let pageNumber = 0

  return (
    <div className="py-8">
      {plan.blocks.map((block) => {
        const bodies = blockBodies({ block, subject, survey, template, deploymentDate })
        return bodies.map((body, index) => {
          pageNumber += 1
          if (block.type === 'cover') {
            return (
              <article
                key={`${block.id}-${index}`}
                className={REPORT_SHEET}
                style={reportSheetStyle(template.masterDesign.pageSize)}
              >
                {body}
                <ReportFooter footerText={template.masterDesign.footerText} />
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
        <article className={REPORT_SHEET} style={reportSheetStyle(template.masterDesign.pageSize)}>
          <BackCoverPage block={coverBlock} survey={survey} template={template} />
          <ReportFooter footerText={template.masterDesign.footerText} />
        </article>
      ) : null}
    </div>
  )
}

export function getReportPagePlan(subject: Report360Subject, template: Report360Template) {
  return resolveReportPlan(subject, template)
}

export { getOpenQuestion }
