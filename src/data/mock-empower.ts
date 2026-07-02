export type EmpowerWorkspace = {
  value: string;
  label: string;
};

export const EMPOWER_WORKSPACES: EmpowerWorkspace[] = [
  { value: 'new-folks', label: 'New folks' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'customer-success', label: 'Customer Success' },
];

export const EMPOWER_TIME_RANGES = [
  { value: '12m', label: 'Last 12 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '3m', label: 'Last 3 months' },
  { value: '30d', label: 'Last 30 days' },
];

export const EMPOWER_GOAL_STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export const EMPOWER_TOP_GOALS = [
  { name: 'Continuous listening', percent: 50, color: '#1b3380' },
  { name: 'Wellbeing', percent: 50, color: '#7cb342' },
];

export type EmpowerInitiative = {
  id: string;
  name: string;
  owner: string;
  status: 'active' | 'draft' | 'completed';
  tasksInProgress: number;
  dueDate: string;
};

export const MOCK_EMPOWER_INITIATIVES: EmpowerInitiative[] = [
  {
    id: 'init-1',
    name: 'Q2 onboarding pulse',
    owner: 'Maya Chen',
    status: 'active',
    tasksInProgress: 4,
    dueDate: '2026-06-15',
  },
  {
    id: 'init-2',
    name: 'Manager coaching rollout',
    owner: 'James Okonkwo',
    status: 'active',
    tasksInProgress: 2,
    dueDate: '2026-07-01',
  },
  {
    id: 'init-3',
    name: 'Recognition program refresh',
    owner: 'Priya Sharma',
    status: 'draft',
    tasksInProgress: 0,
    dueDate: '2026-08-20',
  },
  {
    id: 'init-4',
    name: 'Annual engagement retrospective — extended title for layout testing',
    owner: 'Alex Rivera',
    status: 'completed',
    tasksInProgress: 0,
    dueDate: '2026-03-30',
  },
  {
    id: 'init-5',
    name: 'Remote collaboration norms',
    owner: 'Jordan Lee',
    status: 'active',
    tasksInProgress: 6,
    dueDate: '2026-05-28',
  },
];

export type EmpowerTeamMember = {
  id: string;
  name: string;
  role: string;
  department: string;
  openTasks: number;
  initiativesOwned: number;
};

export const MOCK_EMPOWER_TEAM: EmpowerTeamMember[] = [
  {
    id: 'tm-1',
    name: 'Maya Chen',
    role: 'People Partner',
    department: 'HR',
    openTasks: 5,
    initiativesOwned: 2,
  },
  {
    id: 'tm-2',
    name: 'James Okonkwo',
    role: 'Engineering Manager',
    department: 'Engineering',
    openTasks: 3,
    initiativesOwned: 1,
  },
  {
    id: 'tm-3',
    name: 'Priya Sharma',
    role: 'Program Lead',
    department: 'Operations',
    openTasks: 7,
    initiativesOwned: 3,
  },
  {
    id: 'tm-4',
    name: 'Sam O\'Brien',
    role: 'Analyst',
    department: 'People Analytics',
    openTasks: 0,
    initiativesOwned: 0,
  },
];

export type EmpowerConversation = {
  id: string;
  subject: string;
  participants: string;
  lastMessageAt: string;
  unreadCount: number;
};

export const MOCK_EMPOWER_CONVERSATIONS: EmpowerConversation[] = [
  {
    id: 'conv-1',
    subject: 'Feedback on onboarding week 1',
    participants: 'Maya Chen, 4 others',
    lastMessageAt: '2026-06-02T14:22:00Z',
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    subject: 'Wellbeing goal check-in',
    participants: 'Priya Sharma, James Okonkwo',
    lastMessageAt: '2026-06-01T09:10:00Z',
    unreadCount: 0,
  },
  {
    id: 'conv-3',
    subject: 'Initiative priorities for Q3',
    participants: 'Leadership circle',
    lastMessageAt: '2026-05-28T16:45:00Z',
    unreadCount: 5,
  },
  {
    id: 'conv-4',
    subject: 'Anonymous suggestion follow-up',
    participants: 'HR inbox',
    lastMessageAt: '2026-05-20T11:00:00Z',
    unreadCount: 0,
  },
];

export const EMPOWER_HOME_SNAPSHOT = {
  activeInitiatives: 0,
  tasksInProgress: 0,
  newIdeas: 0,
};

export const EMPOWER_HOME_METRICS = [
  { value: EMPOWER_HOME_SNAPSHOT.activeInitiatives, label: 'Active initiatives' },
  { value: EMPOWER_HOME_SNAPSHOT.tasksInProgress, label: 'Tasks in progress' },
  { value: EMPOWER_HOME_SNAPSHOT.newIdeas, label: 'New ideas' },
] as const;

export type EmpowerTopIdea = {
  id: string;
  name: string;
  votes: number;
};

export const MOCK_EMPOWER_TOP_IDEAS: EmpowerTopIdea[] = [
  { id: 'idea-1', name: 'Ideation 00', votes: 0 },
  { id: 'idea-2', name: 'Manager office hours', votes: 3 },
  { id: 'idea-3', name: 'Peer recognition wall', votes: 7 },
];

export type EmpowerUpcomingTaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'overdue';

export type EmpowerUpcomingTask = {
  id: string;
  name: string;
  owner: string;
  contributor: string;
  due: string;
  status: EmpowerUpcomingTaskStatus;
};

export const EMPOWER_UPCOMING_INITIATIVE_TITLE = 'Creating the whole person profile';

export const MOCK_EMPOWER_UPCOMING_TASKS: EmpowerUpcomingTask[] = [
  {
    id: 'task-1',
    name: 'Draft competency framework',
    owner: 'Maya Chen',
    contributor: 'James Okonkwo',
    due: '2026-06-10',
    status: 'in_progress',
  },
  {
    id: 'task-2',
    name: 'Validate survey instrument',
    owner: 'Priya Sharma',
    contributor: 'Sam O\'Brien',
    due: '2026-06-12',
    status: 'not_started',
  },
  {
    id: 'task-3',
    name: 'Pilot with engineering cohort',
    owner: 'Jordan Lee',
    contributor: 'Maya Chen',
    due: '2026-06-18',
    status: 'in_progress',
  },
  {
    id: 'task-4',
    name: 'Synthesize focus group notes',
    owner: 'Alex Rivera',
    contributor: 'Priya Sharma',
    due: '2026-05-28',
    status: 'overdue',
  },
  {
    id: 'task-5',
    name: 'Publish findings summary',
    owner: 'James Okonkwo',
    contributor: 'Jordan Lee',
    due: '2026-06-25',
    status: 'not_started',
  },
  {
    id: 'task-6',
    name: 'Align leadership talking points',
    owner: 'Maya Chen',
    contributor: 'Alex Rivera',
    due: '2026-06-30',
    status: 'not_started',
  },
];
