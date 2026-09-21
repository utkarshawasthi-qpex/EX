import {
  REPORT360_COMPETENCIES,
  REPORT360_RELATIONSHIPS,
  REPORT360_RELATIONSHIP_COLORS,
  REPORT360_RELATIONSHIP_LABELS,
  evaluatorTotal,
  getOpenQuestion,
  type Report360BehaviorScore,
  type Report360Block,
  type Report360MasterDesign,
  type Report360PerformanceCategory,
  type Report360Relationship,
  type Report360Subject,
  type Report360Template,
} from '@/data/mock-360-reports'

export const COMBINED_OTHERS_KEY = 'combined_others'

/**
 * Practitioner convention: a self-versus-others difference of a full point on a
 * five-point scale is the line between measurement noise and a real blind spot.
 */
export const GAP_SIGNIFICANCE = 1

/** QxBot will not synthesize recommendations from fewer than this many responses. */
export const AI_MIN_RESPONSES = 3

/**
 * Self and Manager are identified roles by design — the subject already knows who
 * rated them — so the confidentiality threshold only applies to the group-based
 * relationships, which is where a small n could expose an individual rater.
 */
const THRESHOLD_EXEMPT: Report360Relationship[] = ['self', 'manager']

export type Report360Column = {
  key: string
  label: string
  color: string
  relationships: Report360Relationship[]
  responses: number
  merged: boolean
}

export type Report360ColumnPlan = {
  columns: Report360Column[]
  suppressed: Report360Relationship[]
  absent: Report360Relationship[]
}

export function weightTotal(weights: Record<Report360Relationship, number>): number {
  return REPORT360_RELATIONSHIPS.reduce((sum, key) => sum + (weights[key] ?? 0), 0)
}

/** Block-level override beats the global setting; equal weights when neither applies. */
export function resolveWeights(
  template: Report360Template,
  block?: Report360Block,
): Record<Report360Relationship, number> {
  if (block?.useBlockWeights) return block.relationshipWeights
  if (template.masterDesign.globalWeightsEnabled) return template.masterDesign.relationshipWeights
  const equal = {} as Record<Report360Relationship, number>
  REPORT360_RELATIONSHIPS.forEach((key) => {
    equal[key] = 100 / REPORT360_RELATIONSHIPS.length
  })
  return equal
}

/**
 * Decides which relationship columns a subject's report can show: groups with no
 * responses disappear, groups under the threshold are merged into Combined others.
 */
export function resolveColumnPlan(
  subject: Report360Subject,
  design: Report360MasterDesign,
): Report360ColumnPlan {
  const columns: Report360Column[] = []
  const suppressed: Report360Relationship[] = []
  const absent: Report360Relationship[] = []
  const threshold = Math.max(1, design.minRatersPerGroup || 1)

  REPORT360_RELATIONSHIPS.forEach((relationship) => {
    const responses = subject.evaluatorCounts[relationship] ?? 0
    if (responses === 0) {
      absent.push(relationship)
      return
    }
    if (!THRESHOLD_EXEMPT.includes(relationship) && responses < threshold) {
      suppressed.push(relationship)
      return
    }
    columns.push({
      key: relationship,
      label: REPORT360_RELATIONSHIP_LABELS[relationship],
      color:
        design.relationshipIcons?.[relationship]?.color ??
        REPORT360_RELATIONSHIP_COLORS[relationship],
      relationships: [relationship],
      responses,
      merged: false,
    })
  })

  // Merging only helps if the merged bucket itself clears the threshold. A
  // Combined others column of one rater would expose that rater, so drop it.
  if (suppressed.length > 0) {
    const responses = suppressed.reduce(
      (sum, relationship) => sum + (subject.evaluatorCounts[relationship] ?? 0),
      0,
    )
    if (responses >= threshold) {
      columns.push({
        key: COMBINED_OTHERS_KEY,
        label: 'Combined others',
        color: '#475569',
        relationships: [...suppressed],
        responses,
        merged: true,
      })
    }
  }

  return { columns, suppressed, absent }
}

/**
 * The columns that feed a mean. Self is dropped when the admin excludes it, unless
 * that would leave nothing to average.
 */
