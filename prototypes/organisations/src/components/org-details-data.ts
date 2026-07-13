// The single legal entity the User prototype role is scoped to.
export const USER_ENTITY_ID = "eu-2";

export type EntityType = "HQ" | "Subsidiary";
export type EntityStatus = "Active" | "Disabled";
export type UserType = "Internal" | "External";
// Change 3 — platform role hierarchy. "Super Admin" is internal/platform; the two
// admin roles are composable on one user (see OrgUser.roles); Contributor is operational.
export type UserRole = "Super Admin" | "Organisation Admin" | "Engagement Admin" | "Contributor";
export type UserStatus = "Active" | "Pending" | "Rejected";
export type EngagementStatus = "Draft" | "Active" | "Expired" | "Disabled";

// Change 6/7 — a dated value with valid-from / valid-to, so IDs can carry history and a
// future-dated (pending) state. Reuses the same period machinery as group memberships.
export interface DatedId {
  id: string;
  value: string;
  validFrom: string;        // yyyy-mm-dd
  validTo: string | null;   // null = open-ended
}

// Additional Identifiers model. Only NON-tax IDs live here — Client Identifier, DUNS, DATEV,
// plus a "Custom" bucket where the user names the identifier themselves (Internal Ref, etc.).
// The TIN family is handled elsewhere:
//   • TIN CIT — a single scalar per entity (LegalEntity.citNumber), inline in Head Office.
//   • TIN VAT — the VAT registration (VatRegistration.vatNumber), first-class per country.
//   • TIN Wage Tax — deferred (not in scope right now).
// Identifiers carry NO validity / status — they are simple label→value pairs shown plainly.
export type IdentifierType =
  | "Client Identifier"
  | "DUNS"
  | "DATEV"
  | "Custom";

export const IDENTIFIER_TYPES: IdentifierType[] = ["Client Identifier", "DUNS", "DATEV", "Custom"];

export interface EntityIdentifier {
  id: string;
  type: IdentifierType;
  value: string;
  // Only used when type === "Custom" — the user-supplied name (e.g. "Internal Ref").
  label?: string;
}

// Display label for an identifier — the type by default, or the custom label when Custom.
export function identifierLabel(id: EntityIdentifier): string {
  if (id.type === "Custom") return id.label?.trim() || "Custom";
  return id.type;
}

// Branch / establishment (Hauptniederlassung). For a branch, jurisdiction + citNumber are
// mandatory; address & taxAuthority & wageTaxNumber are optional. Jurisdiction is locked to
// the head-office jurisdiction (branches share the entity's tax jurisdiction).
export interface Establishment {
  id?: string;            // stable client-side key for form rows (not persisted meaningfully)
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxAuthority?: string;
  jurisdiction: string;
  citNumber: string;
  wageTaxNumber?: string;  // TIN Wage Tax — optional at the branch level
}

// Engagement scope catalogue: a service line (parent) groups case types (children).
export interface ServiceLine {
  key: string;
  label: string;
  caseTypes: string[];
}

// V10-H — three service lines only: VAT, CIT, HR Tax. Transfer Pricing dropped.
export const SERVICE_CATALOGUE: ServiceLine[] = [
  { key: "VAT", label: "VAT", caseTypes: ["VAT Return", "Annual VAT Return", "EC Sales List", "Intrastat Return"] },
  { key: "CIT", label: "CIT", caseTypes: ["CIT Return Yearly", "CIT Return Quarterly", "Trade Tax Return", "Annual Report"] },
  { key: "HR Tax", label: "HR Tax", caseTypes: ["HR Audit Yearly"] },
];

export interface LegalEntity {
  id: string;
  orgId: string;
  legalName: string;
  legalForm: string;
  clientId: string;           // current client ID (K-side) — see clientIdHistory for dated history
  vatId: string;
  taxAuthority: string;       // Head Office (Hauptsitz) tax authority — typed by the user
  citNumber?: string;         // Head Office TIN CIT
  wageTaxNumber?: string;     // Head Office TIN Wage Tax
  // Change 6/7 — dated ID history. When present, the entity carries multiple values over
  // time (past / current / future-pending). The scalar fields above hold the current value
  // for back-compat; the *History arrays add the valid-from/valid-to audit trail.
  clientIdHistory?: DatedId[];
  citNumberHistory?: DatedId[];
  // Unified TIN / identifier list. When present, it is the source of truth for the Details
  // and Tax Footprint cards; the legacy scalar/history fields above are synthesised into it
  // for entities that pre-date this model.
  identifiers?: EntityIdentifier[];
  establishments?: Establishment[]; // additional branches / establishments (Hauptniederlassung)
  levelOfShareholding?: string;
  incomeTaxGroup?: boolean;
  vatGroup?: boolean;
  vatGroupRepresentative?: boolean;   // "Is VAT Group Representative?"
  vatGroupRepresentativeId?: string;  // selected representative entity id (when not a representative)
  jurisdiction?: string;      // Head Office jurisdiction (defaults to country)
  address: string;            // Head Office address
  city: string;
  postalCode: string;
  country: string;
  countryCode: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  type: EntityType;
  status: EntityStatus;
  parentId?: string;
}

// One Access Scope row: a legal entity → engagements → (Change 2) specific VAT registrations.
export interface AccessScope {
  entityId: string;
  engagementIds: string[];
  // Change 2 — VAT-registration (country) level access, scoped per (user, entity). Explicit,
  // never cascaded from the entity; empty/undefined = not restricted to specific registrations.
  // TODO(open-q-1): registration access is provisionally nested UNDER the engagement here.
  // It is unconfirmed whether it should sit inside an engagement or independently of it —
  // if the latter, lift vatRegistrationIds to its own scope row keyed on (entity, registration).
  vatRegistrationIds?: string[];
}

export interface OrgUser {
  id: string;
  entityIds: string[];
  access?: AccessScope[];  // source of truth for Legal Entity + Engagement + Registration access
  allEntities?: boolean; // WTS super admins have access to every legal entity ("ALL")
  name: string;
  email: string;
  userType: UserType;
  role: UserRole;          // legacy single role — prefer `roles`; kept for back-compat/display fallback
  roles?: UserRole[];      // Change 3 — composable roles (one user may hold both admin roles)
  poolLevel?: "org" | "engagement"; // Change 4 — org-wide pool vs single-engagement user
  canCreateCases?: boolean;         // Change 5 — distinct case-creation right (not universal)
  // Change 5 — country restriction on case creation. "only" = may create cases for these
  // countries; "except" = may create for all but these.
  // TODO(open-q-3): the "only vs except" toggle is provisional — confirm whether the near-term
  // model is a simple allow-list or the two-way toggle before hardening.
  caseCountryScope?: { mode: "only" | "except"; countries: string[] };
  status: UserStatus;
  invitedBy: string;
  dateAdded: string;
}

