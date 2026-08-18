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
  // The "Country (of VAT registration)" picked in the Single Case drawer — VAT-only there, so
  // a CIT/HR Tax case never has one (renders as "—" in the Case Management table).
  country?: string
  myRole: 'Creator' | 'Reviewer' | 'Partner' | 'Client'
  status: CaseStatus
  statutoryDeadline: string // ISO date
  nextDeadline: string | null // ISO date
  latestActivity: CaseLatestActivity
  // "Correction Case" ticket — set only on a Child Case created as part of a correction; points
  // back at the original (non-correction) Child Case it was made from, for the link-back element
  // shown on that case's own header (see parent-vat-group-case-page.tsx).
  correctionOfCaseId?: string
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
  // "Correction Case" ticket — set only on a correction parent; points back at the original
  // (non-correction) parent case it was made from. `correctionNumber` names the naming suffix
  // ("/ Correction 1", "/ Correction 2", ...); `reopenedChildIds` are this correction's own
  // `children[].id`s that start at In Preparation — every other child starts Ready for
  // Consolidation (see parent-vat-group-case-page.tsx's CHILD_CONFIG, which reads this list).
  correctionOfCaseId?: string
  correctionNumber?: number
  reopenedChildIds?: string[]
}

export type CaseListItem = Case | VatGroupCase

export const isGroupCase = (item: CaseListItem): item is VatGroupCase =>
  'kind' in item && item.kind === 'group'

