# PRD: Heatmap Widget

Module: Lifecycle Surveys — Analytics Dashboards
Route: Dashboard canvas widget (`heatmap` type)

## Problem this solves
HR Admins need to compare mean scores across job levels and markers in a color-coded heatmap grid.

## Data Source
Import `mockHeatmapData` from `src/data/mock/analyticsData.ts`.

## Component
`src/components/modules/analytics/widgets/HeatmapWidget.tsx`

## Layout
- Widget card shell with "Heatmap" title + survey name subtitle
- "Mean / Δ Delta" toggle buttons (Mean active by default; both show same data for now)
- Horizontally scrollable table

## Table Structure
- First column: "Metric" header + marker rows with ">" chevron (non-functional)
- Respondents row below header with counts per column
- Remaining columns: job levels from mock data

## Cell Coloring
- score >= 4: bg-green-100
- score = 3: bg-yellow-100
- score <= 2: bg-red-100
- Score number centered in cell

## Default Width
`half`

## Acceptance Check
- Yellow cells for score=3
- Horizontal scroll when columns overflow
- Mean/Delta toggle switches active state