// Frequency of a service line on an engagement (how often the work recurs).
export type ServiceFrequency = "Monthly" | "Quarterly" | "Yearly";
export const SERVICE_FREQUENCIES: ServiceFrequency[] = ["Monthly", "Quarterly", "Yearly"];

export interface ServiceLineAssignment {
  serviceLine: string;   // key from SERVICE_CATALOGUE (VAT, CIT, HR Tax, …)
  caseTypes: string[];   // selected case types within that service line
  frequency?: ServiceFrequency; // how often this service line recurs (Monthly/Quarterly/Yearly)
}

export interface Engagement {
  id: string;
  orgId: string;
  contractRef: string;
  serviceLines: ServiceLineAssignment[];   // one or more service lines, each with its own case types
  status: EngagementStatus;
  startDate: string;
  endDate: string | null;
  entityIds: string[];
  createdBy?: string;
  lastUpdated?: string;
}

export const LEGAL_ENTITIES: LegalEntity[] = [
  // Electronic Arts
  {
    id: "ea-1", orgId: "ea", legalName: "Electronic Arts GmbH", legalForm: "GmbH",
    clientId: "K110904", vatId: "DE 159933475", taxAuthority: "Köln-Altstadt", citNumber: "CIT-DE-110904",
    // Branches must sit inside the Head Office country (Germany) — a branch can't be in a
    // different jurisdiction than its HQ.
    establishments: [
      { address: "Prinzregentenstraße 22", city: "München", postalCode: "80538", country: "Germany", taxAuthority: "München-Abteilung Körperschaften", jurisdiction: "Germany", citNumber: "CIT-DE-110905" },
    ],
    levelOfShareholding: "100%", incomeTaxGroup: true, vatGroup: false,
    address: "Im Zollhafen 05-07", city: "Köln", postalCode: "50678", country: "Germany", countryCode: "DE",
    fiscalYearStart: "1 April", fiscalYearEnd: "31 March", type: "HQ", status: "Active",
  },
  // EUROPIPE — parent #1 (eu-1 HQ → eu-2 subsidiary). eu-1 holds DE + FR + PL registrations
  // (multi-country VAT). Its Additional Identifiers list (Details card) demonstrates every
  // type available in the "Add number" flow — including a Custom-labelled entry.
  {
    id: "eu-1", orgId: "europipe", legalName: "EUROPIPE GmbH", legalForm: "GmbH",
    clientId: "K204411-N", vatId: "DE 812047551", taxAuthority: "Mülheim an der Ruhr", citNumber: "CIT-DE-204411", wageTaxNumber: "WT-DE-204411",
    levelOfShareholding: "100",
    identifiers: [
      { id: "id-eu1-cid",    type: "Client Identifier", value: "K204411-N" },
      { id: "id-eu1-duns",   type: "DUNS",              value: "31-563-9999" },
      { id: "id-eu1-datev",  type: "DATEV",             value: "77004411" },
      { id: "id-eu1-custom", type: "Custom",            value: "EU-P1-2020", label: "Internal Ref" },
    ],
    vatGroup: true, vatGroupRepresentative: true,
    address: "Pilgerstraße 2", city: "Mülheim an der Ruhr", postalCode: "45473", country: "Germany", countryCode: "DE",
    fiscalYearStart: "1 January", fiscalYearEnd: "31 December", type: "HQ", status: "Active",
  },
  {
    id: "eu-2", orgId: "europipe", legalName: "Mülheim Pipecoatings GmbH (MPC)", legalForm: "GmbH",
    clientId: "K204412", vatId: "DE 812047552", taxAuthority: "Mülheim an der Ruhr", citNumber: "CIT-DE-204412",
    // A realistic fractional shareholding — the field now accepts up to 10 decimals.
    levelOfShareholding: "74.9999999999", incomeTaxGroup: false, vatGroup: true,
    vatGroupRepresentative: false, vatGroupRepresentativeId: "eu-1",
    address: "Pilgerstraße 4", city: "Mülheim an der Ruhr", postalCode: "45473", country: "Germany", countryCode: "DE",
    fiscalYearStart: "1 January", fiscalYearEnd: "31 December", type: "Subsidiary", status: "Active", parentId: "eu-1",
  },
  // EUROPIPE — parent #2 (eu-3 HQ → eu-4, eu-5 subsidiaries). A second parent with its own
  // children within the SAME organisation (Change 8: multiple parents, exactly one level deep).
  {
    id: "eu-3", orgId: "europipe", legalName: "MÜLHEIM Rohr Holding GmbH", legalForm: "GmbH",
    clientId: "K204420", vatId: "DE 812047560", taxAuthority: "Mülheim an der Ruhr", citNumber: "CIT-DE-204420",
    incomeTaxGroup: true,
    address: "Timmerhellstraße 20", city: "Mülheim an der Ruhr", postalCode: "45478", country: "Germany", countryCode: "DE",
    fiscalYearStart: "1 January", fiscalYearEnd: "31 December", type: "HQ", status: "Active",
  },
  {
    id: "eu-4", orgId: "europipe", legalName: "Rohr Logistik France SAS", legalForm: "SE",
    clientId: "K204421", vatId: "FR 40123456789", taxAuthority: "Paris — DGE", citNumber: "CIT-FR-204421",
    levelOfShareholding: "100%", incomeTaxGroup: false,
    address: "12 Rue de la Paix", city: "Paris", postalCode: "75002", country: "France", countryCode: "FR",
    fiscalYearStart: "1 January", fiscalYearEnd: "31 December", type: "Subsidiary", status: "Active", parentId: "eu-3",
  },
  {
    id: "eu-5", orgId: "europipe", legalName: "Rohr Serwis Polska Sp. z o.o.", legalForm: "GmbH",
    clientId: "K204422", vatId: "PL 5261040828", taxAuthority: "Warsaw — First Office", citNumber: "CIT-PL-204422",
    levelOfShareholding: "100%", incomeTaxGroup: false,
    address: "ul. Prosta 51", city: "Warsaw", postalCode: "00-838", country: "Poland", countryCode: "PO",
    fiscalYearStart: "1 January", fiscalYearEnd: "31 December", type: "Subsidiary", status: "Active", parentId: "eu-3",
  },
  // Porsche
  {
    id: "po-1", orgId: "porsche", legalName: "Porsche Werkzeugbau GmbH", legalForm: "GmbH",
    clientId: "K330118", vatId: "DE 727451908", taxAuthority: "Stuttgart-Körperschaften",
    address: "Porschestraße 1", city: "Stuttgart", postalCode: "70435", country: "Germany", countryCode: "DE",
    fiscalYearStart: "1 January", fiscalYearEnd: "31 December", type: "HQ", status: "Active",
  },
  {
    id: "po-2", orgId: "porsche", legalName: "Porsche Consulting GmbH", legalForm: "GmbH",
    clientId: "K330119", vatId: "DE 727451909", taxAuthority: "Stuttgart-Körperschaften",
    address: "Porschestraße 1", city: "Bietigheim-Bissingen", postalCode: "74321", country: "Germany", countryCode: "DE",
    fiscalYearStart: "1 January", fiscalYearEnd: "31 December", type: "Subsidiary", status: "Active", parentId: "po-1",
  },
  // Merck
  {
    id: "me-1", orgId: "merck", legalName: "Merck KGaA", legalForm: "KGaA",
    clientId: "K500207", vatId: "DE 811850788", taxAuthority: "Darmstadt",
    address: "Frankfurter Straße 250", city: "Darmstadt", postalCode: "64293", country: "Germany", countryCode: "DE",
    fiscalYearStart: "1 January", fiscalYearEnd: "31 December", type: "HQ", status: "Active",
  },
  {
    id: "me-2", orgId: "merck", legalName: "Merck Healthcare Germany GmbH", legalForm: "GmbH",
    clientId: "K500208", vatId: "DE 811850790", taxAuthority: "Darmstadt",
    address: "Frankfurter Straße 250", city: "Darmstadt", postalCode: "64293", country: "Germany", countryCode: "DE",
    fiscalYearStart: "1 January", fiscalYearEnd: "31 December", type: "Subsidiary", status: "Active", parentId: "me-1",
  },
  // SMR
  {
    id: "smr-1", orgId: "smr", legalName: "SMR Automotive Mirror Systems GmbH", legalForm: "GmbH",
    clientId: "K612003", vatId: "DE 290115447", taxAuthority: "Stuttgart-Körperschaften",
    address: "Industriestraße 12", city: "Stuttgart", postalCode: "70565", country: "Germany", countryCode: "DE",
    fiscalYearStart: "1 April", fiscalYearEnd: "31 March", type: "HQ", status: "Disabled",
  },
  // Provinzial — intentionally empty (freshly-created org; add first legal entity via UI).
];

