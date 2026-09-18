'use client'

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
  type Report360Block,
  type Report360MasterDesign,
  type Report360Relationship,
  type Report360Subject,
  type Report360Template,
} from '@/data/mock-360-reports'
import type { Survey360 } from '@/data/mock/surveys360'

const RELATIONSHIPS: Report360Relationship[] = [
  'self',
  'manager',
  'direct_report',
  'peer',
  'external',
]

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
      <div className="flex items-center justify-between border-b border-gray-100 px-10 py-3 text-xs text-gray-500">
        <span>{design.showLogo ? design.logoName : ''}</span>
        <span>{design.headerText}</span>
      </div>
      <div className="px-10 py-8">{children}</div>
      <div className="flex items-center justify-between px-10 py-3 text-xs text-gray-400">
        <span>{design.footerText}</span>
        <span>{design.pageNumbering ? `Page ${pageNumber}` : ''}</span>
      </div>
    </article>
  )
}

function CoverPage({
  subject,
  survey,
  block,
}: {
  subject: Report360Subject
  survey: Survey360
  block: Report360Block
}) {
  const total = evaluatorTotal(subject)
  return (
    <div className="flex min-h-[720px] flex-col justify-between rounded-lg bg-gradient-to-br from-[#0B1F4B] via-[#123A7A] to-[#1B87E6] p-10 text-white">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-blue-100">360° Development Report</p>
        <h2 className="mt-6 break-words text-4xl font-semibold">{subject.name}</h2>
        <p className="mt-2 text-lg text-blue-100">{subject.role}</p>
      </div>
      <div>
        <p className="text-sm text-blue-100">{survey.title}</p>
        {block.introduction ? <p className="mt-2 text-sm text-blue-50">{block.introduction}</p> : null}
        <p className="mt-4 text-sm">{total} evaluators</p>
        <div className="mt-6 inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-lg font-medium">
          {subject.overallScore}% — {subject.category}
        </div>
      </div>
    </div>
  )
}

function IntroductionPage({ block }: { block: Report360Block }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
        {block.introduction || 'This report summarizes multi-rater feedback for development planning.'}
      </p>
    </div>
  )
}

