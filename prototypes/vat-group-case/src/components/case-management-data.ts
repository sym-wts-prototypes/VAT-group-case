import type { BadgeTone } from '@wts/ui'

import { shortPeriodLabel } from './case-generation'

// Dummy case dataset for the Case Management page — recreates the reference platform's case
// list (reference/WTS20Platform/src/views/case-management/internal/case-list.tsx) with static
// data. Two shapes: individual `Case`s, and `VatGroupCase`s (an expandable parent whose
// children are themselves full `Case`s — see case-management-page.tsx for how they render).

export type CaseStatus = 'Draft' | 'InPreparation' | 'InReview' | 'ClientApproval' | 'Submission'

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  Draft: 'Draft',
  InPreparation: 'In Preparation',
  InReview: 'In Review',
  ClientApproval: 'Client Approval',
  Submission: 'Submitted',
}

// Mirrors the reference's CaseStatusBadge color mapping, translated to our Badge `tone` prop.
export const CASE_STATUS_TONE: Record<CaseStatus, BadgeTone> = {
  Draft: 'gray',
  InPreparation: 'sky',
  InReview: 'orange',
  ClientApproval: 'orange',
  Submission: 'green',
}

export interface CaseLatestActivity {
  actor: string
  description: string
}

export interface Case {
  id: string
  client: string
  caseName: string
  serviceLine: 'VAT' | 'CIT' | 'HR Tax'
  caseType: string
  frequency: 'Monthly' | 'Quarterly' | 'Yearly'
  jurisdiction: string
  myRole: 'Creator' | 'Reviewer' | 'Partner' | 'Client'
  status: CaseStatus
  statutoryDeadline: string // ISO date
  nextDeadline: string | null // ISO date
  latestActivity: CaseLatestActivity
}

// A VAT Group Case is a parent for one legal entity's registrations across an entire VAT
// group, for one reporting period — each child is a full, normal `Case` (same shape, same
// row rendering), so "resembles a normal individual case" falls out for free.
export interface VatGroupCase {
  kind: 'group'
  id: string
  organisation: string
  // The group's Representative Legal Entity (see org-details-data.ts's `representativeOf`) —
  // shown in the Client column in place of the organisation name, matching how every other
  // row in this column shows a legal entity, not a parent organisation.
  representativeEntity: string
  vatGroupName: string
  reportingPeriod: string
  caseName: string
  serviceLine: 'VAT'
  caseType: string
  frequency: Case['frequency']
  jurisdiction: string
  status: CaseStatus // representative status shown on the collapsed parent row
  statutoryDeadline: string
  nextDeadline: string | null
  children: Case[]
}

export type CaseListItem = Case | VatGroupCase

export const isGroupCase = (item: CaseListItem): item is VatGroupCase =>
  'kind' in item && item.kind === 'group'