export const ENGAGEMENTS: Engagement[] = [
  // Electronic Arts — 6 engagements per spec
  { id: "eng-ea-1", orgId: "ea", contractRef: "09059", serviceLines: [{ serviceLine: "CIT", caseTypes: ["CIT Return Yearly"], frequency: "Yearly" }], status: "Active", startDate: "01/01/2024", endDate: "31/12/2026", entityIds: ["ea-1"] },
  { id: "eng-ea-2", orgId: "ea", contractRef: "04314", serviceLines: [{ serviceLine: "CIT", caseTypes: ["CIT Return Yearly"], frequency: "Yearly" }], status: "Active", startDate: "01/01/2025", endDate: "31/12/2025", entityIds: [] },
  { id: "eng-ea-3", orgId: "ea", contractRef: "04325", serviceLines: [{ serviceLine: "CIT", caseTypes: ["CIT Return Yearly"], frequency: "Yearly" }], status: "Active", startDate: "01/01/2026", endDate: null, entityIds: ["ea-1"] },
  { id: "eng-ea-4", orgId: "ea", contractRef: "03398", serviceLines: [{ serviceLine: "CIT", caseTypes: ["CIT Return Yearly"], frequency: "Yearly" }], status: "Expired", startDate: "01/01/2023", endDate: "31/12/2023", entityIds: ["ea-1"] },
  { id: "eng-ea-5", orgId: "ea", contractRef: "00371", serviceLines: [{ serviceLine: "VAT", caseTypes: ["VAT Return"], frequency: "Monthly" }], status: "Active", startDate: "01/04/2024", endDate: null, entityIds: ["ea-1"] },
  { id: "eng-ea-6", orgId: "ea", contractRef: "07823", serviceLines: [{ serviceLine: "HR Tax", caseTypes: ["HR Audit Yearly"], frequency: "Yearly" }], status: "Active", startDate: "01/04/2025", endDate: null, entityIds: [] },
  // EUROPIPE
  { id: "eng-eu-1", orgId: "europipe", contractRef: "11204", serviceLines: [{ serviceLine: "CIT", caseTypes: ["CIT Return Yearly", "Trade Tax Return"], frequency: "Yearly" }, { serviceLine: "VAT", caseTypes: ["VAT Return"], frequency: "Quarterly" }], status: "Active", startDate: "01/01/2025", endDate: "31/12/2027", entityIds: ["eu-1", "eu-2"] },
  { id: "eng-eu-2", orgId: "europipe", contractRef: "11288", serviceLines: [{ serviceLine: "VAT", caseTypes: ["VAT Return"], frequency: "Monthly" }], status: "Active", startDate: "01/07/2026", endDate: null, entityIds: ["eu-2"] },
  // Porsche
  { id: "eng-po-1", orgId: "porsche", contractRef: "20451", serviceLines: [{ serviceLine: "CIT", caseTypes: ["CIT Return Yearly"], frequency: "Yearly" }], status: "Active", startDate: "01/01/2024", endDate: "31/12/2026", entityIds: ["po-1", "po-2"] },
  { id: "eng-po-2", orgId: "porsche", contractRef: "20518", serviceLines: [{ serviceLine: "VAT", caseTypes: ["VAT Return"], frequency: "Quarterly" }], status: "Active", startDate: "01/01/2025", endDate: null, entityIds: ["po-1"] },
  // Merck
  { id: "eng-me-1", orgId: "merck", contractRef: "30119", serviceLines: [{ serviceLine: "CIT", caseTypes: ["CIT Return Yearly"], frequency: "Yearly" }], status: "Active", startDate: "01/01/2025", endDate: null, entityIds: ["me-1"] },
  { id: "eng-me-2", orgId: "merck", contractRef: "30120", serviceLines: [{ serviceLine: "VAT", caseTypes: ["VAT Return"], frequency: "Monthly" }], status: "Expired", startDate: "01/01/2023", endDate: "31/12/2024", entityIds: ["me-2"] },
  // SMR
  { id: "eng-smr-1", orgId: "smr", contractRef: "40087", serviceLines: [{ serviceLine: "VAT", caseTypes: ["VAT Return"], frequency: "Quarterly" }], status: "Active", startDate: "01/04/2025", endDate: null, entityIds: ["smr-1"] },
  // Provinzial — intentionally empty (freshly-created org).
];

