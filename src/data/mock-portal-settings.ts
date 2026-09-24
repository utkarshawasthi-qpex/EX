import {
  createFilterCondition,
  createFilterGroup,
  type EmployeeFilterGroup,
} from '@/data/mock-employee-filters'

export const PORTAL_LANGUAGE_CODES = ['Ma', 'es', 'sl', 'en', 'ja'] as const

export type PortalLanguageCode = (typeof PORTAL_LANGUAGE_CODES)[number]

export type PortalContentPageId =
  | 'privacy-policy'
  | 'navigation-footer'
  | 'terms-of-use'
  | 'contact'
  | 'about'
  | 'faq'
  | 'landing-page'
  | 'login-page'

export type PortalGlobalPageId = 'footer' | 'customize-theme'

export type PortalPageCopy = {
  title: string
  body: string
}

export type PortalContentPage = {
  id: PortalContentPageId
  title: string
  mainTab: boolean
  footer: boolean
  order: number
  body: string
  translations: Partial<Record<PortalLanguageCode, PortalPageCopy>>
}

export type PortalGlobalPage = {
  id: PortalGlobalPageId
  title: string
  body: string
  translations: Partial<Record<PortalLanguageCode, PortalPageCopy>>
}

export type PortalLanguage = {
  code: PortalLanguageCode
  name: string
  enabled: boolean
}

export type PortalRole = 'employee' | 'manager' | 'hr_admin'

export type PortalFeatureId =
  | 'dashboards'
  | 'actionPlanning'
  | 'surveyComparison'
  | 'benchmarking'
  | 'pptExport'
  | 'settings'
  | 'admin'

export type PortalFeature = {
  id: PortalFeatureId
  label: string
}

export type PortalPermissions = Record<PortalRole, Record<PortalFeatureId, boolean>>

export type PortalLogEntry = {
  id: string
  at: string
  actor: string
  action: string
}

export type PortalSetup = {
  portalEnabled: boolean
  requireLogin: boolean
  showLandingPage: boolean
  allowDownloads: boolean
  defaultLanguage: PortalLanguageCode
}

export type PortalAccessSettings = {
  culture: boolean
  understandCulture: boolean
  analyzingCulture: boolean
  activateCulture: boolean
  employeeExperience: boolean
  createDashboard: boolean
  createWidget: boolean
  driverAnalysisColorCode: boolean
  threeSixty: boolean
  empower: boolean
}

export type PortalAccessRule = {
  id: string
  name: string
  description: string
  userIds: string[]
  allowedEmployeeIds: string[]
}

export type PortalFilterAccessField = {
  id: string
  label: string
}

export type FilterAudienceSource = 'new' | 'saved'

export type FilterAudience = {
  id: string
  source: FilterAudienceSource
  savedFilterId?: string
  peopleGroups: EmployeeFilterGroup[]
  allowedFilterIds: string[]
}

export type PortalFilterAccessRule = {
  id: string
  name: string
  description: string
  audiences: FilterAudience[]
}

export type PortalProductId = 'employeeExperience' | 'threeSixty'

export type PortalSettingsState = {
  pages: PortalContentPage[]
  globalPages: PortalGlobalPage[]
  languages: PortalLanguage[]
  permissions: PortalPermissions
  logs: PortalLogEntry[]
  setup: PortalSetup
  portalAccess: PortalAccessSettings
  accessRules: PortalAccessRule[]
  filterAccessRules: PortalFilterAccessRule[]
}

export const PORTAL_FEATURES: PortalFeature[] = [
  { id: 'dashboards', label: 'Dashboards' },
  { id: 'actionPlanning', label: 'Action planning' },
  { id: 'surveyComparison', label: 'Survey comparison' },
  { id: 'benchmarking', label: 'Benchmarking' },
  { id: 'pptExport', label: 'PPT export' },
  { id: 'settings', label: 'Settings' },
  { id: 'admin', label: 'Admin' },
]

