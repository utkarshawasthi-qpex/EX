/**
 * RECONCILE — dataset selection store:
 * - CONFIRMED: dashboard/tab state already uses localStorage with `pp_` keys
 *   (pp_dashboards, pp_dashboard_${id}_tabs, pp_dashboard_${id}_widgets).
 * - No Zustand/Jotai. DashboardWidgetContext exists for capabilities only.
 * - A module store + useSyncExternalStore lets getRespondentMetricScores (non-React)
 *   and the header picker share one selected DatasetId, persisted at pp_current_dataset_id.
 */
import {
  DATASET_STORAGE_KEY,
  DATASETS,
  DEFAULT_DATASET_ID,
  getDatasetById,
  isDatasetId,
  type DatasetId,
  type DatasetProfile,
} from '@/data/mock/driverAnalysisDatasets'

type Listener = () => void

const listeners = new Set<Listener>()

let currentId: DatasetId = DEFAULT_DATASET_ID
let hydrated = false

function readStoredId(): DatasetId {
  if (typeof window === 'undefined') return DEFAULT_DATASET_ID
  try {
    const stored = window.localStorage.getItem(DATASET_STORAGE_KEY)
    return isDatasetId(stored) ? stored : DEFAULT_DATASET_ID
  } catch {
    return DEFAULT_DATASET_ID
  }
}

function hydrate(): void {
  if (hydrated) return
  hydrated = true
  currentId = readStoredId()
}

export function getCurrentDatasetId(): DatasetId {
  hydrate()
  return currentId
}

export function getCurrentDataset(): DatasetProfile {
  return getDatasetById(getCurrentDatasetId())
}

export function setCurrentDatasetId(id: DatasetId): void {
  hydrate()
  if (currentId === id) return
  currentId = id
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DATASET_STORAGE_KEY, id)
  }
  listeners.forEach((listener) => listener())
}

export function subscribeToDatasetId(listener: Listener): () => void {
  hydrate()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getServerDatasetId(): DatasetId {
  return DEFAULT_DATASET_ID
}

export { DATASETS, DEFAULT_DATASET_ID }
