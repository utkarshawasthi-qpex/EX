# PRD — QuestionPro EX Prototype
## Employee Experience · Empower · 360 Feedback

---

## Overview

**Product:** QuestionPro Employee Experience (EX)
**What it does:** A complete HR platform for running employee surveys, measuring engagement, managing action planning through Empower, and running 360-degree feedback assessments. Admins build and distribute surveys, analyze results through dashboards and analytics portals, manage employee rosters, and act on insights through initiatives and ideation.
**Primary users:** HR Administrators, People Managers, Organisation Admins, Employees (respondents)
**Prototype goal:** Build a fully navigable HTML/CSS/JS prototype covering all major screens across EX, Empower, and 360 Feedback. Every screen must be interconnected with working navigation. No backend required — use realistic static data throughout.

---

## Key Entities

- **Survey** — An employee experience survey built on a framework, distributed to employees
- **Deployment** — A scheduled or live instance of a survey sent to a group of employees
- **Employee / Roster** — The list of employees in the portal, with custom fields (department, location, role, manager)
- **Dashboard** — A configurable analytics view with widgets showing survey results
- **Widget** — A single data visualization unit on a dashboard (scorecard, heatmap, trend, eNPS, text analysis, etc.)
- **Initiative** — An action program created in Empower to address survey findings
- **Task** — An action item inside an initiative, assigned to a contributor with a due date
- **Idea** — An employee suggestion submitted through the Ideation module
- **Goal** — A category tag on initiatives (e.g. Wellbeing, Continuous Listening)
- **360 Subject** — The employee being assessed in a 360 review
- **360 Evaluator** — The person giving feedback on a subject (Self, Manager, Peer, Direct Report)
- **360 Report** — The individual PDF/digital report generated for a subject after 360 completion
- **Block** — A configurable section in a 360 report (e.g. Competency Detail View, Gap Analysis)
- **QxBot** — AI assistant embedded across the platform for survey building, analytics, and report generation

---

## Primary User Actions

### EX Core
- Create a new survey from scratch or from a framework template
- Add and configure questions (matrix, eNPS, multiple choice, open text, rating scales)
- Distribute survey via email, SMS, Slack, or collector form
- Schedule deployments with start/end dates and reminders
- View and manage employee roster (add, import, filter, update custom fields)
- View survey analytics dashboard with widgets
- Filter analytics by demographic (department, location, role, manager)
- Export data and PPT reports
- Configure portal settings and branding

### Empower
- View Empower home (key initiatives, upcoming tasks, analytics snapshot)
- Create and manage initiatives with goals, owners, and contributors
- Add tasks to initiatives with due dates and assignees
- Write notes on initiatives
- Submit and vote on ideas in Ideation
- View Empower analytics (top contributors, top goals, status summary)
- Manage conversations (threaded discussions linked to initiatives)
- Configure Empower settings (admin)

### 360 Feedback
- Create and configure a 360 survey (sections, question types, logic)
- Set up display configurations and labels
- Add subjects and assign evaluators (self, manager, peers, direct reports)
- Distribute 360 survey with messaging
- Track subject actions and evaluator response status
- Generate individual reports per subject
- Configure report blocks and template
- View spider/radar charts, competency detail, gap analysis
- Manage 360 portal settings

---

## File Structure

```
/prototype
  /shared
    design-tokens.css       ← all CSS variables (colors, spacing, typography)
    components.css          ← reusable component styles
    layout.css              ← shell, sidebar, topbar
    nav.js                  ← sidebar navigation and routing logic
    data.js                 ← all mock data (employees, surveys, initiatives, etc.)
  /ex
    index.html              ← EX Home / Survey List
    survey-create.html      ← Survey Builder
    survey-distribute.html  ← Distribution screen
    survey-analytics.html   ← Analytics Dashboard
    survey-heatmap.html     ← Heatmap view
    survey-comparison.html  ← Survey Comparison
    roster.html             ← Employee Roster
    portal-settings.html    ← Portal Settings & Branding
  /empower
    index.html              ← Empower Home
    initiatives.html        ← Initiatives List
    initiative-detail.html  ← Single Initiative with tasks and notes
    ideation.html           ← Ideas board
    ideation-insights.html  ← Ideation analytics
    analytics.html          ← Empower Analytics
    conversations.html      ← Conversations
    settings.html           ← Empower Settings
  /360
    index.html              ← 360 Survey List
    setup.html              ← 360 Survey Setup (sections, questions)
    distribute.html         ← 360 Distribution (subjects + evaluators)
    portal.html             ← 360 Portal (subject-facing)
    report-builder.html     ← Report Template Builder
    report-preview.html     ← Individual Subject Report Preview
    settings.html           ← 360 Settings
  index.html                ← Root entry point with product switcher
```

---

## Design System

