import type { Phase, Platform, Process, Role } from '@/types'

export type DraftToolbarAction = 'import' | 'add' | 'requestReview'

export function showDraftRequirementsToolbar(
  process: Process,
  platform: Platform,
  phase: Phase,
  role: Role,
): boolean {
  if (platform === 'client' || role === 'client') return false
  if (phase !== 'draft') return false
  return process === 'cit' || process === 'hr'
}

/** Draft requirements bar — role-gated actions (WTS CIT/HR only). */
export function draftToolbarActionsForRole(
  role: Role,
): DraftToolbarAction[] {
  switch (role) {
    case 'creator':
      return ['import', 'add', 'requestReview']
    case 'reviewer':
      return ['import', 'add']
    case 'partner':
    case 'client':
      return []
    default:
      return []
  }
}
