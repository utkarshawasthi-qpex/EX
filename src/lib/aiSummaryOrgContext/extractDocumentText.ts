'use client'

import {
  AI_SUMMARY_MIN_EXTRACTED_CHARS,
  AI_SUMMARY_SCANNED_FILE_MIN_BYTES,
  orgContextErrorE2,
} from '@/lib/aiSummaryOrgContext/constants'

export type ExtractedDocument = {
  extractedText: string
  pageCount: number | null
}

function normalizeExtractedText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function getExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  return index >= 0 ? fileName.slice(index).toLowerCase() : ''
}

export function isAcceptedOrgContextFile(file: File): boolean {
  const extension = getExtension(file.name)
  return ['.pdf', '.docx', '.txt', '.md'].includes(extension)
}

async function extractPdfText(file: File): Promise<ExtractedDocument> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const pageCount = pdf.numPages

  if (pageCount > 100) {
    throw new Error(orgContextErrorE2(pageCount))
  }

  const chunks: string[] = []
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
      .join(' ')
    chunks.push(pageText)
  }

  return {
    extractedText: normalizeExtractedText(chunks.join('\n')),
    pageCount,
  }
}

async function extractDocxText(file: File): Promise<ExtractedDocument> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return {
    extractedText: normalizeExtractedText(result.value),
    pageCount: null,
  }
}

async function extractPlainText(file: File): Promise<ExtractedDocument> {
  const text = await file.text()
  return {
    extractedText: normalizeExtractedText(text),
    pageCount: null,
  }
}

export function assertReadableExtractedText(file: File, extractedText: string): void {
  if (file.size > AI_SUMMARY_SCANNED_FILE_MIN_BYTES && extractedText.length < AI_SUMMARY_MIN_EXTRACTED_CHARS) {
    throw new Error(
      "We couldn't read text from this file — it appears to be a scanned image. Upload a text-based version.",
    )
  }
}

export async function extractDocumentText(file: File): Promise<ExtractedDocument> {
  const extension = getExtension(file.name)

  if (extension === '.pdf') {
    return extractPdfText(file)
  }

  if (extension === '.docx') {
    return extractDocxText(file)
  }

  if (extension === '.txt' || extension === '.md') {
    return extractPlainText(file)
  }

  throw new Error('Unsupported file type. Accepted formats: PDF, DOCX, TXT, MD.')
}
