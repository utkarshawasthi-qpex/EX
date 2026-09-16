import { mockEmployees } from '@/data/mock/employees'
import { mockRaterAssignments } from '@/data/mock/raters'
import type { Employee, EmployeeStatus } from '@/types'

export type DirectoryEmployee = Employee & {
  phone: string
  language: string
  survey360Count: number
  alternateEmail?: string
  phoneCountry?: string
  timeZone?: string
  memberStatus?: string
  isAdmin?: boolean
}

export type DirectoryTreeNode = {
  employee: DirectoryEmployee
  children: DirectoryTreeNode[]
}

const PHONES = [
  '+1 415 555 0142',
  '+1 512 555 0198',
  '+91 80 4555 0142',
  '+1 212 555 0176',
  '+44 20 7946 0133',
  '+1 415 555 0188',
  '+1 415 555 0104',
  '+1 512 555 0161',
  '+1 617 555 0129',
  '+1 212 555 0155',
  '+44 20 7946 0180',
  '+1 212 555 0190',
  '+1 512 555 0137',
  '+1 415 555 0122',
  '+1 303 555 0144',
  '+44 20 7946 0166',
  '+1 415 555 0177',
  '+1 646 555 0118',
  '+1 512 555 0182',
  '+1 415 555 0139',
  '+44 20 7946 0144',
  '+1 512 555 0148',
  '+1 206 555 0160',
  '+1 212 555 0121',
  '+44 20 7946 0172',
]

const LANGUAGES = [
  'English',
  'English',
  'English',
  'Spanish',
  'English',
  'English',
  'English',
  'English',
  'French',
  'English',
  'English',
  'English',
  'Spanish',
  'English',
  'English',
  'English',
  'German',
  'English',
  'English',
  'Spanish',
  'English',
  'English',
  'French',
  'English',
  'English',
]

const EXTRA_FIRST_NAMES = [
  'Ava',
  'Caleb',
  'Diana',
  'Felix',
  'Gia',
  'Hugo',
  'Iris',
  'Jonah',
  'Kira',
  'Miles',
  'Nadia',
  'Omar',
  'Pearl',
  'Quinn',
  'Reina',
  'Seth',
  'Tessa',
  'Uri',
  'Vera',
  'Wade',
  'Ximena',
  'Yves',
  'Willa',
  'Brett',
  'Cora',
  'Drew',
  'Elise',
  'Farid',
  'Greta',
  'Hank',
]

const EXTRA_LAST_NAMES = [
  'Bennett',
  'Foster',
  'Hughes',
  'Ibrahim',
  'Jensen',
  'Kowalski',
  'Lopez',
  'Nakamura',
  'Okafor',
  'Price',
  'Quintero',
  'Reed',
  'Santos',
  'Thompson',
  'Ueda',
  'Vargas',
  'Walsh',
  'Xu',
  'Young',
  'Zimmerman',
  'Abbott',
  'Bishop',
  'Cohen',
  'Diaz',
]

const DEPARTMENTS = ['Engineering', 'Product', 'Sales', 'HR'] as const
const LOCATIONS = ['San Francisco', 'Austin', 'Remote', 'New York', 'London'] as const
const JOB_TITLES: Record<(typeof DEPARTMENTS)[number], string[]> = {
  Engineering: ['Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'QA Engineer'],
  Product: ['Product Manager', 'Product Designer', 'UX Researcher', 'Product Analyst'],
  Sales: ['Account Executive', 'Customer Success Manager', 'Sales Development Representative', 'Solutions Consultant'],
  HR: ['People Partner', 'Talent Coordinator', 'HRIS Analyst', 'Learning Specialist'],
}
const MANAGER_POOL = ['emp_002', 'emp_008', 'emp_012', 'emp_017', 'emp_022']
const STATUS_CYCLE: EmployeeStatus[] = ['active', 'active', 'active', 'active', 'on_leave', 'inactive']
const LANGUAGE_CYCLE = ['English', 'English', 'Spanish', 'English', 'French', 'German']

export const DIRECTORY_LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
]

export const EMPLOYEE_LIST_PAGE_SIZE = 100
export const DEFAULT_PORTAL_SUBDOMAIN = 'qp151'
export const PORTAL_URL_HOST_SUFFIX = '.questionpro.com/e/t/TakeSurvey?tt=newfolks'

function padPhone(index: number) {
  return `+1 415 555 ${String(2000 + index).slice(-4)}`
}

function inferJobLevel(jobTitle: string) {
  const title = jobTitle.toLowerCase()
  if (/(chief|cpo|cfo|cto)/.test(title)) return 'C-Suite/Exec'
  if (/\bvp\b|vice president/.test(title)) return 'Senior VP/VP'
  if (title.includes('director')) return 'Director'
  if (title.includes('manager') || title.includes('lead')) return 'Manager'
  return 'Individual Contributor'
}

function survey360CountFor(employeeId: string, fallbackIndex: number) {
  const programs = new Set<string>()
  mockRaterAssignments.forEach((assignment) => {
    if (assignment.subjectId === employeeId || assignment.raterId === employeeId) {
      programs.add(assignment.programId)
    }
  })
  if (programs.size > 0) return programs.size
  return fallbackIndex % 4
}

