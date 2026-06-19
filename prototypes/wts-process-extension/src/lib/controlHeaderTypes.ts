import { headerTypesForRole } from '@/lib/resolveHeader'
import type { HeaderType, Phase, Process, Role } from '@/types'

/** Client does not use the Draft workflow stage in the demo controls. */
export function isPhaseDisabledInControls(phase: Phase, role: Role): boolean {
  return role === 'client' && phase === 'draft'
}

export function defaultPhaseForControls(role: Role): Phase {
  return role === 'client' ? 'inPreparation' : 'draft'
}

/** Whether a header type pill is disabled in the playground controls. */
export function isHeaderTypeDisabledInControls(
  headerType: HeaderType,
  process: Process,
  role: Role,
  phase: Phase,
): boolean {
  if (
    headerType === 'requirementList' &&
    (process === 'cit' || process === 'hr') &&
    phase === 'draft'
  ) {
    return true
  }

  if (headerType === 'case' && role === 'client' && phase === 'draft') {
    return true
  }

  if (
    headerType === 'requirementBucket' &&
    role === 'client' &&
    phase === 'draft'
  ) {
    return true
  }

  return false
}

export function isHeaderTypeAllowedInControls(
  headerType: HeaderType,
  process: Process,
  role: Role,
  phase: Phase,
): boolean {
  if (!headerTypesForRole(process, role).includes(headerType)) return false
  return !isHeaderTypeDisabledInControls(headerType, process, role, phase)
}

/** First header type selectable in controls for the current context. */
export function defaultHeaderTypeForControls(
  process: Process,
  role: Role,
  phase: Phase,
): HeaderType {
  const allowed = headerTypesForRole(process, role).filter((headerType) =>
    isHeaderTypeAllowedInControls(headerType, process, role, phase),
  )
  return allowed[0] ?? 'case'
}
