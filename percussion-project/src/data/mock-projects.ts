export type ProjectStatus = 'active' | 'draft' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: string;
  status: ProjectStatus;
  owner: string;
  createdAt: string;
  updatedAt: string;
  responses: number;
  deployments: number;
  tags: string[];
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Workplace Culture - COPIED',
    description: 'Copied study for culture insights',
    type: 'Survey',
    status: 'active',
    owner: 'Admin',
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
    responses: 0,
    deployments: 0,
    tags: ['culture'],
  },
  {
    id: '2',
    name: 'Workplace Culture - COPIED',
    description: 'Copied study for culture insights',
    type: 'Survey',
    status: 'active',
    owner: 'Admin',
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
    responses: 0,
    deployments: 0,
    tags: ['culture'],
  },
  {
    id: '3',
    name: 'Workplace Culture - COPIED',
    description: 'Copied study for culture insights',
    type: 'Survey',
    status: 'active',
    owner: 'Admin',
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
    responses: 0,
    deployments: 0,
    tags: ['culture'],
  },
  {
    id: '4',
    name: 'Workplace Culture - COPIED',
    description: 'Copied study for culture insights',
    type: 'Survey',
    status: 'active',
    owner: 'Admin',
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
    responses: 0,
    deployments: 0,
    tags: ['culture'],
  },
  {
    id: '5',
    name: 'new',
    description: 'New survey draft',
    type: 'Survey',
    status: 'active',
    owner: 'Admin',
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
    responses: 0,
    deployments: 0,
    tags: ['draft'],
  },
  {
    id: '6',
    name: 'new',
    description: 'New survey draft',
    type: 'Survey',
    status: 'active',
    owner: 'Admin',
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
    responses: 0,
    deployments: 0,
    tags: ['draft'],
  },
  {
    id: '7',
    name: 'Workplace Culture',
    description: 'Primary culture survey',
    type: 'Survey',
    status: 'active',
    owner: 'Admin',
    createdAt: '2026-05-12',
    updatedAt: '2026-05-12',
    responses: 500,
    deployments: 2,
    tags: ['culture', 'active'],
  },
];