export function scoreColumns(
  plan: Report360ColumnPlan,
  design: Report360MasterDesign,
  excludeSelf?: boolean,
): Report360Column[] {
  const drop = excludeSelf ?? design.excludeSelfInAverageScore
  if (!drop) return plan.columns
  const withoutSelf = plan.columns.filter((column) => column.key !== 'self')
  return withoutSelf.length > 0 ? withoutSelf : plan.columns
}

export function columnScore(
  behavior: Report360BehaviorScore,
  column: Report360Column,
): number | null {
  const values = column.relationships
    .map((relationship) => behavior.scores[relationship])
    .filter((value): value is number => value != null)
  if (values.length === 0) return null
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export function columnWeight(
  column: Report360Column,
  weights: Record<Report360Relationship, number>,
): number {
  return column.relationships.reduce((sum, relationship) => sum + (weights[relationship] ?? 0), 0)
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

/**
 * Weighted mean across the columns that actually responded. Absent groups are
 * excluded from the denominator, which redistributes their weight proportionally.
 */
export function weightedBehaviorMean(
  behavior: Report360BehaviorScore,
  columns: Report360Column[],
  weights: Record<Report360Relationship, number>,
): number | null {
  let weighted = 0
  let weightSum = 0
  let plain = 0
  let plainCount = 0

  columns.forEach((column) => {
    const score = columnScore(behavior, column)
    if (score == null) return
    const weight = columnWeight(column, weights)
    weighted += score * weight
    weightSum += weight
    plain += score
    plainCount += 1
  })

  if (plainCount === 0) return null
  if (weightSum === 0) return round1(plain / plainCount)
  return round1(weighted / weightSum)
}

export function behaviorsWithData(subject: Report360Subject): Report360BehaviorScore[] {
  return subject.behaviors.filter((behavior) =>
    REPORT360_RELATIONSHIPS.some((relationship) => behavior.scores[relationship] != null),
  )
}

/** Converts a 1-5 rating into the 0-100 scale used for the overall score. */
export function ratingToPercent(rating: number): number {
  return Math.round(((rating - 1) / 4) * 100)
}

export function blockMean(
  subject: Report360Subject,
  template: Report360Template,
  block: Report360Block,
): number | null {
  const plan = resolveColumnPlan(subject, template.masterDesign)
  const columns = scoreColumns(plan, template.masterDesign)
  const weights = resolveWeights(template, block)
  const means = behaviorsWithData(subject)
    .map((behavior) => weightedBehaviorMean(behavior, columns, weights))
    .filter((value): value is number => value != null)
  if (means.length === 0) return null
  return round1(means.reduce((sum, value) => sum + value, 0) / means.length)
}

/**
 * REQ-07 — one composite score per subject, rolled up from the blocks the admin
 * marked as counting toward it, so weight changes are visible end to end.
 */
export function computeOverallScore(
  subject: Report360Subject,
  template: Report360Template,
): number | null {
  const scoredBlocks = template.blocks.filter(
    (block) => block.enabled && block.includeInOverallScore && block.type !== 'masterDesign',
  )
  const means = (scoredBlocks.length > 0 ? scoredBlocks : [undefined])
    .map((block) =>
      block
        ? blockMean(subject, template, block)
        : (() => {
            const plan = resolveColumnPlan(subject, template.masterDesign)
            const columns = scoreColumns(plan, template.masterDesign)
            const weights = resolveWeights(template)
            const values = behaviorsWithData(subject)
              .map((behavior) => weightedBehaviorMean(behavior, columns, weights))
              .filter((value): value is number => value != null)
            if (values.length === 0) return null
            return round1(values.reduce((sum, value) => sum + value, 0) / values.length)
          })(),
    )
    .filter((value): value is number => value != null)

  if (means.length === 0) return null
  return ratingToPercent(means.reduce((sum, value) => sum + value, 0) / means.length)
}

export function resolvePerformanceCategory(
  score: number | null,
  categories: Report360PerformanceCategory[],
): Report360PerformanceCategory | null {
  if (score == null) return null
  const match = categories.find((category) => score >= category.min && score <= category.max)
  return match ?? null
}

export type Report360GapClass = 'blind-spot' | 'hidden-strength' | 'aligned'

export function classifyGap(gap: number): Report360GapClass {
  if (gap <= -GAP_SIGNIFICANCE) return 'blind-spot'
  if (gap >= GAP_SIGNIFICANCE) return 'hidden-strength'
  return 'aligned'
}

export const GAP_CLASS_LABELS: Record<Report360GapClass, string> = {
  'blind-spot': 'Blind spot',
  'hidden-strength': 'Hidden strength',
  aligned: 'Aligned',
}

export type Report360CompetencyScore = {
  competencyId: string
  competency: string
  mean: number | null
  importance: number
}

export function competencyScores(
  subject: Report360Subject,
  template: Report360Template,
  block: Report360Block,
  options?: { excludeSelf?: boolean },
): Report360CompetencyScore[] {
  const plan = resolveColumnPlan(subject, template.masterDesign)
  const columns = scoreColumns(plan, template.masterDesign, options?.excludeSelf)
  const weights = resolveWeights(template, block)
  return REPORT360_COMPETENCIES.map((competency) => {
    const behaviors = subject.behaviors.filter((item) => item.competencyId === competency.id)
    const means = behaviors
      .map((behavior) => weightedBehaviorMean(behavior, columns, weights))
      .filter((value): value is number => value != null)
    const importance = behaviors.length
      ? Math.round(behaviors.reduce((sum, item) => sum + item.importance, 0) / behaviors.length)
      : 0
    return {
      competencyId: competency.id,
      competency: competency.name,
      mean: means.length === 0 ? null : round1(means.reduce((sum, value) => sum + value, 0) / means.length),
      importance,
    }
  })
}

export type Report360RankedBehavior = {
  behavior: Report360BehaviorScore
  mean: number
}

export function rankedBehaviors(
  subject: Report360Subject,
  template: Report360Template,
  block: Report360Block,
  options?: { excludeSelf?: boolean },
): Report360RankedBehavior[] {
  const plan = resolveColumnPlan(subject, template.masterDesign)
  const columns = scoreColumns(plan, template.masterDesign, options?.excludeSelf)
  const weights = resolveWeights(template, block)
  return behaviorsWithData(subject)
    .map((behavior) => ({ behavior, mean: weightedBehaviorMean(behavior, columns, weights) }))
    .filter((item): item is Report360RankedBehavior => item.mean != null)
    .sort((a, b) => b.mean - a.mean)
}

export function commentQuestionsWithData(
  subject: Report360Subject,
  block: Report360Block,
): { id: string; text: string; comments: Report360Subject['comments'][string] }[] {
  return block.commentQuestionIds
    .map((questionId) => ({
      id: questionId,
      text: getOpenQuestion(questionId)?.text ?? questionId,
      comments: subject.comments[questionId] ?? [],
    }))
    .filter((question) => question.comments.length > 0)
}

export function totalComments(subject: Report360Subject): number {
  return Object.values(subject.comments).reduce((sum, list) => sum + list.length, 0)
}

export type Report360DataCheck = {
  hasData: boolean
  reason: string
}

/**
 * REQ-01 — runs before a block renders. Blocks with no data for this subject are
 * skipped entirely rather than producing an empty page frame. All-zero scores
 * still count as data.
 */
export function blockHasData(
  block: Report360Block,
  subject: Report360Subject,
  template: Report360Template,
): Report360DataCheck {
  const ok = { hasData: true, reason: '' }
  const plan = resolveColumnPlan(subject, template.masterDesign)
  const scored = behaviorsWithData(subject)

  switch (block.type) {
    case 'cover':
    case 'introduction':
    case 'customContent':
    case 'masterDesign':
      return ok

    case 'executiveSummary':
    case 'competencyDetail':
    case 'overallData':
    case 'keyDevelopmentAreas':
    case 'strengthGrowthIndicators':
    case 'competencyPriorityIndex':
      return scored.length > 0
        ? ok
        : { hasData: false, reason: 'No completed ratings for this subject' }

    case 'spiderChart': {
      const usable = competencyScores(subject, template, block).filter(
        (item) => block.spiderCompetencyIds.includes(item.competencyId) && item.mean != null,
      )
      return usable.length >= 3
        ? ok
        : { hasData: false, reason: 'Fewer than 3 competencies have ratings' }
    }

    case 'gapAnalysis': {
      const hasSelf = subject.evaluatorCounts.self > 0
      const hasOthers = plan.columns.some((column) => !column.relationships.includes('self'))
      if (!hasSelf) return { hasData: false, reason: 'No self-evaluation submitted' }
      if (!hasOthers) return { hasData: false, reason: 'No evaluator groups available to compare against' }
      return ok
    }

    case 'performanceTrend':
      return subject.trend.length >= 2
        ? ok
        : { hasData: false, reason: 'No prior cycle to compare against' }

    case 'rankingByRelationship':
      return plan.columns.length > 0
        ? ok
        : { hasData: false, reason: 'No reportable relationship groups' }

    case 'priorityComments':
      return commentQuestionsWithData(subject, block).length > 0
        ? ok
        : { hasData: false, reason: 'No open-ended responses for the selected questions' }

    case 'aiRecommendations':
      return totalComments(subject) > 0
        ? ok
        : { hasData: false, reason: 'No open-ended responses to analyze' }

    case 'surveyRespondents':
      return evaluatorTotal(subject) > 0
        ? ok
        : { hasData: false, reason: 'No evaluations submitted' }

    case 'nominatedRaters':
      return subject.nominatedRaters.length > 0
        ? ok
        : { hasData: false, reason: 'No raters nominated' }

    case 'actionPlan':
      return subject.actionPlanItems.length > 0
        ? ok
        : { hasData: false, reason: 'No development priorities selected' }

    default:
      return ok
  }
}

export type Report360Audience = 'subject' | 'manager' | 'admin'

export function blockVisibleTo(block: Report360Block, audience: Report360Audience): boolean {
  if (audience === 'manager') return block.visibleToManager
  if (audience === 'subject') return block.visibleToSubject
  return block.visibleToAdmin
}

export type Report360SkippedBlock = {
  blockId: string
  title: string
  reason: string
}

export type Report360ReportPlan = {
  blocks: Report360Block[]
  skipped: Report360SkippedBlock[]
}

/**
 * Decides which blocks actually become pages for one subject, and records why the
 * rest were dropped so the admin can see it in the preview.
 */
export function resolveReportPlan(
  subject: Report360Subject,
  template: Report360Template,
  audience: Report360Audience = 'admin',
): Report360ReportPlan {
  const blocks: Report360Block[] = []
  const skipped: Report360SkippedBlock[] = []

  template.blocks.forEach((block) => {
    if (block.type === 'masterDesign' || !block.enabled) return
    if (!blockVisibleTo(block, audience)) {
      skipped.push({
        blockId: block.id,
        title: block.title,
        reason: `Hidden from the ${audience} view`,
      })
      return
    }
    const check = blockHasData(block, subject, template)
    if (!check.hasData && template.masterDesign.skipEmptyBlocks) {
      skipped.push({ blockId: block.id, title: block.title, reason: check.reason })
      return
    }
    blocks.push(block)
  })

  return { blocks, skipped }
}

export type MergeVariableContext = {
  subject: Report360Subject
  programName: string
  overallScore: number | null
  categoryLabel: string
  deploymentDate: string
}

export function resolveMergeVariables(text: string, context: MergeVariableContext): string {
  const [firstName, ...rest] = context.subject.name.split(' ')
  return text
    .replaceAll('${FIRST_NAME_SUBJECT}', firstName ?? context.subject.name)
    .replaceAll('${LAST_NAME_SUBJECT}', rest.join(' '))
    .replaceAll('${DEPLOYMENT_DATE_MMM_DD_YYYY}', context.deploymentDate)
    .replaceAll('${OVERALL_SCORE_PCT}', context.overallScore == null ? '' : `${context.overallScore}%`)
    .replaceAll('${PERFORMANCE_CATEGORY}', context.categoryLabel)
    .replaceAll('${EVALUATOR_COUNT}', String(evaluatorTotal(context.subject)))
    .replaceAll('${PROGRAM_NAME}', context.programName)
}