// Trimmed to one row per (My role, Status) combination already demonstrated by the previous,
// larger dataset — every status (Draft, In Preparation, In Review, Client Approval, Submitted)
// and all four roles stay reachable as a Playground launcher, including the only Submission
// example (Reviewer), which the "don't remove the only example of a workflow" rule protects.
// serviceLine is independent of that rule (case-management-page.tsx's row-click launchers only
// ever read My role/Status), so Feature 1a rebalances it freely: entries 0-6 are what
// case-management-page.tsx's `allItems` puts on page 1 (mostly VAT, exactly 2 CIT — Creator's
// InPreparation case and Reviewer's ClientApproval case); entries 7-8 are extra CIT/VAT
// variety that lands on page 2 instead. Dates are chosen (Feature 1d) so every Next
// Deadline/Statutory Deadline pill tier shows up somewhere, and EUROPIPE GmbH's three cases
// (VAT Q3 upcoming, VAT Q2 already filed, CIT yearly) read as one coherent entity across
// quarters/service lines rather than random dates.
export const DUMMY_CASES: Case[] = [
  {
    id: 'VAT-DE-2026-0142',
    client: 'EUROPIPE GmbH',
    caseName: 'VAT - VAT return - Q3 2026',
    serviceLine: 'VAT',
    caseType: 'VAT return',
    frequency: 'Quarterly',
    jurisdiction: 'Germany',
    country: 'Germany',
    myRole: 'Creator',
    status: 'Draft',
    statutoryDeadline: '2026-09-10', // green (>7d)
    nextDeadline: '2026-08-25', // yellow (4-7d)
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
    statutoryDeadline: '2026-11-07', // CIT — plain text, no pill (Feature 1c is VAT-only)
    nextDeadline: '2026-08-21', // yellow (4-7d)
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
    country: 'Germany',
    myRole: 'Reviewer',
    status: 'InReview',
    statutoryDeadline: '2026-08-29', // yellow (4-14d)
    nextDeadline: '2026-08-26', // green (>7d)
    latestActivity: { actor: 'Oscar Wilson', description: 'Client approval requested' },
  },
  {
    // Feature 1a — was a CIT case; converted to VAT so page 1 stays "mostly VAT/VAT Group"
    // (My role/Status are all that case-management-page.tsx's launcher reads, so the swap
    // doesn't remove any role/status combination the "don't remove the only example" rule
    // protects).
    id: 'VAT-DE-2026-0155',
    client: 'Electronic Arts GmbH',
    caseName: 'VAT - VAT return - Q3 2026',
    serviceLine: 'VAT',
    caseType: 'VAT return',
    frequency: 'Quarterly',
    jurisdiction: 'Germany',
    country: 'Germany',
    myRole: 'Partner',
    status: 'ClientApproval',
    statutoryDeadline: '2026-08-19', // red (0-3d)
    nextDeadline: '2026-08-20', // orange (2-3d)
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
    country: 'Netherlands',
    myRole: 'Reviewer',
    status: 'Submission',
    statutoryDeadline: '2026-07-20', // overdue (past) — already filed, consistent with Submission
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
    statutoryDeadline: '2026-09-30', // CIT — plain text, no pill
    nextDeadline: '2026-08-05', // overdue (past)
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
    country: 'Germany',
    myRole: 'Client',
    status: 'ClientApproval',
    statutoryDeadline: '2026-09-15', // green (>15d)
    nextDeadline: '2026-08-18', // red (due tomorrow)
    latestActivity: { actor: 'Olivia Taylor', description: 'Client approval requested' },
  },
  // Feature 1a — extra CIT case (page 2, per allItems' interleaving in case-management-page.tsx)
  // opening the CIT scenario from Case Management, same as every other CIT row.
  {
    id: 'CIT-DE-2026-0099',
    client: 'Rheinmetall AG',
    caseName: 'CIT - Return - FY2026',
    serviceLine: 'CIT',
    caseType: 'Return',
    frequency: 'Yearly',
    jurisdiction: 'Germany',
    myRole: 'Reviewer',
    status: 'InPreparation',
    statutoryDeadline: '2026-11-30', // CIT — plain text, no pill
    nextDeadline: '2026-08-17', // red — due today
    latestActivity: { actor: 'Sophie Martin', description: 'Reviewer assigned' },
  },
  // Feature 1d — EUROPIPE GmbH's third case (alongside its Q3 VAT return above and its yearly
  // CIT return): last quarter's VAT return, already filed — same entity, coherent quarter-over-
  // quarter progression rather than an unrelated random date.
  {
    id: 'VAT-DE-2026-0130',
    client: 'EUROPIPE GmbH',
    caseName: 'VAT - VAT return - Q2 2026',
    serviceLine: 'VAT',
    caseType: 'VAT return',
    frequency: 'Quarterly',
    jurisdiction: 'Germany',
    country: 'Germany',
    myRole: 'Creator',
    status: 'Submission',
    statutoryDeadline: '2026-07-10', // overdue (past) — already filed
    nextDeadline: null,
    latestActivity: { actor: 'Maria Fischer', description: 'Filed with authority' },
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
//
// Feature 1d of the "deadline pills & comment notifications" ticket — `statutoryDeadline`/
// `nextDeadline` are explicit args rather than derived from `period`/`year` (the old formula
// always landed in early 2026, months before "today" regardless of when this is viewed) so the
// Case Management table's deadline pills can show deliberate, non-stale tier variety while
// `period`/`year` keep driving the case naming/id ("Jan 2026" etc.) untouched.
function buildDeVatGroupCase(args: {
  idSuffix: string
  period: number
  year: number
  allDraft?: boolean
  statutoryDeadline: string
  nextDeadline: string | null
  /** A second child (index 3, "always accessible" per the comment on DE_VAT_GROUP_MEMBERS) gets
   * its own next deadline so the table shows more than one tier per group — defaults to the
   * parent's own `nextDeadline` when omitted. */
  secondChildNextDeadline?: string | null
}): VatGroupCase {
  const { idSuffix, period, year, allDraft, statutoryDeadline, nextDeadline, secondChildNextDeadline } = args
  const periodMarker = shortPeriodLabel('Monthly', period, year)
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
    nextDeadline: allDraft ? null : nextDeadline,
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
      // Children in the table share the parent's statutory deadline — same VAT group, same
      // filing deadline for every legal entity in it (Feature 1d).
      statutoryDeadline,
      nextDeadline: !allDraft && index === 0 ? nextDeadline : !allDraft && index === 3 ? secondChildNextDeadline ?? nextDeadline : null,
      latestActivity: allDraft
        ? { actor: member.actor, description: 'Case created' }
        : { actor: member.actor, description: member.description },
    })),
  }
}

