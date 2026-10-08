export type HeadcountCriteria = {
  dimension: string
  values: string[]
}

export type HeadcountSegmentSet = {
  id: string
  segment: string
  segmentValues: string[]
  criteria: HeadcountCriteria[]
}

export type HeadcountField = {
  key: string
  title: string
  options: string[]
}

export type HeadcountRow = {
  setId: string
  values: Record<string, string>
  expectedHeadcount: number
  managerEmail: string
  qrResponses: number
  emailExpected: number
  emailResponses: number
}

export type CollectorHeadcount = {
  sets: HeadcountSegmentSet[]
  rows: HeadcountRow[]
  /** Company overall denominator. Used even when no segment file is uploaded. */
  totalExpected: number | null
  updatedAt: string
}

export type HeadcountCsvError = {
  row: number
  message: string
}

export type HeadcountChannel = 'combined' | 'email' | 'qr'

export type HeadcountNode = {
  key: string
  label: string
  responses: number
  expected: number
  rate: number
  hidden: boolean
  overCapacity: boolean
  children: HeadcountNode[]
}

export const RESPONSE_RATE_SEGMENTS: HeadcountField[] = [
  { key: 'department', title: 'Department', options: ['Engineering', 'Product', 'Sales', 'HR', 'Marketing', 'Finance', 'Operations'] },
  { key: 'location', title: 'Location', options: ['Mumbai', 'Bangalore', 'Delhi', 'Remote', 'US'] },
  { key: 'level', title: 'Level', options: ['IC', 'Manager', 'Senior Manager', 'Director', 'VP', 'C-Suite'] },
  { key: 'status', title: 'Status', options: ['Active', 'Inactive', 'On leave', 'Terminated'] },
]

export const RESPONSE_RATE_VIEWERS = [
  { id: 'admin', label: 'Admin' },
  { id: 'arun', label: 'Arun (his segments)' },
] as const

export type ResponseRateViewerId = (typeof RESPONSE_RATE_VIEWERS)[number]['id']

const COUNT_HEADER = 'Expected responses'
const EMAIL_HEADER = 'Manager email'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const WORKPLACE_SET_ID = 'set_workplace'

function seedRow(
  location: string,
  department: string,
  expectedHeadcount: number,
  qrResponses: number,
  emailExpected: number,
  emailResponses: number,
  managerEmail: string,
): HeadcountRow {
  return {
    setId: WORKPLACE_SET_ID,
    values: { location, department },
    expectedHeadcount,
    qrResponses,
    emailExpected,
    emailResponses,
    managerEmail,
  }
}

/** Location is the criteria and Department is the segment. Email 2,280/3,000, QR 1,140/2,000. */
export const WORKPLACE_COLLECTOR_HEADCOUNT: CollectorHeadcount = {
  updatedAt: '2026-10-03T09:00:00.000Z',
  totalExpected: null,
  sets: [
    {
      id: WORKPLACE_SET_ID,
      segment: 'department',
      segmentValues: ['Engineering', 'Product', 'Operations'],
      criteria: [{ dimension: 'location', values: ['Mumbai', 'Bangalore', 'Delhi'] }],
    },
  ],
  rows: [
    seedRow('Mumbai', 'Engineering', 500, 280, 600, 480, 'alex@co.com'),
    seedRow('Mumbai', 'Product', 250, 140, 350, 280, 'emma@co.com'),
    seedRow('Mumbai', 'Operations', 150, 80, 200, 160, 'sarah@co.com'),
    seedRow('Bangalore', 'Engineering', 400, 220, 500, 400, 'arun@co.com'),
    seedRow('Bangalore', 'Product', 200, 110, 280, 220, 'arun@co.com'),
    seedRow('Bangalore', 'Operations', 60, 67, 10, 5, 'sarah@co.com'),
    seedRow('Delhi', 'Engineering', 300, 170, 700, 520, 'james@co.com'),
    seedRow('Delhi', 'Product', 8, 2, 4, 1, 'james@co.com'),
    seedRow('Delhi', 'Operations', 132, 71, 356, 214, 'james@co.com'),
  ],
}

export function segmentTitle(key: string): string {
  return RESPONSE_RATE_SEGMENTS.find((segment) => segment.key === key)?.title ?? key
}

export function segmentOptions(key: string): string[] {
  return RESPONSE_RATE_SEGMENTS.find((segment) => segment.key === key)?.options ?? []
}