export const USERS: OrgUser[] = [
  // WTS super admin — always present on every organization and every legal entity ("ALL")
  { id: "u-superadmin", entityIds: [], allEntities: true, name: "Super Admin", email: "super.admin@wts.de", userType: "Internal", role: "Super Admin", roles: ["Super Admin"], poolLevel: "org", status: "Active", invitedBy: "System", dateAdded: "2025-01-05" },
  // Electronic Arts
  { id: "u1", entityIds: ["ea-1"], name: "Anna Müller", email: "anna.mueller@wts.com", userType: "Internal", role: "Organisation Admin", roles: ["Organisation Admin"], status: "Active", invitedBy: "Thomas Becker", dateAdded: "2026-01-12" },
  { id: "u2", entityIds: ["ea-1"], name: "Lukas Schmidt", email: "lukas.schmidt@ea.com", userType: "External", role: "Contributor", status: "Active", invitedBy: "Anna Müller", dateAdded: "2026-02-03" },
  { id: "u12", entityIds: ["ea-1"], name: "Priya Nair", email: "priya.nair@ea.com", userType: "External", role: "Contributor", status: "Pending", invitedBy: "Anna Müller", dateAdded: "2026-06-15" },
  { id: "u13", entityIds: ["ea-1"], name: "Daniel Roth", email: "daniel.roth@wts.com", userType: "Internal", role: "Contributor", status: "Active", invitedBy: "Anna Müller", dateAdded: "2026-03-10" },
  // EUROPIPE — the demo world for Changes 2/3/4/5.
  // u3 Julia — "one person does everything" small-client case: holds BOTH admin roles
  // (composable, Change 3) and is an org-level pool user (Change 4).
  { id: "u3", entityIds: ["eu-1", "eu-2"], access: [{ entityId: "eu-1", engagementIds: ["eng-eu-1"] }, { entityId: "eu-2", engagementIds: ["eng-eu-1", "eng-eu-2"] }], name: "Julia Hoffmann", email: "julia.hoffmann@wts.com", userType: "Internal", role: "Organisation Admin", roles: ["Organisation Admin", "Engagement Admin"], poolLevel: "org", canCreateCases: true, status: "Active", invitedBy: "Thomas Becker", dateAdded: "2025-11-20" },
  // u4 Sofia — France-only local partner (Change 2): on eu-1 scoped to the FR registration
  // ONLY (vat-eu1-fr), but fuller (no registration restriction) on eu-2 — proving the
  // per-(user,entity) rule: a country limit on one entity does NOT carry to another.
  // Engagement-level pool user, and may create cases but only for France (Change 5).
  { id: "u4", entityIds: ["eu-1", "eu-2"], access: [{ entityId: "eu-1", engagementIds: ["eng-eu-1"], vatRegistrationIds: ["vat-eu1-fr"] }, { entityId: "eu-2", engagementIds: ["eng-eu-1", "eng-eu-2"] }], name: "Sofia Rossi", email: "sofia.rossi@europipe.com", userType: "External", role: "Contributor", roles: ["Contributor"], poolLevel: "engagement", canCreateCases: true, caseCountryScope: { mode: "only", countries: ["France"] }, status: "Active", invitedBy: "Julia Hoffmann", dateAdded: "2026-04-15" },
  // u5 Markus — Engagement Admin (builds engagement detail, cannot touch entity data);
  // engagement-level pool; may create German cases only.
  { id: "u5", entityIds: ["eu-2"], access: [{ entityId: "eu-2", engagementIds: ["eng-eu-1", "eng-eu-2"] }], name: "Markus Weber", email: "markus.weber@europipe.com", userType: "External", role: "Engagement Admin", roles: ["Engagement Admin"], poolLevel: "engagement", canCreateCases: true, caseCountryScope: { mode: "only", countries: ["Germany"] }, status: "Pending", invitedBy: "Julia Hoffmann", dateAdded: "2026-04-18" },
  { id: "u14", entityIds: ["eu-1"], access: [{ entityId: "eu-1", engagementIds: ["eng-eu-1"] }], name: "Klara Vogel", email: "klara.vogel@europipe.com", userType: "External", role: "Contributor", roles: ["Contributor"], poolLevel: "engagement", status: "Rejected", invitedBy: "Lukas Schmidt", dateAdded: "2026-04-21" },
  // u16 Tomasz — Poland-only local partner on eu-5, org-level pool contributor (pairs with the
  // engagement-level users above to show the org-pool vs engagement distinction, Change 4).
  { id: "u16", entityIds: ["eu-5"], access: [{ entityId: "eu-5", engagementIds: [], vatRegistrationIds: ["vat-eu5-pl"] }], name: "Tomasz Nowak", email: "tomasz.nowak@europipe.com", userType: "External", role: "Contributor", roles: ["Contributor"], poolLevel: "org", canCreateCases: false, status: "Active", invitedBy: "Julia Hoffmann", dateAdded: "2026-05-12" },
  // Porsche
  { id: "u6", entityIds: ["po-1", "po-2"], name: "Anna Müller", email: "anna.mueller@wts.com", userType: "Internal", role: "Organisation Admin", roles: ["Organisation Admin"], status: "Active", invitedBy: "Thomas Becker", dateAdded: "2025-09-01" },
  { id: "u7", entityIds: ["po-1"], name: "Lukas Schmidt", email: "lukas.schmidt@porsche.de", userType: "External", role: "Contributor", status: "Rejected", invitedBy: "Anna Müller", dateAdded: "2026-03-22" },
  { id: "u8", entityIds: ["po-2"], name: "Julia Hoffmann", email: "julia.hoffmann@porsche.de", userType: "External", role: "Contributor", status: "Active", invitedBy: "Anna Müller", dateAdded: "2026-01-30" },
  { id: "u15", entityIds: ["po-1"], name: "Felix Braun", email: "felix.braun@porsche.de", userType: "External", role: "Contributor", status: "Pending", invitedBy: "Anna Müller", dateAdded: "2026-06-09" },
  // Merck
  { id: "u9", entityIds: ["me-1"], name: "Sofia Rossi", email: "sofia.rossi@wts.com", userType: "Internal", role: "Organisation Admin", roles: ["Organisation Admin"], status: "Active", invitedBy: "Thomas Becker", dateAdded: "2025-08-14" },
  { id: "u10", entityIds: ["me-1", "me-2"], name: "Markus Weber", email: "markus.weber@merck.com", userType: "External", role: "Contributor", status: "Active", invitedBy: "Sofia Rossi", dateAdded: "2026-02-19" },
  // Provinzial — intentionally empty (freshly-created org).
];