// Two reporting periods for the same VAT group, demonstrating the repeat-per-period structure —
// January already under way (statutory deadline in the yellow band, next deadline orange), and
// February not yet started (every case still in Draft; statutory deadline further out, green).
export const DUMMY_GROUP_CASES: VatGroupCase[] = [
  buildDeVatGroupCase({
    idSuffix: '01',
    period: 1,
    year: 2026,
    statutoryDeadline: '2026-08-27',
    nextDeadline: '2026-08-20',
    secondChildNextDeadline: '2026-08-22',
  }),
  buildDeVatGroupCase({
    idSuffix: '02',
    period: 2,
    year: 2026,
    allDraft: true,
    statutoryDeadline: '2026-09-06',
    nextDeadline: null,
  }),
]

// "Correction Case" ticket, Segment 3 — builds a new parent case that re-references every one
// of `original`'s children: the ones in `reopenChildIds` (by their ORIGINAL id) start over at
// In Preparation, everyone else is already Ready for Consolidation (their original filing still
// stands). Scoped to exactly the one period `original` belongs to — building a correction from,
// say, the January group case never touches February's own separate `VatGroupCase` object.
export function buildCorrectionCase(
  original: VatGroupCase,
  args: { reopenChildIds: string[]; correctionNumber: number },
): VatGroupCase {
  const { reopenChildIds, correctionNumber } = args
  const suffix = ` / Correction ${correctionNumber}`
  const reopenSet = new Set(reopenChildIds)
  const newReopenedChildIds: string[] = []

  const children: Case[] = original.children.map((child) => {
    const isReopened = reopenSet.has(child.id)
    const newId = `${child.id}-C${correctionNumber}`
    if (isReopened) newReopenedChildIds.push(newId)
    return {
      ...child,
      id: newId,
      caseName: `${child.caseName}${suffix}`,
      status: isReopened ? 'InPreparation' : 'Submission',
      correctionOfCaseId: child.id,
    }
  })

  return {
    ...original,
    id: `${original.id}-C${correctionNumber}`,
    caseName: `${original.caseName}${suffix}`,
    status: 'InPreparation',
    children,
    correctionOfCaseId: original.id,
    correctionNumber,
    reopenedChildIds: newReopenedChildIds,
  }
}

// Segment 8 — one permanent demo correction, built from the January group case (PARENT_CASE in
// parent-vat-group-case-page.tsx) so it's reachable any time via the Playground's Regular/
// Correction toggle (Segment 9), with nothing to click through first. Reopens the Representative
// (index 0) and EUROPIPE France (index 3) — 2 of 12 — matching the ticket's own "10 of 12"
// example exactly; both are also in the "always accessible" demo set (see
// ALWAYS_ACCESSIBLE_CHILD_CLIENTS), so this correction's reopened children are always openable
// regardless of which Playground role is currently selected.
export const CORRECTION_PARENT_CASE: VatGroupCase = buildCorrectionCase(DUMMY_GROUP_CASES[0], {
  reopenChildIds: [DUMMY_GROUP_CASES[0].children[0].id, DUMMY_GROUP_CASES[0].children[3].id],
  correctionNumber: 1,
})

// Segment 3 — "In Case Management, the new parent + child cases appear as NEW, In Progress like
// other cases." Appended (not spliced in) so DUMMY_GROUP_CASES[0]/[1]'s indices — read
// elsewhere by index (e.g. parent-vat-group-case-page.tsx's `PARENT_CASE`) — stay stable.
DUMMY_GROUP_CASES.push(CORRECTION_PARENT_CASE)