export const PORTAL_ROLE_LABELS: Record<PortalRole, string> = {
  employee: 'Employee',
  manager: 'Manager',
  hr_admin: 'HR Admin',
}

export const DEFAULT_PORTAL_THEME_COLOR = '#1B87E6'
export const DEFAULT_PORTAL_LANGUAGE: PortalLanguageCode = 'en'
export const PORTAL_CMS_BASE_PATH = '/lifecycle/analytics/pages'

function page(
  id: PortalContentPageId,
  title: string,
  body: string,
  flags: { mainTab?: boolean; footer?: boolean } = {},
): PortalContentPage {
  return {
    id,
    title,
    mainTab: Boolean(flags.mainTab),
    footer: Boolean(flags.footer),
    order: 0,
    body,
    translations: { en: { title, body } },
  }
}

export const DEFAULT_PORTAL_PAGES: PortalContentPage[] = [
  page(
    'privacy-policy',
    'Privacy Policy',
    'QuestionPro collects employee experience responses to help your organization understand engagement. Responses are reported in aggregate unless a survey is configured otherwise. Contact your HR administrator with privacy questions.',
    { footer: true },
  ),
  page(
    'navigation-footer',
    'Navigation Footer',
    'Use this block for additional footer navigation copy. Toggle Footer to show it as a portal footer link.',
  ),
  page(
    'terms-of-use',
    'Terms of Use',
    'This employee portal is provided for internal use. Do not share dashboard links outside the organization unless your administrator has enabled public sharing.',
  ),
  page(
    'contact',
    'Contact',
    'Need help with a survey or dashboard? Email people-ops@questionpro.example or ask your manager. For technical access issues, contact your HR administrator.',
    { footer: true },
  ),
  page(
    'about',
    'About',
    'This portal is where employees view experience dashboards and follow through on action plans. Content and navigation are configured by your administrator in Employee Experience.',
    { footer: false },
  ),
  page(
    'faq',
    'FAQ',
    'How do I see my team’s results? Open Dashboards and use the filters your administrator enabled.\n\nWhy can’t I open Employee Experience from here? The portal is for dashboards and action planning. Administration stays in the Employee Experience app.',
    { footer: false },
  ),
  page(
    'landing-page',
    'Landing Page',
    'Welcome to the employee portal. Open Dashboards to review results, or use the links your administrator added to this portal.',
  ),
  page(
    'login-page',
    'Login Page',
    'Sign-in happens from Employee Experience. Administrators can preview this page, but employees enter the portal from Access portal or Login on the employee list.',
  ),
]

export const DEFAULT_PORTAL_GLOBAL_PAGES: PortalGlobalPage[] = [
  {
    id: 'footer',
    title: 'Footer',
    body: 'QuestionPro QuestionPro Admin | #Employee Experience',
    translations: {
      en: {
        title: 'Footer',
        body: 'QuestionPro QuestionPro Admin | #Employee Experience',
      },
    },
  },
  {
    id: 'customize-theme',
    title: 'Customize Theme',
    body: DEFAULT_PORTAL_THEME_COLOR,
    translations: {
      en: { title: 'Customize Theme', body: DEFAULT_PORTAL_THEME_COLOR },
    },
  },
]

export const DEFAULT_PORTAL_LANGUAGES: PortalLanguage[] = [
  { code: 'Ma', name: 'Malay', enabled: true },
  { code: 'es', name: 'Spanish', enabled: true },
  { code: 'sl', name: 'Slovenian', enabled: true },
  { code: 'en', name: 'English', enabled: true },
  { code: 'ja', name: 'Japanese', enabled: true },
]

const ALL_FEATURES_ON = {
  dashboards: true,
  actionPlanning: true,
  surveyComparison: true,
  benchmarking: true,
  pptExport: true,
  settings: true,
  admin: true,
} satisfies Record<PortalFeatureId, boolean>

