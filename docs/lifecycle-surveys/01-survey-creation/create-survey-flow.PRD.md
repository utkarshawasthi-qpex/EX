# PRD: Create Survey Flow

Module: Lifecycle Surveys — Survey Creation
Route: Modal triggered from /lifecycle/surveys

## Problem this solves
HR Admins need a quick way to start a new survey — either from scratch or from a pre-built template.
This is the entry point to the survey builder.

## What to build

### 1. Update the Create Survey button
Update the "Create Survey" button on `/lifecycle/surveys/page.tsx` to open a `WuModal` instead of `console.log`.

### 2. Modal with WuStepper and two steps
The modal contains a `WuStepper` with 2 steps.

#### Step 1 — Choose Method
Two large selectable cards side by side:

Card A: "Start from Scratch"
- Icon from `@npm-questionpro/wick-ui-icon`
- Description: "Build your survey question by question"
- Clicking selects this card (highlight with border)

Card B: "Use a Template"
- Icon from `@npm-questionpro/wick-ui-icon`
- Description: "Start with a pre-built survey template"
- Clicking selects this card (highlight with border)

Footer:
- Cancel button (closes modal)
- Next button (`WuButton` primary, disabled until a card is selected)

#### Step 2 — Name Your Survey
- Survey name field (`WuFormGroup` + `WuInput`, required)
- Survey type select (`WuFormGroup` + `WuSelect`): Options: Onboarding, Exit, Pulse, Engagement
- Description textarea (`WuFormGroup` + `WuTextarea`, optional)

Footer:
- Back button (returns to Step 1)
- Create Survey button (`WuButton` primary):
  - Validates name is not empty
  - Adds new survey to local state in the surveys page with status: `draft` and current timestamp
  - Closes modal
  - Shows success toast

### 3. Template path placeholder
If user selected "Use a Template" in Step 1:
After modal closes, `console.log "Navigate to template library"`.
Template Library is built in the next task.

## Component
Create this as a component:
`src/components/modules/lifecycle/CreateSurveyModal.tsx`

Import and use it in:
`src/app/lifecycle/surveys/page.tsx`

`'use client'` on the modal component.
Named export: `export function CreateSurveyModal()`

## Acceptance check
- "Create Survey" button opens the modal
- Step 1 card selection works, Next disabled until selection made
- Step 2 form validation works
- New survey appears in table after creation
- Toast shows on success
- `npx tsc --noEmit` — zero errors
