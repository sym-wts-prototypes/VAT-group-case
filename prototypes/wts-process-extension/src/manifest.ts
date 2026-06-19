import type { PrototypeManifest } from '@wts/prototype-kit'

/**
 * Pure-data description of this prototype for the gallery (index card, flow
 * canvas layout, Figma export). NO React imports here — the gallery imports
 * this module directly. Screens are rendered by loading `${basePath}#${hash}`.
 *
 * Phase 1 lists a representative CIT creator/reviewer/client flow. Phase 2 will
 * auto-enumerate every valid (process, role, headerType, phase) via the
 * prototype's `isValidContext()` and derive edges from phase order + actions.
 */
const manifest: PrototypeManifest = {
  id: 'wts-process-extension',
  title: 'Process Extension — CIT Assessment & Closure',
  description:
    'Corporate income-tax case workflow across Creator, Reviewer, Partner and Client roles: preparation, maker/checker review, client approval, submission and assessment closure.',
  basePath: '/prototypes/wts-process-extension/',
  defaultHash: 'cit/creator/case/inPreparation',
  flow: {
    screens: [
      { id: 'cit-creator-case-draft', label: 'Draft', hash: 'cit/creator/case/draft', group: 'creator', meta: { role: 'Creator', phase: 'Draft' } },
      { id: 'cit-creator-reqlist-draft', label: 'Requirements (Draft)', hash: 'cit/creator/requirementList/draft', group: 'creator', meta: { role: 'Creator', phase: 'Draft' } },
      { id: 'cit-creator-case-inPreparation', label: 'In Preparation', hash: 'cit/creator/case/inPreparation', group: 'creator', meta: { role: 'Creator', phase: 'In Preparation' } },
      { id: 'cit-creator-case-inReview', label: 'In Review (Creator)', hash: 'cit/creator/case/inReview', group: 'creator', meta: { role: 'Creator', phase: 'In Review' } },
      { id: 'cit-reviewer-case-inReview', label: 'In Review (Reviewer)', hash: 'cit/reviewer/case/inReview', group: 'reviewer', meta: { role: 'Reviewer', phase: 'In Review' } },
      { id: 'cit-creator-case-clientApproval', label: 'Client Approval (Creator)', hash: 'cit/creator/case/clientApproval', group: 'creator', meta: { role: 'Creator', phase: 'Client Approval' } },
      { id: 'cit-client-bucket-clientApproval', label: 'Client Approval (Client)', hash: 'cit/client/requirementBucket/clientApproval', group: 'client', meta: { role: 'Client', phase: 'Client Approval' } },
      { id: 'cit-creator-case-submitted', label: 'Submitted', hash: 'cit/creator/case/submitted', group: 'creator', meta: { role: 'Creator', phase: 'Submitted' } },
      { id: 'cit-creator-case-assessmentClosure', label: 'Assessment Closure', hash: 'cit/creator/case/assessmentClosure', group: 'creator', meta: { role: 'Creator', phase: 'Assessment Closure' } },
      { id: 'cit-creator-case-summary', label: 'Summary', hash: 'cit/creator/case/summary', group: 'creator', meta: { role: 'Creator', phase: 'Summary' } },
    ],
    edges: [
      { from: 'cit-creator-case-draft', to: 'cit-creator-reqlist-draft', label: 'Requirements' },
      { from: 'cit-creator-case-draft', to: 'cit-creator-case-inPreparation', label: 'Start preparation' },
      { from: 'cit-creator-case-inPreparation', to: 'cit-creator-case-inReview', label: 'Send for review' },
      { from: 'cit-creator-case-inReview', to: 'cit-reviewer-case-inReview', label: 'Reviewer opens' },
      { from: 'cit-reviewer-case-inReview', to: 'cit-creator-case-clientApproval', label: 'Approve → client' },
      { from: 'cit-creator-case-clientApproval', to: 'cit-client-bucket-clientApproval', label: 'Client view' },
      { from: 'cit-client-bucket-clientApproval', to: 'cit-creator-case-submitted', label: 'Client approves → submit' },
      { from: 'cit-creator-case-submitted', to: 'cit-creator-case-assessmentClosure', label: 'Assessments arrive' },
      { from: 'cit-creator-case-assessmentClosure', to: 'cit-creator-case-summary', label: 'Close case' },
    ],
  },
}

export default manifest