```css
/* design-tokens.css */
:root {
  /* Brand colors */
  --color-navy:        #0F1E3C;
  --color-blue:        #1A73E8;
  --color-teal:        #00B4D8;
  --color-purple:      #7C3AED;
  --color-green:       #10B981;
  --color-amber:       #F59E0B;
  --color-red:         #EF4444;
  --color-orange:      #F97316;

  /* Surface */
  --surface-page:      #F4F6FA;
  --surface-card:      #FFFFFF;
  --surface-sidebar:   #0F1E3C;

  /* Text */
  --text-primary:      #1E293B;
  --text-secondary:    #64748B;
  --text-muted:        #94A3B8;
  --text-inverse:      #FFFFFF;

  /* Border */
  --border-default:    #E2E8F0;
  --border-focus:      #1A73E8;

  /* Spacing scale */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 20px;  --space-6: 24px;
  --space-8: 32px;  --space-10: 40px; --space-12: 48px;

  /* Typography */
  --font-family:       'DM Sans', sans-serif;
  --font-display:      'DM Serif Display', serif;
  --text-xs:   11px;  --text-sm: 12px; --text-base: 13px;
  --text-md:   14px;  --text-lg: 16px; --text-xl:   20px;
  --text-2xl:  24px;  --text-3xl: 32px;
  --font-regular: 400; --font-medium: 500;
  --font-semibold: 600; --font-bold: 700;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);

  /* Radius */
  --radius-sm: 4px; --radius-md: 8px;
  --radius-lg: 12px; --radius-xl: 16px;
  --radius-full: 9999px;
}
```

**Shared shell layout (all screens):**
- Left sidebar: 260px, `--surface-sidebar` (navy), fixed
- Top bar: 56px, white, 1px bottom border `--border-default`
- Content area: remaining width, `--surface-page` background, `padding: 32px`
- Cards: white, `--shadow-sm`, `--radius-lg`, `--border-default` 1px border
- All navigation between screens via `<a href>` links — no JS routing needed

---

## Screens & Flows

---

### [ROOT] Product Switcher

**File:** `/prototype/index.html`
**Purpose:** Entry point. Lets user choose which product to enter.
**Data shown:** 3 product cards — Employee Experience, Empower, 360 Feedback
**Actions:**
- Click "Employee Experience" → `/ex/index.html`
- Click "Empower" → `/empower/index.html`
- Click "360 Feedback" → `/360/index.html`

---

## PRODUCT 1 — EMPLOYEE EXPERIENCE (EX)

---

### EX-01 — Survey List (Home)

**File:** `/ex/index.html`
**URL pattern:** /ex
**Purpose:** Main landing screen showing all surveys in the portal. Entry point for all EX survey work.
**Sidebar nav active:** Surveys

**Data shown:**
- Page title "Surveys"
- Stats row: Total Surveys (12), Active Deployments (4), Avg Response Rate (74%), Employees in Portal (248)
- Survey table with columns: Survey Name | Framework | Last Deployed | Responses | Status | Actions
- Sample rows:
  - Employee Engagement 2025 | Engagement | Mar 2025 | 186/248 | Active (green badge) | Analyze · Distribute · ···
  - Manager Effectiveness Q1 | 360 Feedback | Jan 2025 | 92/110 | Closed (gray badge) | Analyze · ···
  - Onboarding Experience | Custom | Feb 2025 | 44/60 | Active (green badge) | Analyze · Distribute · ···
  - Wellbeing Pulse | Wellbeing | — | — | Draft (amber badge) | Edit · ···
  - eNPS Q4 2024 | eNPS | Dec 2024 | 201/248 | Closed (gray badge) | Analyze · ···

**Actions:**
- "+ New Survey" button (top right) → `/ex/survey-create.html`
- "Analyze" link per row → `/ex/survey-analytics.html`
- "Distribute" link per row → `/ex/survey-distribute.html`
- "Edit" link per row → `/ex/survey-create.html`
- Folder selector dropdown (left of table)
- Search input on table

---

### EX-02 — Survey Builder

**File:** `/ex/survey-create.html`
**URL pattern:** /ex/survey/create
**Purpose:** Build or edit a survey — add sections, questions, configure logic.
**Sidebar nav active:** Surveys

**Layout:** 3-column
- Left (240px): Section list — draggable sections with add section button at bottom
- Center (flex): Question editor — shows questions for selected section, add question button
- Right (320px): Question settings panel — opens when a question is selected

**Data shown:**
Survey title (editable): "Employee Engagement 2025"
Top tabs: Design | Logic | Settings | Languages | Preview

**Sections (left panel):**
- Section 1: Work Environment (4 questions)
- Section 2: Manager Relationship (3 questions)  
- Section 3: Growth & Development (3 questions)
- Section 4: Open Feedback (2 questions)
- "+ Add Section" button at bottom

**Questions in active section (center, Section 1):**
- Q1: Matrix — "Rate your satisfaction with the following aspects of your work environment" — 5 rows, 5-point scale (Strongly Disagree → Strongly Agree)
- Q2: Rating scale — "How likely are you to recommend this company as a great place to work?" (eNPS 0–10)
- Q3: Multiple choice single — "How would you describe your work arrangement?" — Remote / Hybrid / On-site / Flexible
- Q4: Open text — "What is one thing we could do to improve your work environment?"
- "+ Add Question" button (shows question type picker dropdown: Matrix | Rating Scale | eNPS | Multiple Choice | Open Text | Dropdown | Presentation Text | Section Heading)

**Question settings panel (right, when Q1 matrix selected):**
- Question text (editable)
- Required toggle
- Row labels (editable list)
- Column labels (editable list)
- Add row / Add column buttons
- Scale type dropdown
- Logic tab (skip logic, show/hide)

