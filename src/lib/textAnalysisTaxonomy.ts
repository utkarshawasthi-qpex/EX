import type { TaxonomyIndustry, TaxonomyTopic } from '@/data/mock/textAnalysisTaxonomy'

function nextId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  cells.push(current.trim())
  return cells
}

function findIndustry(industries: TaxonomyIndustry[], name: string) {
  const needle = name.toLowerCase()
  return industries.find((industry) => industry.name.toLowerCase() === needle)
}

function findTopic(industry: TaxonomyIndustry, name: string) {
  const needle = name.toLowerCase()
  return industry.topics.find((topic) => topic.name.toLowerCase() === needle)
}

export function countTaxonomy(industries: TaxonomyIndustry[]) {
  return industries.reduce(
    (counts, industry) => {
      counts.industries += 1
      counts.topics += industry.topics.length
      counts.subTopics += industry.topics.reduce((sum, topic) => sum + topic.subTopics.length, 0)
      return counts
    },
    { industries: 0, topics: 0, subTopics: 0 },
  )
}

export function addIndustry(industries: TaxonomyIndustry[], name: string): TaxonomyIndustry[] {
  const trimmed = name.trim()
  if (!trimmed) return industries
  if (findIndustry(industries, trimmed)) return industries
  return [...industries, { id: nextId('ind'), name: trimmed, topics: [] }]
}

export function addTopic(
  industries: TaxonomyIndustry[],
  industryId: string,
  name: string,
): TaxonomyIndustry[] {
  const trimmed = name.trim()
  if (!trimmed) return industries
  return industries.map((industry) => {
    if (industry.id !== industryId) return industry
    if (findTopic(industry, trimmed)) return industry
    const topic: TaxonomyTopic = { id: nextId('top'), name: trimmed, subTopics: [] }
    return { ...industry, topics: [...industry.topics, topic] }
  })
}

export function addSubTopic(
  industries: TaxonomyIndustry[],
  industryId: string,
  topicId: string,
  name: string,
): TaxonomyIndustry[] {
  const trimmed = name.trim()
  if (!trimmed) return industries
  return industries.map((industry) => {
    if (industry.id !== industryId) return industry
    return {
      ...industry,
      topics: industry.topics.map((topic) => {
        if (topic.id !== topicId) return topic
        if (topic.subTopics.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
          return topic
        }
        return {
          ...topic,
          subTopics: [...topic.subTopics, { id: nextId('sub'), name: trimmed }],
        }
      }),
    }
  })
}

export function removeIndustry(industries: TaxonomyIndustry[], industryId: string) {
  return industries.filter((industry) => industry.id !== industryId)
}

export function removeTopic(industries: TaxonomyIndustry[], industryId: string, topicId: string) {
  return industries.map((industry) =>
    industry.id === industryId
      ? { ...industry, topics: industry.topics.filter((topic) => topic.id !== topicId) }
      : industry,
  )
}

export function removeSubTopic(
  industries: TaxonomyIndustry[],
  industryId: string,
  topicId: string,
  subTopicId: string,
) {
  return industries.map((industry) => {
    if (industry.id !== industryId) return industry
    return {
      ...industry,
      topics: industry.topics.map((topic) =>
        topic.id === topicId
          ? { ...topic, subTopics: topic.subTopics.filter((item) => item.id !== subTopicId) }
          : topic,
      ),
    }
  })
}

export type ParsedTaxonomyRow = {
  industry: string
  topic?: string
  subTopic?: string
}

export function parseTaxonomyCsv(text: string): ParsedTaxonomyRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return []

  const first = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase())
  const hasHeader =
    first[0] === 'industry' || first.includes('topic') || first.includes('sub-topic') || first.includes('subtopic')
  const dataLines = hasHeader ? lines.slice(1) : lines

  return dataLines
    .map((line) => {
      const [industry, topic, subTopic] = splitCsvLine(line)
      return {
        industry,
        topic: topic || undefined,
        subTopic: subTopic || undefined,
      }
    })
    .filter((row) => Boolean(row.industry))
}

export function mergeTaxonomyRows(
  industries: TaxonomyIndustry[],
  rows: ParsedTaxonomyRow[],
): TaxonomyIndustry[] {
  let next = industries
  rows.forEach((row) => {
    next = addIndustry(next, row.industry)
    const industry = findIndustry(next, row.industry)
    if (!industry || !row.topic) return
    next = addTopic(next, industry.id, row.topic)
    const topic = findTopic(findIndustry(next, row.industry) ?? industry, row.topic)
    if (!topic || !row.subTopic) return
    next = addSubTopic(next, industry.id, topic.id, row.subTopic)
  })
  return next
}
