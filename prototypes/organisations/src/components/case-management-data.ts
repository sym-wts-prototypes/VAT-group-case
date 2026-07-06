import type { BadgeTone } from '@wts/ui'

import { countryCodeFor } from './org-details-data'

// Dummy individual-case dataset for the Case Management page — recreates the reference
// platform's case list (reference/WTS20Platform/src/views/case-management/internal/case-list.tsx)
// with static data. Group cases are intentionally out of scope for this first pass; keep this
// module additive (a `groupCases` sibling array + a merge point in the page) so they can be
// added later without restructuring the page.

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
  myRole: 'Creator' | 'Reviewer' | 'Partner'
  status: CaseStatus
  statutoryDeadline: string // ISO date
  nextDeadline: string | null // ISO date
  latestActivity: CaseLatestActivity
}

// Dependency-free flag: no need to pull in a flag-icon package for a handful of emoji flags.
export function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

export function jurisdictionFlag(country: string): string {
  return flagEmoji(countryCodeFor(country))
}

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
    id: 'VAT-FR-2027-0021',
    client: 'Rohr Logistik France SAS',
    caseName: 'VAT - Return - Q1 2027',
    serviceLine: 'VAT',
    caseType: 'Return',
    frequency: 'Quarterly',
    jurisdiction: 'France',
    myRole: 'Creator',
    status: 'Draft',
    statutoryDeadline: '2027-01-11',
    nextDeadline: null,
    latestActivity: { actor: 'Sophie Martin', description: 'Requirement added' },
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
    id: 'VAT-DE-2026-0144',
    client: 'Porsche Werkzeugbau GmbH',
    caseName: 'VAT - Return - Q3 2026',
    serviceLine: 'VAT',
    caseType: 'Return',
    frequency: 'Quarterly',
    jurisdiction: 'Germany',
    myRole: 'Creator',
    status: 'Draft',
    statutoryDeadline: '2026-10-06',
    nextDeadline: null,
    latestActivity: { actor: 'Lucas Brown', description: 'Reviewer assigned' },
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
    id: 'VAT-DE-2026-0151',
    client: 'Merck KGaA',
    caseName: 'VAT - Return - Jul 2026',
    serviceLine: 'VAT',
    caseType: 'Return',
    frequency: 'Monthly',
    jurisdiction: 'Germany',
    myRole: 'Creator',
    status: 'InPreparation',
    statutoryDeadline: '2026-08-10',
    nextDeadline: '2026-07-25',
    latestActivity: { actor: 'Olivia Taylor', description: 'Data provision pending' },
  },
  {
    id: 'CIT-DE-2027-0009',
    client: 'Merck Healthcare Germany GmbH',
    caseName: 'CIT - Return - FY2026',
    serviceLine: 'CIT',
    caseType: 'Return',
    frequency: 'Yearly',
    jurisdiction: 'Germany',
    myRole: 'Creator',
    status: 'Draft',
    statutoryDeadline: '2027-01-06',
    nextDeadline: null,
    latestActivity: { actor: 'Maria Fischer', description: 'Case created' },
  },
  {
    id: 'VAT-DE-2026-0139',
    client: 'SMR Automotive Mirror Systems GmbH',
    caseName: 'VAT - Return - Q3 2026',
    serviceLine: 'VAT',
    caseType: 'Return',
    frequency: 'Quarterly',
    jurisdiction: 'Germany',
    myRole: 'Reviewer',
    status: 'InReview',
    statutoryDeadline: '2026-09-15',
    nextDeadline: null,
    latestActivity: { actor: 'Jordan Miller', description: 'Reviewer comments added' },
  },
  {
    id: 'HR-DE-2026-0011',
    client: 'EUROPIPE GmbH',
    caseName: 'HR Tax - Audit - FY2026',
    serviceLine: 'HR Tax',
    caseType: 'Audit',
    frequency: 'Yearly',
    jurisdiction: 'Germany',
    myRole: 'Creator',
    status: 'Draft',
    statutoryDeadline: '2026-12-01',
    nextDeadline: null,
    latestActivity: { actor: 'Sophie Martin', description: 'Case created' },
  },
  {
    id: 'VAT-PL-2026-0033',
    client: 'Rohr Serwis Polska Sp. z o.o.',
    caseName: 'VAT - Return - Q4 2026',
    serviceLine: 'VAT',
    caseType: 'Return',
    frequency: 'Quarterly',
    jurisdiction: 'Poland',
    myRole: 'Creator',
    status: 'Draft',
    statutoryDeadline: '2026-11-20',
    nextDeadline: null,
    latestActivity: { actor: 'Noah Davis', description: 'Requirement added' },
  },
]
