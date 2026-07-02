# PRD: Tab-Level PPT Export With Widget Selection

## Problem Statement

Dashboard viewers need to export a curated PowerPoint deck from a single analytics dashboard tab without exporting every widget or manually recreating charts in presentation software.

## Outcome

Reduce the time from dashboard review to stakeholder-ready presentation by allowing users to select widgets, apply the active PPT template, and download a deck in one workflow.

## Scope

- Export one active dashboard tab at a time.
- Select individual widgets to include.
- Use the active PPT export template.
- Generate cover, widget slides, and closing slide.
- Manage PPT templates in Analytics Portal settings.

## User Flow

1. User opens a dashboard tab.
2. User clicks the download icon in the dashboard header.
3. Export modal opens with the active template and all tab widgets selected.
4. User optionally changes template for this export only.
5. User selects or deselects widgets.
6. User clicks Export PPT.
7. A `.pptx` downloads with cover, selected widget slides, and closing slide.

## Template Management

Analytics settings includes `/lifecycle/analytics/settings` for PPT Export Templates.

Templates include:
- Theme color
- Confidentiality label
- Cover slide text and font settings
- Widget slide header settings
- Closing slide text and font settings

Templates are stored in `localStorage` key `pp_ppt_templates` for prototype persistence.

## Export Rules

- Cover slide uses template theme color and includes filters when present.
- Widget slides use a colored header, footer metadata, dashboard/tab/survey context, and mock analytics data.
- Closing slide uses configured closing text.
- Export filename includes dashboard name, tab name, and export timestamp.

## Acceptance Criteria

- Download icon opens export modal.
- Active template is shown with a Change link.
- Widget checklist defaults to all selected.
- Select all and Deselect all update selection state.
- Export button is disabled when no widgets are selected.
- Export creates cover + selected widget slides + closing slide.
- `/lifecycle/analytics/settings` loads template management.
- Set Active makes exactly one template active.
- Admin sees New/Edit/Delete controls.
- `npx tsc --noEmit` passes.
# ppt-export.PRD.md — Placeholder. PRD to be written.
