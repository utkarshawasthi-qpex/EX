import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PptxGenJS from 'pptxgenjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT = path.resolve(
  __dirname,
  '../docs/lifecycle-surveys/03-employee-roster/filter-access-rules.PRD.pptx',
)

const W = 13.33
const H = 7.5
const NAVY = '1F3864'
const BLUE = '1B87E6'
const WHITE = 'FFFFFF'
const INK = '1F2937'
const MUTED = '4B5563'
const LIGHT = 'F8FAFC'
const RULE = 'E5E7EB'

const pptx = new PptxGenJS()
pptx.defineLayout({ name: 'WIDE', width: W, height: H })
pptx.layout = 'WIDE'
pptx.title = 'Filter access rules PRD'
pptx.author = 'QuestionPro Employee Experience'
pptx.subject = 'Portal Permissions — Filter access rules'

function headerBar(slide, title, page) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: W,
    h: 0.92,
    fill: { color: NAVY },
    line: { color: NAVY },
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.92,
    w: 0.12,
    h: H - 0.92,
    fill: { color: BLUE },
    line: { color: BLUE },
  })
  slide.addText(title, {
    x: 0.45,
    y: 0.22,
    w: 11.2,
    h: 0.5,
    fontFace: 'Calibri',
    fontSize: 22,
    bold: true,
    color: WHITE,
    margin: 0,
  })
  slide.addText(String(page), {
    x: 12.1,
    y: 0.28,
    w: 0.85,
    h: 0.38,
    fontFace: 'Calibri',
    fontSize: 12,
    color: WHITE,
    align: 'right',
    margin: 0,
  })
}

function bullets(slide, items, y = 1.25) {
  slide.addText(
    items.map((text) => ({
      text,
      options: { bullet: true, breakLine: true },
    })),
    {
      x: 0.55,
      y,
      w: 12.2,
      h: 5.7,
      fontFace: 'Calibri',
      fontSize: 18,
      color: INK,
      paraSpaceAfter: 10,
      valign: 'top',
    },
  )
}

function twoColumns(slide, leftTitle, leftItems, rightTitle, rightItems) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.45,
    y: 1.22,
    w: 6.05,
    h: 5.7,
    fill: { color: LIGHT },
    line: { color: RULE },
    rectRadius: 0.08,
  })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 6.75,
    y: 1.22,
    w: 6.05,
    h: 5.7,
    fill: { color: LIGHT },
    line: { color: RULE },
    rectRadius: 0.08,
  })
  slide.addText(leftTitle, {
    x: 0.7,
    y: 1.4,
    w: 5.55,
    h: 0.4,
    fontFace: 'Calibri',
    fontSize: 16,
    bold: true,
    color: BLUE,
    margin: 0,
  })
  slide.addText(
    leftItems.map((text) => ({ text, options: { bullet: true, breakLine: true } })),
    {
      x: 0.7,
      y: 1.9,
      w: 5.55,
      h: 4.7,
      fontFace: 'Calibri',
      fontSize: 16,
      color: INK,
      paraSpaceAfter: 8,
      valign: 'top',
    },
  )
  slide.addText(rightTitle, {
    x: 7.0,
    y: 1.4,
    w: 5.55,
    h: 0.4,
    fontFace: 'Calibri',
    fontSize: 16,
    bold: true,
    color: BLUE,
    margin: 0,
  })
  slide.addText(
    rightItems.map((text) => ({ text, options: { bullet: true, breakLine: true } })),
    {
      x: 7.0,
      y: 1.9,
      w: 5.55,
      h: 4.7,
      fontFace: 'Calibri',
      fontSize: 16,
      color: INK,
      paraSpaceAfter: 8,
      valign: 'top',
    },
  )
}

// 1. Cover
{
  const slide = pptx.addSlide()
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: W,
    h: H,
    fill: { color: NAVY },
    line: { color: NAVY },
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.18,
    h: H,
    fill: { color: BLUE },
    line: { color: BLUE },
  })
  slide.addText('PRODUCT REQUIREMENTS', {
    x: 0.7,
    y: 1.7,
    w: 12,
    h: 0.35,
    fontFace: 'Calibri',
    fontSize: 14,
    bold: true,
    color: BLUE,
    margin: 0,
  })
  slide.addText('Filter access rules', {
    x: 0.7,
    y: 2.15,
    w: 12,
    h: 1.1,
    fontFace: 'Calibri',
    fontSize: 40,
    bold: true,
    color: WHITE,
    margin: 0,
  })
  slide.addText('Employee Experience  ·  Portal Permissions', {
    x: 0.7,
    y: 3.35,
    w: 12,
    h: 0.45,
    fontFace: 'Calibri',
    fontSize: 20,
    color: 'D6E8FA',
    margin: 0,
  })
  slide.addText(
    'Limit which dashboard filters a person can use, using saved employee groups.\nApplies to every dashboard they create or that is shared with them.',
    {
      x: 0.7,
      y: 4.15,
      w: 11.5,
      h: 1.1,
      fontFace: 'Calibri',
      fontSize: 16,
      color: WHITE,
      margin: 0,
    },
  )
  slide.addText('QuestionPro Employee Experience prototype', {
    x: 0.7,
    y: 6.7,
    w: 12,
    h: 0.35,
    fontFace: 'Calibri',
    fontSize: 13,
    color: '9CA3AF',
    margin: 0,
  })
}

