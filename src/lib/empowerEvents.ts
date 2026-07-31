/** Dispatched after an Empower mutation so shell-level widgets can recompute. */
export const EMPOWER_DATA_CHANGED_EVENT = 'pp_empower_data_changed'

export function notifyEmpowerDataChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EMPOWER_DATA_CHANGED_EVENT))
}