// Trimmed to one row per (My role, Status) combination already demonstrated by the previous,
// larger dataset — every status (Draft, In Preparation, In Review, Client Approval, Submitted)
// and all four roles stay reachable as a Playground launcher, including the only Submission
// example (Reviewer), which the "don't remove the only example of a workflow" rule protects.
export const DUMMY_CASES: Case[] = [
  {
    id: 'VAT-DE-2026-0142',
    client: 'EUROPIPE GmbH',
    caseName: 'VAT - VAT return - Q3 2026',
    serviceLine: 'VAT',
    caseType: 'VAT return',
    frequency: 'Quarterly',
    jurisdiction: 'Germany',
    myRole: 'Creator',
    status: 'Draft',
    statutoryDeadline: '2026-10-12',
    nextDeadline: null,
    latestActivity: { actor: 'Maria Fischer', description: 'Reviewer assigned' },
  },
  {
    id: 'CIT-DE-2026-0087',
    client: 'EUROPIPE GmbH',
    caseName: 'CIT - Return - FY2026',
    serviceLine: 'CIT',
    caseType: 'Return',
    frequency: 'Yearly',
    jurisdiction: 'Germany',
    myRole: 'Creator',
    status: 'InPreparation',
    statutoryDeadline: '2026-11-07',
    nextDeadline: '2026-07-26',
    latestActivity: { actor: 'Jordan Miller', description: 'Partner assigned' },
  },
  {
    id: 'VAT-DE-2026-0143',
    client: 'Mülheim Pipecoatings GmbH (MPC)',
    caseName: 'VAT - Preliminary VAT return - Q3 2026',
    serviceLine: 'VAT',
    caseType: 'Preliminary VAT return',
    frequency: 'Quarterly',
    jurisdiction: 'Germany',
    myRole: 'Reviewer',
    status: 'InReview',
    statutoryDeadline: '2026-09-01',
    nextDeadline: null,
    latestActivity: { actor: 'Oscar Wilson', description: 'Client approval requested' },
  },
  {
    id: 'CIT-DE-2026-0055',
    client: 'Electronic Arts GmbH',
    caseName: 'CIT - Return - FY2026',
    serviceLine: 'CIT',
    caseType: 'Return',
    frequency: 'Yearly',
    jurisdiction: 'Germany',
    myRole: 'Partner',
    status: 'ClientApproval',
    statutoryDeadline: '2026-08-15',
    nextDeadline: '2026-07-15',
    latestActivity: { actor: 'Emma Johnson', description: 'Awaiting client sign-off' },
  },
  {
    id: 'VAT-DE-2026-0128',
    client: 'Porsche Consulting GmbH',
    caseName: 'VAT - EC Sales (ECSL) - Q2 2026',
    serviceLine: 'VAT',
    caseType: 'EC Sales (ECSL)',
    frequency: 'Quarterly',
    jurisdiction: 'Germany',
    myRole: 'Reviewer',
    status: 'Submission',
    statutoryDeadline: '2026-07-20',
    nextDeadline: null,
    latestActivity: { actor: 'Noah Davis', description: 'Filed with authority' },
  },
  {
    id: 'CIT-DE-2026-0071',
    client: 'Porsche Werkzeugbau GmbH',
    caseName: 'CIT - Return - FY2026',
    serviceLine: 'CIT',
    caseType: 'Return',
    frequency: 'Yearly',
    jurisdiction: 'Germany',
    myRole: 'Reviewer',
    status: 'ClientApproval',
    statutoryDeadline: '2026-09-30',
    nextDeadline: '2026-07-18',
    latestActivity: { actor: 'Lucas Brown', description: 'Awaiting client sign-off' },
  },
  {
    id: 'VAT-DE-2026-0160',
    client: 'Merck KGaA',
    caseName: 'VAT - Annual VAT return - FY2026',
    serviceLine: 'VAT',
    caseType: 'Annual VAT return',
    frequency: 'Yearly',
    jurisdiction: 'Germany',
    myRole: 'Client',
    status: 'ClientApproval',
    statutoryDeadline: '2026-10-12',
    nextDeadline: '2026-07-20',
    latestActivity: { actor: 'Olivia Taylor', description: 'Client approval requested' },
  },
]

// The DE VAT Group's members — reused for both reporting periods below so every static VAT
// Group Case has the same ~12 Child Cases (a mid-sized group: enough to exercise the Parent
// Case page's legal-entity search/filter without feeling overcrowded). EUROPIPE GmbH is the
// Representative Legal Entity, so it always sits first (see case-management-page.tsx /
// parent-vat-group-case-page.tsx's `isRepresentative` checks, which key off list position +
// name, not an explicit flag on this table).
const DE_VAT_GROUP_MEMBERS: Array<{
  client: string
  jurisdiction: string
  myRole: Case['myRole']
  status: CaseStatus
  actor: string
  description: string
}> = [
  { client: 'EUROPIPE GmbH', jurisdiction: 'Germany', myRole: 'Creator', status: 'InPreparation', actor: 'Maria Fischer', description: 'Data provision pending' },
  { client: 'EUROPIPE Logistics GmbH', jurisdiction: 'Germany', myRole: 'Reviewer', status: 'InReview', actor: 'Jordan Miller', description: 'Reviewer comments added' },
  { client: 'EUROPIPE Poland', jurisdiction: 'Poland', myRole: 'Creator', status: 'Draft', actor: 'Sophie Martin', description: 'Case created' },
  // Reference example for the Parent Case page's "click a Child Case to open it" flow (see
  // parent-vat-group-case-page.tsx's CHILD_CONFIG): Creator has access (myRole matches the
  // Playground's default role) and it skips Client Approval, so opening it always succeeds.
  { client: 'EUROPIPE France', jurisdiction: 'France', myRole: 'Creator', status: 'InPreparation', actor: 'Maria Fischer', description: 'Data provision pending' },
  { client: 'EUROPIPE Manufacturing GmbH', jurisdiction: 'Germany', myRole: 'Creator', status: 'ClientApproval', actor: 'Lucas Brown', description: 'Awaiting client sign-off' },
  { client: 'EUROPIPE Distribution GmbH', jurisdiction: 'Germany', myRole: 'Creator', status: 'InReview', actor: 'Noah Davis', description: 'Reviewer comments added' },
  { client: 'EUROPIPE Trading GmbH', jurisdiction: 'Germany', myRole: 'Creator', status: 'InPreparation', actor: 'Olivia Taylor', description: 'Data provision pending' },
  { client: 'EUROPIPE Holdings GmbH', jurisdiction: 'Germany', myRole: 'Reviewer', status: 'ClientApproval', actor: 'Jordan Miller', description: 'Client approval requested' },
  { client: 'EUROPIPE Engineering GmbH', jurisdiction: 'Germany', myRole: 'Creator', status: 'InPreparation', actor: 'Oscar Wilson', description: 'Data provision pending' },
  { client: 'EUROPIPE Italy', jurisdiction: 'Italy', myRole: 'Creator', status: 'ClientApproval', actor: 'Lucas Brown', description: 'Awaiting client sign-off' },
  { client: 'EUROPIPE Netherlands', jurisdiction: 'Netherlands', myRole: 'Creator', status: 'InReview', actor: 'Noah Davis', description: 'Reviewer comments added' },
  { client: 'EUROPIPE Switzerland', jurisdiction: 'Switzerland', myRole: 'Creator', status: 'InPreparation', actor: 'Oscar Wilson', description: 'Data provision pending' },
]

