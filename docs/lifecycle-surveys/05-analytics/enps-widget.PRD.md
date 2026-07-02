# PRD: eNPS Widget

Module: Lifecycle Surveys — Analytics Dashboards
Route: Dashboard canvas widget (`enps` type)

## Problem this solves
HR Admins need to visualize employee Net Promoter Score with detractor/passive/promoter breakdown and company benchmark comparison.

## Data Source
Import `mockENPSData` from `src/data/mock/analyticsData.ts`.

## Component
`src/components/modules/analytics/widgets/ENPSWidget.tsx`

## Layout
- Widget card shell with "eNPS" header + ⋮ menu
- Question text at top (italic, gray)

## Semicircle Gauge (SVG)
- Red zone: -100 to -33 (left)
- Yellow zone: -33 to +33 (middle)
- Green zone: +33 to +100 (right)
- Needle pointing to score (-66)
- Labels: -100 (far left), 0 (top), +100 (far right)
- Large score number below gauge center

## Right Side Stats
- Respondents count
- Company Overall score with ▼ delta in red

## Below Gauge
Three items in a row: Detractors 71% | Passives 24% | Promoters 5% (with emoji)

## Segment eNPS Section
Collapsible accordion, collapsed by default. When expanded shows "No segment data available".

## Default Width
`half`

## Acceptance Check
- Gauge needle points to -66
- Three color zones visible on semicircle
- Detractor/passive/promoter breakdown displayed