**Top bar actions:**
- "Save Draft" ghost button
- "Preview" ghost button → shows survey preview modal
- "Next: Distribute →" primary button → `/ex/survey-distribute.html`

---

### EX-03 — Survey Distribution

**File:** `/ex/survey-distribute.html`
**URL pattern:** /ex/survey/distribute
**Purpose:** Set up and launch survey distribution. Configure channels, audience, scheduling, and reminders.
**Sidebar nav active:** Surveys

**Layout:** Single column with step sections

**Step 1 — Audience:**
- Deployment name: text input "Employee Engagement 2025 — Wave 1"
- Send to: radio — All employees (248) | Selected groups | Upload list
- Group filter (when Selected groups): shows department, location, role checkboxes
- Preview count: "248 employees will receive this survey"

**Step 2 — Channel:**
- Channel pills: Email (selected) | SMS | Slack | Collector Form
- Email settings:
  - From name: "QuestionPro EX"
  - Subject line: "We'd love your feedback — Employee Engagement Survey"
  - Message editor (rich text with merge variables: ${FIRST_NAME}, ${SURVEY_LINK})
  - "Preview Email" button

**Step 3 — Schedule:**
- Start date + time picker
- End date + time picker
- Toggle: "Send immediately" (ON by default)

**Step 4 — Reminders:**
- Toggle: "Send reminders to non-respondents"
- Reminder 1: after 3 days — customisable
- Reminder 2: after 7 days — customisable
- "+ Add Reminder" link

**Step 5 — Settings:**
- Toggle: Anonymous responses (ON)
- Toggle: One response per employee (ON)
- Toggle: Allow response editing (OFF)

**Top bar actions:**
- "← Back to Survey" link
- "Save & Launch" primary button → shows confirmation modal "Your survey has been sent to 248 employees."

---

### EX-04 — Analytics Dashboard

**File:** `/ex/survey-analytics.html`
**URL pattern:** /ex/survey/analytics
**Purpose:** View survey results via a configurable dashboard with widgets.
**Sidebar nav active:** Analytics

**Layout:**
- Top: Survey name "Employee Engagement 2025" + date range filter + "+ Add Widget" button + "Export ▾" button
- Filter bar: Department (All) | Location (All) | Role (All) | Manager (All) — filter pills that trigger data updates
- Dashboard canvas: responsive grid of widget cards

**Widgets shown (static mock data):**

Widget 1 — Scorecard (full width):
  Markers as column headers: Work Environment | Manager Relationship | Growth & Development | Overall
  Rows: Favorability % | Score (1–5) | vs Benchmark | vs Previous
  Values: 78% / 3.9 / +5% / +3% | 82% / 4.1 / +8% / +2% | 71% / 3.6 / +2% / -1% | 77% / 3.87 / +5% / +1%

Widget 2 — eNPS (half width):
  Large NPS score: +42
  Promoters 58% (green bar) | Passives 26% (gray bar) | Detractors 16% (red bar)
  vs previous: +7 points

Widget 3 — Response Rate (half width):
  Donut chart: 186 responses / 248 sent = 75%
  By department table: Engineering 82% | Product 78% | Design 91% | HR 88% | Sales 64%

Widget 4 — Trend Analysis (full width):
  Line chart with 4 data points (Q1 2024, Q2 2024, Q3 2024, Q1 2025)
  Lines: Work Environment | Manager Relationship | Growth & Development | Overall
  Y-axis: 0–5 scale

Widget 5 — Text Analysis (full width):
  Tab bar: Positive | Negative | Neutral
  Word cloud visualization
  Top themes list: Work-life balance (34 mentions) | Communication (28) | Career growth (22) | Management (19)

Widget 6 — Notes (half width):
  "+ Add Note" button
  Note cards: text + author + date

**Actions:**
- "+ Add Widget" → widget picker modal (Scorecard | eNPS | Response Rate | Trend | Text Analysis | Heatmap | Single Question | Notes | Driver Analysis | Sentiment)
- "Export ▾" → PDF | PPT | CSV options
- "Heatmap →" link → `/ex/survey-heatmap.html`
- Filter pills update all widgets visually
- QxBot icon bottom-right → opens QxBot panel with AI analysis

---

### EX-05 — Heatmap

**File:** `/ex/survey-heatmap.html`
**URL pattern:** /ex/survey/heatmap
**Purpose:** Cross-tabulate survey scores by employee demographic groups.
**Sidebar nav active:** Analytics

**Data shown:**
- Row headers: Departments — Engineering | Product | Design | HR | Sales | Finance | Operations
- Column headers: Markers — Work Environment | Manager Relationship | Growth & Dev | Overall
- Cells: favorability % with color coding — green (≥75%) | amber (60–74%) | red (<60%)
- Sample data:
  Engineering: 81% | 85% | 74% | 80%
  Product: 79% | 83% | 78% | 80%
  Design: 88% | 84% | 82% | 85%
  HR: 85% | 80% | 80% | 82%
  Sales: 62% | 70% | 58% | 63% ← red/amber cells
  Finance: 76% | 78% | 72% | 75%
  Operations: 70% | 74% | 65% | 70%

**Controls:**
- Row grouping dropdown: Department | Location | Role | Manager | Custom field
- Column selection: toggle markers on/off
- Color scale legend shown below
- Toggle: Show scores | Show % | Show both
- Export button

