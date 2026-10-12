import type { FilterField } from '@/types'

export const DASHBOARD_FILTER_FIELDS: FilterField[] = [
  {
    id: 'department',
    label: 'Department',
    values: ['Engineering', 'HR', 'Sales', 'Marketing', 'Product', 'Finance', 'Operations'],
  },
  {
    id: 'location',
    label: 'Location',
    values: ['Mumbai', 'Bangalore', 'Delhi', 'Remote', 'US'],
  },
  {
    id: 'level',
    label: 'Level',
    values: ['IC', 'Manager', 'Senior Manager', 'Director', 'VP', 'C-Suite'],
  },
  {
    id: 'tenure',
    label: 'Tenure',
    values: ['<1 year', '1–3 years', '3–5 years', '>5 years'],
  },
]
