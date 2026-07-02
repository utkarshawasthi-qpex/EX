# PRD: Template Library

Module: Lifecycle Surveys — Survey Creation
Route: Modal/panel triggered from Create Survey Flow, Step 1 "Use a Template"

## Problem this solves
HR Admins want to launch common lifecycle surveys quickly using QuestionPro's real, branded template library instead of building from scratch every time.

## Scope note
This template picker is for Lifecycle Surveys ONLY. Empower 360 has its own separate Standard Assessment Library built in Phase 2. Do not include a "360°" template card here, even though the real product currently shows it in a merged picker. We are intentionally keeping Lifecycle and 360 template flows separate in this rebuild.

## 1. Mock Template Dataset
Create `src/data/mock/surveyTemplates.ts`.

Add this type to `src/types/index.ts` if not already present:

```ts
export type SurveyTemplate = {
  id: ID
  title: string
  provider: string
  description: string
  category: 'custom' | 'culture' | 'recruiting' | 'onboarding' | 'wellness' | 'exit' | 'engagement' | 'partner'
  surveyType: SurveyType
  isPartnerContent?: boolean
}
```

Export: `export const mockSurveyTemplates: SurveyTemplate[]`

Create exactly these 8 templates from the real QuestionPro EX template library:

1. "Custom study" — provider: "QuestionPro", category: `custom`, description: "Create a study tailored to your specific needs.", surveyType: `engagement`
2. "Workplace Culture" — provider: "QuestionPro", category: `culture`, description: "Enhance the most critical elements of your employee experience.", surveyType: `engagement`
3. "Recruiting Experience" — provider: "QuestionPro", category: `recruiting`, description: "Optimize your hiring process and make your employment brand shine.", surveyType: `engagement`
4. "On-boarding Experience" — provider: "QuestionPro", category: `onboarding`, description: "Show your people from the start that you value their feedback.", surveyType: `onboarding`
5. "Wellness & Wellbeing" — provider: "QuestionPro", category: `wellness`, description: "Continually check in that you are fostering the best culture and effective life balance.", surveyType: `pulse`
6. "Exit Experience" — provider: "QuestionPro", category: `exit`, description: "Why people are leaving and how you could offer a better experience for others to stay.", surveyType: `exit`
7. "Employee Experience" — provider: "QuestionPro", category: `engagement`, description: "Understand the key factors that determine how your employees experience work.", surveyType: `engagement`
8. "Market Responsiveness Index (MRI)" — provider: "MarketCulture", category: `partner`, isPartnerContent: true, description: "Bridge the gap between EX and CX with an assessment that delivers vital employee feedback to leadership.", surveyType: `engagement`

## 2. Modify CreateSurveyModal.tsx
Replace the existing Step 1 entirely.

The old "Start from Scratch" vs "Use a Template" card choice is gone. Step 1 becomes "Choose a Template" immediately. There is no separate method-choice screen; the template grid is Step 1, with "Custom study" as the first card representing the from-scratch option.

Step 1 instruction text: "Select one of our templates or start from scratch to create your study"

- Search input (`WuInput`) filters templates by title in real time and is placed above the grid.
- The "Choose Template" title, instruction text, and search input are sticky at the top of the modal content while the template grid scrolls underneath.
- Grid of template cards, 4 columns on desktop.
- Each card shows:
  - Provider logo placeholder: small colored square with first letter of provider (`P` for QuestionPro, `M` for MarketCulture), using a simple styled div rather than an image asset.
  - Provider name.
  - Template title.
  - Description truncated to 2 lines.
  - "Custom study" card shows a `+` icon instead of a provider logo.
  - Selecting a card highlights it with a border.

Footer:
- Next button (`WuButton` primary, disabled until a card is selected)
- No Back button on this step.

Step 2 — "Name Your Survey" remains from the previous implementation.

- Pre-fill survey name, type, and description based on selected template:
  - If "Custom study" selected: leave all fields blank.
  - If any other template selected: pre-fill name = template title, type = template.surveyType, description = template.description.
- User can still edit all fields.
- Back button returns to Step 1, preserving selection.
- Create Survey button creates the survey and closes modal as before.

## 3. Step indicator
Do not use `WuStepper` for this modal. `WuStepper` renders as a numeric increment/decrement control, which is not the product pattern for multi-step modal flows.

Use a custom breadcrumb-style step indicator in the modal footer bar:

`[Template Icon] Choose Template  >  [Settings Icon] Name Your Survey`

- Use Wick UI icon CSS classes from `@npm-questionpro/wick-ui-icon/dist/wu-icon.css`.
- Use `wc-templates` for "Choose Template" and `wc-settings` for "Name Your Survey" when available.
- Current/active step uses `text-blue-600`.
- Completed steps use blue text with a checkmark icon or blue text.
- Upcoming steps use `text-gray-400`.
- Step segments are display-only and not clickable.
- On Step 1, the footer shows the breadcrumb on the left and only the primary `Next` button on the right.
- On Step 2, the footer shows the breadcrumb on the left, with `Back` as a secondary button beside the primary `Create Survey` button on the right.

## 4. Cleanup
Remove now-unused code from the previous "Choose Method" step implementation, including the two large method-choice cards and unused state/types related to the old flow.

## Acceptance check
- Modal opens directly to the template grid with no method-choice step.
- All 8 templates render with correct provider, title, description.
- Search filters the grid in real time.
- Title, instruction text, and search remain sticky while the template grid scrolls.
- No numeric `- 1 +` stepper control is visible.
- Step indicator is a horizontal footer breadcrumb with icon, label, chevron separator, and active step in blue.
- Selecting "Custom study" -> Name Your Survey step is blank.
- Selecting any other template -> Name Your Survey step is pre-filled.
- Creating a survey from a template adds it to the table with the correct type.
- Back button from step 2 returns to step 1 with prior selection still highlighted.
- `npx tsc --noEmit` — zero errors.
