'use client'

import { createContext, useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import {
  DATASETS,
  getDatasetById,
  type DatasetId,
  type DatasetProfile,
} from '@/data/mock/driverAnalysisDatasets'
import {
  getCurrentDatasetId,
  getServerDatasetId,
  setCurrentDatasetId as writeDatasetId,
  subscribeToDatasetId,
} from '@/lib/datasetStore'

type DatasetContextValue = {
  currentDatasetId: DatasetId
  setCurrentDatasetId: (id: DatasetId) => void
  currentDataset: DatasetProfile
}

const DatasetContext = createContext<DatasetContextValue | null>(null)

export function DatasetProvider({ children }: { children: ReactNode }) {
  const currentDatasetId = useSyncExternalStore(
    subscribeToDatasetId,
    getCurrentDatasetId,
    getServerDatasetId,
  )

  const setCurrentDatasetId = useCallback((id: DatasetId) => {
    writeDatasetId(id)
  }, [])

  const currentDataset = useMemo(() => getDatasetById(currentDatasetId), [currentDatasetId])

  const value = useMemo(
    () => ({ currentDatasetId, setCurrentDatasetId, currentDataset }),
    [currentDataset, currentDatasetId, setCurrentDatasetId],
  )

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
}

export function useCurrentDataset(): DatasetContextValue {
  const currentDatasetId = useSyncExternalStore(
    subscribeToDatasetId,
    getCurrentDatasetId,
    getServerDatasetId,
  )
  const setCurrentDatasetId = useCallback((id: DatasetId) => {
    writeDatasetId(id)
  }, [])
  const currentDataset = useMemo(() => getDatasetById(currentDatasetId), [currentDatasetId])
  return { currentDatasetId, setCurrentDatasetId, currentDataset }
}

export { DATASETS }
