import { mockEmployees } from '@/data/mock/employees'

export type AppUser = {
  id: string
  name: string
  email: string
  role: 'hr_admin' | 'manager' | 'employee'
  department?: string
  location?: string
  jobLevel?: string
  isImpersonating?: boolean
  originalAdminName?: string
}

const DEFAULT_ADMIN: AppUser = {
  id: 'emp_001',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@questionpro.com',
  role: 'hr_admin',
  isImpersonating: false,
}

function deriveJobLevel(jobTitle?: string): string | undefined {
  if (!jobTitle) return undefined
  const title = jobTitle.toLowerCase()
  if (title.includes('chief') || title.includes('vp') || title.includes('executive')) {
    return title.includes('vp') ? 'Senior VP/VP' : 'C-Suite/Exec'
  }
  if (title.includes('director')) return 'Director'
  if (title.includes('manager')) return 'Manager'
  return 'Individual Contributor'
}

function enrichUser(base: Omit<AppUser, 'department' | 'location' | 'jobLevel'>): AppUser {
  const employee = mockEmployees.find((item) => item.id === base.id)
  return {
    ...base,
    department: employee?.department,
    location: employee?.location,
    jobLevel: deriveJobLevel(employee?.jobTitle),
  }
}

export function getCurrentUser(): AppUser {
  if (typeof window === 'undefined') {
    return enrichUser(DEFAULT_ADMIN)
  }

  const impersonating =
    typeof window !== 'undefined' ? window.localStorage.getItem('pp_impersonating') : null
  if (impersonating) {
    const emp = JSON.parse(impersonating) as {
      id: string
      name: string
      email: string
      role?: AppUser['role']
    }
    return enrichUser({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role || 'employee',
      isImpersonating: true,
      originalAdminName: 'Sarah Johnson',
    })
  }

  return enrichUser(DEFAULT_ADMIN)
}

export function isAdminContext(): boolean {
  const user = getCurrentUser()
  return user.role === 'hr_admin' && !user.isImpersonating
}

export function isEmployeeContext(): boolean {
  const user = getCurrentUser()
  return user.role === 'employee' || user.role === 'manager' || user.isImpersonating === true
}

export function isManagerUser(user: AppUser): boolean {
  if (user.role === 'manager') return true

  const employee = mockEmployees.find((item) => item.id === user.id)
  if (!employee) return false

  const hasDirectReports = mockEmployees.some(
    (item) => item.managerId === user.id && item.id !== user.id,
  )
  if (hasDirectReports) return true

  return employee.jobTitle.toLowerCase().includes('manager')
}
