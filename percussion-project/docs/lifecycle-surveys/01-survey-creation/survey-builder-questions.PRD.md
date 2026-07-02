# PRD: Survey Builder Questions

Module: Lifecycle Surveys — Survey Creation
Route: `/lifecycle/surveys/[id]/edit`

## Problem this solves
HR Admins need a full-page survey builder canvas where they can edit lifecycle survey blocks, questions, and response displays after creating or opening a survey.

## Route & Page
Create `src/app/lifecycle/surveys/[id]/edit/page.tsx`.

This is a full-page editor with its own self-contained layout. It must not show the dashboard sidebar or topbar from `AppShell`.

- Add `'use client'`.
- Get survey id from `params`.
- Look up the survey using `getSurveyById(id)` from `@/lib/mockDb`.
- If the survey is not found, redirect to `/lifecycle/surveys`.

## Layout — 3 Zones

### Zone 1 — Top Navigation Bar
Dark navy background, full width.

Left side:

- `P` logo placeholder in a small blue square
- Breadcrumb: `New folks > [Survey title]`

Center tabs, underline style:

- Edit — active by default
- Distribute — placeholder, `console.log`
- Analytics — placeholder, `console.log`
- Manage Data — placeholder, `console.log`

Right side:

- `Tools ▾` dropdown placeholder
- `Responses: 0`
- `Preview` button (`WuButton` primary, small)

### Zone 2 — Second Toolbar
White background, bottom border, icon + label buttons.

Items:

- Workspace — active
- Design — placeholder
- Languages — placeholder
- Media Library — placeholder
- Completion — placeholder
- Settings — placeholder

Only Workspace shows the canvas.

### Zone 3 — Canvas
Gray-50 background, scrollable, center-aligned.

- Max width: 900px
- Center with auto margins
- Bottom padding: 80px

## Canvas Content

### Cover Block
White card, centered.

- Large QP logo placeholder: dark navy square about 120px, white `P`
- `QuestionPro` text in blue below the logo
- Three-dot menu in card top-right, placeholder

### Survey Blocks
Use `survey.markers` as blocks. If there are no markers, create one default `Block 1`.

Each block card:

- White rounded card with `shadow-sm`
- Header with collapse/expand chevron, block name, and three-dot placeholder menu
- Centered `Add Question` button with a caret/dropdown
- Dropdown options: `Add Question` and `Build with AI`

### Question Items
For each question in the block:

- Thin `+` hover line above the first question and between questions. Clicking logs `Add question at position X`.
- Question row with:
  - `Q1`, `Q2`, etc. in gray
  - Red asterisk for required questions
  - Editable question text. Clicking text turns it into inline input; blur saves local state.
  - Top-right placeholder links: `Validation`, `Logic`, `Settings`, `⋮`

Question type displays:

- `rating_scale`: matrix table with scale labels Not at All / Rarely / Sometimes / Often / All the Time. First row uses the question text plus 2–3 placeholder sub-questions. Cells are disabled radio buttons.
- `open_text`: gray textarea placeholder.
- `multiple_choice`: radio option list.
- `enps`: 0–10 scale buttons.

## Mock Data

When navigating to `/lifecycle/surveys/[id]/edit`, populate the canvas using the survey's markers and questions from `mockSurveys`.

If the survey has no questions yet, show one empty `Block 1` with the Add Question button and no questions.

For a Workplace Culture survey or survey created from that template, use the marker/question structure created in the template flow.

## Also Update

Update `src/app/lifecycle/surveys/page.tsx` so clicking a survey title navigates to `/lifecycle/surveys/[id]/edit`.

## Acceptance check

- Navigating to `/lifecycle/surveys/[id]/edit` loads the builder
- Dark nav bar with breadcrumb, center tabs, and right actions renders
- Second toolbar with icon+label buttons renders
- Cover block renders with QP logo placeholder
- At least one block renders with questions from mock data
- Empty survey shows one block with Add Question button
- Question text is inline-editable
- Add Question dropdown shows `Add Question` and `Build with AI`
- Clicking survey title in the survey list navigates to builder
- `npx tsc --noEmit` passes with zero errors
