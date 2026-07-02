import type { Program360, RaterAssignment } from '@/types'

export const mockPrograms360: Program360[] = [
  {
    id: 'prog_360_001',
    assessmentId: 'assessment_360_leadership_2025',
    title: 'Leadership 360 Program 2025',
    status: 'active',
    subjectIds: ['emp_002', 'emp_008', 'emp_012', 'emp_017', 'emp_022'],
    openDate: '2025-06-01',
    closeDate: '2025-07-15',
    responseRate: 64,
    createdAt: '2025-05-15',
  },
]

export const mockRaterAssignments: RaterAssignment[] = [
  { id: 'rater_001', programId: 'prog_360_001', subjectId: 'emp_002', raterId: 'emp_002', category: 'self', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-04' },
  { id: 'rater_002', programId: 'prog_360_001', subjectId: 'emp_002', raterId: 'emp_001', category: 'manager', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-05' },
  { id: 'rater_003', programId: 'prog_360_001', subjectId: 'emp_002', raterId: 'emp_003', category: 'peer', status: 'opened', invitedAt: '2025-06-01' },
  { id: 'rater_004', programId: 'prog_360_001', subjectId: 'emp_002', raterId: 'emp_004', category: 'peer', status: 'invited', invitedAt: '2025-06-01' },
  { id: 'rater_005', programId: 'prog_360_001', subjectId: 'emp_002', raterId: 'emp_005', category: 'direct_report', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-06' },

  { id: 'rater_006', programId: 'prog_360_001', subjectId: 'emp_008', raterId: 'emp_008', category: 'self', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-03' },
  { id: 'rater_007', programId: 'prog_360_001', subjectId: 'emp_008', raterId: 'emp_007', category: 'manager', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-04' },
  { id: 'rater_008', programId: 'prog_360_001', subjectId: 'emp_008', raterId: 'emp_009', category: 'peer', status: 'opened', invitedAt: '2025-06-01' },
  { id: 'rater_009', programId: 'prog_360_001', subjectId: 'emp_008', raterId: 'emp_011', category: 'peer', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-07' },
  { id: 'rater_010', programId: 'prog_360_001', subjectId: 'emp_008', raterId: 'emp_003', category: 'peer', status: 'invited', invitedAt: '2025-06-01' },
  { id: 'rater_011', programId: 'prog_360_001', subjectId: 'emp_008', raterId: 'emp_010', category: 'direct_report', status: 'declined', invitedAt: '2025-06-01' },

  { id: 'rater_012', programId: 'prog_360_001', subjectId: 'emp_012', raterId: 'emp_012', category: 'self', status: 'opened', invitedAt: '2025-06-01' },
  { id: 'rater_013', programId: 'prog_360_001', subjectId: 'emp_012', raterId: 'emp_017', category: 'manager', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-08' },
  { id: 'rater_014', programId: 'prog_360_001', subjectId: 'emp_012', raterId: 'emp_013', category: 'peer', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-04' },
  { id: 'rater_015', programId: 'prog_360_001', subjectId: 'emp_012', raterId: 'emp_014', category: 'peer', status: 'opened', invitedAt: '2025-06-01' },
  { id: 'rater_016', programId: 'prog_360_001', subjectId: 'emp_012', raterId: 'emp_016', category: 'direct_report', status: 'invited', invitedAt: '2025-06-01' },

  { id: 'rater_017', programId: 'prog_360_001', subjectId: 'emp_017', raterId: 'emp_017', category: 'self', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-02' },
  { id: 'rater_018', programId: 'prog_360_001', subjectId: 'emp_017', raterId: 'emp_001', category: 'manager', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-03' },
  { id: 'rater_019', programId: 'prog_360_001', subjectId: 'emp_017', raterId: 'emp_018', category: 'peer', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-04' },
  { id: 'rater_020', programId: 'prog_360_001', subjectId: 'emp_017', raterId: 'emp_019', category: 'peer', status: 'opened', invitedAt: '2025-06-01' },
  { id: 'rater_021', programId: 'prog_360_001', subjectId: 'emp_017', raterId: 'emp_020', category: 'direct_report', status: 'invited', invitedAt: '2025-06-01' },
  { id: 'rater_022', programId: 'prog_360_001', subjectId: 'emp_017', raterId: 'emp_021', category: 'direct_report', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-09' },

  { id: 'rater_023', programId: 'prog_360_001', subjectId: 'emp_022', raterId: 'emp_022', category: 'self', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-05' },
  { id: 'rater_024', programId: 'prog_360_001', subjectId: 'emp_022', raterId: 'emp_001', category: 'manager', status: 'opened', invitedAt: '2025-06-01' },
  { id: 'rater_025', programId: 'prog_360_001', subjectId: 'emp_022', raterId: 'emp_023', category: 'peer', status: 'completed', invitedAt: '2025-06-01', completedAt: '2025-06-06' },
  { id: 'rater_026', programId: 'prog_360_001', subjectId: 'emp_022', raterId: 'emp_024', category: 'peer', status: 'invited', invitedAt: '2025-06-01' },
  { id: 'rater_027', programId: 'prog_360_001', subjectId: 'emp_022', raterId: 'emp_025', category: 'direct_report', status: 'declined', invitedAt: '2025-06-01' },
]