---

### EX-06 — Employee Roster

**File:** `/ex/roster.html`
**URL pattern:** /ex/roster
**Purpose:** Manage all employees in the portal — add, import, filter, view, update.
**Sidebar nav active:** Roster

**Data shown:**
- Stats: Total Employees 248 | Active 241 | Inactive 7
- Employee table columns: Name | Email | Department | Location | Role | Manager | Status | Actions
- Sample rows (8 employees):
  - Priya Sharma | priya@co.com | Engineering | Pune | Senior Engineer | Raj Patel | Active
  - Arun Mehta | arun@co.com | Product | Mumbai | PM | Sarah Mitchell | Active
  - Divya Nair | divya@co.com | Design | Bangalore | Lead Designer | Arun Mehta | Active
  - ... (5 more rows)

**Actions:**
- "+ Add Employee" button → inline form row appears at top of table
- "Import ▾" button → CSV import | Excel import | HRIS sync options
- Search input
- Filter by: Department | Location | Status dropdowns
- Row actions: Edit (opens side panel) | Deactivate | ···
- Bulk select + bulk actions (deactivate, export, add to group)
- Pagination controls

---

### EX-07 — Portal Settings

**File:** `/ex/portal-settings.html`
**URL pattern:** /ex/settings
**Purpose:** Configure portal-wide settings — branding, access, custom fields, lifecycle rules.
**Sidebar nav active:** Settings

**Layout:** Left tab navigation + right content area

**Tabs:**
- Branding (active): Logo upload, brand color picker, portal URL customisation, portal name
- Access: Portal access toggle, access rules, permissions by role
- Custom Fields: List of custom employee fields, "+ Add Field" button, field type picker
- Lifecycle Rules: Rules for auto-sending surveys based on employee events (onboarding, anniversary)
- Integrations: Slack, Office 365, HRIS, Google Apps, Webhooks — each with connect/disconnect button
- Benchmarking: Industry benchmark selection, internal benchmark configuration

---

## PRODUCT 2 — EMPOWER

---

### EM-01 — Empower Home

**File:** `/empower/index.html`
**URL pattern:** /empower
**Purpose:** Central hub showing key initiatives, upcoming tasks, and an analytics snapshot.
**Sidebar nav active:** Home

**Data shown:**

**Header:** "Good morning, Utkarsh 👋" + date

**Key Initiatives section (top):**
- Section title "Key Initiatives" + "Pin up to 4" hint
- 4 initiative cards (pinned), each showing:
  - Initiative name
  - Goal tag (colored pill: Wellbeing / Continuous Listening / etc.)
  - Progress bar (tasks completed / total)
  - Owner avatar + name
  - Status badge (Active / Planned / Completed)
  - Unpin icon (⊗)
- "+ Pin Initiative" ghost card if fewer than 4 pinned

Sample initiatives:
1. Improve Work-Life Balance | Wellbeing | 3/8 tasks | Priya S. | Active
2. Manager Training Program | Continuous Listening | 6/10 tasks | Arun M. | Active
3. Office Redesign | Engagement | 1/5 tasks | Divya N. | Planned
4. Onboarding Revamp | Onboarding | 8/8 tasks | Raj P. | Completed (green)

**Upcoming Tasks section (middle):**
- Section title "Upcoming Tasks" + "sorted by due date" hint
- Grouped by initiative:
  Initiative: Improve Work-Life Balance
    ☐ Send flexible work policy draft — Due May 20 — Assigned: You
    ☐ Schedule team survey follow-up — Due May 22 — Assigned: Priya S.
  Initiative: Manager Training Program
    ☐ Review training module 3 — Due May 19 — Assigned: You
    ☐ Book training venue — Due May 25 — Assigned: Arun M.

**Analytics section (bottom, 3 cards):**
- Active Initiatives: 8
- Tasks in Progress: 23
- New Ideas: 14
- Top Goals donut chart: Wellbeing 40% | Continuous Listening 35% | Engagement 25%
- Top Contributors: 1. Priya S. (12 tasks) 2. Arun M. (9 tasks) 3. Divya N. (7 tasks)
- Top Ideas: 1. "Flexible Fridays" (42 votes) 2. "Remote work allowance" (38 votes) 3. "Mental health days" (31 votes)

**Actions:**
- Click initiative card → `/empower/initiative-detail.html`
- Click task checkbox → marks complete (CSS toggle)
- "View all initiatives →" link → `/empower/initiatives.html`
- "View all ideas →" link → `/empower/ideation.html`

---

### EM-02 — Initiatives List

**File:** `/empower/initiatives.html`
**URL pattern:** /empower/initiatives
**Purpose:** Full list of all initiatives with filtering and status overview.
**Sidebar nav active:** Initiatives

**Data shown:**
- Stats row: Total 14 | Active 8 | Planned 3 | Completed 3
- Filter bar: Goal (All) | Status (All) | Owner (All) | Search
- Initiative cards in a 3-column grid, each showing:
  - Initiative name (bold)
  - Goal tag pill
  - Description (2 lines)
  - Progress bar (X/Y tasks)
  - Owner + Contributors avatars
  - Status badge
  - Due date
  - "View →" button

