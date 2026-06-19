/**
 * Demo data used by all headers - lives in one place so a label tweak
 * propagates everywhere.
 */

import type { PeopleRow, Process } from '@/types'

export const SAMPLE_CASE = {
  company: 'Uniper Technologies GmbH',
  vatCode: 'DE999999',
  dueDate: '14.08.2026',
}

/** Demo case IDs — `{PROCESS}-{4-digit}` per tax type. */
export const SAMPLE_CASE_IDS: Record<Process, string> = {
  cit: 'CIT-2847',
  hr: 'HR-0193',
  vat: 'VAT-5612',
}

export const SAMPLE_PEOPLE: PeopleRow = {
  creator: 'Emma Fischer',
  reviewer: 'Patricia Klein',
  partner: ['Amara Weber', 'Jonas Ritter'],
  client: ['Jan Decker', 'Clara Meyer'],
}

export const PROCESS_LABELS: Record<Process, string> = {
  cit: 'CIT',
  hr: 'HR',
  vat: 'VAT',
}

/**
 * The 3-part case title varies by process. CIT is "Return · FYxxxx",
 * VAT is "Return · Q3 2026", HR is "Wage Tax Audit · 2024-2025".
 */
export const SAMPLE_CASE_TITLE: Record<Process, string[]> = {
  cit: ['CIT', 'Return', 'FY2026'],
  hr: ['HR', 'Wage Tax Audit', '2024-2025'],
  vat: ['VAT', 'Return', 'Q3 2026'],
}

/** HR wrapper case ID — `{PROCESS}-{4-digit}`. */
export const SAMPLE_HR_CASE_ID = SAMPLE_CASE_IDS.hr

/** HR audit request ID when a single request is opened. */
export const SAMPLE_HR_REQUEST_ID = 'Audit-0001'

/** Demo request IDs for wrapper case list. */
export const SAMPLE_HR_REQUEST_IDS = [
  'Audit-0001',
  'Audit-0002',
  'Audit-0003',
] as const

/** HR case under a case wrapper — single-line title only. */
export const SAMPLE_HR_CASE_TITLE = 'Audit Request 1'

export const SAMPLE_REQUIREMENT_CATEGORY = 'Requirement Category'
export const SAMPLE_BUCKET_TITLE = 'General'
/** Client bucket header (Figma 5346:112616). */
export const SAMPLE_CLIENT_BUCKET_TITLE = 'Auditor request'
export const SAMPLE_CLIENT_BUCKET_BACK =
  'Back to Kto. Sonstige Beratungsleistungen'
export const SAMPLE_REQUIREMENT_LIST_TITLE = 'Requirements'
export const SAMPLE_CASE_WRAPPER_TITLE = 'HR Engagement 2026'

/** Draft requirement list section header (Figma 8712:52171 / Pro Blocks Section Header). */
export const DRAFT_REQUIREMENT_LIST = {
  title: 'Requirement list',
  subtitle: 'Prepare the requirement list to send to the client.',
} as const

export const CASE_MANAGEMENT_BREADCRUMB = {
  label: 'Case Management',
  href: '#',
}
