import { PlaceholderPage } from '@/components/shared/PlaceholderPage'
import { getEmployeeById } from '@/lib/mockDb'

export default function EmployeeProfilePlaceholderPage({ params }: { params: { id: string } }) {
  const employee = getEmployeeById(params.id)
  const name = employee ? `${employee.firstName} ${employee.lastName}` : params.id

  return (
    <PlaceholderPage
      title="Employee Profile"
      description={`Employee profile placeholder — ${name}`}
    />
  )
}
