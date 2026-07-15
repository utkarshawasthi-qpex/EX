import { ENGAGEMENT_2027_ID, ENGAGEMENT_SURVEY_ID } from '@/data/mock/empowerIntegrationSeed'
import { aggregate } from '@/lib/empowerIntegration/aggregate'
import {
  addNotification,
  getAllInitiativesRaw,
  getOrgSettings,
  saveAllInitiatives,
  saveOrgSettings,
} from '@/lib/empowerIntegration/storage'

function isEngagementSeries(surveyId: string, surveyName: string): boolean {
  return surveyId === ENGAGEMENT_SURVEY_ID || surveyName.toLowerCase().includes('engagement')
}

export function simulateEngagement2027Close(): {
  ok: boolean
  alreadyClosed: boolean
  updatedCount: number
  message: string
} {
  const settings = getOrgSettings()
  if (settings.engagement2027Closed) {
    return { ok: false, alreadyClosed: true, updatedCount: 0, message: '2027 already closed' }
  }

  const now = new Date().toISOString()
  let updatedCount = 0
  const initiatives = getAllInitiativesRaw().map((initiative) => {
    if (!initiative.surveyLink) return initiative
    if (!isEngagementSeries(initiative.surveyLink.surveyId, initiative.surveyLink.surveyName)) {
      return initiative
    }

    const focusExists = aggregate(ENGAGEMENT_2027_ID, initiative.surveyLink.focus, initiative.surveyLink.scope, {
      includeHidden: true,
    })

    if (!focusExists.meetsThreshold) {
      return {
        ...initiative,
        history: [
          ...initiative.history,
          { at: now, event: `Focus not present in Engagement 2027 — latest not computed` },
        ],
      }
    }

    const baseline = initiative.surveyLink.baseline.favorability ?? 0
    const latest = focusExists.favorability ?? baseline
    const delta = latest - baseline

    if (initiative.status === 'completed') {
      return {
        ...initiative,
        history: [
          ...initiative.history,
          { at: now, event: `Final delta at cycle close: ${baseline}% → ${latest}% (${delta >= 0 ? '+' : ''}${delta})` },
        ],
      }
    }

    const updated = {
      ...initiative,
      surveyLink: {
        ...initiative.surveyLink,
        latest: {
          favorability: latest,
          respondentCount: focusExists.respondentCount,
          sourceSurveyId: ENGAGEMENT_2027_ID,
          computedAt: now,
        },
      },
      history: [
        ...initiative.history,
        { at: now, event: `Latest results: ${baseline}% → ${latest}% (${delta >= 0 ? '+' : ''}${delta})` },
      ],
    }

    addNotification({
      message: `New results are in for ${initiative.title}: ${initiative.surveyLink.focus.label} ${baseline}% → ${latest}% (${delta >= 0 ? '+' : ''}${delta})`,
      initiativeId: initiative.id,
      read: false,
      createdAt: now,
    })

    updatedCount += 1
    return updated
  })

  saveAllInitiatives(initiatives)
  saveOrgSettings({ ...settings, engagement2027Closed: true })
  return {
    ok: true,
    alreadyClosed: false,
    updatedCount,
    message: 'Engagement 2027 cycle closed — latest results updated',
  }
}
