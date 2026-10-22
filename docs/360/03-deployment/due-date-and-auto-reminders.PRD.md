# PRD: 360 rater due date and auto-reminders

Module: 360 Feedback — Deployment
Source: [PRD: 360 Due Date And Reminders](https://docs.google.com/presentation/d/1QAMgICKA5nUYQTBVNnzoRQANEzByF8BfB6rdm4CZOcE/edit?usp=sharing) (v1, Phase 1 of 2)
Status: Product decisions locked for prototype build

Phase 1 covers **rater due date + scheduled email reminders** only. Nomination due date and nomination reminders are Phase 2 and out of scope.

This file is the locked product copy for the prototype. Use these rules over the slide deck wherever they conflict.

---

## Locked terminology

Three events are distinct. Do not reuse one label for all three.

| Event | What it is | What it does |
|---|---|---|
| **Rater due date** | Optional date on the deployment | Soft close. Late responses still accepted (late flags on the participant table are out of this pass). When a due date is set, **every scheduled firing must be on or before that date**. |
| **Close deployment** | Admin action that moves the deployment to Closed | Cancels **all** remaining scheduled reminder firings. No further emails. |
| **Delete deployment** | Admin deletes the deployment | Cancels **all** scheduled reminder rules. |

Do not offer an end option named “Until deployment closes” or “When deployment closes.” Recurring series may end **Until rater due date**. Close deployment is a separate action that cancels remaining firings even when no due date exists.

**UI copy for the recurring end option:** `Until rater due date` with the due date shown in parentheses, e.g. `Until rater due date (Nov 15, 2026)`.

---

## Who is a rater (pending at fire time)

A **pending rater** is anyone in this deployment who still has **at least one incomplete evaluation**, including:

- Self
- Manager, peer, direct report
- External reviewer

**Incomplete** includes Not started and In progress (started, not submitted).

**Not pending:**

- Rater who has submitted every assigned evaluation in this deployment
- Nominee who has not been invited / has no evaluation to complete yet
- Subjects who are not themselves evaluating anyone

Partial completion: if a rater finished 3 of 8 subjects, they get **one** consolidated email listing the remaining 5. Self is just another subject in that list when the person still owes a self evaluation.

Grouping key: `(rater identity, deployment)`. Cross-deployment consolidation is out of scope.

---

## 1. Rater due date vs Close deployment vs Until rater due date

### Rater due date

- Optional field labeled **Rater due date**.
- Prototype v1: **date only** (no time picker, no timezone selector). Production may add time + timezone later.
- Admin may leave it blank and launch without a deadline.
- Editable after launch until Close deployment: add, change, or clear.
- Soft close: after the due date, raters can still submit.
- **Scheduled reminders never fire after the rater due date.** If a due date is set, every computed occurrence must be on or before that date. There are no post-due scheduled sends.
- Respondent **survey form** does **not** show the due date in v1.

### Close deployment

- Always cancels every remaining scheduled firing for that deployment, whether or not a due date exists.
- Recurring series without a due date therefore still stop on close. They do not run forever.

### Recurring end conditions (admin must pick one; no default)

1. **On specific end date** — admin picks a date (last firing must be on or before that date).
2. **After N occurrences** — admin picks a count ≥ 1.
3. **Until rater due date** — shown only when a rater due date is set. Hidden otherwise, with tooltip: `Set a rater due date to end on the deadline.`

When no due date is set, end is required as **On date** or **After N occurrences**.

Do not offer an end option named “When deployment closes.”

---

## 2. Due-date window for scheduled reminders

Every scheduled firing must be **on or before** the rater due date when one is set.

- **One-time:** picked date must be `<= dueDate`. Do not allow a one-time date in the past.
- **Recurring:** start date `<= dueDate`. End can be Until rater due date, an earlier end date, or After N occurrences — but save is blocked if any computed occurrence would fall after the due date. Modal error: `This schedule extends past the rater due date`.
- **No due date:** end is required as On date or After N occurrences. Hide Until rater due date.

Due-date edits do **not** silently recalculate reminder dates. Absolute dates and recurrence patterns stay as stored. Admin must review the schedule if a due-date change makes a rule invalid.

### Clear the due date

- If **no** rule uses Until rater due date: clear immediately.
- If **any** rule uses Until rater due date: do not clear yet. Convert those rules to **On specific end date** using the current rater due date, then clear.

---

## 3. Recurrence details

Every reminder rule is **One-time** or **Recurring**. Admin picks every value. No suggested cadence, no “days before due.” Setup matches a Google Calendar event: mode, date + time, repeat interval, weekdays, start, end, live summary.

### One-time

- Required: date + time. Time is required; no prefilled time.
- Fires once. Date must not be in the past. Date must be on or before the rater due date when one is set.

### Recurring (always includes time of day)

Required:

- Interval: daily | every N days | weekly | every N weeks | monthly
- N ≥ 1 when the interval uses N
- **Time of day** (required; no default)
- Start date
- End condition (one of the three above)

**Weekly / every N weeks:** admin may select **one or more** weekdays (`M T W T F S S`). Multiple days are allowed. Save is blocked until at least one day is selected.

**Monthly:** fire on the **same calendar day-of-month as the start date**, at the chosen time. If that day does not exist in a later month (31 Jan → February), fire on the **last day of that month**. That is the overflow rule.

**Daily / every N days:** every Nth day at the chosen time, from the start date.

A summary line is required before save, e.g. `Every Monday and Thursday at 9:00 AM, starting Oct 28, until Nov 15 (due date). 6 occurrences.`

### Caps

No cap on the number of reminder rules in this prototype.

### Disable vs delete

Pause/disable is **out of v1**. List rows have Edit and delete only. Delete asks for confirmation. Deleting one rule does not affect the others.

---

## 4. Surfaces

The scheduler does **not** live on deployment settings. It lives on **Reminders**.

### Reminders page (two tabs)

When the admin opens **Reminders**, wrap the page in WickUI tabs:

- **Scheduled** (default, primary)
- **Manual** (secondary)

Invitations stay a single compose page. Opening a reminder template still lands on Reminders; default to **Manual** only when the user came from Templates to edit/send now, otherwise **Scheduled**.

#### Scheduled tab

- Settings-card list (not chips): rule summary, next firing, Edit, delete.
- **Add reminder** opens a two-step modal: **When** (one-time vs recurring, date + time, interval, weekday toggles, start, end, live summary) then **Email** (same compose options as Manual: Type / subject or evaluator group, To, From, template, subject, body, insert variable).
- **Send reminder now** on the Scheduled list switches to the Manual tab.
- **Preview send** (or first-occurrence row) can append to Sent history with status `Scheduled` so the tab feels real.

#### Manual tab

Reuse the existing mail composer (templates, insert variable, Send Mail).

Same reminder template and subject line as scheduled sends. Recipients cannot tell scheduled from manual.

### Deployment create + header

- **Rater due date** remains optional on create and in the deployment header.
- Do not put the calendar scheduler on create or settings.

### Out of this pass

- Timezone selector
- Late flags on the participant table
- Due-date-passed admin email
- Deadline on the respondent survey form
- Per-reminder template variants beyond the existing compose Type / template / subject / body on each scheduled rule
- Slack / Teams
- Per-rater due date overrides
- Reminder analytics
- Nomination due date / nomination reminders
- Hard close
- Auto-recalc when due date changes
- Real job runner / cron

---

## 5. Same-day overlap (flag only)

In one day, the same person should not normally receive more than one reminder. Manual can still send at any time. Scheduled must be set up in advance.

This is **not** a hard cap on Manual send.

Before a Manual send, compute overlap: recipients in the current To pool who already have a **scheduled firing today** or a **sent reminder today** (from Sent history). If any match, show a warning banner + toast naming them. **Do not block Send.**

Same check in reverse when saving a scheduled rule whose next firing is today and those people already got a manual reminder today: warn, still save.

Copy: `These people already have a reminder today: … Sending another is allowed, but they will receive more than one.`

- Banner on Manual when a schedule fires today for the same audience.
- Amber badge on Scheduled rows that fire today if a manual reminder already went to overlapping people today.

---

## Firing, consolidation, cancellation

At each scheduled instant:

1. Find pending raters for this deployment (definition above).
2. If none, skip silently.
3. Send one email per pending rater listing remaining subjects, plus a link to that rater’s assigned list.
4. Use existing reminder email infrastructure.

Cancel remaining firings when:

- Admin closes the deployment
- Admin deletes the deployment
- Admin deletes that reminder rule

Due-date edit does **not** cancel rules.

Frontend prototype cannot run cron. Represent the scheduler in UI (next firing, rule list, Sent history status `Scheduled`). **Send reminder now** remains a live prototype action with toast + sent-history row.

---

## Prototype notes vs production

| Topic | Production | This prototype |
|---|---|---|
| In-flight backfill | New deployments only | Mock deployments may include rater due date + sample rules so the Reminders UX is visible |
| Scheduler | Real job | Simulated next occurrence + Sent history |
| Time / timezone | Date + time + timezone | Date-only due date; reminder time in the calendar modal |
| Due-date-passed admin email | Yes | Out of this pass |
