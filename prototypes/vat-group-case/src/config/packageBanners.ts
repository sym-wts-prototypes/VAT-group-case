/**
 * Data-package banner copy (Figma WTS-ShadCn 15403:3973).
 * Package filenames are per process; status content is per phase × role × state.
 */

import { SAMPLE_PEOPLE } from '@/config/sampleData'
import type { Phase, Process, Role } from '@/types'

export type PackageBannerWorkflowPhase = 'inReview' | 'clientApproval' | 'submitted'

export type PackageBannerState =
  | 'sent'
  | 'requested'
  | 'needChanges'
  | 'approved'
  | 'submitted'

export type PackageBannerVariant = 'purple' | 'amber' | 'green' | 'blue'

export type PackageBannerIcon = 'fileText' | 'filePen' | 'circleCheck' | 'hourglass'

export interface PackageBannerComments {
  label: string
  body: string
}

export interface PackageBannerDescriptor {
  variant: PackageBannerVariant
  icon: PackageBannerIcon
  title: string
  description: string
  /** Omitted entirely (no pill rendered) for banners with no single actor/timestamp to
   * attribute — e.g. the Parent Case's "all child cases ready" banner, which reflects the
   * aggregate state of every Child Case rather than one person's action. */
  meta?: string
  showFooter: boolean
  showVersionHistory: boolean
  comments?: PackageBannerComments
}

const DEMO_TIMESTAMP = '12 Mar 2026, 13:55'

const CREATOR = SAMPLE_PEOPLE.creator ?? 'Emma Fischer'
const REVIEWER = SAMPLE_PEOPLE.reviewer ?? 'Patricia Klein'
const CLIENTS = Array.isArray(SAMPLE_PEOPLE.client)
  ? SAMPLE_PEOPLE.client.join(', ')
  : (SAMPLE_PEOPLE.client ?? 'Jan Decker, Clara Meyer')

/** Zip name shown in banner footer — contextual per tax process. */
export function packageFileNameForProcess(process: Process): string {
  const names: Record<Process, string> = {
    cit: '2025 CIT Advance Payment Computation_Package_02_10_2026.zip',
    hr: '2024-2025 HR Wage Tax Audit_Package_02_10_2026.zip',
    vat: 'Q3 2026 VAT Return_Package_02_10_2026.zip',
  }
  return names[process]
}

/** Demo control: mutually exclusive review outcome (drives banner + Approved gate). */
export type PackageReviewOutcome = 'default' | 'needChanges' | 'approved'

export const PACKAGE_REVIEW_OUTCOMES: PackageReviewOutcome[] = [
  'default',
  'needChanges',
  'approved',
]

export const PACKAGE_BANNER_PHASES: PackageBannerWorkflowPhase[] = [
  'inReview',
  'clientApproval',
  'submitted',
]

function metaSentToReviewer(): string {
  return `Request sent to ${REVIEWER} · ${DEMO_TIMESTAMP}`
}

function metaReviewRequested(): string {
  return `Review requested by ${CREATOR} · ${DEMO_TIMESTAMP}`
}

function metaReviewRequestedByReviewer(): string {
  return `Changes requested by ${REVIEWER} · ${DEMO_TIMESTAMP}`
}

function metaApprovedByReviewer(): string {
  return `Approved by ${REVIEWER} · ${DEMO_TIMESTAMP}`
}

function metaSentToClient(): string {
  return `Request sent to ${CLIENTS} · ${DEMO_TIMESTAMP}`
}

function metaChangesByClient(): string {
  return `Changes requested by ${CLIENTS} · ${DEMO_TIMESTAMP}`
}

function metaApprovedByClient(): string {
  return `Approved by ${CLIENTS} · ${DEMO_TIMESTAMP}`
}

function metaSubmittedByCreator(): string {
  return `Submitted by ${CREATOR} · ${DEMO_TIMESTAMP}`
}

type BannerKey = `${PackageBannerWorkflowPhase}:${Role}:${PackageBannerState}`