export function fieldsForSet(set: HeadcountSegmentSet): HeadcountField[] {
  const criteria = set.criteria.filter((item) => item.dimension && item.dimension !== 'none' && item.values.length > 0)
  const dimensions = [
    ...criteria.map((item) => ({ key: item.dimension, values: item.values })),
    ...(set.segment && set.segment !== 'none' && set.segmentValues.length > 0
      ? [{ key: set.segment, values: set.segmentValues }]
      : []),
  ]
  return dimensions.map((dimension) => ({
    key: dimension.key,
    title: segmentTitle(dimension.key),
    options: dimension.values,
  }))
}

export function setHeading(set: HeadcountSegmentSet): string {
  const fields = fieldsForSet(set)
  if (fields.length === 0) return 'Segment'
  if (fields.length === 1) return fields[0].title
  return `${fields.slice(0, -1).map((field) => field.title).join(' / ')} / ${fields[fields.length - 1].title}`
}

export function rowsForViewer(rows: HeadcountRow[], viewer: ResponseRateViewerId): HeadcountRow[] {
  if (viewer === 'admin') return rows
  return rows.filter((item) => item.managerEmail.toLowerCase() === 'arun@co.com')
}

export function channelTotals(rows: HeadcountRow[], channel: HeadcountChannel) {
  const responses = rows.reduce((total, item) => total + channelResponses(item, channel), 0)
  const expected = rows.reduce((total, item) => total + channelExpected(item, channel), 0)
  return { responses, expected, rate: rateFor(responses, expected) }
}

export function headcountHasDenominator(headcount: CollectorHeadcount | null | undefined) {
  if (!headcount) return false
  return typeof headcount.totalExpected === 'number' || headcount.rows.length > 0
}

/** Company overall rate. An entered total replaces that form's segment sum, and still counts when nothing is uploaded. */
export function companyOverallTotals(
  sources: { responsesCollected: number; headcount: CollectorHeadcount }[],
  viewer: ResponseRateViewerId,
) {
  const rows = sources.flatMap((source) => rowsForViewer(source.headcount.rows, viewer))
  const fromRows = channelTotals(rows, 'combined')
  if (viewer !== 'admin' || !sources.some((source) => typeof source.headcount.totalExpected === 'number')) {
    return { ...fromRows, usesEnteredTotal: false }
  }

  let responses = 0
  let expected = 0
  for (const source of sources) {
    const sourceRows = rowsForViewer(source.headcount.rows, 'admin')
    const rowTotals = channelTotals(sourceRows, 'combined')
    if (typeof source.headcount.totalExpected === 'number') {
      expected += source.headcount.totalExpected
      responses += sourceRows.length > 0 ? rowTotals.responses : source.responsesCollected
    } else {
      expected += rowTotals.expected
      responses += rowTotals.responses
    }
  }
  return { responses, expected, rate: rateFor(responses, expected), usesEnteredTotal: true }
}

export function buildHeadcountTree(
  rows: HeadcountRow[],
  fields: HeadcountField[],
  channel: HeadcountChannel,
  anonymityThreshold: number,
): HeadcountNode[] {
  return buildNestedLevel(rows, fields, 0, channel, anonymityThreshold, 'root')
}

export function headcountTemplateCsv(sets: HeadcountSegmentSet[], existing: HeadcountRow[] | null): string {
  const blocks = sets.flatMap((set, index) => {
    const fields = fieldsForSet(set)
    if (fields.length === 0) return []
    const headers = [...fields.map((field) => field.title), COUNT_HEADER, EMAIL_HEADER]
    const lines = [`Set ${index + 1}`, headers.map(escapeCsv).join(',')]
    for (const combo of combinations(fields)) {
      const match = existing?.find(
        (item) => item.setId === set.id && fields.every((field) => item.values[field.key] === combo[field.key]),
      )
      lines.push(
        [...fields.map((field) => combo[field.key] ?? ''), String(match?.expectedHeadcount ?? 0), match?.managerEmail ?? '']
          .map(escapeCsv)
          .join(','),
      )
    }
    return [lines.join('\n')]
  })
  return `${blocks.join('\n\n')}\n`
}

