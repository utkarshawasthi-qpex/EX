import { ENGAGEMENT_SURVEY_SERIES_ID } from '@/data/mock/empowerIntegrationSeed'
import { aggregateHiddenSurvey } from '@/lib/empowerIntegration/aggregate'
import {
  addNotification,
  getAllInitiativesRaw,
  getOrgSettings,
  saveAllInitiatives,
  saveOrgSettings,
} from '@/lib/empowerIntegration/storage'
import type { EmpowerInitiativeRecord } from '@/types/empowerIntegration'

const NEXT_CYCLE_SURVEY_ID = 'surv_engagement_2027'

export function simulateEngagement2027Close(): { ok: boolean; message: string } {
  const settings = getOrgSettings()
  if (settings.engagement2027Closed) {
    return { ok: false, message: '2027 already closed' }
  }

  const now = new Date().toISOString()
  const initiatives = getAllInitiativesRaw().map((initiative) => {
    if (!initiative.surveyLink) return initiative
    if (initiative.surveyLink.surveyType !== 'ex') return initiative
    if (initiative.surveyLink.surveyId !== ENGAGEMENT_SURVEY_SERIES_ID) return initiative
    if (initiative.status !== 'active') {
      return appendHistory(initiative, `${now}: Final measurement recorded at cycle close`)
    }

    const result = aggregateHiddenSurvey(
      NEXT_CYCLE_SURVEY_ID,
      initiative.surveyLink.focus,
      initiative.surveyLink.scope,
    )

    if (!result.meetsThreshold) return initiative

    const baselineFavorability = initiative.surveyLink.baseline.favorability ?? 0
    const latestFavorability = result.scores.favorability ?? baselineFavorability
    const delta = latestFavorability - baselineFavorability

    const updated: EmpowerInitiativeRecord = {
      ...initiative,
      surveyLink: {
        ...initiative.surveyLink,
        latest: {
          favorability: latestFavorability,
          respondentCount: result.respondentCount,
          sourceSurveyId: NEXT_CYCLE_SURVEY_ID,
          computedAt: now,
        },
      },
      history: [
        ...initiative.history,
        { at: now, event: `Latest results: ${baselineFavorability}% → ${latestFavorability}% (${delta >= 0 ? '+' : ''}${delta})` },
      ],
    }

    addNotification({
      message: `New results are in for ${initiative.title}: ${initiative.surveyLink.focus.label} ${baselineFavorability}% → ${latestFavorability}% (${delta >= 0 ? '+' : ''}${delta})`,
      initiativeId: initiative.id,
      read: false,
      createdAt: now,
    })

    return updated
  })

  saveAllInitiatives(initiatives)
  saveOrgSettings({ ...settings, engagement2027Closed: true })

  return { ok: true, message: 'Engagement 2027 cycle closed — latest results updated' }
}

function appendHistory(
  initiative: EmpowerInitiativeRecord,
  event: string,
): EmpowerInitiativeRecord {
  return {
    ...initiative,
    history: [...initiative.history, { at: new Date().toISOString(), event }],
  }
}
