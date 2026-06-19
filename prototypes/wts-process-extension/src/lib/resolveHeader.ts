/**
 * resolveHeader - given a HeaderContext, produce the HeaderDescriptor.
 *
 * Encodes:
 *  - which (process, headerType, role, platform) combinations are valid,
 *  - the merge order across global / process / headerType / phase / role,
 *  - WTS vs Client platform differences in hierarchy & people row.
 */

import { configFor } from '@/config/headers'
import type {
  HeaderContext,
  HeaderDescriptor,
  HeaderType,
  Platform,
  Process,
  Role,
} from '@/types'

/* ---------------------------------------------------------------- *
 *  Validity                                                        *
 * ---------------------------------------------------------------- */

export function platformForRole(role: Role): Platform {
  return role === 'client' ? 'client' : 'wts'
}

/**
 * Header types reachable for (process, platform).
 *
 *  - WTS: caseWrapper? (HR) -> case -> requirementList
 *  - Client: caseWrapper? (HR) -> case -> requirementBucket (no requirement list)
 */
export function headerTypesFor(
  process: Process,
  platform: Platform,
): HeaderType[] {
  const types: HeaderType[] = []
  if (process === 'hr') types.push('caseWrapper')
  types.push('case')
  if (platform === 'wts') types.push('requirementList')
  else types.push('requirementBucket')
  return types
}

export function headerTypesForRole(
  process: Process,
  role: Role,
): HeaderType[] {
  return headerTypesFor(process, platformForRole(role))
}

export function isValidContext(ctx: HeaderContext): boolean {
  if (ctx.headerType === 'caseWrapper' && ctx.process !== 'hr') return false

  if (ctx.role === 'client' && ctx.platform === 'wts') return false
  if (ctx.role !== 'client' && ctx.platform === 'client') return false

  if (ctx.headerType === 'requirementList' && ctx.platform === 'client')
    return false
  if (ctx.headerType === 'requirementBucket' && ctx.platform === 'wts')
    return false

  return true
}

/* ---------------------------------------------------------------- *
 *  Roles                                                           *
 * ---------------------------------------------------------------- */

export const WTS_ROLES: Role[] = ['creator', 'reviewer', 'partner']
export const ALL_ROLES: Role[] = ['creator', 'reviewer', 'partner', 'client']

export function rolesFor(platform: Platform): Role[] {
  return platform === 'wts' ? WTS_ROLES : ['client']
}

/** WTS roles that cannot advance phases or mutate requirements/tasks/files. */
export const READ_ONLY_WTS_ROLES: Role[] = ['reviewer', 'partner']

const WRITE_SECONDARY_LABELS = new Set(['Add requirement'])

/** Requirement list: Send reminder is only allowed in In Preparation. */
function applySendReminderPhaseRule(
  descriptor: HeaderDescriptor,
  ctx: HeaderContext,
): HeaderDescriptor {
  if (ctx.headerType !== 'requirementList') return descriptor
  if (ctx.phase === 'inPreparation') return descriptor

  if (descriptor.actions.primary?.label !== 'Send reminder') return descriptor

  return {
    ...descriptor,
    actions: {
      secondary: descriptor.actions.secondary,
    },
  }
}

/** Requirement list: Add requirement is hidden in In Review and Client Approval. */
function applyAddRequirementPhaseRule(
  descriptor: HeaderDescriptor,
  ctx: HeaderContext,
): HeaderDescriptor {
  if (ctx.headerType !== 'requirementList') return descriptor
  if (ctx.phase !== 'inReview' && ctx.phase !== 'clientApproval') {
    return descriptor
  }

  const secondary = descriptor.actions.secondary?.filter(
    (action) => action.label !== 'Add requirement',
  )

  return {
    ...descriptor,
    actions: {
      ...descriptor.actions,
      secondary: secondary?.length ? secondary : undefined,
    },
  }
}

/** Client: no assignee edit; bucket keeps Comments + Mark as done; case gets Submit review in Client Approval only. */
function applyClientRoleRules(
  descriptor: HeaderDescriptor,
  ctx: HeaderContext,
): HeaderDescriptor {
  if (ctx.role !== 'client') return descriptor

  const readOnly = { ...descriptor, editable: false }

  if (ctx.headerType === 'requirementBucket') {
    return readOnly
  }

  if (ctx.headerType === 'case' && ctx.phase === 'clientApproval') {
    return {
      ...readOnly,
      actions: {
        primary: {
          label: 'Submit review',
          icon: 'Check',
          iconSide: 'right',
          variant: 'default',
        },
      },
    }
  }

  return {
    ...readOnly,
    actions: {},
  }
}

function applyReadOnlyRoleRules(
  descriptor: HeaderDescriptor,
  ctx: HeaderContext,
): HeaderDescriptor {
  if (!READ_ONLY_WTS_ROLES.includes(ctx.role)) return descriptor

  const secondary = descriptor.actions.secondary?.filter(
    (action) => !WRITE_SECONDARY_LABELS.has(action.label),
  )

  const keepPrimary =
    ctx.role === 'reviewer' &&
    ctx.headerType === 'case' &&
    ctx.phase === 'inReview' &&
    descriptor.actions.primary

  return {
    ...descriptor,
    editable: false,
    actions: {
      primary: keepPrimary ? descriptor.actions.primary : undefined,
      secondary: secondary?.length ? secondary : undefined,
    },
  }
}

/* ---------------------------------------------------------------- *
 *  Merge                                                           *
 * ---------------------------------------------------------------- */

type AnyObj = Record<string, unknown>

function isPlainObject(value: unknown): value is AnyObj {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

function deepMerge<T extends AnyObj>(...sources: Array<Partial<T> | undefined>): T {
  const out: AnyObj = {}
  for (const source of sources) {
    if (!source) continue
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) continue
      const existing = out[key]
      if (isPlainObject(existing) && isPlainObject(value)) {
        out[key] = deepMerge(existing as AnyObj, value as AnyObj)
      } else {
        out[key] = value
      }
    }
  }
  return out as T
}

/** Summary phase: read-only header — no primary CTA, due date, or assignee edit. */
function applySummaryPhaseRules(
  descriptor: HeaderDescriptor,
  ctx: HeaderContext,
): HeaderDescriptor {
  if (ctx.phase !== 'summary' || ctx.headerType !== 'case') return descriptor

  return {
    ...descriptor,
    editable: false,
    dueDate: undefined,
    actions: {
      secondary: [
        { label: 'Requirements', icon: 'ListChecks', variant: 'outline' },
      ],
    },
  }
}

export function resolveHeader(ctx: HeaderContext): HeaderDescriptor | null {
  if (!isValidContext(ctx)) return null

  const layers = configFor(ctx)
  const merged = deepMerge<Partial<HeaderDescriptor>>(
    layers.global,
    layers.process,
    layers.headerType,
    layers.phase,
    layers.role,
  )

  const descriptor: HeaderDescriptor = {
    headerType: ctx.headerType,
    title: merged.title ?? { plain: '—' },
    breadcrumb: merged.breadcrumb,
    backLink: merged.backLink,
    badges: merged.badges,
    people: merged.people,
    dueDate: merged.dueDate,
    editable: merged.editable ?? false,
    actions: merged.actions ?? {},
    note: merged.note,
  }
  return applySummaryPhaseRules(
    applyClientRoleRules(
      applySendReminderPhaseRule(
        applyAddRequirementPhaseRule(
          applyReadOnlyRoleRules(descriptor, ctx),
          ctx,
        ),
        ctx,
      ),
      ctx,
    ),
    ctx,
  )
}
