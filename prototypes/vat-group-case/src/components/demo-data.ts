/**
 * Playground dataset provider.
 *
 * The prototype can be viewed with three different seed datasets, chosen from the
 * playground controls:
 *   • empty  — every organisation is a blank slate (no entities/users/groups).
 *   • mixed  — the hand-authored world: EUROPIPE rich, Provinzial empty, others partial.
 *   • full   — every organisation is populated (Provinzial gets a full dataset too).
 *
 * `getDataset(mode)` returns the organisation list plus the per-org seed arrays that
 * `OrgWorkspace` uses to initialise its local state.
 */

import {
  INITIAL_ORGANIZATIONS,
  Organization,
} from './organizations-data'
import {
  ACTIVITY_LOG,
  ActivityLogEntry,
  ENGAGEMENTS,
  Engagement,
  GROUPS,
  Group,
  LEGAL_ENTITIES,
  LegalEntity,
  OrgUser,
  USERS,
  VAT_REGISTRATIONS,
  VatRegistration,
} from './org-details-data'

export type DataMode = 'empty' | 'mixed' | 'full'

/** The per-organisation seed arrays consumed by OrgWorkspace. */
export interface OrgWorkspaceData {
  legalEntities: LegalEntity[]
  engagements: Engagement[]
  users: OrgUser[]
  vatRegistrations: VatRegistration[]
  groups: Group[]
  activityLog: ActivityLogEntry[]
}

export interface DemoDataset extends OrgWorkspaceData {
  organizations: Organization[]
}

/* ─── Provinzial full-mode dataset ─────────────────────────────────────────
   Provinzial is intentionally empty in `mixed` mode (freshly-created org). In
   `full` mode it gets a complete dataset so every organisation has content. */

const PROVINZIAL_ENTITIES: LegalEntity[] = [
  {
    id: 'pr-1', orgId: 'provinzial', legalName: 'Provinzial Holding AG', legalForm: 'AG',
    clientId: 'K700100', vatId: 'DE 811223344', taxAuthority: 'Düsseldorf-Nord', citNumber: 'CIT-DE-700100',
    levelOfShareholding: '100%', incomeTaxGroup: true, vatGroup: true, vatGroupRepresentative: true,
    address: 'Provinzialplatz 1', city: 'Düsseldorf', postalCode: '40591', country: 'Germany', countryCode: 'DE',
    fiscalYearStart: '1 January', fiscalYearEnd: '31 December', type: 'HQ', status: 'Active',
  },
  {
    id: 'pr-2', orgId: 'provinzial', legalName: 'Provinzial Rheinland Leben AG', legalForm: 'AG',
    clientId: 'K700101', vatId: 'DE 811223345', taxAuthority: 'Düsseldorf-Nord', citNumber: 'CIT-DE-700101',
    levelOfShareholding: '90%', incomeTaxGroup: false, vatGroup: true, vatGroupRepresentative: false, vatGroupRepresentativeId: 'pr-1',
    address: 'Provinzialplatz 2', city: 'Düsseldorf', postalCode: '40591', country: 'Germany', countryCode: 'DE',
    fiscalYearStart: '1 January', fiscalYearEnd: '31 December', type: 'Subsidiary', status: 'Active', parentId: 'pr-1',
  },
]

const PROVINZIAL_VAT: VatRegistration[] = [
  { id: 'vat-pr1-de', entityId: 'pr-1', country: 'Germany', vatNumber: 'DE811223344', taxAuthority: 'Düsseldorf-Nord', validFrom: '2018-01-01', validTo: null },
  { id: 'vat-pr2-de', entityId: 'pr-2', country: 'Germany', vatNumber: 'DE811223345', taxAuthority: 'Düsseldorf-Nord', validFrom: '2018-01-01', validTo: null },
]

const PROVINZIAL_ENGAGEMENTS: Engagement[] = [
  { id: 'eng-pr-1', orgId: 'provinzial', contractRef: '70011', serviceLines: [{ serviceLine: 'HR Tax', caseTypes: ['HR Audit Yearly'], frequency: 'Yearly' }], status: 'Active', startDate: '01/01/2026', endDate: null, entityIds: ['pr-1'] },
  { id: 'eng-pr-2', orgId: 'provinzial', contractRef: '70012', serviceLines: [{ serviceLine: 'VAT', caseTypes: ['VAT Return'], frequency: 'Quarterly' }], status: 'Active', startDate: '01/01/2026', endDate: null, entityIds: ['pr-1', 'pr-2'] },
]

