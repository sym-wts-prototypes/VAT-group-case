export type OrgStatus = "Active" | "Disabled";

// Organizations the Admin prototype role is assigned to (Admin sees only these).
export const ADMIN_ORG_IDS = ["ea", "europipe"];

// Organizations the User prototype role can see (scoped further to one entity).
export const USER_ORG_IDS = ["europipe"];

export interface Organization {
  id: string;
  name: string;
  initials: string;
  logoUrl?: string;
  tags: string[];
  legalEntities: number;
  activeEngagements: number;
  status: OrgStatus;
  description?: string;
  createdDate: string; // ISO
  lastModified: string; // ISO
  lastModifiedBy: string;
}

// Saved logo for Provinzial (embedded SVG so the prototype needs no network).
const PROVINZIAL_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%230c7c3e'/%3E%3Ctext x='200' y='218' text-anchor='middle' textLength='300' lengthAdjust='spacingAndGlyphs' font-family='Arial,Helvetica,sans-serif' font-weight='800' font-size='56' fill='%23ffffff'%3EPROVINZIAL%3C/text%3E%3Cpath d='M300 146 c26 -8 56 -6 72 11 c-23 2 -41 10 -53 25 c6 -17 -2 -29 -19 -36z' fill='%23f5c518'/%3E%3Cpath d='M296 176 c25 -6 53 -2 67 17 c-23 0 -42 7 -53 23 c5 -17 -1 -28 -14 -40z' fill='%23f5c518'/%3E%3C/svg%3E";

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: "ea",
    tags: ["CIT"],
    name: "Electronic Arts",
    initials: "EA",
    legalEntities: 1,
    activeEngagements: 4,
    status: "Active",
    description: "Global interactive entertainment company.",
    createdDate: "2024-02-11",
    lastModified: "2026-05-28",
    lastModifiedBy: "Sarah Klein",
  },
  {
    id: "europipe",
    tags: ["CIT", "VAT"],
    name: "EUROPIPE",
    initials: "EU",
    legalEntities: 2,
    activeEngagements: 3,
    status: "Active",
    description: "Manufacturer of large-diameter steel pipes.",
    createdDate: "2023-09-04",
    lastModified: "2026-04-15",
    lastModifiedBy: "Markus Weber",
  },
  {
    id: "merck",
    tags: ["VAT"],
    name: "Merck",
    initials: "ME",
    legalEntities: 1,
    activeEngagements: 15,
    status: "Active",
    description: "Science and technology company in healthcare.",
    createdDate: "2022-11-20",
    lastModified: "2026-06-01",
    lastModifiedBy: "Sarah Klein",
  },
  {
    id: "porsche",
    tags: ["CIT"],
    name: "Porsche",
    initials: "PO",
    legalEntities: 2,
    activeEngagements: 1,
    status: "Active",
    description: "German automobile manufacturer of sports cars.",
    createdDate: "2023-01-30",
    lastModified: "2026-03-22",
    lastModifiedBy: "Anna Becker",
  },
  {
    id: "provinzial",
    tags: ["HR Tax"],
    name: "Provinzial",
    initials: "PR",
    logoUrl: PROVINZIAL_LOGO,
    legalEntities: 0,
    activeEngagements: 0,
    status: "Active",
    description: "Regional German insurance group.",
    createdDate: "2026-07-01",
    lastModified: "2026-07-01",
    lastModifiedBy: "Super Admin",
  },
  {
    id: "smr",
    tags: ["VAT"],
    name: "SMR",
    initials: "SM",
    legalEntities: 1,
    activeEngagements: 15,
    status: "Disabled",
    description: "Automotive mirror systems supplier.",
    createdDate: "2023-07-18",
    lastModified: "2026-01-14",
    lastModifiedBy: "Anna Becker",
  },
];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
