import type { DirectoryCustomField } from '@/data/mock-custom-fields'
import { getReport360Subjects, evaluatorTotal, type Report360Subject } from '@/data/mock-360-reports'
import { mockSurvey360Deployments, type Survey360Deployment } from '@/data/mock/survey360Deployments'

export type Survey360ExportRow = {
  deploymentId: string
  deploymentName: string
  subjectId: string
  subjectName: string
  role: string
  responses: number
  overallScore: number
  customFields: Record<string, string>
}

function fieldValue(field: DirectoryCustomField, index: number): string {
  if (field.options.length === 0) return ''
  return field.options[index % field.options.length] ?? ''
}

function deploymentsForSubject(index: number, deployments: Survey360Deployment[]): Survey360Deployment[] {
  if (deployments.length === 0) return []
  const primary = deployments[index % deployments.length]
  if (deployments.length === 1 || index % 2 === 1) return [primary]
  const second = deployments[(index + 1) % deployments.length]
  return [primary, second]
}

export function buildSurvey360ExportRows(
  surveyId: string,
  fields: DirectoryCustomField[],
  deployments: Survey360Deployment[] = mockSurvey360Deployments,
): Survey360ExportRow[] {
  const subjects = getReport360Subjects(surveyId)
  return subjects.flatMap((subject, index) =>
    deploymentsForSubject(index, deployments).map((deployment) =>
      rowFor(subject, deployment, fields, index),
    ),
  )
}

function rowFor(
  subject: Report360Subject,
  deployment: Survey360Deployment,
  fields: DirectoryCustomField[],
  index: number,
): Survey360ExportRow {
  const customFields: Record<string, string> = {}
  fields.forEach((field, fieldIndex) => {
    customFields[field.key] = fieldValue(field, index + fieldIndex)
  })
  return {
    deploymentId: deployment.id,
    deploymentName: deployment.name,
    subjectId: subject.id,
    subjectName: subject.name,
    role: subject.role,
    responses: evaluatorTotal(subject),
    overallScore: subject.baselineScore,
    customFields,
  }
}

export function filterSurvey360ExportRows(
  rows: Survey360ExportRow[],
  filters: {
    deploymentIds: string[]
    subjectId: string
    fieldValues: Record<string, string[]>
  },
): Survey360ExportRow[] {
  return rows.filter((row) => {
    if (!filters.deploymentIds.includes(row.deploymentId)) return false
    if (filters.subjectId && row.subjectId !== filters.subjectId) return false
    return Object.entries(filters.fieldValues).every(([key, values]) => {
      if (values.length === 0) return true
      return values.includes(row.customFields[key] ?? '')
    })
  })
}
