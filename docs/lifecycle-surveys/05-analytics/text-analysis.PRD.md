# PRD: Text analysis

Module: Lifecycle Surveys — Analytics Dashboards  
Route: Dashboard canvas widget (`text_analysis`)  
Catalog title: **Text analysis**  
Catalog description: Use AI to classify open ended questions

---

## One-sentence summary

Text analysis turns free-text survey answers into a ranked list of topics so people leaders can see **what employees are talking about**, **how often**, and **how they feel about it**, then read the actual comments behind any bar.

---

## Why this widget exists

Closed-ended scores (scorecard, eNPS, heatmap) tell you *how well* something is going. They do not tell you *why*.

Open-ended questions are where employees name the real issues — unclear direction, meeting load, pay, tools — but a raw dump of hundreds of comments is unreadable. HR Admins and people leaders need a structured view of that text so they can:

1. See the themes that come up most often.
2. Judge whether a theme is mostly a complaint, mixed, or a strength.
3. Drill from a theme into the verbatim comments that created it.
4. Take action from evidence, not from one anecdote.

This widget is the dashboard’s answer to that job. Sentiment is **not a second widget**. It is a display mode of Text analysis, controlled by **Show sentiment**.

---

## Who it is for

| Role | What they use it for |
|---|---|
| HR Admin / People Analytics | Spot recurring themes after a pulse, engagement, onboarding, or exit survey |
| People leader reading a shared dashboard | Understand what their population is saying, then open comments |
| Action planning | Pick a high-volume or highly negative theme as the starting point for an initiative |

Primary user of the dashboard remains the HR Admin. Employees do not see this widget while taking a survey.

---

## What it is (and is not)

**It is:** one dashboard widget, bound to **one open-ended question**, that classifies responses into topics and optional sub-topics.

**It is not:**

- **Text report** — that widget lists verbatim comments with attribution. It does not classify themes.
- **Scorecard sentiment bars** — those are favorability splits on *closed-ended* marker scores (Unfavorable / Neutral / Favorable). Text analysis sentiment is Negative / Neutral / Positive on *open text*.
- A word cloud. Themes are a ranked hierarchy, not a cloud of words.
- A separate “Sentiment analysis” widget. Older product lists mentioned Sentiment as its own catalog item. In this prototype, sentiment lives inside Text analysis.

---

## Problem this solves

HR Admins need to go from “we collected 368 comments” to “Leadership Communication is the top theme (42 mentions), mostly negative, and here are the comments about Unclear direction.”

---

## Data the widget shows

Prototype data: `mockTextAnalysisData` and `mockTextAnalysisComments` in `src/data/mock/analyticsData.ts`.  
Component: `src/components/modules/analytics/widgets/TextAnalysisWidget.tsx`.

Above the topic list, the widget shows two totals:

- **Total comments** — number of open-ended responses classified for this question
- **Topics identified** — number of topics with at least one mention

Dashboard filters scale the comment total the same way they scale mention counts. Topics with zero mentions after filtering drop out of **Topics identified**.

Each **topic** has:

- Name (e.g. Leadership Communication, Work-Life Balance, Compensation)
- Mention count — number of responses that include this topic
- Sentiment mix — counts of Negative, Neutral, and Positive among those mentions
- Optional **sub-topics** (e.g. Unclear direction, Delayed decisions, Town halls)

Mention count for a topic equals the sum of its sentiment mix. When sub-topics exist, the topic’s mentions are the union of its sub-topics.

Each **comment** has:

- Parent topic (and sub-topic when applicable)
- Sentiment (negative / neutral / positive)
- Full response text
- A highlight phrase — the part of the comment that maps to the topic or sub-topic

Topics are sorted by mention count, highest first. Long topic names truncate in the row and show in full on hover.

Dashboard filters scale mention and sentiment counts the same way other widgets shrink when a population is filtered. Below the anonymity threshold, `FilteredWidgetGuard` hides the content.

---

## Display modes

Configured at widget create/edit time with **Show sentiment** (on by default).

### Text analysis (Show sentiment off)

Use this when the question is “what are people talking about?”

- Each topic is a row: name on the left, a horizontal bar on the right.
- Bar length is proportional to mentions versus the largest topic.
- The mention count sits on the bar.
- A light track behind the bar makes shorter topics comparable.
- Sub-topics use the same pattern, indented under the parent.

This is the “key themes” view: volume first.

### Text analysis with sentiment (Show sentiment on)