const PROVINZIAL_USERS: OrgUser[] = [
  { id: 'u-pr-1', entityIds: ['pr-1', 'pr-2'], name: 'Katrin Bauer', email: 'katrin.bauer@wts.com', userType: 'Internal', role: 'Organisation Admin', roles: ['Organisation Admin'], status: 'Active', invitedBy: 'Super Admin', dateAdded: '2026-07-01' },
  { id: 'u-pr-2', entityIds: ['pr-1'], name: 'Jonas Fischer', email: 'jonas.fischer@provinzial.de', userType: 'External', role: 'Contributor', status: 'Active', invitedBy: 'Katrin Bauer', dateAdded: '2026-07-02' },
  { id: 'u-pr-3', entityIds: ['pr-2'], name: 'Lena Wagner', email: 'lena.wagner@provinzial.de', userType: 'External', role: 'Contributor', status: 'Pending', invitedBy: 'Katrin Bauer', dateAdded: '2026-07-03' },
]

const PROVINZIAL_GROUPS: Group[] = [
  {
    id: 'grp-pr-vat', orgId: 'provinzial', name: 'DE VAT Group', type: 'VAT', jurisdiction: 'Germany',
    members: [
      { entityId: 'pr-1', vatRegistrationId: 'vat-pr1-de', representative: true, validFrom: '2020-01-01', validTo: null },
      { entityId: 'pr-2', vatRegistrationId: 'vat-pr2-de', representative: false, validFrom: '2020-01-01', validTo: null },
    ],
    consolidationCase: { name: 'DE VAT Group — VAT Return', status: 'In preparation', completedCount: 0, totalCount: 2 },
  },
]

const PROVINZIAL_ACTIVITY: ActivityLogEntry[] = [
  { id: 'log-pr-1', orgId: 'provinzial', timestamp: '01.07.2026 09:00', userEmail: 'super.admin@wts.de', legalEntity: 'Provinzial Holding AG', action: 'Created legal entity "Provinzial Holding AG"' },
  { id: 'log-pr-2', orgId: 'provinzial', timestamp: '02.07.2026 10:30', userEmail: 'katrin.bauer@wts.com', legalEntity: '—', action: 'Created engagement 70011' },
  { id: 'log-pr-3', orgId: 'provinzial', timestamp: '03.07.2026 14:15', userEmail: 'katrin.bauer@wts.com', legalEntity: '—', action: 'Created VAT group "DE VAT Group"' },
]

/** Recompute the per-org counts shown on the organisation cards from the seed arrays. */
function withCounts(
  orgs: Organization[],
  entities: LegalEntity[],
  engagements: Engagement[],
): Organization[] {
  return orgs.map((o) => ({
    ...o,
    legalEntities: entities.filter((e) => e.orgId === o.id).length,
    activeEngagements: engagements.filter((e) => e.orgId === o.id && e.status === 'Active').length,
  }))
}

export function getDataset(mode: DataMode): DemoDataset {
  if (mode === 'empty') {
    return {
      organizations: INITIAL_ORGANIZATIONS.map((o) => ({ ...o, legalEntities: 0, activeEngagements: 0 })),
      legalEntities: [],
      engagements: [],
      users: [],
      vatRegistrations: [],
      groups: [],
      activityLog: [],
    }
  }

  if (mode === 'full') {
    const legalEntities = [...LEGAL_ENTITIES, ...PROVINZIAL_ENTITIES]
    const engagements = [...ENGAGEMENTS, ...PROVINZIAL_ENGAGEMENTS]
    const users = [...USERS, ...PROVINZIAL_USERS]
    const vatRegistrations = [...VAT_REGISTRATIONS, ...PROVINZIAL_VAT]
    const groups = [...GROUPS, ...PROVINZIAL_GROUPS]
    const activityLog = [...ACTIVITY_LOG, ...PROVINZIAL_ACTIVITY]
    return {
      organizations: withCounts(INITIAL_ORGANIZATIONS, legalEntities, engagements),
      legalEntities,
      engagements,
      users,
      vatRegistrations,
      groups,
      activityLog,
    }
  }

  // mixed — the hand-authored world, counts left as authored.
  return {
    organizations: INITIAL_ORGANIZATIONS,
    legalEntities: LEGAL_ENTITIES,
    engagements: ENGAGEMENTS,
    users: USERS,
    vatRegistrations: VAT_REGISTRATIONS,
    groups: GROUPS,
    activityLog: ACTIVITY_LOG,
  }
}
