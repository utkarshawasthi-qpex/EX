import type { CollectorHeadcount } from '@/data/mock-headcount'

export type CollectorFormStatus = 'Active' | 'Inactive'

export type CollectorEmployeeField = {
  id: string
  name: string
  required: boolean
  custom: boolean
}

export type CollectorForm = {
  id: string
  name: string
  link: string
  status: CollectorFormStatus
  responsesCollected: number
  responsesExpected: number | null
  createdAt: string
  modifiedAt: string
  validateEmployee: boolean
  validateByEmail: boolean
  collectEmployeeData: boolean
  employeeFields: CollectorEmployeeField[]
  headcount?: CollectorHeadcount | null
}

function fields(id: string, required = false): CollectorEmployeeField[] {
  return [{ id: `${id}_first`, name: 'First Name', required, custom: false }]
}

export const MOCK_COLLECTOR_FORMS: CollectorForm[] = [
  {
    id: 'cf_test_q',
    name: 'test q',
    link: 'https://ex.questionpro.com/c/test-q',
    status: 'Active',
    responsesCollected: 3,
    responsesExpected: 10,
    createdAt: '2026-10-06',
    modifiedAt: '2026-10-06',
    validateEmployee: true,
    validateByEmail: true,
    collectEmployeeData: true,
    employeeFields: fields('cf_test_q'),
  },
  {
    id: 'cf_workplace_email',
    name: 'Workplace culture link',
    link: 'https://ex.questionpro.com/c/workplace-culture',
    status: 'Active',
    responsesCollected: 128,
    responsesExpected: 240,
    createdAt: '2026-08-12',
    modifiedAt: '2026-09-30',
    validateEmployee: true,
    validateByEmail: true,
    collectEmployeeData: true,
    employeeFields: fields('cf_workplace_email'),
  },
  {
    id: 'cf_lobby_qr',
    name: 'Lobby QR code',
    link: 'https://ex.questionpro.com/c/lobby-qr',
    status: 'Active',
    responsesCollected: 36,
    responsesExpected: 80,
    createdAt: '2026-08-20',
    modifiedAt: '2026-09-18',
    validateEmployee: true,
    validateByEmail: true,
    collectEmployeeData: true,
    employeeFields: fields('cf_lobby_qr', true),
  },
  {
    id: 'cf_manager_huddle',
    name: 'Manager huddle',
    link: 'https://ex.questionpro.com/c/manager-huddle',
    status: 'Active',
    responsesCollected: 14,
    responsesExpected: 22,
    createdAt: '2026-09-02',
    modifiedAt: '2026-09-21',
    validateEmployee: true,
    validateByEmail: true,
    collectEmployeeData: false,
    employeeFields: [],
  },
  {
    id: 'cf_all_hands',
    name: 'All-hands kiosk',
    link: 'https://ex.questionpro.com/c/all-hands',
    status: 'Inactive',
    responsesCollected: 57,
    responsesExpected: 60,
    createdAt: '2026-07-15',
    modifiedAt: '2026-08-01',
    validateEmployee: false,
    validateByEmail: false,
    collectEmployeeData: true,
    employeeFields: fields('cf_all_hands'),
  },
  {
    id: 'cf_new_hire',
    name: 'New hire week one',
    link: 'https://ex.questionpro.com/c/new-hire',
    status: 'Active',
    responsesCollected: 9,
    responsesExpected: 15,
    createdAt: '2026-09-18',
    modifiedAt: '2026-10-01',
    validateEmployee: true,
    validateByEmail: true,
    collectEmployeeData: true,
    employeeFields: [
      { id: 'cf_new_hire_first', name: 'First Name', required: true, custom: false },
      { id: 'cf_new_hire_start', name: 'Start date', required: false, custom: true },
    ],
  },
  {
    id: 'cf_long_name',
    name: 'Annual engagement pulse for the customer operations and shared services teams across North America and Europe',
    link: 'https://ex.questionpro.com/c/annual-engagement-pulse',
    status: 'Active',
    responsesCollected: 203,
    responsesExpected: 400,
    createdAt: '2026-06-30',
    modifiedAt: '2026-09-12',
    validateEmployee: true,
    validateByEmail: true,
    collectEmployeeData: true,
    employeeFields: fields('cf_long_name'),
  },
  {
    id: 'cf_unused',
    name: 'Pilot link',
    link: 'https://ex.questionpro.com/c/pilot',
    status: 'Inactive',
    responsesCollected: 0,
    responsesExpected: null,
    createdAt: '2026-09-28',
    modifiedAt: '2026-09-28',
    validateEmployee: true,
    validateByEmail: true,
    collectEmployeeData: true,
    employeeFields: fields('cf_unused'),
  },
]
