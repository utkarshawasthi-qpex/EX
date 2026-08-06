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
export {
  DRIVER_CORRELATION_MATRIX,
  DRIVER_METRICS,
  getCorrelation,
  getDriverMetricById,
  getDriverOutcomeOptions,
  getMetricFavorability,
} from '@/data/mock/driverAnalysis'
export type { DriverMetric, DriverMetricKind } from '@/data/mock/driverAnalysis'