**Actions:**
- "+ Create Initiative" button (top right) → modal / inline create form
- Click "View →" → `/empower/initiative-detail.html`
- Filter updates card display

---

### EM-03 — Initiative Detail

**File:** `/empower/initiative-detail.html`
**URL pattern:** /empower/initiative/:id
**Purpose:** View and manage a single initiative — tasks, notes, linked surveys, upstream/downstream.
**Sidebar nav active:** Initiatives

**Layout:** Header + 4 tabs

**Header:**
- Initiative name: "Improve Work-Life Balance"
- Goal: Wellbeing (teal pill)
- Status: Active (green badge)
- Owner: Priya Sharma
- Contributors: 3 avatars + "+ Add"
- Created: April 1, 2025 | Due: June 30, 2025
- "Edit" button | "Archive" button

**Tab 1 — Tasks (active):**
- Task list with columns: ☐ | Task Name | Assignee | Due Date | Status | Priority | ···
- Sample tasks:
  ☐ Send flexible work policy draft | Priya S. | May 20 | In Progress | High
  ☐ Schedule team survey follow-up | You | May 22 | Not Started | Medium
  ☑ Define success metrics | Arun M. | May 10 | Completed | High (strikethrough)
  ☐ Present proposal to leadership | Raj P. | Jun 1 | Not Started | Medium
- "+ Add Task" button at bottom
- Clicking task row expands inline detail: description, sub-tasks, comments, attachments

**Tab 2 — Notes:**
- Note cards in chronological order
- Each note: author avatar + name + date + note text
- "+ Add Note" button → opens textarea inline
- Notes are rich text (bold, bullets, links)

**Tab 3 — Linked Surveys:**
- Shows surveys linked as data sources for this initiative
- Table: Survey Name | Deployment | Score | Last Updated
- "Link Survey →" button

**Tab 4 — Upstream / Downstream:**
- Visual diagram showing this initiative's relationship to parent initiatives (upstream) and child initiatives (downstream)
- Each node: initiative name + goal pill + status badge
- "+ Link upstream" and "+ Link downstream" buttons

---

### EM-04 — Ideation Board

**File:** `/empower/ideation.html`
**URL pattern:** /empower/ideation
**Purpose:** Employee idea submission, voting, and management.
**Sidebar nav active:** Ideation

**Layout:** Header + filter bar + ideas grid

**Data shown:**
- Stats: Total Ideas 47 | Under Review 12 | Approved 8 | Implemented 5
- Filter bar: Status (All) | Category (All) | Sort: Most Votes (default) | Trending | Newest
- Idea cards (3-column grid), each showing:
  - Title
  - Description (2 lines)
  - Category pill
  - Submitted by (avatar + name)
  - Date submitted
  - 👍 Vote count + "Vote" button (togglable)
  - Status badge
  - Comment count

Sample ideas:
1. "Flexible Fridays" — Allow half-day Fridays in summer — Work-Life Balance — 42 votes — Priya S.
2. "Remote Work Allowance" — Monthly stipend for home office setup — Benefits — 38 votes — Arun M.
3. "Mental Health Days" — 2 additional paid mental health days — Wellbeing — 31 votes — Divya N.
4. "Lunch & Learn Sessions" — Weekly knowledge sharing — Learning — 24 votes — Raj P.
5. "Peer Recognition Wall" — Public kudos board — Culture — 21 votes — Sarah M.
6. "Gym Reimbursement" — Monthly fitness benefit — Wellbeing — 18 votes

**Actions:**
- "+ Submit Idea" button → modal with title, description, category selector
- "Vote" button → toggles vote (filled / outline thumb)
- Click idea card → expands to idea detail view (overlay or page)
- "Insights →" link → `/empower/ideation-insights.html`
- Admin: Status change dropdown per idea (Under Review / Approved / Rejected / Implemented)

---

### EM-05 — Empower Analytics

**File:** `/empower/analytics.html`
**URL pattern:** /empower/analytics
**Purpose:** Analytics overview for all Empower activity — initiatives, tasks, ideas, contributors, goals.
**Sidebar nav active:** Analytics

**Layout:** Page header + time period filter + 3 widget cards + Status Summary

**Time period filter (top right):** Last 12 months ▾ | Export icon

**Row 1 — 3 equal cards:**

Card 1 — Snapshot:
  Active Initiatives: 8
  Tasks in Progress: 23
  New Ideas: 14

Card 2 — Top Contributors:
  Ranked list with avatar + name + task count:
  1. Priya Sharma — 12 tasks
  2. Arun Mehta — 9 tasks
  3. Divya Nair — 7 tasks
  4. Raj Patel — 6 tasks
  5. Sarah Mitchell — 5 tasks

Card 3 — Top Goals:
  Donut chart (Status: All status ▾ | Percent ● / Count ○)
  ■ Continuous Listening — 35%
  ■ Wellbeing — 40%
  ■ Engagement — 25%

**Row 2 — Full width — Status Summary:**
  Tabs: Tasks | Initiatives (Initiatives active)
  Goals filter: All status ▾
  Legend: ● Active ● Completed
  
  Table (initiatives): Name | Goal | Tasks | Completion | Status
  Improve Work-Life Balance | Wellbeing | 3/8 | 38% | Active
  Manager Training | Continuous Listening | 6/10 | 60% | Active
  Office Redesign | Engagement | 1/5 | 20% | Planned
  Onboarding Revamp | Onboarding | 8/8 | 100% | Completed

