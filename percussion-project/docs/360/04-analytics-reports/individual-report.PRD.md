# PRD: Individual Report (360) — Phase 1

Module: 360 — Analytics & Reports
Route: `/360/reports` → `/360/reports/[surveyId]` (Report Builder) → `/360/reports/[surveyId]/preview`
Primary user: HR Business Partner / 360 program admin

## Problem this solves

The individual 360 PDF is produced from a fixed, page-based layout that assumes the Priority Model
(OPTM) is the baseline. Three things break as a result:

- **Structural integrity.** A block with no data for a subject still renders its page frame, so
  reports contain blank pages. Partial data leaves empty columns. Block names such as "OPTM All
  Items" mean nothing to the reader. Comments from several open-ended questions are merged into one
  undifferentiated wall of text.
- **Scoring.** Every relationship contributes equally regardless of organizational philosophy. There
  is no composite score per subject, so a manager holding ten reports cannot compare them at a
  glance, and there is no organization-defined way to say whether a score is "Excellent" or "Needs
  Improvement".
- **Actionability.** Without a synthesized development plan, a summary page, or an overall score,
  the report is a data dump. Subjects receive raw comments with no guidance on what to do first.

## Goals

- Never print a page with nothing on it.
- Let the admin name every block in their own language, with methodology-agnostic defaults.
- Attribute every comment to the question it answers.
- Make the cover page presentable to an executive audience without design help.
- Weight relationship groups so scores reflect the organization's hierarchy.
- Produce one composite score per subject plus an organization-defined performance category.
- Turn qualitative feedback into prioritized, grounded recommendations.

## Non-goals (Phase 1)

- Benchmarking a subject against company or department averages (Phase 3; the Benchmark section in
  the builder states this).
- Comparative or cohort reports across subjects.
- Rich-text/WYSIWYG editing inside blocks.
- Real PDF generation. Preview is the deliverable; Download is a prototype action.

## Terminology

- **Block** — One configurable unit of the report. Most blocks produce one page; some produce
  several.
- **Master Design** — The locked, always-on block holding page-level settings: fonts, header and
  footer, global relationship weights, performance categories, and rendering rules.
- **Relationship** — Self, Manager, Direct Report, Peer, External.
- **Column** — What a relationship becomes in the rendered report. A relationship with no responses
  produces no column; relationships below the confidentiality threshold are merged into a single
  **Combined others** column.
- **Scored block** — A block where a mean is calculated, and therefore where relationship weighting
  applies.
- **Overall score** — One composite percentage per subject, rolled up from the blocks marked
  "Include in Overall Score".
- **Performance category** — An admin-defined band (label, range, color) applied to the overall
  score.

## Where it lives

```text
/360/reports                          list of 360 programs
        ↓
/360/reports/[surveyId]               Report Builder — configure blocks
        ↓
/360/reports/[surveyId]/preview       Individual Report preview, per subject
```

## Block library

Blocks are renamed to be methodology-agnostic. Admin-set custom names always take priority over the
default.

| Old name | New default name |
| --- | --- |
| All Items Block | Competency Detail View |
| Overall Data Block | Top Behaviors Summary |
| Ranking Relationship Block | Relationship Breakdown |
| Action Plan Block | Development Action Plan |
| Details of Development Results | Priority Comments & Evidence |
| Nominated Raters Block | Evaluator Roster |
| Survey Respondents Block | Response Summary |
| Priority Areas of Development Block | Key Development Areas |
| Priority Areas of Development - Survey Block | Competency Priority Index |
| Ranking by Behavior Block | Strength & Growth Indicators |
| Presentation Text Block | Custom Content Block |
| Spider Chart Block | Spider / Radar Chart |

Unchanged blocks: Master Design Settings, Cover Page, Introduction, Executive Summary, Gap Analysis,
Performance Trend, AI Action Recommendations.

### Master Design settings

Master Design is locked and always on. Its setup is consistent across every page of the report.

- **Header & footer** — Report Logo, Page Number, Left Header Logo, Right Header Logo, Left Header
  Text, Footer Text. Logos accept PNG and JPEG only.
- **Typography & color** — Theme Color (page headings and accents), Font Family, Font Color, Page
  Size.
- **Table styling** — Table Heading Text Color, Table Background 1 (odd rows), Table Background 2
  (even rows), Table Border. These apply to every table in the report.