// Change 1 — a VAT registration is a first-class, individually identifiable object with a
// stable id. Access rules and VAT-group membership reference a specific registration (not the
// entity). One entity may hold several across countries. The registration's validity window IS
// the VAT ID's validity (Change 6); multiple registrations per country over time = history.
export interface VatRegistration {
  id: string;
  entityId: string;
  country: string;
  vatNumber: string;          // the VAT ID
  taxAuthority: string;
  validFrom?: string;         // yyyy-mm-dd; undefined = always-active (legacy rows)
  validTo?: string | null;    // null/undefined = open-ended
  address?: string;           // optional; defaults to the entity's address when absent
}

export interface ActivityLogEntry {
  id: string;
  orgId: string;
  timestamp: string;   // DD.MM.YYYY HH:mm
  userEmail: string;
  legalEntity: string; // legal entity name, or "—" if not entity-scoped
  action: string;      // descriptive sentence
  // V11-G — for change events, capture the "before" and "after" state as short strings so
  // the Activity Log table can show two extra columns. Left undefined for pure creations /
  // deletions where a delta isn't meaningful (the action sentence conveys it).
  previous?: string;
  current?: string;
}

export const VAT_REGISTRATIONS: VatRegistration[] = [
  { id: "vat-1", entityId: "ea-1", country: "Germany", vatNumber: "DE159933475", taxAuthority: "Köln-Altstadt" },
  { id: "vat-2", entityId: "ea-1", country: "France", vatNumber: "FR12345678", taxAuthority: "Paris Authority" },
  { id: "vat-3", entityId: "ea-1", country: "Poland", vatNumber: "PO12345678", taxAuthority: "Warsaw Authority" },
  // eu-1 (German GmbH) holds DE + FR + PL registrations — multi-country VAT, what makes
  // registration-level access and multi-country VAT groups meaningful (Change 8).
  { id: "vat-4", entityId: "eu-1", country: "Germany", vatNumber: "DE812047551", taxAuthority: "Mülheim an der Ruhr", validFrom: "2015-01-01", validTo: null },
  // FR registration history: an older number ended, a current one active (Change 6/7 — a
  // registration's validity IS its VAT ID's; multiple over time in one country = history).
  { id: "vat-eu1-fr-old", entityId: "eu-1", country: "France", vatNumber: "FR90812047551", taxAuthority: "Paris — DGE", validFrom: "2018-01-01", validTo: "2023-12-31" },
  { id: "vat-eu1-fr", entityId: "eu-1", country: "France", vatNumber: "FR44812047551", taxAuthority: "Paris — DGE", validFrom: "2024-01-01", validTo: null },
  { id: "vat-eu1-pl", entityId: "eu-1", country: "Poland", vatNumber: "PL8120475510", taxAuthority: "Warsaw — First Office", validFrom: "2021-06-01", validTo: null },
  { id: "vat-5", entityId: "eu-2", country: "Germany", vatNumber: "DE812047552", taxAuthority: "Mülheim an der Ruhr", validFrom: "2016-01-01", validTo: null },
  // EUROPIPE parent #2 and its cross-border children.
  { id: "vat-eu3-de", entityId: "eu-3", country: "Germany", vatNumber: "DE812047560", taxAuthority: "Mülheim an der Ruhr", validFrom: "2019-01-01", validTo: null },
  { id: "vat-eu4-fr", entityId: "eu-4", country: "France", vatNumber: "FR40123456789", taxAuthority: "Paris — DGE", validFrom: "2020-03-01", validTo: null },
  { id: "vat-eu5-pl", entityId: "eu-5", country: "Poland", vatNumber: "PL5261040828", taxAuthority: "Warsaw — First Office", validFrom: "2020-05-01", validTo: null },
  { id: "vat-6", entityId: "po-1", country: "Germany", vatNumber: "DE727451908", taxAuthority: "Stuttgart-Körperschaften" },
  { id: "vat-7", entityId: "me-1", country: "Germany", vatNumber: "DE811850788", taxAuthority: "Darmstadt" },
  { id: "vat-8", entityId: "me-1", country: "Austria", vatNumber: "ATU12345678", taxAuthority: "Wien" },
];

export const ACTIVITY_LOG: ActivityLogEntry[] = [
  { id: "log-1", orgId: "ea", timestamp: "12.03.2026 09:42", userEmail: "sarah.klein@wts.com", legalEntity: "Electronic Arts GmbH", action: 'Created legal entity "Electronic Arts GmbH"' },
  { id: "log-2", orgId: "ea", timestamp: "14.03.2026 15:08", userEmail: "sarah.klein@wts.com", legalEntity: "Electronic Arts GmbH", action: "Created engagement 09059" },
  { id: "log-3", orgId: "ea", timestamp: "15.03.2026 10:22", userEmail: "sarah.klein@wts.com", legalEntity: "Electronic Arts GmbH", action: "Added user anna.mueller@wts.com" },
  { id: "log-4", orgId: "ea", timestamp: "16.03.2026 11:30", userEmail: "anna.mueller@wts.com", legalEntity: "Electronic Arts GmbH", action: "Added a VAT registration to Electronic Arts GmbH" },
  { id: "log-5", orgId: "ea", timestamp: "18.03.2026 14:15", userEmail: "anna.mueller@wts.com", legalEntity: "Electronic Arts GmbH", action: "Assigned engagement 09059 to Electronic Arts GmbH" },
  { id: "log-6", orgId: "ea", timestamp: "20.03.2026 09:00", userEmail: "anna.mueller@wts.com", legalEntity: "Electronic Arts GmbH", action: "Added user lukas.schmidt@ea.com" },
  { id: "log-7", orgId: "ea", timestamp: "22.03.2026 16:45", userEmail: "sarah.klein@wts.com", legalEntity: "—", action: "Created engagement 04314" },
  // Edit events carry a before → after delta; creations above intentionally leave them blank.
  { id: "log-8", orgId: "ea", timestamp: "25.03.2026 08:30", userEmail: "sarah.klein@wts.com", legalEntity: "—", action: "Updated organization details", previous: "EA Games", current: "Electronic Arts" },
  { id: "log-9", orgId: "europipe", timestamp: "10.02.2026 09:00", userEmail: "markus.weber@wts.com", legalEntity: "EUROPIPE GmbH", action: 'Created legal entity "EUROPIPE GmbH"' },
  { id: "log-10", orgId: "europipe", timestamp: "12.02.2026 11:30", userEmail: "markus.weber@wts.com", legalEntity: "—", action: "Created engagement 11204" },
  { id: "log-11", orgId: "europipe", timestamp: "15.02.2026 13:00", userEmail: "julia.hoffmann@wts.com", legalEntity: "Mülheim Pipecoatings GmbH (MPC)", action: 'Created legal entity "Mülheim Pipecoatings GmbH (MPC)"' },
  { id: "log-12", orgId: "europipe", timestamp: "18.02.2026 09:45", userEmail: "julia.hoffmann@wts.com", legalEntity: "EUROPIPE GmbH", action: "Added user sofia.rossi@europipe.com" },
  { id: "log-13", orgId: "europipe", timestamp: "22.02.2026 10:15", userEmail: "julia.hoffmann@wts.com", legalEntity: "—", action: 'Changed representative of "DE VAT Group"', previous: "Mülheim Pipecoatings GmbH (MPC)", current: "EUROPIPE GmbH" },
  { id: "log-14", orgId: "europipe", timestamp: "28.02.2026 14:40", userEmail: "markus.weber@wts.com", legalEntity: "—", action: "Re-enabled engagement 11288", previous: "Disabled", current: "Active" },
];

