import type { ID } from '@/types'

export type Survey360Source = 'custom' | 'template'
export type Survey360Status = 'draft' | 'active' | 'closed' | 'archived'

export type Survey360Question = {
  id: ID
  text: string
  required: boolean
  scaleLabels?: string[]
}

export type Survey360Section = {
  id: ID
  title: string
  questions: Survey360Question[]
}

export type Survey360DisplaySettings = {
  nextButton: string
  exitButton: string
  previousButton: string
  finishButton: string
  thankYouMessage: string
  invalidLink: string
  errorMessage: string
  terminateMessage: string
  validationStar: string
  showQuestionNumbers: boolean
}

export type Survey360 = {
  id: ID
  title: string
  source: Survey360Source
  status: Survey360Status
  framework: string
  subjectCount: number
  evaluatorCount: number
  sections: Survey360Section[]
  themeColor: string
  font: string
  displaySettings: Survey360DisplaySettings
  defaultRelationships: string[]
  customRelationships: string[]
  languages: string[]
  defaultLanguage: string
  mediaFiles: { id: ID; name: string }[]
  createdAt: string
  updatedAt: string
}

export const DEFAULT_SCALE_LABELS = [
  'May be holding you back greatly',
  'May be holding you back',
  'Neither your strength nor holding you back',
  'One of your strengths',
  'One of your greatest strengths',
]

export const DEFAULT_DISPLAY_SETTINGS: Survey360DisplaySettings = {
  nextButton: 'Next',
  exitButton: 'Exit',
  previousButton: 'Back',
  finishButton: 'Finish',
  thankYouMessage: 'Thank you for completing the survey',
  invalidLink: 'Invalid survey link',
  errorMessage:
    'This page still has some question(s) unanswered, please answer them in order to move forward',
  terminateMessage: '',
  validationStar: 'Questions marked with a * are required',
  showQuestionNumbers: false,
}

export const THEME_COLORS = [
  '#1B87E6',
  '#FFFFFF',
  '#E5E7EB',
  '#374151',
  '#92400E',
  '#16A34A',
  '#EA580C',
  '#DC2626',
  '#7C3AED',
] as const

const INCLUSIVE_LEADERSHIP_QUESTIONS: Survey360Question[] = [
  {
    id: 'q_il_1',
    text: 'Listens to and understands diverse viewpoints.',
    required: true,
    scaleLabels: DEFAULT_SCALE_LABELS,
  },
  {
    id: 'q_il_2',
    text: 'Has effective relationships with diverse stakeholders.',
    required: true,
    scaleLabels: DEFAULT_SCALE_LABELS,
  },
  {
    id: 'q_il_3',
    text: 'Brings people together to make the best decisions.',
    required: true,
    scaleLabels: DEFAULT_SCALE_LABELS,
  },
  {
    id: 'q_il_4',
    text: 'Pays focused attention when speaking with others.',
    required: true,
    scaleLabels: DEFAULT_SCALE_LABELS,
  },
  {
    id: 'q_il_5',
    text: "Emphasizes the importance of team members having each other's best interest at heart.",
    required: true,
    scaleLabels: DEFAULT_SCALE_LABELS,
  },
  {
    id: 'q_il_6',
    text: 'When making decisions, lets people know that all input will be considered.',
    required: true,
    scaleLabels: DEFAULT_SCALE_LABELS,
  },
  {
    id: 'q_il_7',
    text: 'Fosters a team where each member feels included and has a sense of belonging.',
    required: true,
    scaleLabels: DEFAULT_SCALE_LABELS,
  },
]

function createInclusiveLeadershipSection(): Survey360Section {
  return {
    id: 'sec_inclusive_leadership',
    title: 'Inclusive Leadership',
    questions: INCLUSIVE_LEADERSHIP_QUESTIONS.map((q) => ({ ...q })),
  }
}

function createEmptySection(): Survey360Section {
  return {
    id: `sec_${Date.now()}`,
    title: 'New Section',
    questions: [],
  }
}

