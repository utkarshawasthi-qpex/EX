export type StudyStatus = 'active' | 'draft' | 'archived';
export type StudyType = 'Survey' | '360 Review';

export interface Study {
  id: string;
  name: string;
  type: StudyType;
  status: StudyStatus;
  createdAt: string;
  responses: number;
  deployments: number;
  folderId: string;
  surveyId?: string;
  programId?: string;
}

export const STUDY_FOLDERS = [
  { value: 'new-folks', label: 'New folks' },
  { value: 'ca-500', label: 'CA-500' },
  { value: 'all-folders', label: 'All folders' },
];

export { EMPLOYEE_PORTAL_COUNT } from '@/data/mock-employee-directory';

export const MOCK_STUDIES: Study[] = [
  {
    id: '1',
    name: 'Survey - 11',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-09-07',
    responses: 0,
    deployments: 0,
    folderId: 'new-folks',
  },
  {
    id: '2',
    name: 'Workplace Culture',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-09-07',
    responses: 3,
    deployments: 1,
    folderId: 'new-folks',
  },
  {
    id: '3',
    name: 'On-boarding Experience',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-09-07',
    responses: 12,
    deployments: 2,
    folderId: 'new-folks',
  },
  {
    id: '4',
    name: '360 Review - 3',
    type: '360 Review',
    status: 'active',
    createdAt: '2026-06-26',
    responses: 8,
    deployments: 1,
    folderId: 'new-folks',
    surveyId: 'surv360_newhire_90',
  },
  {
    id: '5',
    name: 'Manager Effectiveness Pulse',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-06-26',
    responses: 41,
    deployments: 2,
    folderId: 'new-folks',
  },
  {
    id: '6',
    name: 'Leadership 360 Review',
    type: '360 Review',
    status: 'active',
    createdAt: '2026-06-18',
    responses: 19,
    deployments: 1,
    folderId: 'new-folks',
    surveyId: 'surv360_leadership_2025',
  },
  {
    id: '7',
    name: 'eNPS Q3 2026',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-06-04',
    responses: 96,
    deployments: 3,
    folderId: 'new-folks',
  },
  {
    id: '8',
    name: 'New hire check-in — 30 / 60 / 90',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-05-22',
    responses: 14,
    deployments: 1,
    folderId: 'new-folks',
  },
  {
    id: '9',
    name: 'Workplace Culture Assessment and Organizational Belonging Pulse — Q3 Leadership Review',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-05-12',
    responses: 500,
    deployments: 2,
    folderId: 'new-folks',
  },
  {
    id: '10',
    name: 'Wellbeing Pulse',
    type: 'Survey',
    status: 'draft',
    createdAt: '2026-04-30',
    responses: 0,
    deployments: 0,
    folderId: 'new-folks',
  },
  {
    id: '11',
    name: 'Peer 360 Review - Engineering',
    type: '360 Review',
    status: 'active',
    createdAt: '2026-04-15',
    responses: 27,
    deployments: 1,
    folderId: 'new-folks',
    surveyId: 'surv360_manager_q1',
  },
  {
    id: '12',
    name: 'Exit experience',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-03-28',
    responses: 6,
    deployments: 1,
    folderId: 'new-folks',
  },
  {
    id: '13',
    name: 'Team collaboration snapshot',
    type: 'Survey',
    status: 'archived',
    createdAt: '2026-03-09',
    responses: 22,
    deployments: 1,
    folderId: 'new-folks',
  },
  {
    id: '14',
    name: '360 Review - Sales managers',
    type: '360 Review',
    status: 'active',
    createdAt: '2026-02-17',
    responses: 11,
    deployments: 2,
    folderId: 'new-folks',
    surveyId: 'surv360_manager_q1',
  },
  {
    id: '15',
    name: 'CA-500 engagement census',
    type: 'Survey',
    status: 'active',
    createdAt: '2026-01-20',
    responses: 248,
    deployments: 4,
    folderId: 'ca-500',
  },
];

export function getStudyHref(study: Study): string {
  if (study.type === '360 Review') {
    return study.surveyId ? `/360/surveys/${study.surveyId}/edit` : '/360/surveys';
  }
  return '/lifecycle/surveys';
}

export function getStudyDistributeHref(study: Study): string {
  if (study.type === '360 Review') {
    return study.surveyId
      ? `/360/surveys/${study.surveyId}/edit?tab=distribute`
      : '/360/surveys';
  }
  return `/lifecycle/distribution?study=${encodeURIComponent(study.name)}`;
}

export function getStudyAnalyzeHref(study: Study): string {
  return study.type === '360 Review' ? '/360/surveys' : '/lifecycle/analytics';
}