function ExecutiveSummaryPage({ subject }: { subject: Report360Subject }) {
  const total = evaluatorTotal(subject)
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Executive Summary</h2>
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div className="flex size-28 items-center justify-center rounded-full border-8 border-blue-600 text-2xl font-semibold text-blue-800">
          {subject.overallScore}%
        </div>
        <div>
          <p className="rounded bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">{subject.category}</p>
          <p className="mt-3 max-w-xl text-sm text-gray-600">{subject.alignmentStatement}</p>
        </div>
      </div>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2 font-medium">Relationship</th>
            <th className="py-2 font-medium">Evaluators</th>
          </tr>
        </thead>
        <tbody>
          {RELATIONSHIPS.map((key) => (
            <tr key={key} className="border-b border-gray-100">
              <td className="py-2">{REPORT360_RELATIONSHIP_LABELS[key]}</td>
              <td className="py-2">{subject.evaluatorCounts[key]}</td>
            </tr>
          ))}
          <tr>
            <td className="py-2 font-medium">Total</td>
            <td className="py-2 font-medium">{total}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Top strengths</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {subject.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Development areas</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {subject.developmentAreas.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function CompetencyDetailPage({
  subject,
  block,
}: {
  subject: Report360Subject
  block: Report360Block
}) {
  const rows = subject.behaviors.slice(0, block.behavioursPerPage || 5)
  const chartData = rows.map((row) => ({
    name: row.text.length > 28 ? `${row.text.slice(0, 28)}…` : row.text,
    Self: row.scores.self,
    Manager: row.scores.manager,
    'Direct Report': row.scores.direct_report,
    Peer: row.scores.peer,
    External: row.scores.external,
    Mean: row.mean,
  }))

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      {block.introduction ? <p className="mt-2 text-sm text-gray-600">{block.introduction}</p> : null}
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {block.chartType === 'radar' ? (
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 5]} />
              <Radar name="Self" dataKey="Self" stroke="#1B87E6" fill="#1B87E6" fillOpacity={0.15} />
              <Radar name="Manager" dataKey="Manager" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.1} />
              <Legend />
            </RadarChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Self" fill="#1B87E6" />
              <Bar dataKey="Manager" fill="#7C3AED" />
              <Bar dataKey="Direct Report" fill="#16A34A" />
              <Bar dataKey="Peer" fill="#EA580C" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {block.tabularData ? (
        <table className="mt-6 w-full text-left text-xs">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="py-2 pr-2 font-medium">Behavior</th>
              {RELATIONSHIPS.map((key) => (
                <th key={key} className="py-2 font-medium">
                  {block.relationshipIcons ? (
                    <span className="mr-1 inline-block size-2 rounded-full" style={{ background: REPORT360_RELATIONSHIP_COLORS[key] }} />
                  ) : null}
                  {REPORT360_RELATIONSHIP_LABELS[key]}
                </th>
              ))}
              {block.meanColumn ? <th className="py-2 font-medium">Mean</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100">
                <td className="py-2 pr-2 text-gray-800">{row.text}</td>
                {RELATIONSHIPS.map((key) => (
                  <td key={key} className="py-2">
                    {row.scores[key] ?? '—'}
                  </td>
                ))}
                {block.meanColumn ? <td className="py-2">{row.mean}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {block.qxBotInsights ? (
        <div className="mt-6 rounded border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium">QxBot Insights</p>
          <p className="mt-1">{subject.qxBot.commentInsights.strengths[0]}</p>
          <p className="mt-1">{subject.qxBot.commentInsights.improvements[0]}</p>
        </div>
      ) : null}
      {block.closingText ? <p className="mt-4 text-sm text-gray-500">{block.closingText}</p> : null}
    </div>
  )
}

function OverallDataPage({ subject, block }: { subject: Report360Subject; block: Report360Block }) {
  const top = [...subject.behaviors].sort((a, b) => b.overall - a.overall).slice(0, 5)
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      <p className="mt-2 text-sm text-gray-600">Highest-rated behaviors across relationships.</p>
      <ol className="mt-6 space-y-3">
        {top.map((item, index) => (
          <li key={item.id} className="rounded border border-gray-100 px-4 py-3">
            <p className="text-xs font-semibold text-blue-700">#{index + 1}</p>
            <p className="text-sm text-gray-800">{item.text}</p>
            <p className="text-xs text-gray-500">Overall {item.overall}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function SpiderChartPage({ subject, block }: { subject: Report360Subject; block: Report360Block }) {
  const competencyIds =
    block.spiderCompetencyIds.length >= 3
      ? block.spiderCompetencyIds
      : REPORT360_COMPETENCIES.map((item) => item.id)
  const data = competencyIds.map((id) => {
    const rows = subject.behaviors.filter((item) => item.competencyId === id)
    const point: Record<string, string | number> = {
      competency: REPORT360_COMPETENCIES.find((item) => item.id === id)?.name ?? id,
    }
    block.spiderRelationships.forEach((relationship) => {
      const values = rows
        .map((row) => row.scores[relationship])
        .filter((value): value is number => value != null)
      point[REPORT360_RELATIONSHIP_LABELS[relationship]] =
        values.length === 0 ? 0 : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
    })
    return point
  })

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      {block.introduction ? <p className="mt-2 text-sm text-gray-600">{block.introduction}</p> : null}
      <div className="mt-6 h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="competency" />
            <PolarRadiusAxis domain={[0, 5]} />
            {block.spiderRelationships.map((relationship) => (
              <Radar
                key={relationship}
                name={REPORT360_RELATIONSHIP_LABELS[relationship]}
                dataKey={REPORT360_RELATIONSHIP_LABELS[relationship]}
                stroke={REPORT360_RELATIONSHIP_COLORS[relationship]}
                fill={REPORT360_RELATIONSHIP_COLORS[relationship]}
                fillOpacity={0.08}
                strokeDasharray={
                  block.lineStyles[relationship] === 'dashed'
                    ? '6 4'
                    : block.lineStyles[relationship] === 'dotted'
                      ? '2 4'
                      : undefined
                }
              />
            ))}
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function GapAnalysisPage({ subject }: { subject: Report360Subject }) {
  const data = subject.gaps.map((gap) => ({
    name: gap.competency,
    gap: gap.gap,
    fill: gap.gap >= 0 ? '#16A34A' : '#DC2626',
  }))
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Gap Analysis</h2>
      <p className="mt-2 text-sm text-gray-600">Others minus self. Positive means others rate higher.</p>
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[-1, 1]} />
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
          <tr className="border-b text-gray-500">
            <th className="py-2 font-medium">Competency</th>
            <th className="py-2 font-medium">Self</th>
            <th className="py-2 font-medium">Others</th>
            <th className="py-2 font-medium">Gap</th>
          </tr>
        </thead>
        <tbody>
          {subject.gaps.map((gap) => (
            <tr key={gap.competencyId} className="border-b border-gray-100">
              <td className="py-2">{gap.competency}</td>
              <td className="py-2">{gap.selfScore}</td>
              <td className="py-2">{gap.othersAvg}</td>
              <td className="py-2">{gap.gap > 0 ? `+${gap.gap}` : gap.gap}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PerformanceTrendPage({ subject }: { subject: Report360Subject }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Performance Trend</h2>
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
    </div>
  )
}

function RankingPage({ subject, block }: { subject: Report360Subject; block: Report360Block }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {RELATIONSHIPS.map((key) => (
          <div key={key} className="rounded border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-800">{REPORT360_RELATIONSHIP_LABELS[key]}</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700">
              {subject.rankingByRelationship[key].slice(0, block.rankingCount).map((item) => (
                <li key={item.behavior}>
                  {item.behavior} <span className="text-gray-400">({item.score})</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  )
}

function PriorityCommentsPage({
  subject,
  tab,
  onTabChange,
}: {
  subject: Report360Subject
  tab: 'q1' | 'q2' | 'q3'
  onTabChange: (tab: 'q1' | 'q2' | 'q3') => void
}) {
  const tabs: { id: 'q1' | 'q2' | 'q3'; label: string }[] = [
    { id: 'q1', label: 'Q1' },
    { id: 'q2', label: 'Q2' },
    { id: 'q3', label: 'Q3' },
  ]
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Priority Comments</h2>
      <div className="mt-4 flex gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded px-3 py-1 text-sm ${tab === item.id ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => onTabChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <ul className="mt-6 space-y-3">
        {subject.priorityComments[tab].map((comment, index) => (
          <li key={`${comment.relationship}-${index}`} className="rounded border border-gray-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{comment.relationship}</p>
            <p className="mt-1 text-sm text-gray-800">{comment.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RespondentsPage({ subject, block }: { subject: Report360Subject; block: Report360Block }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2 font-medium">Relationship</th>
            <th className="py-2 font-medium">Nominations</th>
          </tr>
        </thead>
        <tbody>
          {RELATIONSHIPS.filter((key) => subject.evaluatorCounts[key] > 0).map((key) => (
            <tr key={key} className="border-b border-gray-100">
              <td className="py-2">{REPORT360_RELATIONSHIP_LABELS[key]}</td>
              <td className="py-2">{subject.evaluatorCounts[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm text-gray-500">Total evaluations: {evaluatorTotal(subject)}</p>
    </div>
  )
}

function NominatedRatersPage({ subject, block }: { subject: Report360Subject; block: Report360Block }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      {block.introduction ? <p className="mt-2 text-sm text-gray-600">{block.introduction}</p> : null}
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2 font-medium">Name</th>
            <th className="py-2 font-medium">Relationship</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {subject.nominatedRaters.map((rater) => (
            <tr key={`${rater.name}-${rater.relationship}`} className="border-b border-gray-100">
              <td className="py-2">{rater.name}</td>
              <td className="py-2">{rater.relationship}</td>
              <td className="py-2">{rater.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AiRecommendationsPage({ subject }: { subject: Report360Subject }) {
  const total =
    subject.qxBot.sentimentPositive + subject.qxBot.sentimentNeutral + subject.qxBot.sentimentNegative
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">AI Action Recommendations</h2>
      <div className="mt-6 overflow-hidden rounded-full bg-gray-100">
        <div className="flex h-4 text-[0px]">
          <div className="bg-green-600" style={{ width: `${(subject.qxBot.sentimentPositive / total) * 100}%` }} />
          <div className="bg-gray-400" style={{ width: `${(subject.qxBot.sentimentNeutral / total) * 100}%` }} />
          <div className="bg-red-500" style={{ width: `${(subject.qxBot.sentimentNegative / total) * 100}%` }} />
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Positive {subject.qxBot.sentimentPositive}% · Neutral {subject.qxBot.sentimentNeutral}% · Negative{' '}
        {subject.qxBot.sentimentNegative}%
      </p>
      <div className="mt-6 grid gap-4">
        {subject.qxBot.cards.map((card) => (
          <div key={card.title} className="rounded border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900">{card.title}</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700">
              {card.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionPlanPage({ subject, block }: { subject: Report360Subject; block: Report360Block }) {
  const items = subject.actionPlanItems.filter(
    (item) =>
      block.actionPlanPriorities.length === 0 ||
      block.actionPlanPriorities.includes(item.priority) ||
      block.actionPlanPriorities.includes('#1 to #3'),
  )
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.priority} className="rounded border border-gray-100 p-4">
            <p className="text-xs font-semibold text-blue-700">{item.priority}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{item.behavior}</p>
            <p className="mt-1 text-sm text-gray-600">{item.action}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReportPageStack({
  survey,
  subject,
  template,
  commentTab,
  onCommentTabChange,
}: {
  survey: Survey360
  subject: Report360Subject
  template: Report360Template
  commentTab: 'q1' | 'q2' | 'q3'
  onCommentTabChange: (tab: 'q1' | 'q2' | 'q3') => void
}) {
  const pages = template.blocks.filter((block) => block.enabled && block.type !== 'masterDesign')
  return (
    <div className="py-8">
      {pages.map((block, index) => {
        const pageNumber = index + 1
        let body: React.ReactNode = null
        if (block.type === 'cover') body = <CoverPage subject={subject} survey={survey} block={block} />
        else if (block.type === 'introduction') body = <IntroductionPage block={block} />
        else if (block.type === 'executiveSummary') body = <ExecutiveSummaryPage subject={subject} />
        else if (block.type === 'competencyDetail') body = <CompetencyDetailPage subject={subject} block={block} />
        else if (block.type === 'overallData') body = <OverallDataPage subject={subject} block={block} />
        else if (block.type === 'spiderChart') body = <SpiderChartPage subject={subject} block={block} />
        else if (block.type === 'gapAnalysis') body = <GapAnalysisPage subject={subject} />
        else if (block.type === 'performanceTrend') body = <PerformanceTrendPage subject={subject} />
        else if (block.type === 'rankingByRelationship') body = <RankingPage subject={subject} block={block} />
        else if (block.type === 'priorityComments') {
          body = <PriorityCommentsPage subject={subject} tab={commentTab} onTabChange={onCommentTabChange} />
        } else if (block.type === 'surveyRespondents') body = <RespondentsPage subject={subject} block={block} />
        else if (block.type === 'nominatedRaters') body = <NominatedRatersPage subject={subject} block={block} />
        else if (block.type === 'aiRecommendations') body = <AiRecommendationsPage subject={subject} />
        else if (block.type === 'actionPlan') body = <ActionPlanPage subject={subject} block={block} />

        if (block.type === 'cover') {
          return (
            <article key={block.id} className="mx-auto mb-8 w-full max-w-[816px] overflow-hidden bg-white shadow-md">
              <CoverPage subject={subject} survey={survey} block={block} />
            </article>
          )
        }

        return (
          <ReportPage key={block.id} design={template.masterDesign} pageNumber={pageNumber}>
            {body}
          </ReportPage>
        )
      })}
    </div>
  )
}