---

### EM-06 — Conversations

**File:** `/empower/conversations.html`
**URL pattern:** /empower/conversations
**Purpose:** Threaded discussions linked to initiatives or topics, with AI content moderation.
**Sidebar nav active:** Conversations

**Layout:** Left list (320px) + right thread view

**Left — Conversation list:**
- Search input
- Filter: All | Unread | My conversations
- Conversation rows: topic title + last message preview + timestamp + unread count badge
  1. "Work from home policy update" — 12 messages — 2h ago — 3 unread
  2. "Q1 Engagement results discussion" — 8 messages — 1d ago
  3. "Wellbeing initiative ideas" — 24 messages — 3d ago
  4. "Manager feedback session" — 5 messages — 5d ago

**Right — Thread view (Conversation 1 active):**
- Thread title: "Work from home policy update"
- Linked to initiative: "Improve Work-Life Balance" (blue pill link)
- Messages in chat-style layout:
  - Avatar + name + timestamp + message text
  - Reactions row (👍 ❤️ 😊)
  - Reply button
  - AI moderation flag icon on messages with sensitive content (amber ⚠)
- Message input at bottom: textarea + emoji + attachment + send button
- "+ New Conversation" button at top of list

---

## PRODUCT 3 — 360 FEEDBACK

---

### 360-01 — 360 Survey List

**File:** `/360/index.html`
**URL pattern:** /360
**Purpose:** List all 360 feedback programs in the portal.
**Sidebar nav active:** 360 Feedback

**Data shown:**
- Page title "360 Feedback Programs"
- Stats: Total Programs 3 | Active Deployments 2 | Subjects 48 | Reports Generated 36
- Programs table: Name | Framework | Subjects | Evaluators | Status | Actions
  - Leadership 360 — Annual 2025 | Competency | 24 subjects | 186 evaluators | Active | Setup · Distribute · Reports
  - Manager Effectiveness Q1 | Custom | 12 subjects | 84 evaluators | Closed | Reports · ···
  - New Hire 90-Day | Onboarding | 12 subjects | 48 evaluators | Draft | Setup · ···

**Actions:**
- "+ New 360 Program" button → `/360/setup.html`
- "Setup" → `/360/setup.html`
- "Distribute" → `/360/distribute.html`
- "Reports" → `/360/report-builder.html`

---

### 360-02 — 360 Survey Setup

**File:** `/360/setup.html`
**URL pattern:** /360/setup
**Purpose:** Build the 360 survey — add sections, configure question types, set logic, design.
**Sidebar nav active:** 360 Feedback → Setup

**Layout:** Same 3-column layout as EX survey builder

**Tabs:** Design | Logic | Settings | Display Config | Languages

**Sections (left panel):**
- Section 1: Leadership & Influence (Matrix, 5 questions)
- Section 2: Communication (Matrix, 4 questions)
- Section 3: Collaboration (Matrix, 3 questions)
- Section 4: Open Feedback (Free text, 3 questions)
- Section 5: Introduction Text (Presentation)
- "+ Add Section" (type picker: Matrix | Single Select | Free Text | Presentation Text)

**Questions (center, Section 1):**
- Q1: Matrix — "Rate the subject on the following leadership behaviors" — 5 rows × 5-point scale
  Rows: Sets clear direction | Inspires team | Makes decisions | Communicates vision | Develops people
- Q2: Matrix — "Strategic thinking behaviors" — 4 rows
- Q3–Q5: similar matrix questions
- "+ Add Question" button

**Display Config tab (active):**
Shows 360-specific settings:
- Relationship labels: Self | Manager | Direct Report | Peer | External — each with custom label input
- Anonymity threshold: "Minimum X evaluators per relationship to show data" — number input (default 3)
- Priority model: toggle ON/OFF
- Scale labels: column header text inputs for 1–5 scale

---

### 360-03 — 360 Distribution

**File:** `/360/distribute.html`
**URL pattern:** /360/distribute
**Purpose:** Add subjects, assign evaluators per relationship, configure messaging, launch deployment.
**Sidebar nav active:** 360 Feedback → Distribution

**Layout:** Left panel (subjects list) + Right panel (subject detail / evaluator management)

**Left panel — Subjects list:**
- "+ Add Subject" button
- Search input
- Subject rows: avatar + name + role + evaluator count + status
  Sarah Mehta | Sr. Manager | 12 evaluators | In Progress (blue)
  Arun Sharma | Director | 9 evaluators | Completed (green)
  Priya Nair | Team Lead | 7 evaluators | Not Started (gray)
  Raj Patel | Analyst | 5 evaluators | In Progress (blue)

**Right panel (Sarah Mehta selected):**
- Subject name + role header
- Evaluator groups:
  Self (1/1): Sarah Mehta ✓
  Manager (1/1): Rajesh Kumar ✓
  Direct Reports (4/5): 4 added, 1 pending — list with name + status + remove icon
  Peers (5/6): 5 added — list
  External (1/2): 1 added
- "+ Add Evaluator" button per group
- Progress bar: 12/15 evaluators confirmed
- "Send Reminders" button
- "View Status →" link showing email delivery tracking

