import type { SurveyTemplate } from '@/types'

const workplaceCultureMarkers: NonNullable<SurveyTemplate['markers']> = [
  {
    id: 'marker_workplace_agility',
    name: 'Agility',
    buildingBlocks: [
      {
        id: 'bb_agility_managing_change',
        name: 'Managing Change',
        questions: [
          'We can maintain quality and still move quickly',
          'We embrace change as an organization.',
        ],
      },
      {
        id: 'bb_agility_streamlining_workflow',
        name: 'Streamlining Workflow',
        questions: [
          'Work is shared based not on who owns it, but rather on who is in the best position to get it done.',
          "People can make decisions and solve problems around here even if they aren't in charge.",
        ],
      },
      {
        id: 'bb_agility_distributing_authority',
        name: 'Distributing Authority',
        questions: [
          'Knowledge and expertise matter more than title or tenure around here.',
          'The senior level gets out of the way so more can get done.',
        ],
      },
      {
        id: 'bb_agility_removing_obstacles',
        name: 'Removing Obstacles',
        questions: [
          'If a process, procedure, approach is not working, we can correct it with ease.',
          "We eliminate activity that doesn't move us towards our goal.",
        ],
      },
    ],
  },
  {
    id: 'marker_workplace_collaboration',
    name: 'Collaboration',
    buildingBlocks: [
      {
        id: 'bb_collaboration_teamwork',
        name: 'Teamwork',
        questions: ['Teams share information openly.', 'People work across functions to solve problems.'],
      },
      {
        id: 'bb_collaboration_shared_accountability',
        name: 'Shared Accountability',
        questions: ['Teams own outcomes together.', 'People help one another meet commitments.'],
      },
    ],
  },
  {
    id: 'marker_workplace_growth',
    name: 'Growth',
    buildingBlocks: [
      {
        id: 'bb_growth_career_paths',
        name: 'Career Paths',
        questions: ['I understand how I can grow here.', 'Managers support meaningful career conversations.'],
      },
      {
        id: 'bb_growth_learning',
        name: 'Learning Opportunities',
        questions: ['I have access to learning that helps me improve.', 'Mistakes are treated as opportunities to learn.'],
      },
    ],
  },
  {
    id: 'marker_workplace_inclusion',
    name: 'Inclusion',
    buildingBlocks: [
      {
        id: 'bb_inclusion_belonging',
        name: 'Belonging',
        questions: ['I feel like I belong on my team.', 'Different perspectives are welcomed here.'],
      },
      {
        id: 'bb_inclusion_voice',
        name: 'Employee Voice',
        questions: ['People can speak up without fear.', 'Leaders listen to employee feedback.'],
      },
    ],
  },
  {
    id: 'marker_workplace_innovation',
    name: 'Innovation',
    buildingBlocks: [
      {
        id: 'bb_innovation_experimentation',
        name: 'Experimentation',
        questions: ['We are encouraged to try new approaches.', 'Good ideas can come from anywhere in the organization.'],
      },
      {
        id: 'bb_innovation_customer_focus',
        name: 'Customer Focus',
        questions: ['Customer needs shape how we improve.', 'We connect employee ideas to customer impact.'],
      },
    ],
  },
  {
    id: 'marker_workplace_solutions',
    name: 'Solutions',
    buildingBlocks: [
      {
        id: 'bb_solutions_problem_solving',
        name: 'Problem Solving',
        questions: ['Teams focus on solving root causes.', 'People have the information needed to solve problems.'],
      },
      {
        id: 'bb_solutions_follow_through',
        name: 'Follow Through',
        questions: ['Decisions turn into action quickly.', 'We follow up on the issues employees raise.'],
      },
    ],
  },
  {
    id: 'marker_workplace_technologies',
    name: 'Technologies',
    buildingBlocks: [
      {
        id: 'bb_technologies_tools',
        name: 'Tools and Systems',
        questions: ['I have the tools needed to do my job well.', 'Our systems help me work efficiently.'],
      },
      {
        id: 'bb_technologies_enablement',
        name: 'Digital Enablement',
        questions: ['Technology reduces unnecessary manual work.', 'I can get support when tools are not working.'],
      },
    ],
  },
  {
    id: 'marker_workplace_transparency',
    name: 'Transparency',
    buildingBlocks: [
      {
        id: 'bb_transparency_communication',
        name: 'Communication',
        questions: ['Leaders communicate changes clearly.', 'I understand why important decisions are made.'],
      },
      {
        id: 'bb_transparency_trust',
        name: 'Trust',
        questions: ['Leaders are honest about challenges.', 'I trust information shared by leadership.'],
      },
    ],
  },
  {
    id: 'marker_workplace_engagement',
    name: 'Engagement',
    buildingBlocks: [
      {
        id: 'bb_engagement_motivation',
        name: 'Motivation',
        questions: ['I feel motivated to contribute my best work.', 'My work gives me a sense of accomplishment.'],
      },
      {
        id: 'bb_engagement_recognition',
        name: 'Recognition',
        questions: ['Good work is recognized here.', 'Recognition feels meaningful and timely.'],
      },
    ],
  },
]