export function parseHeadcountCsv(
  text: string,
  sets: HeadcountSegmentSet[],
): { ok: true; rows: HeadcountRow[] } | { ok: false; errors: HeadcountCsvError[] } {
  const table = parseCsv(text.replace(/^\uFEFF/, ''))
  const errors: HeadcountCsvError[] = []
  const sections: { index: number; lines: { cells: string[]; rowNumber: number }[] }[] = []
  let current: (typeof sections)[number] | null = null
  let rowNumber = 0
  for (const cells of table) {
    rowNumber += 1
    if (cells.every((cell) => cell.trim() === '')) continue
    const title = cells[0]?.trim() ?? ''
    if (/^set\s+\d+$/i.test(title) && cells.slice(1).every((cell) => cell.trim() === '')) {
      current = { index: Number.parseInt(title.replace(/\D/g, ''), 10), lines: [] }
      sections.push(current)
      continue
    }
    if (!current) {
      errors.push({ row: rowNumber, message: 'Start each block with a line like Set 1.' })
      continue
    }
    current.lines.push({ cells, rowNumber })
  }

  if (sections.length !== sets.length) {
    errors.push({ row: 1, message: `The file needs ${sets.length} set${sets.length === 1 ? '' : 's'}, matching the template.` })
  }

  const rows: HeadcountRow[] = []
  sections.forEach((section) => {
    const set = sets[section.index - 1]
    if (!set) {
      errors.push({ row: section.lines[0]?.rowNumber ?? 1, message: `Set ${section.index} is not in this template.` })
      return
    }
    const fields = fieldsForSet(set)
    const expectedHeaders = [...fields.map((field) => field.title), COUNT_HEADER, EMAIL_HEADER]
    const headerLine = section.lines[0]
    if (!headerLine || !sameHeaders(headerLine.cells.map((cell) => cell.trim().toLowerCase()), expectedHeaders)) {
      errors.push({
        row: headerLine?.rowNumber ?? 1,
        message: `Set ${section.index} columns should be ${expectedHeaders.join(', ')}.`,
      })
      return
    }
    const seen = new Set<string>()
    section.lines.slice(1).forEach(({ cells, rowNumber: lineNumber }) => {
      const countRaw = cells[fields.length]?.trim() ?? ''
      const managerEmail = cells[fields.length + 1]?.trim() ?? ''
      if (isUntouchedRow(countRaw, managerEmail)) return
      const values: Record<string, string> = {}
      fields.forEach((field, fieldIndex) => {
        const value = cells[fieldIndex]?.trim() ?? ''
        if (!field.options.includes(value)) {
          errors.push({ row: lineNumber, message: `${field.title} "${value || 'blank'}" is not one of the selected values.` })
        }
        values[field.key] = value
      })
      pushCountAndEmailErrors(errors, lineNumber, countRaw, managerEmail)
      const key = fields.map((field) => values[field.key] ?? '').join('\u0000')
      if (seen.has(key)) errors.push({ row: lineNumber, message: 'This combination is already in the set.' })
      seen.add(key)
      if (errors.some((error) => error.row === lineNumber)) return
      rows.push({
        setId: set.id,
        values,
        expectedHeadcount: Number.parseInt(countRaw, 10),
        managerEmail,
        qrResponses: 0,
        emailExpected: 0,
        emailResponses: 0,
      })
    })
  })

  if (rows.length === 0 && errors.length === 0) errors.push({ row: 2, message: 'Add at least one segment.' })
  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, rows }
}

export function mergeHeadcountRows(previous: HeadcountRow[] | null, uploaded: HeadcountRow[], sets: HeadcountSegmentSet[]): HeadcountRow[] {
  return uploaded.map((rowItem) => {
    const set = sets.find((item) => item.id === rowItem.setId)
    const fields = set ? fieldsForSet(set) : []
    const match = previous?.find((item) => item.setId === rowItem.setId && rowKey(item, fields) === rowKey(rowItem, fields))
    return {
      ...rowItem,
      qrResponses: match?.qrResponses ?? 0,
      emailExpected: match?.emailExpected ?? 0,
      emailResponses: match?.emailResponses ?? 0,
    }
  })
}

export function cloneCollectorHeadcount(headcount: CollectorHeadcount): CollectorHeadcount {
  return {
    updatedAt: headcount.updatedAt,
    totalExpected: typeof headcount.totalExpected === 'number' ? headcount.totalExpected : null,
    sets: headcount.sets.map((set) => ({
      ...set,
      segmentValues: [...set.segmentValues],
      criteria: set.criteria.map((item) => ({ ...item, values: [...item.values] })),
    })),
    rows: headcount.rows.map((item) => ({ ...item, values: { ...item.values } })),
  }
}

