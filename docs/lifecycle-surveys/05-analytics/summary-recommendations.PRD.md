# PRD: Summary & Recommendations Widget

**Module:** Lifecycle Surveys — Analytics  
**Routes:** Dashboard widget type `summary`, `/lifecycle/analytics/org-context`  
**Status:** Prototype (frontend-only, mock AI generation)

---

## Overview

The Summary & Recommendations widget generates an AI-powered narrative (WHAT / WHY / ACTIONS) from all data widgets on the current dashboard tab, combined with organization context. It supports configurable visibility and auto-generates when first placed on a tab.

**Prototype note:** Generation uses mock data and simulated delay — no live Anthropic API calls.

---

## Widget Creation Flow (Summary Only)

Summary widgets use a **2-step flow** after widget type selection (not the standard 4-step flow).

| Step | Label | Content |
|------|-------|---------|
| 1 | Widget | Select "Summary & Recommendations" |
| 2 | Settings | Name + description + purple info box |
| 3 | Visibility | Who can see the widget + data check |

**Breadcrumb:** `[Widget] > [Settings] > [Visibility]`

Steps Source and Columns set are **skipped** for summary widgets.

### Step 2 — Settings

- Name pre-filled: `Summary & Recommendations` (required, 0/100 counter)
- Description optional, placeholder: "Describe what this summary covers..."
- Purple info box explaining data source and auto-generation on placement

### Step 3 — Visibility

Three selectable cards:

1. **Everyone** (default) — all dashboard viewers
2. **Specific people** — user search + chip picker (min 1 user required)
3. **Based on filters** — department / location / job level multi-selects

**Data check (always visible):**

- **No data widgets:** amber warning; Create Widget disabled
- **Has data widgets:** green confirmation listing widget titles used for generation

On create:

- Width: always `full`
- `summaryConfig.isGenerating: true` triggers auto-generation
- Toast: "Summary widget added — generating insights..."

---

## Widget States

| State | Trigger | UI |
|-------|---------|-----|
| Generating | `isGenerating: true`, no content | Pulsing ✦, skeleton lines |
| No data | `generationError: 'no_data'` | Amber warning + CTA |
| API error | `generationError: 'api_error'` | Red error + Try Again (creator only) |
| Generated | `content` populated | WHAT / WHY / ACTIONS sections |

### Generated Content Layout

- **WHAT** — blue section, 3 bullets
- **WHY** — amber section, 3 bullets
- **ACTIONS** — green section, action cards with timeframe + owner chips + "Create Action Plan" link
- Footer timestamp; Refresh/Regenerate for creator only

---

## Visibility Model

```typescript
SummaryVisibilityMode = 'everyone' | 'custom_users' | 'filter_based'

SummaryVisibilityConfig = {
  mode: SummaryVisibilityMode
  customUserIds?: ID[]
  filters?: { departments?, locations?, jobLevels? }
}
```

Unauthorized users see **nothing** (`return null`).

---

## Caching

- Key: `pp_summary_{widgetId}` in `localStorage`
- Invalidated when `pp_org_context_version` changes
- Restored on mount before re-generating

---

## Organization Context

**Route:** `/lifecycle/analytics/org-context`  
**Nav:** Analytics Portal → DATA → Org Context

- Upload documents card (mock files)
- Text context textarea (2000 char limit)
- Save stores to `localStorage` `pp_org_context` and increments `pp_org_context_version`

---

## Acceptance Criteria

### Creation
- [ ] Summary uses 2-step flow (Settings + Visibility)
- [ ] Breadcrumb shows Widget → Settings → Visibility
- [ ] Name pre-filled; purple info box on Settings
- [ ] Visibility cards with custom user picker and filter selectors
- [ ] Create disabled when no data widgets on tab

### Rendering
- [ ] Generating, no-data, error, and generated states
- [ ] WHAT / WHY / ACTIONS sections with action plan links
- [ ] Regenerate confirmation for creator
- [ ] Visibility gate hides widget from unauthorized users

### Org Context
- [ ] Page loads; sidebar link present
- [ ] Save persists to localStorage with version bump

### Technical
- [ ] `npx tsc --noEmit` passes
