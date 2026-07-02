# PRD: Survey Builder Markers

Module: Lifecycle Surveys — Survey Creation
Route: Create Survey modal after choosing a non-custom template

## Problem this solves
HR Admins need to understand and control which markers, building blocks, and questions from a QuestionPro lifecycle template are included before opening the survey builder.

## Part A — Template Card Hover State + Preview

Update `src/components/modules/lifecycle/CreateSurveyModal.tsx`.

On the template grid in Step 1, every template card except "Custom study" gets a hover state that reveals two centered overlay buttons:

- `Use Template` — `WuButton` primary, small
- `Preview` — `WuButton` secondary, small

Hover behavior:

- Card gets a semi-transparent dark overlay.
- Two buttons appear centered on the card.
- Clicking `Use Template` selects the card and proceeds to Step 2 with pre-filled fields.
- Clicking `Preview` opens `TemplatePreviewModal`.
- `Custom study` has no hover overlay; clicking it anywhere selects it directly.

Create `src/components/modules/lifecycle/TemplatePreviewModal.tsx`.

The preview modal shows what the template survey looks like to an employee respondent.

Header:

- Title: `[Template Name] — Preview`
- Close button from WickUI modal behavior

Body:

- Scrollable content area
- Thin blue progress bar at the top of the body, static at about 30%
- Render 2–3 representative read-only sample questions for the template category
- Rating scale questions show the question text plus a 5-point scale row: Not at All / Rarely / Sometimes / Often / All the Time
- Radio buttons are display-only and unselectable

Footer:

- Left: `X Questions` using `mockSurveyTemplates.questionCount`
- Right: `Cancel` button (`WuButton` secondary/ghost-style) and `Use Template` primary button
- `Use Template` closes preview and proceeds to Step 2 with the template pre-filled

Named export: `export function TemplatePreviewModal()`.

## Part B — Marker & Building Block Selector

Add a new Step 3 in the modal flow only when the selected template is not `Custom study`.

Updated flow:

- Step 1: Choose Template
- Step 2: Name Your Survey
- Step 3: Marker & Building Block Selector — templates only

For `Custom study`, the flow remains two steps. The Step 2 `Create Survey` button creates the survey, closes the modal, and navigates to `/lifecycle/surveys/[id]/edit`.

For all other templates, Step 2 primary action says `Next` and proceeds to Step 3. The final `Create` button lives on Step 3.

Step 3 layout:

Breadcrumb at top of content:

`Choose a Study > [Template Name]`

Two-panel layout:

Left panel:

- About 200px wide
- List of marker names for the selected template
- Clicking a marker name shows its building blocks in the right panel
- Active marker has a blue left border
- All markers are selected by default, with checked state implied by selected building blocks/questions

Right panel:

- Header: selected marker name
- List of building blocks as accordion sections
- Section header contains checkbox, building block name, and chevron
- Building blocks are checked by default
- Expanded section shows individual question rows, each with checkbox and question text
- HR admins can uncheck building blocks or individual questions to exclude them

Mock data:

Update `src/types/index.ts` so `SurveyTemplate` includes:

```ts
questionCount: number
markers?: {
  id: ID
  name: string
  buildingBlocks: {
    id: ID
    name: string
    questions: string[]
  }[]
}[]
```

Update `src/data/mock/surveyTemplates.ts` to include markers and building blocks for each non-custom template. Workplace Culture must include the real marker names and Agility building block content from the product screenshot.

Step indicator:

- Template path shows three footer breadcrumb steps:
  `[Template Icon] Choose Template > [Settings Icon] Name Survey > [Grid Icon] Select Content`
- Custom path shows two footer breadcrumb steps:
  `[Template Icon] Choose Template > [Settings Icon] Name Survey`

Step 3 footer:

- Back button returns to Step 2
- Create button creates the survey in local state, closes the modal, navigates to `/lifecycle/surveys/[id]/edit`, and shows success toast: `Survey created. Opening builder...`

## Acceptance check

- Template cards show hover overlay with `Use Template` and `Preview`
- Preview modal opens with sample questions and progress bar
- `Use Template` in preview proceeds to Step 2 pre-filled
- Step 3 shows for all non-custom templates
- Left sidebar shows markers, clicking switches right panel
- Building blocks show as expandable accordion sections with checkboxes
- All items checked by default
- `Create` navigates to `/lifecycle/surveys/[id]/edit`
- Custom study path still works with two steps and navigates on Create
- `npx tsc --noEmit` passes with zero errors