**Top bar actions:**
- Deployment selector: "Annual 2025 ▾" dropdown
- "+ New Deployment" button
- "Launch" primary button → confirmation modal

---

### 360-04 — Report Builder

**File:** `/360/report-builder.html`
**URL pattern:** /360/report-builder
**Purpose:** Configure the 360 report template — add/remove/reorder blocks, configure per-block settings.
**Sidebar nav active:** 360 Feedback → Reports

**Layout:** Full-width single column accordion (as per detailed spec in 360 PRD)

**Page header:**
- Title "Report Builder"
- Subtitle "Configure template blocks and preview"
- "Configure Template" ghost button | "Download PDFs" blue button

**Block list (accordion):**
All 15 blocks listed (see 360 PRD for full list). Show block 4 "Competency Detail View" expanded with all settings sections:
- GENERAL (expanded): Title, Data Source, Introduction, Closing Text
- DISPLAY OPTIONS (expanded): Chart type toggle (Bar/Radar), Mean Column, Relationship Icons, Tabular Data, Priority Column, QxBot Insights, Behaviours per page
- WEIGHTING (collapsed): Include in Overall Score toggle, weight slider
- BENCHMARK (collapsed, locked): "Coming in Phase 3" label
- VISIBILITY (collapsed)

Footer: Reset + Save Changes buttons

---

### 360-05 — Individual Report Preview

**File:** `/360/report-preview.html`
**URL pattern:** /360/report/preview
**Purpose:** Preview of the generated 360 report for a specific subject — all sections rendered.
**Sidebar nav active:** 360 Feedback → Reports

**Layout:** Left subject selector (200px) + Right PDF-style report view (scrollable)

**Left — Subject selector:**
- Search input
- List of subjects:
  Sarah Mehta (selected, blue)
  Arun Sharma
  Priya Nair
  Raj Patel

**Right — Report view (white pages on gray canvas):**

Page 1 — Cover:
  Navy gradient, "Sarah Mehta", "Senior Manager", "360° Development Report", "Annual 2025", evaluator count, score badge "76% — Excellent"

Page 2 — Executive Summary:
  Overall score gauge 76%, "Excellent" category banner, participation table, top strengths, development areas, alignment statement

Page 3 — Competency Detail View:
  Grouped bar chart for Leadership competency, 4 relationships per behavior, benchmark line at 4.0, data table below

Page 4 — Gap Analysis:
  Bidirectional bar chart showing self vs others gaps, quadrant matrix tab

Page 5 — Performance Trend:
  Line chart 2022–2025 with 5 competency lines + overall score

Page 6 — AI Action Recommendations:
  Sentiment bar, 3 QxBot recommendation cards with action steps

Page 7 — Priority Comments:
  Q1/Q2/Q3 tabs, grouped comments with relationship labels

**Top bar actions:**
- "← Back to Builder" link
- Subject dropdown selector
- "Download PDF" button
- "Regenerate Report" ghost button

---

### 360-06 — 360 Settings

**File:** `/360/settings.html`
**URL pattern:** /360/settings
**Purpose:** Configure report settings — relationship weights, performance categories, report access.
**Sidebar nav active:** 360 Feedback → Settings

**Layout:** Left tab navigation + right content

**Tabs:**
- Report Settings: Master design, overall score config, block weights
- Relationship Weights: Global sliders + block override table
- Performance Categories: 5-tier config with range bar and preview
- Report Access: Subject/manager access toggles
- Report Approvals: Manager/admin approval workflow
- Report Availability: Completion threshold rules

*(See detailed 360 PRD for full field spec per tab)*

---

## Navigation Structure

### EX Sidebar
```
SURVEYS
  My Surveys (active)
  Survey Templates
  Folders

ANALYTICS
  Dashboards
  Heatmap
  Survey Comparison
  Text Reports

ROSTER
  Employee List
  Import Employees
  Custom Fields

SETTINGS
  Portal Settings
  Branding
  Access & Permissions
  Integrations
  Benchmarking
```

### Empower Sidebar
```
EMPOWER
  Home
  Initiatives
  Ideation
  Conversations
  Analytics

SETTINGS
  Admin Settings
  Empower Settings
```

### 360 Sidebar
```
REPORTS
  Individual Reports
  Report Builder
  Report Settings

SUBJECT REPORT SECTIONS
  Cover Page (NEW)
  Executive Summary (NEW)
  Competency Detail View
  Gap Analysis (NEW)
  Performance Trend (NEW)
  AI Recommendations (NEW)
  Priority Comments

CONFIGURATION
  Relationship Weights (NEW)
  Benchmarks (NEW)
  Performance Categories (NEW)

360 PROGRAM
  Setup
  Distribution
  Portal Settings
```

---

## Mock Data

All mock data lives in `/shared/data.js` and is imported into every HTML file.

