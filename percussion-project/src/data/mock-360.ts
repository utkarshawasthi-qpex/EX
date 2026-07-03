export interface I360Survey {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed';
  createdDate: string;
  startDate: string | null;
  endDate: string | null;
  subjectsCount: number;
  completionRate: number;
  evaluatorsAssigned: number;
}

export interface I360Report {
  id: string;
  subjectName: string;
  subjectId: string;
  surveyName: string;
  status: 'pending' | 'in-progress' | 'completed';
  responseRate: number;
  generatedDate: string | null;
}

export const MOCK_360_SURVEYS: I360Survey[] = [
  {
    id: '360-001',
    name: 'Annual Leadership Assessment 2026',
    status: 'active',
    createdDate: '2026-01-15',
    startDate: '2026-01-20',
    endDate: '2026-02-28',
    subjectsCount: 24,
    completionRate: 68,
    evaluatorsAssigned: 156,
  },
  {
    id: '360-002',
    name: 'Manager Effectiveness Review',
    status: 'active',
    createdDate: '2025-12-01',
    startDate: '2026-01-10',
    endDate: '2026-03-15',
    subjectsCount: 18,
    completionRate: 92,
    evaluatorsAssigned: 102,
  },
  {
    id: '360-003',
    name: 'Q1 Competency Assessment',
    status: 'draft',
    createdDate: '2026-06-01',
    startDate: null,
    endDate: null,
    subjectsCount: 0,
    completionRate: 0,
    evaluatorsAssigned: 0,
  },
  {
    id: '360-004',
    name: 'Executive Leadership Evaluation',
    status: 'completed',
    createdDate: '2025-09-10',
    startDate: '2025-10-01',
    endDate: '2025-11-30',
    subjectsCount: 8,
    completionRate: 100,
    evaluatorsAssigned: 64,
  },
  {
    id: '360-005',
    name: 'Team Collaboration Study',
    status: 'completed',
    createdDate: '2025-08-20',
    startDate: '2025-09-05',
    endDate: '2025-10-15',
    subjectsCount: 32,
    completionRate: 100,
    evaluatorsAssigned: 224,
  },
];

export const MOCK_360_REPORTS: I360Report[] = [
  {
    id: 'rpt-001',
    subjectName: 'Sarah Johnson',
    subjectId: 'emp-001',
    surveyName: 'Annual Leadership Assessment 2026',
    status: 'completed',
    responseRate: 100,
    generatedDate: '2026-02-28',
  },
  {
    id: 'rpt-002',
    subjectName: 'Michael Chen',
    subjectId: 'emp-002',
    surveyName: 'Annual Leadership Assessment 2026',
    status: 'completed',
    responseRate: 95,
    generatedDate: '2026-02-27',
  },
  {
    id: 'rpt-003',
    subjectName: 'Emily Rodriguez',
    subjectId: 'emp-003',
    surveyName: 'Annual Leadership Assessment 2026',
    status: 'in-progress',
    responseRate: 70,
    generatedDate: null,
  },
  {
    id: 'rpt-004',
    subjectName: 'David Park',
    subjectId: 'emp-004',
    surveyName: 'Manager Effectiveness Review',
    status: 'completed',
    responseRate: 100,
    generatedDate: '2026-03-10',
  },
  {
    id: 'rpt-005',
    subjectName: 'Lisa Wang',
    subjectId: 'emp-005',
    surveyName: 'Manager Effectiveness Review',
    status: 'pending',
    responseRate: 0,
    generatedDate: null,
  },
];
