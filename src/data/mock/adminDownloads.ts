export type DownloadJobStatus = 'Completed' | 'In progress' | 'Failed' | 'Queued'

export type DownloadJob = {
  id: string
  createdAt: string
  name: string
  status: DownloadJobStatus
}

export const mockDownloadJobs: DownloadJob[] = [
  {
    id: '2715',
    createdAt: '2026-11-11T09:43:00.000Z',
    name: 'PPT Export : New Dashboard : New name',
    status: 'Completed',
  },
  {
    id: '2711',
    createdAt: '2026-11-11T07:54:00.000Z',
    name: 'Generating AI summary',
    status: 'Completed',
  },
  {
    id: '2710',
    createdAt: '2026-11-11T07:35:00.000Z',
    name: 'Generating AI summary',
    status: 'Completed',
  },
  {
    id: '2709',
    createdAt: '2026-11-11T07:30:00.000Z',
    name: 'Generating AI summary',
    status: 'Completed',
  },
  {
    id: '2708',
    createdAt: '2026-11-11T07:29:00.000Z',
    name: 'Generating AI summary',
    status: 'Completed',
  },
  {
    id: '2707',
    createdAt: '2026-11-11T07:16:00.000Z',
    name: 'Generating AI summary',
    status: 'Completed',
  },
  {
    id: '2706',
    createdAt: '2026-11-11T07:05:00.000Z',
    name: 'Generating AI summary',
    status: 'Completed',
  },
  {
    id: '2705',
    createdAt: '2026-11-11T07:01:00.000Z',
    name: 'Generating AI summary',
    status: 'In progress',
  },
  {
    id: '2704',
    createdAt: '2026-11-11T06:59:00.000Z',
    name: 'PPT Export : Engagement Insights : Tab 1',
    status: 'Completed',
  },
  {
    id: '2703',
    createdAt: '2026-11-11T06:42:00.000Z',
    name: 'Generating AI summary',
    status: 'Completed',
  },
  {
    id: '2702',
    createdAt: '2026-11-11T06:32:00.000Z',
    name: 'CSV Export : Workplace Culture responses',
    status: 'Completed',
  },
  {
    id: '2701',
    createdAt: '2026-11-11T06:21:00.000Z',
    name: 'Generating AI summary',
    status: 'Failed',
  },
  {
    id: '2103',
    createdAt: '2026-10-12T09:15:00.000Z',
    name: 'Generating AI summary',
    status: 'Completed',
  },
  {
    id: '2112',
    createdAt: '2025-09-17T09:14:00.000Z',
    name: 'PPT Export : Q3 Pulse results for Regional Product Teams Across EMEA and APAC Offices',
    status: 'Completed',
  },
  {
    id: '1704',
    createdAt: '2026-08-17T10:30:00.000Z',
    name: 'Generating AI summary',
    status: 'Queued',
  },
]
