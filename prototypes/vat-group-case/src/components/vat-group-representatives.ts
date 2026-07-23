import { GROUPS, representativeOf, type Group } from './org-details-data'

// Dummy data: which VAT groups a legal entity represents, derived from the same GROUPS data
// that backs the Organisations page's group/representative relationships (org-details-data.ts).
// e.g. EUROPIPE GmbH (eu-1) is the representative of "DE VAT Group" — this returns that group
// for eu-1, and an empty list for any entity that represents no VAT group.
export function vatGroupsRepresentedBy(entityId: string, groups: Group[] = GROUPS): Group[] {
  return groups.filter((g) => g.type === 'VAT' && representativeOf(g)?.entityId === entityId)
}
