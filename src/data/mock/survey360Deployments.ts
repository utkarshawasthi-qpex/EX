export type Survey360DeploymentList = 'ongoing' | 'completed'

export type Survey360Deployment = {
  id: string
  name: string
  status: 'Active' | 'Closed' | 'Draft'
  responses: number
  invited: number
  date: string
  responseRate: number
  list: Survey360DeploymentList
}

export const mockSurvey360Deployments: Survey360Deployment[] = [
  {
    id: 'dep_thank_you',
    name: 'thankYou',
    status: 'Active',
    responses: 0,
    invited: 5,
    date: '2026-09-18 14:31:00',
    responseRate: 100,
    list: 'ongoing',
  },
  {
    id: 'dep_q1_leadership',
    name: 'Q1 Leadership Cycle',
    status: 'Closed',
    responses: 42,
    invited: 48,
    date: '2026-03-12 09:15:00',
    responseRate: 87.5,
    list: 'completed',
  },
  {
    id: 'dep_manager_2025',
    name: 'Manager Effectiveness 2025',
    status: 'Closed',
    responses: 110,
    invited: 110,
    date: '2025-12-02 16:40:00',
    responseRate: 100,
    list: 'completed',
  },
]
