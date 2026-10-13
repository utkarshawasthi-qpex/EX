import { mockEmployees } from '@/data/mock/employees'
import { isTaskAssignedToUser } from '@/lib/empowerIntegration/storage'
import type { Employee } from '@/types'
import type { EmpowerInitiativeRecord } from '@/types/empowerIntegration'

export type TeamMemberSnapshot = {
  employee: Employee
  name: string
  ownedInitiatives: EmpowerInitiativeRecord[]
  openTaskCount: number
}

export function getDirectReports(userId: string): Employee[] {
  return mockEmployees
    .filter(
      (employee) =>
        employee.managerId === userId &&
        employee.id !== userId &&
        employee.status !== 'inactive',
    )
    .sort((left, right) =>
      `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`),
    )
}

export function getTeamMemberSnapshots(
  userId: string,
  initiatives: EmpowerInitiativeRecord[],
): TeamMemberSnapshot[] {
  return getDirectReports(userId).map((employee) => {
    const ownedInitiatives = initiatives.filter((initiative) => initiative.ownerId === employee.id)
    const openTaskCount = initiatives.reduce(
      (sum, initiative) =>
        sum +
        initiative.tasks.filter(
          (task) => task.status !== 'completed' && isTaskAssignedToUser(task, employee.id),
        ).length,
      0,
    )
    return {
      employee,
      name: `${employee.firstName} ${employee.lastName}`,
      ownedInitiatives,
      openTaskCount,
    }
  })
}