export function createSurvey360Draft(source: Survey360Source): Survey360 {
  const now = new Date().toISOString()
  const isTemplate = source === 'template'
  return {
    id: `surv360_${Date.now()}`,
    title: isTemplate ? 'Inclusive Leadership 360' : 'Untitled 360 Survey',
    source,
    status: 'draft',
    framework: isTemplate ? 'Competency' : 'Custom',
    subjectCount: 0,
    evaluatorCount: 0,
    sections: isTemplate ? [createInclusiveLeadershipSection()] : [createEmptySection()],
    themeColor: '#1B87E6',
    font: 'Fira Sans',
    displaySettings: { ...DEFAULT_DISPLAY_SETTINGS },
    defaultRelationships: ['Manager'],
    customRelationships: [],
    languages: ['English'],
    defaultLanguage: 'English',
    mediaFiles: Array.from({ length: 8 }, (_, i) => ({
      id: `media_${i + 1}`,
      name: 'qp.png',
    })),
    createdAt: now,
    updatedAt: now,
  }
}

export const mockSurveys360: Survey360[] = [
  {
    id: 'surv360_leadership_2025',
    title: 'Leadership 360 — Annual 2025',
    source: 'template',
    status: 'active',
    framework: 'Competency',
    subjectCount: 24,
    evaluatorCount: 186,
    sections: [createInclusiveLeadershipSection()],
    themeColor: '#1B87E6',
    font: 'Fira Sans',
    displaySettings: { ...DEFAULT_DISPLAY_SETTINGS },
    defaultRelationships: ['Manager'],
    customRelationships: ['Peer', 'Direct Report'],
    languages: ['English'],
    defaultLanguage: 'English',
    mediaFiles: Array.from({ length: 16 }, (_, i) => ({
      id: `media_seed_${i + 1}`,
      name: 'qp.png',
    })),
    createdAt: '2025-05-15T10:00:00.000Z',
    updatedAt: '2025-06-01T10:00:00.000Z',
  },
  {
    id: 'surv360_manager_q1',
    title: 'Manager Effectiveness Q1',
    source: 'custom',
    status: 'closed',
    framework: 'Custom',
    subjectCount: 12,
    evaluatorCount: 84,
    sections: [
      {
        id: 'sec_mgr_1',
        title: 'Manager Effectiveness',
        questions: [
          {
            id: 'q_mgr_1',
            text: 'Provides clear expectations for my role.',
            required: true,
            scaleLabels: DEFAULT_SCALE_LABELS,
          },
          {
            id: 'q_mgr_2',
            text: 'Gives timely and constructive feedback.',
            required: true,
            scaleLabels: DEFAULT_SCALE_LABELS,
          },
        ],
      },
    ],
    themeColor: '#7C3AED',
    font: 'Fira Sans',
    displaySettings: { ...DEFAULT_DISPLAY_SETTINGS },
    defaultRelationships: ['Manager'],
    customRelationships: [],
    languages: ['English'],
    defaultLanguage: 'English',
    mediaFiles: [],
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: '2025-03-30T10:00:00.000Z',
  },
  {
    id: 'surv360_newhire_90',
    title: 'New Hire 90-Day',
    source: 'template',
    status: 'draft',
    framework: 'Onboarding',
    subjectCount: 12,
    evaluatorCount: 48,
    sections: [createInclusiveLeadershipSection()],
    themeColor: '#16A34A',
    font: 'Fira Sans',
    displaySettings: { ...DEFAULT_DISPLAY_SETTINGS },
    defaultRelationships: ['Manager'],
    customRelationships: [],
    languages: ['English'],
    defaultLanguage: 'English',
    mediaFiles: [],
    createdAt: '2025-07-01T10:00:00.000Z',
    updatedAt: '2025-07-01T10:00:00.000Z',
  },
]

export const ADD_LANGUAGE_OPTIONS = [
  'French',
  'Spanish',
  'Spanish - Latin America',
  'Spanish - Mexico',
  'German',
  'Portuguese',
  'Portuguese - Brazil',
  'Italian',
  'Dutch',
  'Chinese - Simplified',
  'Chinese - Traditional',
  'Japanese',
  'Korean',
  'Hindi',
  'Arabic',
  'Russian',
  'Polish',
  'Turkish',
  'Swedish',
  'Norwegian',
]
