export type StudyStatus = 'active' | 'draft' | 'archived';

export interface Study {
  id: string;
  name: string;
  type: string;
  status: StudyStatus;
  createdAt: string;
  responses: number;
  deployments: number;
}

export const STUDY_FOLDERS = [
  { value: 'ca-500', label: 'CA-500' },
  { value: 'ca-501', label: 'CA-501' },
  { value: 'all-folders', label: 'All folders' },
];

export const EMPLOYEE_PORTAL_COUNT = 501;

export const MOCK_STUDIES: Study[] = [
  {
    id: '1',
    name: 'Workplace Culture - COPIED',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-06-04',
    responses: 0,
    deployments: 0,
  },
  {
    id: '2',
    name: 'Workplace Culture - COPIED',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-06-04',
    responses: 0,
    deployments: 0,
  },
  {
    id: '3',
    name: 'Workplace Culture - COPIED',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-06-04',
    responses: 0,
    deployments: 0,
  },
  {
    id: '4',
    name: 'Workplace Culture - COPIED',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-06-04',
    responses: 0,
    deployments: 0,
  },
  {
    id: '5',
    name: 'new',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-06-04',
    responses: 0,
    deployments: 0,
  },
  {
    id: '6',
    name: 'new',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-06-04',
    responses: 0,
    deployments: 0,
  },
  {
    id: '7',
    name: 'Workplace Culture',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-05-12',
    responses: 500,
    deployments: 2,
  },
];