const recruitingMarkers: NonNullable<SurveyTemplate['markers']> = [
  {
    id: 'marker_recruiting_application',
    name: 'Application Experience',
    buildingBlocks: [
      { id: 'bb_recruiting_clarity', name: 'Role Clarity', questions: ['The role expectations were clear.', 'The job description matched the interview conversations.'] },
      { id: 'bb_recruiting_process', name: 'Process Ease', questions: ['The application process was easy to complete.', 'I knew what to expect at each step.'] },
    ],
  },
  {
    id: 'marker_recruiting_interview',
    name: 'Interview Experience',
    buildingBlocks: [
      { id: 'bb_recruiting_respect', name: 'Candidate Respect', questions: ['Interviewers treated me with respect.', 'My time was valued during the process.'] },
      { id: 'bb_recruiting_feedback', name: 'Communication', questions: ['Communication was timely.', 'I received useful updates after interviews.'] },
    ],
  },
]

const onboardingMarkers: NonNullable<SurveyTemplate['markers']> = [
  {
    id: 'marker_onboarding_role',
    name: 'Role Clarity',
    buildingBlocks: [
      { id: 'bb_onboarding_expectations', name: 'Expectations', questions: ['I understand what is expected of me.', 'My first priorities were clear.'] },
      { id: 'bb_onboarding_resources', name: 'Resources', questions: ['I have the tools I need.', 'I know where to find help when I need it.'] },
    ],
  },
  {
    id: 'marker_onboarding_connection',
    name: 'Connection',
    buildingBlocks: [
      { id: 'bb_onboarding_manager', name: 'Manager Support', questions: ['My manager checks in regularly.', 'My manager helps remove obstacles.'] },
      { id: 'bb_onboarding_team', name: 'Team Belonging', questions: ['I feel welcomed by my team.', 'I understand how my work supports the team.'] },
    ],
  },
]

const wellbeingMarkers: NonNullable<SurveyTemplate['markers']> = [
  {
    id: 'marker_wellbeing_balance',
    name: 'Balance',
    buildingBlocks: [
      { id: 'bb_wellbeing_workload', name: 'Workload', questions: ['My workload is manageable.', 'Priorities are clear enough to focus my time.'] },
      { id: 'bb_wellbeing_flexibility', name: 'Flexibility', questions: ['I have flexibility when I need it.', 'My team respects boundaries outside work.'] },
    ],
  },
  {
    id: 'marker_wellbeing_support',
    name: 'Support',
    buildingBlocks: [
      { id: 'bb_wellbeing_safety', name: 'Psychological Safety', questions: ['I can ask for help without judgment.', 'My manager supports my wellbeing.'] },
      { id: 'bb_wellbeing_resources', name: 'Wellbeing Resources', questions: ['I know what wellbeing resources are available.', 'Wellbeing resources are easy to access.'] },
    ],
  },
]

const exitMarkers: NonNullable<SurveyTemplate['markers']> = [
  {
    id: 'marker_exit_experience',
    name: 'Employee Experience',
    buildingBlocks: [
      { id: 'bb_exit_manager', name: 'Manager Relationship', questions: ['My manager supported my success.', 'Feedback from my manager was useful.'] },
      { id: 'bb_exit_growth', name: 'Growth and Opportunity', questions: ['I had opportunities to grow here.', 'Career paths were clear enough for me.'] },
    ],
  },
  {
    id: 'marker_exit_decision',
    name: 'Decision Drivers',
    buildingBlocks: [
      { id: 'bb_exit_reason', name: 'Reason for Leaving', questions: ['My reasons for leaving were understood.', 'The organization could have taken action earlier.'] },
      { id: 'bb_exit_recommendation', name: 'Advocacy', questions: ['I would recommend this organization as a place to work.', 'I would consider returning in the future.'] },
    ],
  },
]