export const DEFAULT_PORTAL_PERMISSIONS: PortalPermissions = {
  employee: {
    ...ALL_FEATURES_ON,
    surveyComparison: false,
    benchmarking: false,
    pptExport: false,
    settings: false,
    admin: false,
  },
  manager: {
    ...ALL_FEATURES_ON,
    admin: false,
    settings: false,
  },
  hr_admin: { ...ALL_FEATURES_ON },
}

export const DEFAULT_PORTAL_SETUP: PortalSetup = {
  portalEnabled: true,
  requireLogin: true,
  showLandingPage: false,
  allowDownloads: true,
  defaultLanguage: 'en',
}

export const DEFAULT_PORTAL_ACCESS: PortalAccessSettings = {
  culture: false,
  understandCulture: false,
  analyzingCulture: false,
  activateCulture: false,
  employeeExperience: true,
  createDashboard: true,
  createWidget: true,
  driverAnalysisColorCode: true,
  threeSixty: true,
  empower: false,
}

export const PORTAL_FILTER_ACCESS_FIELDS: PortalFilterAccessField[] = [
  { id: 'department', label: 'Department' },
  { id: 'location', label: 'Location' },
  { id: 'level', label: 'Level' },
  { id: 'tenure', label: 'Tenure' },
]

export const SAMPLE_PORTAL_ACCESS_RULES: PortalAccessRule[] = [
  {
    id: 'rule_sales_hrbp',
    name: 'Sales HRBP view',
    description: 'People partner can see Sales employee results beyond their reporting line.',
    userIds: ['emp_018'],
    allowedEmployeeIds: ['emp_012', 'emp_013', 'emp_014', 'emp_015', 'emp_016'],
  },
  {
    id: 'rule_eng_skip_level',
    name: 'Engineering skip-level',
    description: 'Engineering manager can review Product collaborators plus their own team.',
    userIds: ['emp_002'],
    allowedEmployeeIds: ['emp_002', 'emp_003', 'emp_004', 'emp_005', 'emp_006', 'emp_008', 'emp_009'],
  },
  {
    id: 'rule_people_ops_hr',
    name: 'People ops HR access',
    description: 'Learning program manager can see HR colleague results for planning.',
    userIds: ['emp_021'],
    allowedEmployeeIds: ['emp_017', 'emp_018', 'emp_019', 'emp_020', 'emp_021'],
  },
]

export const SAMPLE_PORTAL_FILTER_ACCESS_RULES: PortalFilterAccessRule[] = [
  {
    id: 'frule_hr_default',
    name: 'HR default filters',
    description: 'HR employees can slice dashboards by department and location.',
    audiences: [
      {
        id: 'aud_hr_dept',
        source: 'saved',
        savedFilterId: 'hr-employees',
        peopleGroups: [createFilterGroup([createFilterCondition('department', 'is', 'HR')])],
        allowedFilterIds: ['department', 'location'],
      },
    ],
  },
  {
    id: 'frule_eng_ppt',
    name: 'Engineering team filters',
    description: 'Employees matching the Active employees saved filter can filter dashboards by department, level, and tenure.',
    audiences: [
      {
        id: 'aud_eng_mgr',
        source: 'saved',
        savedFilterId: 'active-employees',
        peopleGroups: [createFilterGroup([createFilterCondition('status', 'is', 'active')])],
        allowedFilterIds: ['department', 'level', 'tenure'],
      },
    ],
  },
]

export const DEFAULT_PORTAL_LOGS: PortalLogEntry[] = [
  {
    id: 'log_001',
    at: '2026-09-09T14:22:00.000Z',
    actor: 'Sarah Johnson',
    action: 'Updated portal content visibility',
  },
  {
    id: 'log_002',
    at: '2026-09-08T09:10:00.000Z',
    actor: 'Sarah Johnson',
    action: 'Changed manager dashboard access',
  },
  {
    id: 'log_003',
    at: '2026-09-04T16:41:00.000Z',
    actor: 'Sarah Johnson',
    action: 'Enabled Japanese language pack',
  },
]