export const LEGAL_FORMS = ["GmbH", "AG", "KGaA", "GmbH & Co. KG", "SE", "UG (haftungsbeschränkt)", "OHG"];
export const COUNTRIES = ["Germany", "Austria", "Belgium", "Switzerland", "Italy", "France", "Hungary", "Netherlands", "Spain", "Poland"];

// Complete list of countries for the searchable Country / Jurisdiction selects on the
// Create/Edit Legal Entity form. Country and Jurisdiction share this exact dataset. Sovereign
// states only — no regions, federal states, provinces, cities or custom jurisdictions.
export const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
  "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada",
  "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran",
  "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru",
  "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka",
  "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
  "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

// Country → ISO-ish display code (matches the WTS mock; Poland shows "PO").
export const COUNTRY_CODES: Record<string, string> = {
  Germany: "DE", Austria: "AT", Belgium: "BE", Switzerland: "CH", Italy: "IT",
  France: "FR", Hungary: "HU", Netherlands: "NL", Spain: "ES", Poland: "PL",
};
export function countryCodeFor(country: string): string {
  return COUNTRY_CODES[country] ?? country.slice(0, 2).toUpperCase();
}

// Dummy Jurisdiction → VAT Registration mapping, shared by the Single Case and Group Case
// creation forms — selecting a Jurisdiction always deterministically assigns one VAT
// Registration, independent of which legal entity is selected (this is illustrative
// placeholder data, not a real registration lookup).
export const JURISDICTION_VAT_REGISTRATIONS: Record<string, string> = {
  Germany: "DE134990", Austria: "AT927384", Belgium: "BE482913",
  Switzerland: "CH392187", Italy: "IT839201", France: "FR139481",
  Hungary: "HU746291", Netherlands: "NL248193", Spain: "ES583920", Poland: "PL132499",
};
export function vatRegistrationForJurisdiction(jurisdiction: string): string {
  return JURISDICTION_VAT_REGISTRATIONS[jurisdiction] ?? "";
}

export const DECLARATION_TYPES = [
  "CIT Return Yearly",
  "CIT Return Quarterly",
  "VAT Return Monthly",
  "VAT Return Quarterly",
  "HR Audit Yearly",
  "Trade Tax Return",
  "Annual Report",
];

export function entitiesForOrg(orgId: string) {
  return LEGAL_ENTITIES.filter((e) => e.orgId === orgId);
}
export function engagementsForOrg(orgId: string) {
  return ENGAGEMENTS.filter((e) => e.orgId === orgId);
}
export function usersForEntity(entityId: string) {
  return USERS.filter((u) => u.allEntities || u.entityIds.includes(entityId));
}

// Engagements connected to a given legal entity.
export function engagementsForEntity(entityId: string, engagements: Engagement[] = ENGAGEMENTS) {
  return engagements.filter((e) => e.entityIds.includes(entityId));
}

// Change 1 — VAT registrations held by an entity.
export function registrationsForEntity(entityId: string, regs: VatRegistration[] = VAT_REGISTRATIONS): VatRegistration[] {
  return regs.filter((r) => r.entityId === entityId);
}
export function registrationById(id: string, regs: VatRegistration[] = VAT_REGISTRATIONS): VatRegistration | undefined {
  return regs.find((r) => r.id === id);
}
// Unambiguous label for a registration, e.g. "France — FR VAT ID FR123…".
export function registrationLabel(reg: VatRegistration): string {
  return `${reg.country} — ${countryCodeFor(reg.country)} ${reg.vatNumber.replace(/\s+/g, "")}`;
}
// Compact registration chip label for pickers, e.g. "FR — FR123…".
export function registrationShortLabel(reg: VatRegistration): string {
  return `${countryCodeFor(reg.country)} — ${reg.vatNumber.replace(/\s+/g, "")}`;
}
// Change 9 — member row label. VAT members read "Entity — CC registration"; CIT keep the name.
export function memberLabel(
  m: Member,
  entities: LegalEntity[],
  regs: VatRegistration[] = VAT_REGISTRATIONS,
): string {
  const name = entities.find((e) => e.id === m.entityId)?.legalName ?? m.entityId;
  if (!m.vatRegistrationId) return name;
  const reg = regs.find((r) => r.id === m.vatRegistrationId);
  return reg ? `${name} — ${countryCodeFor(reg.country)} registration` : name;
}

// Short label for an engagement: "11204 · CIT" (contract ref + service-line keys).
export function engagementLabel(eng: Engagement): string {
  const lines = eng.serviceLines.map((s) => s.serviceLine).join(", ");
  return lines ? `${eng.contractRef} · ${lines}` : eng.contractRef;
}

// Flatten a user's access into {engagement, entityId} combinations, resolving against the
// provided engagement list. Falls back to entityIds × connected engagements when `access` is absent.
export function userEngagementCombos(
  user: OrgUser,
  engagements: Engagement[],
): { engagement: Engagement; entityId: string }[] {
  const byId = new Map(engagements.map((e) => [e.id, e]));
  const combos: { engagement: Engagement; entityId: string }[] = [];
  if (user.access && user.access.length) {
    for (const row of user.access) {
      for (const engId of row.engagementIds) {
        const engagement = byId.get(engId);
        if (engagement) combos.push({ engagement, entityId: row.entityId });
      }
    }
    return combos;
  }
  // Fallback: derive from entityIds × engagements connected to each entity.
  for (const entityId of user.entityIds) {
    for (const engagement of engagementsForEntity(entityId, engagements)) {
      combos.push({ engagement, entityId });
    }
  }
  return combos;
}

