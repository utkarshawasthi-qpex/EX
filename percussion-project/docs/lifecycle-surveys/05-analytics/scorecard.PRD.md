# PRD: Scorecard Widget

Module: Lifecycle Surveys — Analytics Dashboards
Route: Dashboard canvas widget (`scorecard` type)

## Problem this solves
HR Admins need a compact scorecard view of survey marker favorability, response counts, and period-over-period comparison at a glance.

## Data Source
Import `mockScorecardData` from `src/data/mock/analyticsData.ts`.

## Component
`src/components/modules/analytics/widgets/ScorecardWidget.tsx`

## Layout
- Widget card shell: white background, rounded corners, shadow-sm, 4px blue-600 left border
- Header: "Scorecard" title + survey name subtitle + ⋮ menu

## Table (custom HTML, not WuDataTable)
Columns: Key Metric | Respondents | Stacked bar (Unfavorable / Neutral / Favorable) | Mean | Comparison

Stacked bar: horizontal bar with red (unfavorable), yellow (neutral), green (favorable) segments with % labels below.

Column header labels with colored dots: Unfavorable ↕ | Neutral ↕ | Favorable ↕

Rows:
- "Company Overall": bold, no expand chevron, comparison shows "-"
- All other markers: ">" chevron on left (non-functional), comparison shows ▲ green or ▼ red + number when trend present

## Default Width
`full`

## Acceptance Check
- Stacked bars render with correct segment colors and percentages
- Company Overall row styled distinctly
- Comparison column shows trend indicators for marker rows
