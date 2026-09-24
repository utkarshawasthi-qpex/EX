let label = ''
const listeners = new Set<() => void>()

export function setSurveyBuilderCrumb(next: string) {
  label = next
  listeners.forEach((listener) => listener())
}

export function getSurveyBuilderCrumb() {
  return label
}

export function subscribeSurveyBuilderCrumb(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
