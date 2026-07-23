import type { AssignedPeopleData, AssignedPerson } from './assigned-people'

// Realistic dummy assignee data for the DE VAT Group's Parent Case + Child Cases (Case
// Management → Group Case), sourced from this org's real Organisation Users (org-details-data.ts's
// USERS, filtered to EUROPIPE's entities) — not the generic 8-person directory the Create Case
// drawer's pickers use. EUROPIPE has exactly 5 Organisation Users (u3/u4/u5/u14/u16); only
// these 5 may ever be assigned to a EUROPIPE case.
const JULIA: AssignedPerson = { name: 'Julia Hoffmann', email: 'julia.hoffmann@wts.com' }
const SOFIA: AssignedPerson = { name: 'Sofia Rossi', email: 'sofia.rossi@europipe.com' }
const MARKUS: AssignedPerson = { name: 'Markus Weber', email: 'markus.weber@europipe.com' }
const KLARA: AssignedPerson = { name: 'Klara Vogel', email: 'klara.vogel@europipe.com' }
const TOMASZ: AssignedPerson = { name: 'Tomasz Nowak', email: 'tomasz.nowak@europipe.com' }

// The Parent Case belongs to the Representative Legal Entity (EUROPIPE GmbH) — its Child Case
// must carry the exact same assignees as the Parent (see EDIT_TOOLTIP in
// parent-vat-group-case-page.tsx). All 5 of EUROPIPE's users, every role filled.
export const REPRESENTATIVE_ASSIGNEES: AssignedPeopleData = {
  creator: [JULIA],
  reviewer: [MARKUS],
  partner: [KLARA],
  client: [SOFIA, TOMASZ],
}

// Other Child Cases get different people, with only minor overlap — a small rotation of
// profiles (3-4 people each, Partner only on some) cycled across the group's other legal
// entities. Every profile still satisfies Creator/Reviewer/Client >= 1 (Segment 5).
const OTHER_CHILD_PROFILES: AssignedPeopleData[] = [
  { creator: [SOFIA], reviewer: [JULIA], client: [TOMASZ] },
  { creator: [MARKUS], reviewer: [KLARA], partner: [JULIA], client: [SOFIA] },
  { creator: [KLARA], reviewer: [SOFIA], client: [JULIA] },
  { creator: [TOMASZ], reviewer: [MARKUS], partner: [SOFIA], client: [KLARA] },
]

/** Assignees for the Nth child (0-indexed) of the DE VAT Group — index 0 is always the
 * Representative Legal Entity (EUROPIPE GmbH), everyone else cycles the profiles above. */
export function assignedPeopleForChildIndex(index: number): AssignedPeopleData {
  if (index === 0) return REPRESENTATIVE_ASSIGNEES
  return OTHER_CHILD_PROFILES[(index - 1) % OTHER_CHILD_PROFILES.length]
}

// Fed to the generic Playground's "Child Case" header demo (not tied to a specific row from
// the Parent Case page's list) — a representative example of a non-representative-entity
// Child Case's assignees.
export const CHILD_CASE_DEMO_ASSIGNEES: AssignedPeopleData = OTHER_CHILD_PROFILES[0]
