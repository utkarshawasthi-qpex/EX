export type ProjectStatus = 'active' | 'draft' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  owner: string;
  createdAt: string;
  updatedAt: string;
  responses: number;
  tags: string[];
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p001',
    name: 'Customer Satisfaction Q1 2025',
    description: 'Quarterly CSAT tracking for enterprise accounts',
    status: 'active',
    owner: 'Sarah Chen',
    createdAt: '2025-01-15',
    updatedAt: '2025-03-20',
    responses: 1247,
    tags: ['csat', 'enterprise'],
  },
  {
    id: 'p002',
    name: 'Product Onboarding Feedback',
    description: 'Collect feedback from new users in their first 30 days',
    status: 'active',
    owner: 'Marcus Williams',
    createdAt: '2025-02-01',
    updatedAt: '2025-03-18',
    responses: 342,
    tags: ['onboarding', 'product'],
  },
  {
    id: 'p003',
    name: 'Annual Employee Engagement Survey',
    description: 'Company-wide annual engagement and culture survey',
    status: 'active',
    owner: 'Priya Kapoor',
    createdAt: '2025-01-20',
    updatedAt: '2025-03-15',
    responses: 4891,
    tags: ['hr', 'engagement'],
  },
  {
    id: 'p004',
    name: 'Post-Purchase Experience - E-commerce',
    description: 'Survey sent 7 days after order delivery to measure satisfaction',
    status: 'active',
    owner: 'James Okafor',
    createdAt: '2024-11-10',
    updatedAt: '2025-03-19',
    responses: 12304,
    tags: ['ecommerce', 'post-purchase'],
  },
  {
    id: 'p005',
    name: 'Beta Feature Usability Test — Analytics Dashboard',
    description:
      'Moderated usability study for the new analytics dashboard redesign with early adopters',
    status: 'draft',
    owner: 'Sarah Chen',
    createdAt: '2025-03-05',
    updatedAt: '2025-03-21',
    responses: 0,
    tags: ['usability', 'analytics', 'beta'],
  },
  {
    id: 'p006',
    name: 'Support Ticket Resolution CSAT',
    description: 'Automated survey triggered after a support ticket is closed',
    status: 'active',
    owner: 'Lena Torres',
    createdAt: '2024-09-01',
    updatedAt: '2025-03-20',
    responses: 8720,
    tags: ['support', 'csat'],
  },
  {
    id: 'p007',
    name: 'Pricing Sensitivity Study Q4 2024',
    description: 'Van Westendorp price sensitivity analysis for new subscription tiers',
    status: 'archived',
    owner: 'Marcus Williams',
    createdAt: '2024-09-15',
    updatedAt: '2024-12-31',
    responses: 503,
    tags: ['pricing', 'research'],
  },
  {
    id: 'p008',
    name: 'Healthcare Provider NPS',
    description: 'Net Promoter Score measurement across all clinic locations',
    status: 'active',
    owner: 'Priya Kapoor',
    createdAt: '2025-01-08',
    updatedAt: '2025-03-17',
    responses: 2156,
    tags: ['nps', 'healthcare'],
  },
  {
    id: 'p009',
    name: 'Mobile App Store Rating Follow-up',
    description: 'In-app survey for users who left a 3-star or below rating',
    status: 'draft',
    owner: 'James Okafor',
    createdAt: '2025-03-10',
    updatedAt: '2025-03-10',
    responses: 0,
    tags: ['mobile', 'app-store'],
  },
  {
    id: 'p010',
    name: 'Webinar Attendee Experience 2024',
    description: 'Post-webinar survey for all Q4 2024 product webinar attendees',
    status: 'archived',
    owner: 'Lena Torres',
    createdAt: '2024-10-01',
    updatedAt: '2024-12-15',
    responses: 1089,
    tags: ['webinar', 'events'],
  },
  {
    id: 'p011',
    name: 'SaaS Churn Exit Survey',
    description: 'Triggered when a customer cancels their subscription to capture churn reason',
    status: 'active',
    owner: 'Sarah Chen',
    createdAt: '2024-07-20',
    updatedAt: '2025-03-18',
    responses: 317,
    tags: ['churn', 'retention'],
  },
  {
    id: 'p012',
    name: 'Brand Perception Tracker — Q2 2025',
    description: 'Bi-annual brand health and awareness tracking study',
    status: 'draft',
    owner: 'Marcus Williams',
    createdAt: '2025-03-18',
    updatedAt: '2025-03-22',
    responses: 0,
    tags: ['brand', 'tracking'],
  },
];
