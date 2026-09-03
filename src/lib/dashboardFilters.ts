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
  boundsForAxis,
  clampAxisRange,
  clampMetricValue,
  computeAxisAdaptive,
  computeAxisConfig,
  computeAxisFixed,
  computeAxisWithThreshold,
  computeThresholdDynamic,
  IMPACT_BOUNDS,
  PERFORMANCE_BOUNDS,
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
  getStaticThreshold,
  getYAxisDisclosureLabel,
  MIN_DRIVER_PLOT_POINTS,
  normalizeToFavorability,
  overlapsOutcome,
  pearsonCorrelation,
  pearsonR,
  questionSetsIntersect,
  resolveItemsAtLevel,
  STATIC_IMPACT_THRESHOLD,
  STATIC_PERFORMANCE_THRESHOLD,
} from '@/data/mock/driverAnalysis'
export {
  DATASETS,
  DEFAULT_DATASET_ID,
  generateScores,
  getDatasetById,
} from '@/data/mock/driverAnalysisDatasets'
export type { DatasetId, DatasetProfile } from '@/data/mock/driverAnalysisDatasets'
export type {
  AxisConfig,
  AxisRange,
  DriverAxisKind,
  DriverMetric,
  DriverMetricKind,
  DriverQuestionType,
  MetricTreeNode,
} from '@/data/mock/driverAnalysis'