- **Relationships** — Relationship Icons (an editable letter and color per relationship; the color
  is also used for that relationship in every chart and table) and Relationship Weight
  Configuration.
- **Category headers** — Show Category Headers groups behaviors by competency inside the Competency
  Detail table; Category Header Title labels each group row.
- **Scoring** — Exclude Self in Average Score removes the self rating from every calculated mean.
  Exclude Self in Priority Score removes it from the priority index and Key Development Areas only.
  Performance categories are defined here.
- **Content rendering** — Skip Empty Blocks and Minimum Raters Per Group.

### Presets

Because the report must not assume a single methodology, the builder offers three starting points
that enable different slices of the same block library:

- **Traditional 360** — scores by relationship, gap analysis, verbatim comments.
- **Competency 360** — competency depth, executive summary, development planning.
- **Agile Lightweight** — a short report focused on what to do next.

## REQ-01 — Dynamic content rendering, no blank pages

Before a block renders, a data availability check runs against that block's data source for that
subject. A block with nothing to show is removed from the report rather than producing an empty page
frame. Blocks with all-zero scores are **not** skipped — zero is data.

Partial data renders cleanly: a relationship with no responses produces no column in any table or
chart, rather than a column of dashes.

Master Design carries a **Skip blocks with no data for a subject** toggle. When it is off, the block
renders with an inline explanation instead of being dropped.

Acceptance criteria:

- No blank pages when a block has zero data for a subject.
- Partial data renders cleanly; empty columns are not shown.
- Blocks with all-zero scores are not skipped.
- The preview shows a per-subject log of skipped blocks with the reason for each.

## REQ-02 — Renamed, methodology-agnostic block labels

Each block's name is editable in Report Builder → [Block] → General → Title. The admin-set title
overrides the default in both the builder and the report. A **Reset to Default Name** link appears
whenever the title differs from the default and restores it.

Acceptance criteria:

- Block name editable per block; the custom name is used in the builder and the rendered report.
- "Reset to Default Name" restores the new default at any time.
- Existing templates pick up the new default names on next load.
- Previously customized names are preserved — custom always beats default.

## REQ-03 — Per-question comment attribution

Priority Comments & Evidence can pull from several open-ended questions. Comments are grouped under
the exact question text they answer. When a question's comments run past a page break, the header
repeats with "(continued)" appended.

Settings:

- **Questions** — multi-select of the program's open-ended questions.
- **Display Mode** — Grouped by question (default) or Combined (Legacy). Hidden when only one
  question is selected.
- **Show relationship label on each comment** — on by default, subject to anonymity settings.

Acceptance criteria:

- Multi-question blocks group comments under their question text by default.
- Header text matches the question text exactly.
- Headers repeat with "(continued)" across page breaks.
- Single-question blocks are unaffected: no header, no regression.
- Combined (Legacy) mode remains available.
- Display Mode is hidden when the block has one question configured.

## REQ-04 — Cover page redesign

Three cover templates — Classic, Centered, Split — each with a configurable background color. The
template wraps around the existing cover text; all existing fields and options are preserved.

New toggles: Show Overall Score on Cover, Show Performance Category on Cover, Include Back Cover.

When the back cover is enabled: logo toggle, contact name, contact email, confidentiality note.

Merge variables, inserted through an **Insert Variable** dropdown:

- `${FIRST_NAME_SUBJECT}`, `${LAST_NAME_SUBJECT}`, `${DEPLOYMENT_DATE_MMM_DD_YYYY}` (existing)
- `${OVERALL_SCORE_PCT}`, `${PERFORMANCE_CATEGORY}`, `${EVALUATOR_COUNT}`, `${PROGRAM_NAME}` (new)

Acceptance criteria:

- All existing cover fields and merge variables continue to work.
- Insert Variable lists every available variable.
- Three templates selectable; the template wraps existing text content.
- Overall score badge appears only when its toggle is on.
- Back cover renders when enabled.
- Existing cover configurations migrate with no admin action and no data loss.
- `${OVERALL_SCORE_PCT}` and `${PERFORMANCE_CATEGORY}` render blank, not as error text, when their
  features are off.

## REQ-05 — Relationship weighting, global and per block

**Global.** Master Design carries the relationship weight configuration. These weights apply to
every block where a mean is calculated.