Use this when the question is “are they talking about this as a problem or a strength?”

- Every topic and sub-topic uses the **same bar width**.
- The bar is split into three colors: Negative (red), Neutral (amber), Positive (green).
- Segment width is proportional to that sentiment’s share of the row.
- Each segment shows its response count. The total mention count sits at the end of the bar.
- A legend at the top explains the three colors.
- If a sentiment has zero responses, that color is omitted from the bar.

Equal-width bars keep the eye on mix, not volume. Volume is still readable from the total at the end of the row.

---

## Hierarchy

Topics with sub-topics have a chevron. Expanding a topic reveals its sub-topics without leaving the widget.

- Chevron expands or collapses. It does not open comments.
- Clicking the topic name or anywhere on the bar opens comments.
- Sub-topic names are visually lighter than parent topics.
- A topic with no sub-topics (e.g. Benefits) has no chevron.

---

## Reading comments

Clicking a topic name or its bar opens a modal titled with that topic or sub-topic.

**Always:**

- The modal lists the actual responses that contributed to that row.
- The relevant topic/sub-topic phrase is highlighted in the comment text.

**When Show sentiment is on:**

- The modal opens on **All** comments for that row, regardless of where on the bar the user clicked.
- Pills at the top switch the list: **All**, **Negative**, **Neutral**, **Positive**, each with a count.
- Every comment also shows its own sentiment label.
- Switching pills filters the list in place. The user does not need to close the modal and click a different color.

**When Show sentiment is off:**

- The modal is a single list of all comments for that row. There are no sentiment pills.

Close returns to the widget.

---

## Creating the widget

Add widget → **Text analysis**.

| Step | What the user does |
|---|---|
| Widget | Choose Text analysis |
| Settings | Name and description |
| Source | Pick one survey and deployment, then **one question** (single-select radios). Label is **Question**, not a multi-select list. |
| Columns set | Confirms **Questions to analyse**. Toggle **Show sentiment** (defaults on). There is **no Widget size** control. |

New Text analysis widgets are placed full width. Users can still resize on the canvas.

---

## Why these design choices

| Choice | Reason |
|---|---|
| Ranked bars, not a word cloud | Leaders compare volume. A ranked list answers “what came up most?” in one glance. |
| Topics then sub-topics | A theme like Leadership Communication is too broad to act on. Sub-topics (Unclear direction, Town halls) are closer to an action. |
| Sentiment as a toggle, not a second widget | Same themes, two questions: volume vs mix. Splitting them would duplicate the catalog and the source question. |
| Equal-width sentiment bars | If bars also scaled by volume, a small-but-toxic theme would look unimportant. Mix is the job of this mode; total count still sits at the end. |
| Whole-bar click + in-modal filters | Clicking a color used to trap the user in one sentiment. Opening All, then switching, matches how people actually read comments. |
| One question per widget | Classification is per question. Mixing several open-enders into one theme list would hide which prompt produced the comment. |

---

## Default layout

Full width, 9 grid rows (`w: 12`, `h: 9`) so the totals row and topic list fit without clipping.

---

## Related widgets

| Widget | Relationship |
|---|---|
| Text report | Same source type (open text). Report shows raw quotes; Text analysis shows classified themes. |
| Summary & Recommendations | May cite themes at a narrative level. Text analysis is the inspectable evidence underneath. |
| Scorecard | Closed-ended marker scores. Complementary, not a substitute for comments. |

---

## Prototype notes

- Theme classification and sentiment labels are mocked. There is no live NLP service in this prototype.
- Comment text is generated from templates so lists are long enough to demo scrolling and highlighting. Real comments would be unique.
- Widget title in the catalog is **Text analysis** even when Show sentiment is on.
- `PRD.md` (EX-04) still describes an older concept: a word cloud plus a separate Sentiment catalog item. This document is the source of truth for the current widget.

---

## Acceptance check

- Widget header shows **Total comments** and **Topics identified** above the topic list.
- Topics sort by mention count; at least one topic has sub-topics and one does not.
- Show sentiment off: proportional volume bars with counts on the bar; click opens all comments with highlighting.
- Show sentiment on: equal-width three-color bars, segment counts, total at the end; click opens All comments; pills filter Negative / Neutral / Positive without closing the modal.
- Chevron expands sub-topics; bar/name click does not toggle expand.
- Create flow: question is single-select; Widget size is not shown; Show sentiment is present and defaults on.