```javascript
// data.js — key data objects

const employees = [
  { id: 1, name: "Priya Sharma", email: "priya@co.com", dept: "Engineering", 
    location: "Pune", role: "Senior Engineer", manager: "Raj Patel", status: "active" },
  { id: 2, name: "Arun Mehta", email: "arun@co.com", dept: "Product",
    location: "Mumbai", role: "Product Manager", manager: "Sarah Mitchell", status: "active" },
  { id: 3, name: "Divya Nair", email: "divya@co.com", dept: "Design",
    location: "Bangalore", role: "Lead Designer", manager: "Arun Mehta", status: "active" },
  { id: 4, name: "Raj Patel", email: "raj@co.com", dept: "Engineering",
    location: "Pune", role: "Director", manager: "Sarah Mitchell", status: "active" },
  { id: 5, name: "Sarah Mitchell", email: "sarah@co.com", dept: "Product",
    location: "Mumbai", role: "Senior Manager", manager: "CEO", status: "active" },
];

const surveys = [
  { id: 1, name: "Employee Engagement 2025", framework: "Engagement", 
    responses: 186, total: 248, status: "active", lastDeployed: "Mar 2025" },
  { id: 2, name: "Manager Effectiveness Q1", framework: "360 Feedback",
    responses: 92, total: 110, status: "closed", lastDeployed: "Jan 2025" },
  { id: 3, name: "Wellbeing Pulse", framework: "Wellbeing",
    responses: 0, total: 0, status: "draft", lastDeployed: null },
];

const initiatives = [
  { id: 1, name: "Improve Work-Life Balance", goal: "Wellbeing", 
    status: "active", tasks: 8, completedTasks: 3, owner: "Priya Sharma",
    due: "Jun 30, 2025", description: "Address work-life balance concerns from Q4 survey." },
  { id: 2, name: "Manager Training Program", goal: "Continuous Listening",
    status: "active", tasks: 10, completedTasks: 6, owner: "Arun Mehta",
    due: "Jul 15, 2025", description: "Develop and roll out manager training modules." },
  { id: 3, name: "Office Redesign", goal: "Engagement",
    status: "planned", tasks: 5, completedTasks: 1, owner: "Divya Nair",
    due: "Aug 1, 2025", description: "Redesign office space for hybrid work." },
  { id: 4, name: "Onboarding Revamp", goal: "Onboarding",
    status: "completed", tasks: 8, completedTasks: 8, owner: "Raj Patel",
    due: "Apr 30, 2025", description: "Revamped onboarding program." },
];

const subjects360 = [
  { id: 1, name: "Sarah Mehta", role: "Senior Manager", overallScore: 76,
    category: "Excellent", evaluators: 12, status: "ready" },
  { id: 2, name: "Arun Sharma", role: "Director", overallScore: 84,
    category: "Outstanding", evaluators: 9, status: "ready" },
  { id: 3, name: "Priya Nair", role: "Team Lead", overallScore: 58,
    category: "Developing", evaluators: 7, status: "pending" },
];
```

---

## Terminology

| Term | Definition |
|------|------------|
| EX | Employee Experience — the core survey and analytics platform |
| Empower | The action-planning module — initiatives, tasks, ideation, conversations |
| 360 | 360 Feedback — multi-rater assessment where an employee is evaluated by self, manager, peers, and direct reports |
| Framework | A pre-built survey structure (e.g. Engagement, Wellbeing, eNPS) used as a starting point |
| Deployment | A live or scheduled instance of a survey being sent to employees |
| Marker | A survey section or competency area used as a column header in analytics (e.g. Work Environment) |
| Building Block | A question group within a framework |
| eNPS | Employee Net Promoter Score — a single 0–10 loyalty question |
| Scorecard | A widget showing favorability % and scores across all markers in a table |
| Heatmap | Cross-tabulation of survey scores by employee demographic groups |
| Favorability | % of respondents who answered in the top 2 options (agree/strongly agree) |
| Initiative | A structured action program created in Empower to address survey findings |
| Ideation | Module for employees to submit, vote on, and manage improvement ideas |
| Subject | The employee being assessed in a 360 review |
| Evaluator | The person providing 360 feedback on a subject |
| Block | A configurable section in a 360 report |
| QxBot | QuestionPro's AI assistant — used for building surveys, analysing data, and generating 360 recommendations |
| QxBot Assist | The in-portal AI chat assistant for analytics questions |
| Upstream / Downstream | Parent-child relationships between initiatives in Empower |
| Goal | A category label on initiatives (e.g. Wellbeing, Continuous Listening) used for analytics grouping |
| Benchmark | An internal or industry reference score used to contextualise survey results |
| Performance Category | A named tier (Excellent, Proficient, etc.) assigned to a subject based on their 360 overall score |

---

## Build Instructions for Claude Code

1. Start with `/shared/design-tokens.css` — define all CSS variables first.
2. Build the shared shell layout in `/shared/layout.css` — sidebar + topbar + content area.
3. Build `/shared/nav.js` — handles sidebar active state and `<a href>` navigation highlighting.
4. Build `/shared/data.js` — all mock data objects.
5. Build the root `/prototype/index.html` product switcher first.
6. Then build each product in order: EX screens → Empower screens → 360 screens.
7. Every page imports: design-tokens.css, components.css, layout.css, nav.js, data.js.
8. Every page has the full sidebar and topbar.
9. All navigation between screens uses standard `<a href="...">` links.
10. Do not use any external CSS frameworks (no Bootstrap, no Tailwind) — use only the design tokens.
11. Use vanilla JS only — no React, no Vue.
12. Charts: use SVG or Canvas drawn with vanilla JS — no chart libraries.