// An engagement is Active once it has the required fields + at least one connected legal entity.
// Manually Disabled / Expired statuses are preserved; otherwise it resolves to Active or Draft.
export function computeEngagementStatus(eng: Pick<Engagement, "status" | "contractRef" | "startDate" | "serviceLines" | "entityIds">): EngagementStatus {
  if (eng.status === "Disabled" || eng.status === "Expired") return eng.status;
  const ready =
    !!eng.contractRef?.trim() &&
    !!eng.startDate &&
    eng.serviceLines.some((s) => s.caseTypes.length > 0) &&
    eng.entityIds.length > 0;
  return ready ? "Active" : "Draft";
}

/* ─── Groups (tax groups: VAT / CIT) ──────────────────────────────────────
   Only two group types remain (V10-G). CIT is temporarily disabled in the type
   picker but kept in the enum + mock so existing CIT groups keep rendering. */

export type GroupType = "VAT" | "CIT";
export const GROUP_TYPES: GroupType[] = ["VAT", "CIT"];
// V10-G — CIT is present in the model but its chip is disabled in the Create Group flow.
export const DISABLED_GROUP_TYPES: GroupType[] = ["CIT"];

export type MembershipStatus = "Active" | "Pending" | "Ended";

// A member is a legal entity's time-bounded participation in a group.
export interface Member {
  entityId: string;
  // Change 9 — VAT groups key membership on a specific VAT registration (a company joins a
  // country's VAT group via its registration there). CIT / Income-tax groups leave this
  // undefined and key on the entity. Enables "EUROPIPE GmbH — FR registration" member rows.
  vatRegistrationId?: string;
  representative: boolean;
  validFrom: string;        // yyyy-mm-dd
  validTo: string | null;   // null = open-ended
}

export type ConsolidationStatus = "In preparation" | "In review" | "Client Approval" | "Submitted";

// Display-only summary that links a group out to its Case Management consolidation
// case. NOT a case engine — no filing periods, per-member records, or workflow state.
export interface ConsolidationCase {
  name: string;
  status: ConsolidationStatus;
  completedCount: number;   // completed member cases
  totalCount: number;       // active members including representative
}

export interface Group {
  id: string;
  orgId: string;            // scopes the group to its organization (workspace is per-org)
  name: string;             // free text, e.g. "DE VAT Group"
  type: GroupType;
  jurisdiction: string;     // country name, matches LegalEntity.jurisdiction/country
  members: Member[];
  consolidationCase?: ConsolidationCase;
}

// Today as yyyy-mm-dd — single source for status derivation. Reused across surfaces.
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Generic validity-window status — the single source for Active/Pending/Ended across
// group memberships (Member), dated IDs (DatedId) and VAT registrations. Change 6/7.
export function periodStatus(
  validFrom: string | undefined,
  validTo: string | null | undefined,
  now: string = today(),
): MembershipStatus {
  if (validFrom && validFrom > now) return "Pending";
  if (validTo != null && validTo < now) return "Ended";
  return "Active";
}

// Derived membership status from validity window vs. today.
export function membershipStatus(m: Member, now: string = today()): MembershipStatus {
  return periodStatus(m.validFrom, m.validTo, now);
}

// Status of a dated ID / VAT registration (reuses periodStatus).
export function datedStatus(d: { validFrom?: string; validTo?: string | null }, now: string = today()): MembershipStatus {
  return periodStatus(d.validFrom, d.validTo, now);
}

// The currently-active entry in a dated-ID history (or undefined if none active today).
export function currentDatedId(list: DatedId[] | undefined, now: string = today()): DatedId | undefined {
  return (list ?? []).find((d) => periodStatus(d.validFrom, d.validTo, now) === "Active");
}

// Additional Identifiers for an entity (Details card only). Uses the modern `identifiers`
// array when present; otherwise falls back to synthesising a single "Client Identifier"
// row from the legacy `clientId` scalar for back-compat with older mock rows.
export function entityIdentifiers(entity: LegalEntity): EntityIdentifier[] {
  if (entity.identifiers && entity.identifiers.length) return entity.identifiers;
  if (entity.clientId) return [{ id: `${entity.id}-cid`, type: "Client Identifier", value: entity.clientId }];
  return [];
}

export function activeMembers(g: Group, now: string = today()): Member[] {
  return g.members.filter((m) => membershipStatus(m, now) === "Active");
}

// Consolidation progress denominator: active members INCLUDING the representative
// (current guidance — the representative runs its own member data-provision case too).
// This is the SINGLE place to change if the client confirms the rep should be excluded
// (e.g. `return activeMembers(g, now).length - (representativeOf(g, now) ? 1 : 0)`).
export function consolidationTotal(g: Group, now: string = today()): number {
  return activeMembers(g, now).length;
}
export function pendingMembers(g: Group, now: string = today()): Member[] {
  return g.members.filter((m) => membershipStatus(m, now) === "Pending");
}
export function endedMembers(g: Group, now: string = today()): Member[] {
  return g.members.filter((m) => membershipStatus(m, now) === "Ended");
}
// Combined inactive list (Pending + Ended) — spec rule 4: one list, styled differently within.
export function inactiveMembers(g: Group, now: string = today()): Member[] {
  return g.members.filter((m) => membershipStatus(m, now) !== "Active");
}

// The representative — looked up among ACTIVE members only (rule 1 invariant).
export function representativeOf(g: Group, now: string = today()): Member | undefined {
  return activeMembers(g, now).find((m) => m.representative);
}

// "Active since" — earliest validFrom among active members. Derived, not stored.
export function groupStart(g: Group, now: string = today()): string | null {
  const dates = activeMembers(g, now).map((m) => m.validFrom).sort();
  return dates.length ? dates[0] : null;
}

export function activeMemberCount(g: Group, now: string = today()): number {
  return activeMembers(g, now).length;
}

export function groupsForOrg(orgId: string, groups: Group[] = GROUPS): Group[] {
  return groups.filter((g) => g.orgId === orgId);
}

// Groups an entity belongs to as an ACTIVE or PENDING member (for the reciprocal card + form dedupe).
export function groupsForEntity(entityId: string, groups: Group[] = GROUPS, now: string = today()): Group[] {
  return groups.filter((g) =>
    g.members.some((m) => m.entityId === entityId && membershipStatus(m, now) !== "Ended"),
  );
}

