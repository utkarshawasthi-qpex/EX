export {
  activeFiltersToLabels,
  ANONYMITY_THRESHOLD,
  averageFavorability,
  buildFilteredScorecardMarkers,
  DASHBOARD_FILTER_FIELDS,
  filterRespondents,
  findWeakestDepartmentCategoryCell,
  getDepartmentCategorySentiment,
  getFilteredCategorySentiment,
  getFilteredENPS,
  getFilteredResponseRate,
  getFilteredSentiment,
  meetsAnonymityThreshold,
  mockDashboardRespondents,
  respondentCount,
} from '@/data/mock/dashboardFilters'
export type { CategorySentiment, DashboardRespondent, ScorecardMarker } from '@/data/mock/dashboardFilters'
/**
 * RECONCILE — re-export surface for driver analysis.
 * CURRENT: exports DRIVER_METRICS, resolveItemsAtLevel, pearson helpers, etc.
 * TARGET: also export descendantQuestionsOf, questionSetsIntersect, overlapsOutcome.
 * ANONYMITY: ANONYMITY_THRESHOLD (=5) + meetsAnonymityThreshold already re-exported above.
 */
export {
  buildMetricTree,
  computeAxisConfig,
  descendantQuestionsOf,
  DRIVER_CORRELATION_MATRIX,
  DRIVER_METRICS,
  getCorrelation,
  getDriverImpact,
  getDriverMetricById,
  getDriverOutcomeOptions,
  getEligibleDriverMetrics,
  getMetricFavorability,
  getRespondentMetricScores,
  getYAxisDisclosureLabel,
  normalizeToFavorability,
  overlapsOutcome,
  pearsonCorrelation,
  pearsonR,
  questionSetsIntersect,
  resolveItemsAtLevel,
} from '@/data/mock/driverAnalysis'
export type {
  AxisConfig,
  DriverMetric,
  DriverMetricKind,
  DriverQuestionType,
  MetricTreeNode,
} from '@/data/mock/driverAnalysis'
