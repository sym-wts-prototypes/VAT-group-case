/**
 * Core domain types.
 *
 * Whenever you add a new role / process / phase / header type / platform,
 * extend the literal union here first - the rest of the app is keyed off
 * these unions and TypeScript will tell you everywhere that needs an update.
 */

export type Process = 'cit' | 'hr' | 'vat'

export type Role = 'creator' | 'reviewer' | 'partner' | 'client'

export type Platform = 'wts' | 'client'

export type HeaderType =
  | 'caseWrapper'
  | 'case'
  | 'requirementList'
  | 'requirementBucket'

/**
 * Phases are intentionally broad - a phase only makes sense for a given
 * (process, headerType). Validity is encoded in src/config/phases.ts.
 *
 * The naming convention is "verb-noun" so phases read like states of a
 * case rather than UI labels (those live in PHASE_LABELS).
 */
export type Phase =
  | 'draft'
  | 'inPreparation'
  | 'inReview'
  | 'clientApproval'
  | 'submitted'
  | 'assessmentClosure'
  | 'summary'
  | 'done'
  | 'archived'
  | 'open'
  | 'inProgress'
  | 'completed'

import type { BadgeTone } from '@wts/ui'
export type { BadgeTone }

export type IconName =
  | 'ArrowRight'
  | 'ArrowLeft'
  | 'Send'
  | 'Check'
  | 'CheckCheck'
  | 'ListChecks'
  | 'Plus'
  | 'BellRing'
  | 'MessageSquareText'
  | 'PencilLine'
  | 'Calendar'
  | 'Circle'
  | 'ChevronRight'

export type ButtonVariant =
  | 'default'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'brand'

export interface ActionDescriptor {
  label: string
  icon?: IconName
  iconSide?: 'left' | 'right'
  variant?: ButtonVariant
  /** Free-form note for the demo: what this action does in the real app. */
  note?: string
}

/** Figma 5621:75896 — primary split button with menu options. */
export interface NextStepMenuOption {
  label: string
  subtitle?: string
}

export interface NextStepMenuDescriptor {
  label: string
  options: NextStepMenuOption[]
}

export interface BadgeDescriptor {
  label: string
  tone: BadgeTone
}

export interface BreadcrumbDescriptor {
  label: string
  href?: string
  /** Marks the active/last crumb so it renders semibold without a chevron after. */
  current?: boolean
}

export interface PeopleRow {
  creator?: string
  reviewer?: string
  partner?: string | string[]
  client?: string | string[]
}

export interface HeaderTitle {
  /** Three-part title - eg "CIT · Return · FY2026". When set, plain is ignored. */
  parts?: string[]
  /** Single-word title - eg "Requirements" or "General". */
  plain?: string
  /** Smaller subtitle line - eg "Uniper Technologies GmbH". */
  subtitle?: string
  /** Compact code under subtitle - eg "DE999999". */
  subCode?: string
}

/**
 * The single shape every header renders. The header components are dumb
 * and only know how to draw a HeaderDescriptor.
 */
export type BucketStatus = 'notStarted' | 'inProgress' | 'done'

export interface HeaderDescriptor {
  headerType: HeaderType
  breadcrumb?: BreadcrumbDescriptor[]
  backLink?: { label: string; href?: string }
  title: HeaderTitle
  badges?: BadgeDescriptor[]
  /** Client requirement bucket workflow status (Figma soft badge). */
  bucketStatus?: BucketStatus
  people?: PeopleRow
  dueDate?: string
  editable?: boolean
  /** Tooltip shown on the PeopleRow's Edit action, when editable — e.g. to explain scope. */
  editTooltip?: string
  actions: {
    primary?: ActionDescriptor
    /** When set, renders instead of a single primary button (e.g. HR In Review). */
    nextStep?: NextStepMenuDescriptor
    secondary?: ActionDescriptor[]
  }
  /** Optional free-form annotation displayed in dev tooltip - useful for tracking decisions. */
  note?: string
}

/**
 * The lookup context. Resolver consumes this and emits a HeaderDescriptor.
 */
export interface HeaderContext {
  process: Process
  platform: Platform
  role: Role
  headerType: HeaderType
  phase: Phase
}