// Groups whose jurisdiction matches — for the Create Legal Entity form checklist.
export function groupsForJurisdiction(jurisdiction: string, orgId: string, groups: Group[] = GROUPS): Group[] {
  return groups.filter((g) => g.orgId === orgId && g.jurisdiction === jurisdiction);
}

// Rule 2: an entity can hold only one ACTIVE membership per group TYPE
// (regardless of jurisdiction). Returns the existing active membership
// (group + member) that assigning to a new same-type group must silently supersede.
export function conflictingActiveMembership(
  entityId: string,
  type: GroupType,
  groups: Group[] = GROUPS,
  now: string = today(),
): { group: Group; member: Member } | undefined {
  for (const g of groups) {
    if (g.type !== type) continue;
    const member = g.members.find(
      (m) => m.entityId === entityId && membershipStatus(m, now) === "Active",
    );
    if (member) return { group: g, member };
  }
  return undefined;
}

// Auto-suggested group name from country code + type, e.g. "DE VAT Group".
export function suggestGroupName(type: GroupType, jurisdiction: string): string {
  const code =
    LEGAL_ENTITIES.find((e) => e.country === jurisdiction)?.countryCode ??
    jurisdiction.slice(0, 2).toUpperCase();
  return `${code} ${type} Group`;
}

// Mock groups. Today ≈ 2026-07: past validFrom → Active, future → Pending, past validTo → Ended.
export const GROUPS: Group[] = [
  // EUROPIPE — German VAT group (Organschaft): rep + one member, both active. Change 9 —
  // VAT membership keys on the German REGISTRATION of each entity (vat-4, vat-5), not the entity.
  {
    id: "grp-eu-vat", orgId: "europipe", name: "DE VAT Group", type: "VAT", jurisdiction: "Germany",
    members: [
      { entityId: "eu-1", vatRegistrationId: "vat-4", representative: true, validFrom: "2020-01-01", validTo: null },
      { entityId: "eu-2", vatRegistrationId: "vat-5", representative: false, validFrom: "2020-01-01", validTo: null },
    ],
    // 2 active members incl. rep (eu-1, eu-2).
    consolidationCase: { name: "DE VAT Group — VAT Return", status: "In review", completedCount: 1, totalCount: 2 },
  },
  // EUROPIPE — French VAT group. Demonstrates a member joining via a DIFFERENT-COUNTRY
  // registration: eu-1 is a German entity but joins here through its FR registration
  // (vat-eu1-fr). eu-4 (a French entity) is the representative. eu-5 joins pending (future).
  {
    id: "grp-eu-vat-fr", orgId: "europipe", name: "FR VAT Group", type: "VAT", jurisdiction: "France",
    members: [
      { entityId: "eu-4", vatRegistrationId: "vat-eu4-fr", representative: true, validFrom: "2021-01-01", validTo: null },
      { entityId: "eu-1", vatRegistrationId: "vat-eu1-fr", representative: false, validFrom: "2024-01-01", validTo: null },
      { entityId: "eu-5", vatRegistrationId: "vat-eu5-pl", representative: false, validFrom: "2027-03-01", validTo: null }, // Pending
    ],
    // 2 active members incl. rep (eu-4, eu-1); eu-5 pending.
    consolidationCase: { name: "FR VAT Group — VAT Return", status: "In preparation", completedCount: 0, totalCount: 2 },
  },
  // EUROPIPE — Income-tax (CIT) group keyed on the ENTITY (no registration). Its membership
  // deliberately does NOT mirror the VAT groups (eu-3 rep + eu-1 + eu-2): CIT and VAT
  // perimeters are non-congruent (Change 8/9) — never blend them in an overview (req §4).
  {
    id: "grp-eu-it", orgId: "europipe", name: "DE CIT Group", type: "CIT", jurisdiction: "Germany",
    members: [
      { entityId: "eu-3", representative: true, validFrom: "2019-01-01", validTo: null },
      { entityId: "eu-1", representative: false, validFrom: "2019-01-01", validTo: null },
      // V10-D — eu-2 has been in and out of the group across three stretches. The Inactive
      // Members section collapses these into a single expandable entity row.
      { entityId: "eu-2", representative: false, validFrom: "2019-01-01", validTo: "2020-06-30" }, // Ended (oldest)
      { entityId: "eu-2", representative: false, validFrom: "2021-04-01", validTo: "2022-12-31" }, // Ended (middle)
      { entityId: "eu-2", representative: false, validFrom: "2024-01-01", validTo: "2025-12-31" }, // Ended (most recent)
    ],
    // 2 active members incl. rep (eu-3, eu-1); eu-2 ended across three stretches.
    consolidationCase: { name: "DE CIT Group — CIT Return", status: "Client Approval", completedCount: 1, totalCount: 2 },
  },
  // Merck — Income tax group: active rep + an ended member (demonstrates Ended row).
  {
    id: "grp-me-it", orgId: "merck", name: "DE CIT Group", type: "CIT", jurisdiction: "Germany",
    members: [
      { entityId: "me-1", representative: true, validFrom: "2023-06-01", validTo: null },
      { entityId: "me-2", representative: false, validFrom: "2023-06-01", validTo: "2024-12-31" },
    ],
    // 1 active member incl. rep (me-1; me-2 ended).
    consolidationCase: { name: "DE Income Tax Group — CIT Return", status: "Submitted", completedCount: 1, totalCount: 1 },
  },
  // Porsche — VAT group: active rep + a pending member (demonstrates Pending row).
  {
    id: "grp-po-vat", orgId: "porsche", name: "DE VAT Group", type: "VAT", jurisdiction: "Germany",
    members: [
      { entityId: "po-1", representative: true, validFrom: "2024-01-01", validTo: null },
      { entityId: "po-2", representative: false, validFrom: "2027-01-01", validTo: null },
    ],
    // 1 active member incl. rep (po-1; po-2 pending).
    consolidationCase: { name: "DE VAT Group — VAT Return", status: "In preparation", completedCount: 0, totalCount: 1 },
  },
  // Porsche — SECOND VAT+Germany group (parallel groups, rule 3). po-2 is active here,
  // only pending in grp-po-vat, so rule 2 (one ACTIVE per type) holds.
  {
    id: "grp-po-vat-2", orgId: "porsche", name: "DE VAT Group (Consulting)", type: "VAT", jurisdiction: "Germany",
    members: [
      { entityId: "po-2", representative: true, validFrom: "2024-03-01", validTo: null },
    ],
    // 1 active member incl. rep (po-2).
    consolidationCase: { name: "DE VAT Group (Consulting) — VAT Return", status: "Client Approval", completedCount: 1, totalCount: 1 },
  },
];