function buildNestedLevel(
  rows: HeadcountRow[],
  fields: HeadcountField[],
  depth: number,
  channel: HeadcountChannel,
  anonymityThreshold: number,
  parentKey: string,
): HeadcountNode[] {
  const field = fields[depth]
  if (!field) return []
  const groups = groupBy(rows, (item) => item.values[field.key] ?? '')
  return [...groups.entries()].map(([label, groupRows]) => {
    const key = `${parentKey}/${field.key}:${label}`
    const children =
      depth < fields.length - 1 ? buildNestedLevel(groupRows, fields, depth + 1, channel, anonymityThreshold, key) : []
    return makeNode(key, label || 'Blank', groupRows, channel, anonymityThreshold, children)
  })
}

function makeNode(
  key: string,
  label: string,
  rows: HeadcountRow[],
  channel: HeadcountChannel,
  anonymityThreshold: number,
  children: HeadcountNode[],
): HeadcountNode {
  const responses = rows.reduce((total, item) => total + channelResponses(item, channel), 0)
  const expected = rows.reduce((total, item) => total + channelExpected(item, channel), 0)
  const hidden = children.length === 0 && responses > 0 && responses < anonymityThreshold
  return {
    key,
    label,
    responses,
    expected,
    rate: rateFor(responses, expected),
    hidden,
    overCapacity: !hidden && expected > 0 && responses > expected,
    children,
  }
}

function channelResponses(rowItem: HeadcountRow, channel: HeadcountChannel): number {
  if (channel === 'email') return rowItem.emailResponses
  if (channel === 'qr') return rowItem.qrResponses
  return rowItem.emailResponses + rowItem.qrResponses
}

function channelExpected(rowItem: HeadcountRow, channel: HeadcountChannel): number {
  if (channel === 'email') return rowItem.emailExpected
  if (channel === 'qr') return rowItem.expectedHeadcount
  return rowItem.emailExpected + rowItem.expectedHeadcount
}

function rateFor(responses: number, expected: number): number {
  if (expected <= 0) return 0
  return Math.round((responses / expected) * 100)
}

function rowKey(rowItem: HeadcountRow, fields: HeadcountField[]): string {
  return fields.map((field) => rowItem.values[field.key] ?? '').join('\u0000')
}

function combinations(fields: HeadcountField[]): Record<string, string>[] {
  return fields.reduce<Record<string, string>[]>((rows, field) => {
    const options = field.options.length > 0 ? field.options : ['']
    if (rows.length === 0) return options.map((option) => ({ [field.key]: option }))
    return rows.flatMap((current) => options.map((option) => ({ ...current, [field.key]: option })))
  }, [])
}

function sameHeaders(actual: string[], expected: string[]): boolean {
  return (
    actual.length === expected.length &&
    expected.every((header, index) => {
      const cell = actual[index]
      if (header.toLowerCase() === COUNT_HEADER.toLowerCase()) {
        return cell === 'expected responses' || cell === 'expected headcount'
      }
      return cell === header.toLowerCase()
    })
  )
}

function isUntouchedRow(countRaw: string, managerEmail: string): boolean {
  return (countRaw === '' || countRaw === '0') && managerEmail === ''
}

function pushCountAndEmailErrors(errors: HeadcountCsvError[], rowNumber: number, countRaw: string, managerEmail: string) {
  if (!/^\d+$/.test(countRaw)) errors.push({ row: rowNumber, message: 'Expected responses must be a whole number, 0 or higher.' })
  if (!EMAIL_PATTERN.test(managerEmail)) errors.push({ row: rowNumber, message: 'Manager email must be a valid email address.' })
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }
  return groups
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let rowCells: string[] = []
  let cell = ''
  let quoted = false
  const source = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"'
          index += 1
        } else quoted = false
      } else cell += char
      continue
    }
    if (char === '"') {
      quoted = true
      continue
    }
    if (char === ',') {
      rowCells.push(cell)
      cell = ''
      continue
    }
    if (char === '\n') {
      rowCells.push(cell)
      rows.push(rowCells)
      rowCells = []
      cell = ''
      continue
    }
    cell += char
  }
  if (cell.length > 0 || rowCells.length > 0) {
    rowCells.push(cell)
    rows.push(rowCells)
  }
  return rows
}
