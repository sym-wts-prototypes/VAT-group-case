import type { BadgeTone } from '@wts/ui'

import { countryCodeFor } from './org-details-data'

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

// Dependency-free flag: no need to pull in a flag-icon package for a handful of emoji flags.
export function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

export function jurisdictionFlag(country: string): string {
  return flagEmoji(countryCodeFor(country))
}

// Trimmed to one row per (My role, Status) combination already demonstrated by the previous,
// larger dataset — every status (Draft, In Preparation, In Review, Client Approval, Submitted)
// and all four roles stay reachable as a Playground launcher, including the only Submission
// example (Reviewer), which the "don't remove the only example of a workflow" rule protects.
export const DUMMY_CASES: Case[] = [
  {
    id: 'VAT-DE-2026-0142',
    client: 'EUROPIPE GmbH',
    caseName: 'VAT - Return - Q3 2026',
    serviceLine: 'VAT',
    caseType: 'Return',
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
    caseName: 'VAT - Return - Q3 2026',
    serviceLine: 'VAT',
    caseType: 'Return',
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
    caseName: 'VAT - Return - Q2 2026',
    serviceLine: 'VAT',
    caseType: 'Return',
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
    caseName: 'VAT - Return - Q3 2026',
    serviceLine: 'VAT',
    caseType: 'Return',
    frequency: 'Quarterly',
    jurisdiction: 'Germany',
    myRole: 'Client',
    status: 'ClientApproval',
    statutoryDeadline: '2026-10-12',
    nextDeadline: '2026-07-20',
    latestActivity: { actor: 'Olivia Taylor', description: 'Client approval requested' },
  },
]

// Two reporting periods for the same VAT group, demonstrating the repeat-per-period structure.
export const DUMMY_GROUP_CASES: VatGroupCase[] = [
  {
    kind: 'group',
    id: 'VATGRP-DE-2026-01',
    organisation: 'EUROPIPE',
    representativeEntity: 'EUROPIPE GmbH',
    vatGroupName: 'VAT DE Group',
    reportingPeriod: 'January 2026',
    caseName: 'VAT Group Case — VAT DE Group — January',
    serviceLine: 'VAT',
    caseType: 'Return',
    frequency: 'Monthly',
    jurisdiction: 'Germany',
    status: 'InPreparation',
    statutoryDeadline: '2026-02-10',
    nextDeadline: '2026-07-22',
    children: [
      {
        id: 'VAT-DE-2026-GRP1-01',
        client: 'EUROPIPE GmbH',
        caseName: 'VAT - Return - Jan 2026',
        serviceLine: 'VAT',
        caseType: 'Return',
        frequency: 'Monthly',
        jurisdiction: 'Germany',
        myRole: 'Creator',
        status: 'InPreparation',
        statutoryDeadline: '2026-02-10',
        nextDeadline: '2026-07-22',
        latestActivity: { actor: 'Maria Fischer', description: 'Data provision pending' },
      },
      {
        id: 'VAT-DE-2026-GRP1-02',
        client: 'EUROPIPE Logistics GmbH',
        caseName: 'VAT - Return - Jan 2026',
        serviceLine: 'VAT',
        caseType: 'Return',
        frequency: 'Monthly',
        jurisdiction: 'Germany',
        myRole: 'Reviewer',
        status: 'InReview',
        statutoryDeadline: '2026-02-10',
        nextDeadline: null,
        latestActivity: { actor: 'Jordan Miller', description: 'Reviewer comments added' },
      },
      {
        id: 'VAT-DE-2026-GRP1-03',
        client: 'EUROPIPE Poland',
        caseName: 'VAT - Return - Jan 2026',
        serviceLine: 'VAT',
        caseType: 'Return',
        frequency: 'Monthly',
        jurisdiction: 'Poland',
        myRole: 'Creator',
        status: 'Draft',
        statutoryDeadline: '2026-02-10',
        nextDeadline: null,
        latestActivity: { actor: 'Sophie Martin', description: 'Case created' },
      },
    ],
  },
  {
    kind: 'group',
    id: 'VATGRP-DE-2026-02',
    organisation: 'EUROPIPE',
    representativeEntity: 'EUROPIPE GmbH',
    vatGroupName: 'VAT DE Group',
    reportingPeriod: 'February 2026',
    caseName: 'VAT Group Case — VAT DE Group — February',
    serviceLine: 'VAT',
    caseType: 'Return',
    frequency: 'Monthly',
    jurisdiction: 'Germany',
    status: 'Draft',
    statutoryDeadline: '2026-03-10',
    nextDeadline: null,
    children: [
      {
        id: 'VAT-DE-2026-GRP2-01',
        client: 'EUROPIPE GmbH',
        caseName: 'VAT - Return - Feb 2026',
        serviceLine: 'VAT',
        caseType: 'Return',
        frequency: 'Monthly',
        jurisdiction: 'Germany',
        myRole: 'Creator',
        status: 'Draft',
        statutoryDeadline: '2026-03-10',
        nextDeadline: null,
        latestActivity: { actor: 'Maria Fischer', description: 'Case created' },
      },
      {
        id: 'VAT-DE-2026-GRP2-02',
        client: 'EUROPIPE Logistics GmbH',
        caseName: 'VAT - Return - Feb 2026',
        serviceLine: 'VAT',
        caseType: 'Return',
        frequency: 'Monthly',
        jurisdiction: 'Germany',
        myRole: 'Creator',
        status: 'Draft',
        statutoryDeadline: '2026-03-10',
        nextDeadline: null,
        latestActivity: { actor: 'Sophie Martin', description: 'Case created' },
      },
      {
        id: 'VAT-DE-2026-GRP2-03',
        client: 'EUROPIPE Poland',
        caseName: 'VAT - Return - Feb 2026',
        serviceLine: 'VAT',
        caseType: 'Return',
        frequency: 'Monthly',
        jurisdiction: 'Poland',
        myRole: 'Creator',
        status: 'Draft',
        statutoryDeadline: '2026-03-10',
        nextDeadline: null,
        latestActivity: { actor: 'Sophie Martin', description: 'Case created' },
      },
    ],
  },
]
