// Role capability map — the authoritative boundary between the four lenses. Enforces
// (not merely labels) which affordances each role sees.
//
// Model: every role sees every tab and all content. Only the WRITE actions are gated per
// role. Contributor is a full-viewer with the single power to invite users.
//
// Boundary summary:
//   • Super Admin (internal/platform): creates the organisation and links Organisation Admins.
//     In the prototype the Super Admin lens keeps full CRUD so every feature is reachable.
//   • Organisation Admin: creates legal entities and manages users at the organisation AND
//     entity level. Does NOT create or edit engagements.
//   • Engagement Admin: creates engagements, edits engagement detail, connects engagements
//     to legal entities. Does NOT touch legal-entity data or org users.
//   • Contributor: can INVITE users (org / entity / engagement level). No other write actions.
// One user may hold BOTH admin roles (roles are composable) — capabilities then union.

import type { UserRole } from "./org-details-data";

export type Capability =
  | "org.create"                 // Super Admin only — create the organisation itself
  | "org.edit"                   // rename/logo, link admins (Super Admin)
  | "entity.create"
  | "entity.edit"
  | "entity.disable"
  | "engagement.create"          // create engagements + connect them to entities
  | "engagement.editDetail"      // edit engagement internals
  | "group.manage"
  // V11-J — invite/add-user is now split by context. Each admin role gets ONLY the
  // context it owns. Contributor + Super Admin get all three.
  | "user.invite.org"            // Add User on the org-level Users tab
  | "user.invite.entity"         // Add User on an entity-detail Users section
  | "user.invite.engagement"     // Assign User on an engagement detail page
  | "user.manage"                // edit / approve / reject / remove existing users
  | "case.create";               // subject additionally to per-user canCreateCases + country scope

const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  // Platform view — full CRUD in the prototype so every feature is reachable.
  "Super Admin": [
    "org.create", "org.edit",
    "entity.create", "entity.edit", "entity.disable",
    "engagement.create", "engagement.editDetail",
    "group.manage",
    "user.invite.org", "user.invite.entity", "user.invite.engagement",
    "user.manage", "case.create",
  ],
  "Organisation Admin": [
    // Sets up legal entities + manages users at ORG and ENTITY level only.
    "entity.create", "entity.edit", "entity.disable",
    "group.manage",
    "user.invite.org", "user.invite.entity",
    "user.manage",
    // NOT: engagement.create / engagement.editDetail — that belongs to the Engagement Admin.
    // NOT: user.invite.engagement — engagement user assignment is the Engagement Admin's remit.
  ],
  "Engagement Admin": [
    // Creates engagements, assigns engagement users, connects engagements to entities.
    "engagement.create", "engagement.editDetail",
    "user.invite.engagement",
    "user.manage",
    // NOT: entity.* — never touches legal-entity data.
    // NOT: user.invite.org / user.invite.entity — no org- or entity-level user creation.
  ],
  Contributor: [
    // See-only lens with the ability to invite users at every level.
    "user.invite.org", "user.invite.entity", "user.invite.engagement",
  ],
};

/** Does the given role (or composable set of roles) grant a capability? */
export function can(roles: UserRole | UserRole[], capability: Capability): boolean {
  const list = Array.isArray(roles) ? roles : [roles];
  return list.some((r) => ROLE_CAPABILITIES[r]?.includes(capability));
}

/** All capabilities for a role set (union) — handy for debugging / display. */
export function capabilitiesOf(roles: UserRole | UserRole[]): Capability[] {
  const list = Array.isArray(roles) ? roles : [roles];
  return [...new Set(list.flatMap((r) => ROLE_CAPABILITIES[r] ?? []))];
}