function extraEmployees(): Omit<DirectoryEmployee, 'survey360Count'>[] {
  const extras: Omit<DirectoryEmployee, 'survey360Count'>[] = [
    {
      id: 'emp_026',
      firstName: 'Alexandria-Catherine',
      lastName: 'Montgomery-Whitaker',
      email: 'alexandria.montgomery-whitaker@questionpro.example',
      department: 'Product',
      location: 'San Francisco',
      jobTitle: 'Principal Product Strategist for Employee Experience Platforms',
      hireDate: '2019-04-11',
      status: 'active',
      managerId: 'emp_007',
      phone: '+1 415 555 0199',
      language: 'English',
    },
  ]

  for (let index = 0; index < 94; index += 1) {
    const idNumber = 27 + index
    const firstName = EXTRA_FIRST_NAMES[index % EXTRA_FIRST_NAMES.length]
    const lastName = EXTRA_LAST_NAMES[Math.floor(index / EXTRA_FIRST_NAMES.length) % EXTRA_LAST_NAMES.length]
    const department = DEPARTMENTS[index % DEPARTMENTS.length]
    extras.push({
      id: `emp_${String(idNumber).padStart(3, '0')}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idNumber}@questionpro.example`,
      department,
      location: LOCATIONS[index % LOCATIONS.length],
      jobTitle: JOB_TITLES[department][index % JOB_TITLES[department].length],
      hireDate: `20${18 + (index % 7)}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
      status: STATUS_CYCLE[index % STATUS_CYCLE.length],
      managerId: MANAGER_POOL[index % MANAGER_POOL.length],
      phone: padPhone(index),
      language: LANGUAGE_CYCLE[index % LANGUAGE_CYCLE.length],
    })
  }

  return extras
}

export const MOCK_DIRECTORY_EMPLOYEES: DirectoryEmployee[] = [
  ...mockEmployees.map((employee, index) => ({
    ...employee,
    phone: PHONES[index] ?? padPhone(index),
    language: LANGUAGES[index] ?? 'English',
  })),
  ...extraEmployees(),
].map((employee, index) => ({
  ...employee,
  jobLevel: employee.jobLevel ?? inferJobLevel(employee.jobTitle),
  isAdmin: /chief|\bvp\b/i.test(employee.jobTitle),
  survey360Count: survey360CountFor(employee.id, index),
}))

export const EMPLOYEE_PORTAL_COUNT = MOCK_DIRECTORY_EMPLOYEES.length

export const EMPLOYEE_PORTAL_URL = `https://${DEFAULT_PORTAL_SUBDOMAIN}${PORTAL_URL_HOST_SUFFIX}`

export function getEmployeeDisplayName(employee: Pick<Employee, 'firstName' | 'lastName'>) {
  return `${employee.firstName} ${employee.lastName}`
}

export function getEmployeeFieldValue(employee: DirectoryEmployee, fieldId: string): string {
  switch (fieldId) {
    case 'status':
      return employee.status
    case 'nameOrEmail':
      return `${getEmployeeDisplayName(employee)} ${employee.email}`
    case 'email':
      return employee.email
    case 'department':
      return employee.department
    case 'location':
      return employee.location
    case 'language':
      return employee.language
    case 'level':
      return employee.jobLevel ?? ''
    case 'manager':
      return employee.managerId && employee.managerId !== employee.id ? employee.managerId : ''
    default:
      return employee.customFields?.[fieldId] ?? ''
  }
}

export function setEmployeeFieldValue(
  employee: DirectoryEmployee,
  fieldId: string,
  value: string,
): DirectoryEmployee {
  if (fieldId === 'department') return { ...employee, department: value }
  if (fieldId === 'location') return { ...employee, location: value }
  const nextCustom = { ...employee.customFields }
  if (value) nextCustom[fieldId] = value
  else delete nextCustom[fieldId]
  return {
    ...employee,
    customFields: Object.keys(nextCustom).length > 0 ? nextCustom : undefined,
  }
}

export function getManager(
  employee: DirectoryEmployee,
  employees: DirectoryEmployee[] = MOCK_DIRECTORY_EMPLOYEES,
): DirectoryEmployee | undefined {
  if (!employee.managerId || employee.managerId === employee.id) return undefined
  return employees.find((item) => item.id === employee.managerId)
}

export function buildPortalUrl(subdomain: string) {
  const slug = subdomain.trim() || DEFAULT_PORTAL_SUBDOMAIN
  return `https://${slug}${PORTAL_URL_HOST_SUFFIX}`
}

export function parsePortalSubdomain(url: string) {
  const match = url.match(/^https?:\/\/([^.]+)\.questionpro\.com/i)
  return match?.[1] ?? DEFAULT_PORTAL_SUBDOMAIN
}

export function buildEmployeeTree(employees: DirectoryEmployee[]): DirectoryTreeNode[] {
  const byId = new Map(employees.map((employee) => [employee.id, employee]))
  const childrenByManager = new Map<string, DirectoryEmployee[]>()
  const roots: DirectoryEmployee[] = []

  employees.forEach((employee) => {
    const managerId = employee.managerId
    const isRoot = !managerId || managerId === employee.id || !byId.has(managerId)
    if (isRoot) {
      roots.push(employee)
      return
    }
    const siblings = childrenByManager.get(managerId) ?? []
    siblings.push(employee)
    childrenByManager.set(managerId, siblings)
  })

  function toNode(employee: DirectoryEmployee): DirectoryTreeNode {
    return {
      employee,
      children: (childrenByManager.get(employee.id) ?? []).map(toNode),
    }
  }

  return roots.map(toNode)
}