const employeeExperienceMarkers: NonNullable<SurveyTemplate['markers']> = [
  {
    id: 'marker_ex_engagement',
    name: 'Engagement',
    buildingBlocks: [
      { id: 'bb_ex_purpose', name: 'Purpose', questions: ['My work is meaningful to me.', 'I understand how my work supports company goals.'] },
      { id: 'bb_ex_motivation', name: 'Motivation', questions: ['I am motivated to do my best work.', 'I feel proud to work here.'] },
    ],
  },
  {
    id: 'marker_ex_enablement',
    name: 'Enablement',
    buildingBlocks: [
      { id: 'bb_ex_tools', name: 'Tools', questions: ['I have the resources needed to succeed.', 'Processes help me work efficiently.'] },
      { id: 'bb_ex_support', name: 'Support', questions: ['My manager supports my success.', 'Teams cooperate effectively.'] },
    ],
  },
  {
    id: 'marker_ex_growth',
    name: 'Growth',
    buildingBlocks: [
      { id: 'bb_ex_learning', name: 'Learning', questions: ['I can build skills that matter here.', 'Learning opportunities are available to me.'] },
      { id: 'bb_ex_future', name: 'Future Intent', questions: ['I see a future for myself here.', 'This organization helps me grow my career.'] },
    ],
  },
]

const mriMarkers: NonNullable<SurveyTemplate['markers']> = [
  {
    id: 'marker_mri_market_focus',
    name: 'Market Focus',
    buildingBlocks: [
      { id: 'bb_mri_customer_signal', name: 'Customer Signal', questions: ['Customer feedback is shared with employees.', 'Teams understand what customers value most.'] },
      { id: 'bb_mri_competitive_awareness', name: 'Competitive Awareness', questions: ['We understand changes in our market.', 'Teams respond quickly to competitive threats.'] },
    ],
  },
  {
    id: 'marker_mri_responsiveness',
    name: 'Responsiveness',
    buildingBlocks: [
      { id: 'bb_mri_action', name: 'Action Orientation', questions: ['Customer insights lead to action.', 'Teams adjust quickly when customer needs change.'] },
      { id: 'bb_mri_alignment', name: 'Leadership Alignment', questions: ['Leaders connect EX improvements to customer outcomes.', 'Teams have clear priorities for market responsiveness.'] },
    ],
  },
]

export const mockSurveyTemplates: SurveyTemplate[] = [
  {
    id: 'tmpl_custom_study',
    title: 'Custom study',
    provider: 'QuestionPro',
    description: 'Create a study tailored to your specific needs.',
    category: 'custom',
    surveyType: 'engagement',
    questionCount: 0,
  },
  {
    id: 'tmpl_workplace_culture',
    title: 'Workplace Culture',
    provider: 'QuestionPro',
    description: 'Enhance the most critical elements of your employee experience.',
    category: 'culture',
    surveyType: 'engagement',
    questionCount: 40,
    markers: workplaceCultureMarkers,
  },
  {
    id: 'tmpl_recruiting_experience',
    title: 'Recruiting Experience',
    provider: 'QuestionPro',
    description: 'Optimize your hiring process and make your employment brand shine.',
    category: 'recruiting',
    surveyType: 'engagement',
    questionCount: 8,
    markers: recruitingMarkers,
  },
  {
    id: 'tmpl_onboarding_experience',
    title: 'On-boarding Experience',
    provider: 'QuestionPro',
    description: 'Show your people from the start that you value their feedback.',
    category: 'onboarding',
    surveyType: 'onboarding',
    questionCount: 8,
    markers: onboardingMarkers,
  },
  {
    id: 'tmpl_wellness_wellbeing',
    title: 'Wellness & Wellbeing',
    provider: 'QuestionPro',
    description:
      'Continually check in that you are fostering the best culture and effective life balance.',
    category: 'wellness',
    surveyType: 'pulse',
    questionCount: 8,
    markers: wellbeingMarkers,
  },
  {
    id: 'tmpl_exit_experience',
    title: 'Exit Experience',
    provider: 'QuestionPro',
    description:
      'Why people are leaving and how you could offer a better experience for others to stay.',
    category: 'exit',
    surveyType: 'exit',
    questionCount: 8,
    markers: exitMarkers,
  },
  {
    id: 'tmpl_employee_experience',
    title: 'Employee Experience',
    provider: 'QuestionPro',
    description: 'Understand the key factors that determine how your employees experience work.',
    category: 'engagement',
    surveyType: 'engagement',
    questionCount: 12,
    markers: employeeExperienceMarkers,
  },
  {
    id: 'tmpl_market_responsiveness_index',
    title: 'Market Responsiveness Index (MRI)',
    provider: 'MarketCulture',
    description:
      'Bridge the gap between EX and CX with an assessment that delivers vital employee feedback to leadership.',
    category: 'partner',
    surveyType: 'engagement',
    questionCount: 8,
    isPartnerContent: true,
    markers: mriMarkers,
  },
]