// 2. Problem
{
  const slide = pptx.addSlide()
  headerBar(slide, 'Problem', 2)
  bullets(slide, [
    'By default, everyone can use every dashboard and tab filter.',
    'Admins need to limit which filters a person can see and apply.',
    'Rules must be about the signed-in user, not a specific dashboard.',
    'The same limit should apply on dashboards they create and dashboards shared with them.',
  ])
}

// 3. Outcome
{
  const slide = pptx.addSlide()
  headerBar(slide, 'Outcome', 3)
  bullets(slide, [
    'Admins create named employee groups on Employee Filters.',
    'A filter access rule maps those groups to allowed dashboard filters.',
    'Matching employees only see those allowed filters on every dashboard they can open as a user.',
    'If nobody matches a rule, they keep all filters.',
    'HR admins are unrestricted.',
  ])
}

// 4. Where it lives
{
  const slide = pptx.addSlide()
  headerBar(slide, 'Where it lives', 4)
  bullets(slide, [
    'Configure: Manage Employee List → Portal → Permissions → Filter access rules.',
    'Prerequisite catalog: Employees → Employee Filters.',
    'Employee Filters are the named people groups used by every filter group in a rule.',
    'Dashboard filter panel and tab filters honor the signed-in user’s allowed filters.',
    'Public anonymous share links are out of this rule set.',
  ])
}

// 5. Scope
{
  const slide = pptx.addSlide()
  headerBar(slide, 'Scope', 5)
  twoColumns(
    slide,
    'In',
    [
      'User-based filter access rules',
      'Filter groups built only from saved Employee Filters',
      'Allowed filters: Department, Location, Level, Tenure',
      'Empty state when no employee groups exist',
      'Edit and delete a rule',
      'Edit a filter group’s saved employee filter',
    ],
    'Out',
    [
      'Dashboard-specific filter rules',
      'Creating a new employee filter inside the rule modal',
      'Import rules',
      'Public share-link filter limits',
    ],
  )
}

// 6. Empty state
{
  const slide = pptx.addSlide()
  headerBar(slide, 'Empty state', 6)
  bullets(slide, [
    'Title: No employee groups.',
    'Body: To add an access rule for dashboard filters, create an employee group first.',
    'CTA: Go to Employee Filters — switches to Employees → Employee Filters.',
    '+ Add rule is hidden until at least one saved employee filter exists.',
    'If filters exist but there are no rules yet, the table shows: No data to display.',
  ])
}

// 7. Add rule
{
  const slide = pptx.addSlide()
  headerBar(slide, 'Add rule', 7)
  bullets(slide, [
    'Fields: Rule name, then Filter groups.',
    'Each filter group starts as Filter group 1.',
    'Pick a saved filter from Employee Filters, then choose Allowed filters.',
    '+ Add filter group adds another group on the same rule.',
    'Edit pencil on a filter group opens the saved employee filter for editing.',
    'Remove is available when there is more than one filter group.',
    'Save requires a name, a saved filter on every group, and at least one allowed filter per group.',
  ])
}

// 8. Matching
{
  const slide = pptx.addSlide()
  headerBar(slide, 'Matching', 8)
  bullets(slide, [
    'The signed-in employee is tested against the saved filter’s conditions.',
    'If the saved filter later changes, matching uses the current definition.',
    'All matching filter groups across all rules union their allowed filters.',
    'No matching group: the user keeps every dashboard filter.',
    'HR admin (not impersonating) is unrestricted.',
    'The same allowed set applies on dashboards they create and dashboards shared with them.',
  ])
}

// 9. List actions
{
  const slide = pptx.addSlide()
  headerBar(slide, 'List actions', 9)
  bullets(slide, [
    'Table columns: #, Rule name, Filter groups, actions.',
    'Filter groups show the saved filter name and the allowed dashboard filters.',
    'Click the rule name or the edit pencil to open Edit rule.',
    'Delete removes the rule after confirmation.',
    'There is no Import action on Filter access rules.',
  ])
}

// 10. Acceptance
{
  const slide = pptx.addSlide()
  headerBar(slide, 'Acceptance', 10)
  bullets(slide, [
    'With no saved Employee Filters, the card shows the empty state and hides + Add rule.',
    'Go to Employee Filters lands on Employees → Employee Filters.',
    'After a saved filter exists, + Add rule opens a form with Filter group 1.',
    'A saved rule limits dashboard and tab filters for matching users on every user dashboard.',
    'Unmatched users still see all filters. HR admins see all filters.',
    'Edit and delete work on the rule. Edit on a filter group updates the saved employee filter.',
  ])
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
await pptx.writeFile({ fileName: OUTPUT })
console.log(`Wrote ${OUTPUT}`)
