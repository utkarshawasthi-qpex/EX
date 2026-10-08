import { Workbook, type CellValue } from 'exceljs'
import {
  headcountTemplateSheets,
  parseHeadcountSheets,
  type HeadcountCsvError,
  type HeadcountRow,
  type HeadcountSegmentSet,
  type HeadcountSheet,
} from '@/data/mock-headcount'

const INSTRUCTIONS_SHEET = 'Instructions'

export async function headcountWorkbookBlob(sets: HeadcountSegmentSet[], existing: HeadcountRow[] | null): Promise<Blob> {
  const workbook = new Workbook()
  for (const sheet of headcountTemplateSheets(sets, existing)) {
    const worksheet = workbook.addWorksheet(sheet.name)
    sheet.lines.forEach((line) => {
      const row = worksheet.getRow(line.rowNumber)
      line.cells.forEach((value, index) => {
        row.getCell(index + 1).value = value
      })
      row.commit()
    })
    worksheet.columns = sheet.lines[0]?.cells.map(() => ({ width: 22 })) ?? []
    if (sheet.name === INSTRUCTIONS_SHEET) {
      worksheet.getCell(1, 1).font = { bold: true, size: 14 }
      await worksheet.protect('template', { selectLockedCells: true, selectUnlockedCells: true })
      continue
    }
    const header = worksheet.getRow(1)
    header.eachCell((cell) => {
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
    })
    const inputColumns = [header.cellCount - 1, header.cellCount]
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      for (const column of inputColumns) {
        worksheet.getCell(rowNumber, column).protection = { locked: false }
      }
    }
    await worksheet.protect('template', { selectLockedCells: true, selectUnlockedCells: true })
  }
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export async function parseHeadcountWorkbook(
  data: ArrayBuffer,
  sets: HeadcountSegmentSet[],
): Promise<{ ok: true; rows: HeadcountRow[] } | { ok: false; errors: HeadcountCsvError[] }> {
  const workbook = new Workbook()
  await workbook.xlsx.load(data)
  const sheets: HeadcountSheet[] = workbook.worksheets.map((worksheet) => {
    const lines: HeadcountSheet['lines'] = []
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const width = Math.max(row.cellCount, worksheet.columnCount)
      const cells: string[] = []
      for (let column = 1; column <= width; column += 1) cells.push(cellText(row.getCell(column).value))
      lines.push({ cells, rowNumber: row.number })
    })
    return { name: worksheet.name, lines }
  })
  return parseHeadcountSheets(sheets, sets)
}

function cellText(value: CellValue): string {
  if (value == null) return ''
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(value)
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && 'text' in value && typeof value.text === 'string') return value.text.trim()
  if (typeof value === 'object' && 'richText' in value && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join('').trim()
  }
  if (typeof value === 'object' && 'result' in value) return cellText(value.result as CellValue)
  return String(value).trim()
}