export function seedPortalSettings(): PortalSettingsState {
  return {
    pages: DEFAULT_PORTAL_PAGES.map((item) => ({
      ...item,
      translations: { ...item.translations },
    })),
    globalPages: DEFAULT_PORTAL_GLOBAL_PAGES.map((item) => ({
      ...item,
      translations: { ...item.translations },
    })),
    languages: DEFAULT_PORTAL_LANGUAGES.map((language) => ({ ...language })),
    permissions: {
      employee: { ...DEFAULT_PORTAL_PERMISSIONS.employee },
      manager: { ...DEFAULT_PORTAL_PERMISSIONS.manager },
      hr_admin: { ...DEFAULT_PORTAL_PERMISSIONS.hr_admin },
    },
    logs: DEFAULT_PORTAL_LOGS.map((entry) => ({ ...entry })),
    setup: { ...DEFAULT_PORTAL_SETUP },
    portalAccess: { ...DEFAULT_PORTAL_ACCESS },
    accessRules: [],
    filterAccessRules: [],
  }
}

export function getPortalFilterAccessLabel(id: string) {
  return PORTAL_FILTER_ACCESS_FIELDS.find((field) => field.id === id)?.label ?? id
}

export function getPortalFilterAccessLabels(ids: string[]) {
  const names = ids.map((id) => getPortalFilterAccessLabel(id))
  if (names.length === 0) return '—'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]}, ${names[1]}`
  return `${names[0]} +${names.length - 1}`
}

export function createFilterAudience(): FilterAudience {
  return {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    source: 'saved',
    peopleGroups: [],
    allowedFilterIds: PORTAL_FILTER_ACCESS_FIELDS.map((field) => field.id),
  }
}

export function createBlankFilterAccessRule(): PortalFilterAccessRule {
  return {
    id: `frule_new_${Date.now()}`,
    name: '',
    description: '',
    audiences: [createFilterAudience()],
  }
}

export function isPortalLanguageCode(value: string): value is PortalLanguageCode {
  return (PORTAL_LANGUAGE_CODES as readonly string[]).includes(value)
}

export function getPortalLanguageName(code: PortalLanguageCode) {
  return DEFAULT_PORTAL_LANGUAGES.find((language) => language.code === code)?.name ?? code
}

export function getEnabledPortalLanguages(languages: PortalLanguage[]) {
  return languages.filter((language) => language.enabled)
}

export function getPortalPageCopy(page: PortalContentPage, language: PortalLanguageCode): PortalPageCopy {
  const translation = page.translations[language]
  if (translation?.title || translation?.body) {
    return {
      title: translation.title || page.title,
      body: translation.body || page.body,
    }
  }
  return {
    title: page.translations.en?.title || page.title,
    body: page.translations.en?.body || page.body,
  }
}

export function getPortalGlobalCopy(
  page: PortalGlobalPage,
  language: PortalLanguageCode,
): PortalPageCopy {
  const translation = page.translations[language]
  if (translation?.title || translation?.body) {
    return {
      title: translation.title || page.title,
      body: translation.body || page.body,
    }
  }
  return {
    title: page.translations.en?.title || page.title,
    body: page.translations.en?.body || page.body,
  }
}

export function getPortalThemeColor(globalPages: PortalGlobalPage[]) {
  const theme = globalPages.find((page) => page.id === 'customize-theme')
  const value = theme?.body?.trim()
  return value || DEFAULT_PORTAL_THEME_COLOR
}

export function getPortalFooterText(globalPages: PortalGlobalPage[], language: PortalLanguageCode) {
  const footer = globalPages.find((page) => page.id === 'footer')
  if (!footer) return ''
  return getPortalGlobalCopy(footer, language).body
}

export function getPortalFooterPages(pages: PortalContentPage[]) {
  return [...pages]
    .filter((page) => page.footer)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

export function getPortalMainTabPages(pages: PortalContentPage[]) {
  return [...pages]
    .filter((page) => page.mainTab)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

export function getPortalCmsHref(id: PortalContentPageId) {
  return `${PORTAL_CMS_BASE_PATH}/${id}`
}