**Per block.** Every scored block has an "Override global relationship weights" toggle. When set,
the block-level weights replace the global weights for that block only.

Weighted mean excludes relationships with no responses from the denominator, which redistributes
their weight proportionally across the relationships that did respond.

Acceptance criteria:

- Global weights configurable; total must equal 100% before save.
- Save is disabled while any active weight set is not 100%.
- Weighted score formula applied across all scored blocks.
- Relationships with zero responses are excluded from the denominator automatically.
- Block-level override resolves ahead of the global setting.

## REQ-06 — AI action recommendations (QxBot)

Converts open-ended feedback into structured, prioritized recommendations grounded in actual
response themes.

Settings: data source, number of recommendations (1–5), sentiment summary bar, theme tags on cards,
reinforcement when feedback is all positive.

Each recommendation card carries a title, a theme tag, a body grounded in the response themes, and
numbered action steps.

Acceptance criteria:

- Recommendations are grounded in response themes, not generic.
- Minimum of 3 responses enforced; a clear message is shown below the threshold.
- Sentiment bar renders with accurate percentages.
- Cards render title, tag, body, and action steps.
- All-positive feedback produces reinforcement recommendations, not fabricated development areas.
- Block settings allow data source selection, recommendation count, and display toggles.
- Generation date is shown so stale output is visible.

## REQ-07 — Overall score and performance categories

One composite score per subject, expressed as a percentage, rolled up from the blocks marked
"Include in Overall Score" using that block's resolved weights. Ratings on the 1–5 scale are
normalized to 0–100.

Performance categories are defined in Master Design as bands of label, minimum, maximum, and color.
Defaults: Outstanding 85–100, Excellent 75–84, Strong 65–74, Developing 55–64, Needs attention 0–54.

Acceptance criteria:

- Overall score appears on the cover (when enabled), the executive summary, and the subject list.
- Category label and color resolve from the admin-defined bands.
- Changing weights changes the overall score.
- A subject with no ratings shows no score rather than a zero.

## REQ-08 — Executive summary

A single page a manager can read before a debrief: overall score ring in the category color, category
badge, response rate, top three strengths and top three development areas by weighted score, the
largest perception gap with its interpretation, and the evaluator count by reportable column.

## Confidentiality and gap interpretation

Two conventions from 360 practice are applied because the report is a development tool, not a
performance record:

- **Minimum raters per group** (default 3, configurable in Master Design). Groups below the
  threshold are merged into Combined others rather than shown separately, so an individual rater
  cannot be identified. Self and Manager are exempt because those roles are identified by design.
- **Gap significance** of 1.0 on the five-point scale. A self score a full point or more above
  others is labelled a **Blind spot**; others a full point or more above self is a **Hidden
  strength**; anything smaller reads as **Aligned**. Gap Analysis also presents a quadrant of
  confirmed strengths, development areas, blind spots, and hidden strengths.

## Prototype implementation

- Template state: `src/data/mock-360-reports.ts` defines the block library, defaults, presets, and
  subject data. `src/lib/report360Store.ts` persists per-survey templates in `localStorage` and
  migrates stored templates to the current shape on load.
- Scoring: `src/lib/report360Scoring.ts` is the single place scores are computed — weight
  resolution, column planning, weighted means, overall score, category resolution, gap
  classification, and the per-block data availability check.
- UI: `ReportBuilder.tsx` (configuration), `ReportPages.tsx` (page renderers), `ReportPreview.tsx`
  (subject selector, audience switcher, skipped-block log).
- Audience switching in preview uses each block's existing Subject / Manager / Admin visibility
  toggles.

## Acceptance checklist

- [ ] A subject with no Direct Report or External evaluators produces a report with no Direct Report
      or External columns anywhere.
- [ ] A subject with no open-ended responses produces no Priority Comments and no QxBot page, and
      both appear in the skipped-block log with a reason.
- [ ] A subject in their first cycle produces no Performance Trend page.
- [ ] A rater group below the threshold is reported as Combined others with an explanatory note.
- [ ] Renaming a block updates the builder and the rendered page; Reset to Default Name restores it.
- [ ] Comments appear under their question text, with "(continued)" on overflow.
- [ ] Save is disabled while weights do not total 100%.
- [ ] Changing global weights changes the overall score and the performance category.
- [ ] Cover templates, background color, score badge, and back cover all render as configured.
