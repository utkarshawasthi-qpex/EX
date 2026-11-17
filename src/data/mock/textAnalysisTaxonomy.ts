export type TaxonomySubTopic = {
  id: string
  name: string
}

export type TaxonomyTopic = {
  id: string
  name: string
  subTopics: TaxonomySubTopic[]
}

export type TaxonomyIndustry = {
  id: string
  name: string
  topics: TaxonomyTopic[]
}

export const TEXT_ANALYSIS_TAXONOMY_TEMPLATE_CSV = `Industry,Topic,Sub-topic
Technology,Leadership Communication,Unclear direction
Technology,Leadership Communication,Delayed decisions
Technology,Work-Life Balance,Flexible hours
Healthcare,Staffing,Nurse-to-patient ratio
`

export const mockTextAnalysisTaxonomy: TaxonomyIndustry[] = [
  {
    id: 'ind_technology',
    name: 'Technology',
    topics: [
      {
        id: 'top_leadership',
        name: 'Leadership Communication',
        subTopics: [
          { id: 'sub_unclear_direction', name: 'Unclear direction' },
          { id: 'sub_delayed_decisions', name: 'Delayed decisions' },
          { id: 'sub_town_halls', name: 'Town halls' },
        ],
      },
      {
        id: 'top_wlb',
        name: 'Work-Life Balance',
        subTopics: [
          { id: 'sub_flexible_hours', name: 'Flexible hours' },
          { id: 'sub_meeting_load', name: 'Meeting load' },
          { id: 'sub_time_off', name: 'Time off' },
        ],
      },
      {
        id: 'top_career',
        name: 'Career Growth',
        subTopics: [
          { id: 'sub_promotion_path', name: 'Promotion path' },
          { id: 'sub_mentorship', name: 'Mentorship' },
          { id: 'sub_learning_budget', name: 'Learning budget' },
        ],
      },
      {
        id: 'top_tools',
        name: 'Tools and Technology',
        subTopics: [
          { id: 'sub_slow_tools', name: 'Slow internal tools' },
          { id: 'sub_license_access', name: 'License access' },
        ],
      },
    ],
  },
  {
    id: 'ind_healthcare',
    name: 'Healthcare',
    topics: [
      {
        id: 'top_staffing',
        name: 'Staffing',
        subTopics: [
          { id: 'sub_nurse_ratio', name: 'Nurse-to-patient ratio' },
          { id: 'sub_float_pool', name: 'Float pool coverage' },
        ],
      },
      {
        id: 'top_patient_safety',
        name: 'Patient Safety',
        subTopics: [
          { id: 'sub_hand_hygiene', name: 'Hand hygiene' },
          { id: 'sub_handoffs', name: 'Shift handoffs' },
        ],
      },
      {
        id: 'top_wellbeing_hc',
        name: 'Clinician wellbeing',
        subTopics: [{ id: 'sub_burnout', name: 'Burnout support' }],
      },
    ],
  },
  {
    id: 'ind_financial',
    name: 'Financial Services',
    topics: [
      {
        id: 'top_compliance',
        name: 'Compliance pressure',
        subTopics: [
          { id: 'sub_audit_load', name: 'Audit load' },
          { id: 'sub_policy_clarity', name: 'Policy clarity' },
        ],
      },
      {
        id: 'top_client_load',
        name: 'Client load',
        subTopics: [{ id: 'sub_after_hours', name: 'After-hours coverage' }],
      },
    ],
  },
  {
    id: 'ind_retail',
    name: 'Retail',
    topics: [
      {
        id: 'top_scheduling',
        name: 'Scheduling',
        subTopics: [
          { id: 'sub_last_minute', name: 'Last-minute shift changes' },
          { id: 'sub_weekend_equity', name: 'Weekend equity' },
        ],
      },
      {
        id: 'top_store_ops',
        name: 'Store operations',
        subTopics: [{ id: 'sub_staffing_floor', name: 'Floor staffing' }],
      },
    ],
  },
  {
    id: 'ind_manufacturing',
    name: 'Manufacturing',
    topics: [
      {
        id: 'top_safety',
        name: 'Plant safety',
        subTopics: [
          { id: 'sub_ppe', name: 'PPE availability' },
          { id: 'sub_near_miss', name: 'Near-miss reporting' },
        ],
      },
      {
        id: 'top_shift_work',
        name: 'Shift work',
        subTopics: [],
      },
    ],
  },
  {
    id: 'ind_education',
    name: 'Education',
    topics: [
      {
        id: 'top_workload_edu',
        name: 'Teaching workload',
        subTopics: [
          { id: 'sub_class_size', name: 'Class size' },
          { id: 'sub_prep_time', name: 'Prep time' },
        ],
      },
    ],
  },
  {
    id: 'ind_hospitality',
    name: 'Hospitality',
    topics: [
      {
        id: 'top_tips',
        name: 'Tips and pay',
        subTopics: [{ id: 'sub_tip_pooling', name: 'Tip pooling' }],
      },
      {
        id: 'top_scheduling_hosp',
        name: 'Scheduling',
        subTopics: [{ id: 'sub_split_shifts', name: 'Split shifts' }],
      },
    ],
  },
  {
    id: 'ind_professional',
    name: 'Professional Services',
    topics: [
      {
        id: 'top_utilization',
        name: 'Utilization targets',
        subTopics: [
          { id: 'sub_billable', name: 'Billable hours' },
          { id: 'sub_bench_time', name: 'Bench time' },
        ],
      },
    ],
  },
  {
    id: 'ind_long_name',
    name: 'High-Growth Product Organizations with Distributed Regional Offices and Hybrid Engineering Teams',
    topics: [
      {
        id: 'top_onboarding_long',
        name: 'Onboarding Experience for New Hires in High-Growth Product Teams Across Regional Offices',
        subTopics: [
          { id: 'sub_first_week_buddy', name: 'First-week buddy' },
          { id: 'sub_manager_checkins', name: 'Manager check-ins' },
        ],
      },
    ],
  },
  {
    id: 'ind_energy',
    name: 'Energy',
    topics: [],
  },
]