const BANNERS: Partial<Record<BannerKey, PackageBannerDescriptor>> = {
  /* In Review */
  'inReview:creator:sent': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Sent for internal review',
    description:
      "Your package is with the reviewer. You'll be notified once a decision is made.",
    meta: metaSentToReviewer(),
    showFooter: true,
    showVersionHistory: true,
  },
  'inReview:reviewer:requested': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Awaiting your review',
    description:
      'This package has been submitted for your review. Open it, check the contents, and approve or request changes.',
    meta: metaReviewRequested(),
    showFooter: true,
    showVersionHistory: true,
  },
  'inReview:reviewer:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested',
    description:
      "You've sent your feedback to the creator. They'll update the package and resubmit for your review.",
    meta: metaReviewRequestedByReviewer(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Your comments', body: 'This is a comment' },
  },
  'inReview:reviewer:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved',
    description:
      'You approved this package. The creator can now send it to the client for approval.',
    meta: metaApprovedByReviewer(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Your comments', body: 'This is a comment' },
  },
  'inReview:partner:sent': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Sent for internal review',
    description:
      "The package is with the reviewer. You'll be notified once a decision is made.",
    meta: metaSentToReviewer(),
    showFooter: true,
    showVersionHistory: true,
  },
  'inReview:creator:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested by reviewer',
    description:
      'The reviewer has left feedback. Review the comments, update the package, and resubmit.',
    meta: metaReviewRequestedByReviewer(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Reviewer comments', body: 'This is a comment' },
  },
  'inReview:partner:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested by reviewer',
    description:
      'The reviewer has left feedback. The creator will update the package and resubmit.',
    meta: metaReviewRequestedByReviewer(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Reviewer comments', body: 'This is a comment' },
  },
  'inReview:creator:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved by reviewer',
    description:
      'The package passed internal review. You can now send it to the client for approval.',
    meta: metaApprovedByReviewer(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Reviewer comments', body: 'This is a comment' },
  },
  'inReview:partner:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved by reviewer',
    description:
      'The package passed internal review and can be sent to the client for approval.',
    meta: metaApprovedByReviewer(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Reviewer comments', body: 'This is a comment' },
  },

  /* Client Approval */
  'clientApproval:creator:sent': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Under client review',
    description:
      "Your package is with the client for approval. You'll be notified once they respond.",
    meta: metaSentToClient(),
    showFooter: true,
    showVersionHistory: true,
  },
  'clientApproval:reviewer:sent': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Under client review',
    description:
      "The package is with the client for approval. You'll be notified once they respond.",
    meta: metaSentToClient(),
    showFooter: true,
    showVersionHistory: true,
  },
  'clientApproval:partner:sent': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Under client review',
    description:
      "The package is with the client for approval. You'll be notified once they respond.",
    meta: metaSentToClient(),
    showFooter: true,
    showVersionHistory: true,
  },
  'clientApproval:client:requested': {
    variant: 'purple',
    icon: 'fileText',
    title: 'Awaiting your approval',
    description:
      'A package has been submitted for your sign-off. Please review the contents and approve or request changes.',
    meta: metaReviewRequested(),
    showFooter: true,
    showVersionHistory: true,
  },
  'clientApproval:client:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested',
    description:
      "You've sent your feedback to the team. They'll update the package and resubmit for your approval.",
    meta: metaChangesByClient(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Your comments', body: 'This is a comment' },
  },
  'clientApproval:client:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved',
    description:
      'You approved this package. The team will now submit it to the tax authorities.',
    meta: metaApprovedByClient(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Your comments', body: 'This is a comment' },
  },
  'clientApproval:creator:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested by client',
    description:
      'The client has left feedback. Review their comments, update the package, and resubmit for approval.',
    meta: metaChangesByClient(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
  'clientApproval:reviewer:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested by client',
    description:
      'The client has left feedback. The creator will update the package and resubmit for approval.',
    meta: metaChangesByClient(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
  'clientApproval:partner:needChanges': {
    variant: 'amber',
    icon: 'filePen',
    title: 'Changes requested by client',
    description:
      'The client has left feedback. The creator will update the package and resubmit for approval.',
    meta: metaChangesByClient(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
  'clientApproval:creator:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved by client',
    description:
      'The client has signed off. You can now submit the package to the tax authorities.',
    meta: metaApprovedByClient(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
  'clientApproval:reviewer:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved by client',
    description:
      'The client has signed off. The package can be submitted to the tax authorities.',
    meta: metaApprovedByClient(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },
  'clientApproval:partner:approved': {
    variant: 'green',
    icon: 'circleCheck',
    title: 'Approved by client',
    description:
      'The client has signed off. The package can be submitted to the tax authorities.',
    meta: metaApprovedByClient(),
    showFooter: true,
    showVersionHistory: true,
    comments: { label: 'Client comments', body: 'This is a comment' },
  },

  /* Submission — blue hourglass only (ignore green success variant). */
  'submitted:creator:submitted': {
    variant: 'blue',
    icon: 'hourglass',
    title: 'Submitted to tax authorities',
    description:
      'Filed successfully. Upload the submission receipt when received.',
    meta: metaSubmittedByCreator(),
    showFooter: true,
    showVersionHistory: true,
  },
  'submitted:reviewer:submitted': {
    variant: 'blue',
    icon: 'hourglass',
    title: 'Submitted to tax authorities',
    description:
      'Filed successfully. Upload the submission receipt when received.',
    meta: metaSubmittedByCreator(),
    showFooter: true,
    showVersionHistory: true,
  },
  'submitted:partner:submitted': {
    variant: 'blue',
    icon: 'hourglass',
    title: 'Submitted to tax authorities',
    description:
      'Filed successfully. Upload the submission receipt when received.',
    meta: metaSubmittedByCreator(),
    showFooter: true,
    showVersionHistory: true,
  },
  'submitted:client:submitted': {
    variant: 'blue',
    icon: 'hourglass',
    title: 'Submitted to tax authorities',
    description:
      "Filed successfully. You'll be notified once there's an update from the tax authorities.",
    meta: metaSubmittedByCreator(),
    showFooter: true,
    showVersionHistory: true,
  },
}

export function isPackageBannerPhase(phase: Phase): phase is PackageBannerWorkflowPhase {
  return PACKAGE_BANNER_PHASES.includes(phase as PackageBannerWorkflowPhase)
}

export function getPackageBannerDescriptor(
  phase: PackageBannerWorkflowPhase,
  role: Role,
  state: PackageBannerState,
): PackageBannerDescriptor | null {
  const key = `${phase}:${role}:${state}` as BannerKey
  return BANNERS[key] ?? null
}

export function defaultPackageReviewOutcome(): PackageReviewOutcome {
  return 'default'
}

/** Maps demo radio selection to banner config key. */
export function packageBannerStateFromOutcome(
  phase: PackageBannerWorkflowPhase,
  role: Role,
  outcome: PackageReviewOutcome,
): PackageBannerState {
  if (outcome === 'needChanges') return 'needChanges'
  if (outcome === 'approved') return 'approved'
  if (phase === 'submitted') return 'submitted'
  if (phase === 'inReview' && role === 'reviewer') return 'requested'
  if (phase === 'clientApproval' && role === 'client') return 'requested'
  return 'sent'
}

export function packageReviewOutcomeLabel(
  phase: PackageBannerWorkflowPhase,
  role: Role,
  outcome: PackageReviewOutcome,
): string {
  const isApprover =
    (phase === 'inReview' && role === 'reviewer') ||
    (phase === 'clientApproval' && role === 'client')

  if (outcome === 'needChanges') return 'Need changes'
  if (outcome === 'approved') return 'Approved'

  if (isApprover) return 'Review requested'
  if (phase === 'inReview') return 'Sent for review'
  return 'Under client review'
}

/** Reviewer (In Review) or Client (Client Approval) sets the outcome. */
export function isPackageReviewApprover(
  phase: Phase,
  role: Role,
): boolean {
  return (
    (phase === 'inReview' && role === 'reviewer') ||
    (phase === 'clientApproval' && role === 'client')
  )
}

export function showPackageReviewControls(
  headerType: string,
  platform: string,
  phase: Phase,
): boolean {
  if (headerType !== 'case' || !isPackageBannerPhase(phase)) return false
  if (phase === 'submitted') return false
  return platform === 'wts' || phase === 'clientApproval'
}