// Builds one reporting period's parent + children from DE_VAT_GROUP_MEMBERS. `allDraft` mirrors
// the previous data's "second period is all still in Draft" scenario (nothing started yet).
function buildDeVatGroupCase(args: {
  idSuffix: string
  period: number
  year: number
  allDraft?: boolean
}): VatGroupCase {
  const { idSuffix, period, year, allDraft } = args
  const periodMarker = shortPeriodLabel('Monthly', period, year)
  const statutoryDeadline = `${year}-${String(period + 1).padStart(2, '0')}-10`
  const representative = DE_VAT_GROUP_MEMBERS[0]
  // Parent id keeps the 2-digit "01"/"02" suffix; the child id's GRP segment drops the leading
  // zero ("GRP1"/"GRP2") — matches the original, pre-Feature-2 id convention exactly.
  const groupNumber = Number(idSuffix)

  return {
    kind: 'group',
    id: `VATGRP-DE-${year}-${idSuffix}`,
    organisation: 'EUROPIPE',
    representativeEntity: representative.client,
    vatGroupName: 'VAT DE Group',
    reportingPeriod: periodMarker,
    caseName: `${representative.client} - ${periodMarker}`,
    serviceLine: 'VAT',
    caseType: 'Return',
    frequency: 'Monthly',
    jurisdiction: 'Germany',
    status: allDraft ? 'Draft' : representative.status,
    statutoryDeadline,
    nextDeadline: allDraft ? null : '2026-07-22',
    children: DE_VAT_GROUP_MEMBERS.map((member, index) => ({
      id: `VAT-DE-${year}-GRP${groupNumber}-${String(index + 1).padStart(2, '0')}`,
      client: member.client,
      caseName: `${member.client} - ${periodMarker}`,
      serviceLine: 'VAT',
      caseType: 'Return',
      frequency: 'Monthly',
      jurisdiction: member.jurisdiction,
      myRole: member.myRole,
      status: allDraft ? 'Draft' : member.status,
      statutoryDeadline,
      nextDeadline: !allDraft && index === 0 ? '2026-07-22' : !allDraft && index === 3 ? '2026-07-25' : null,
      latestActivity: allDraft
        ? { actor: member.actor, description: 'Case created' }
        : { actor: member.actor, description: member.description },
    })),
  }
}

// Two reporting periods for the same VAT group, demonstrating the repeat-per-period structure —
// January already under way, February not yet started (every case still in Draft).
export const DUMMY_GROUP_CASES: VatGroupCase[] = [
  buildDeVatGroupCase({ idSuffix: '01', period: 1, year: 2026 }),
  buildDeVatGroupCase({ idSuffix: '02', period: 2, year: 2026, allDraft: true }),
]
