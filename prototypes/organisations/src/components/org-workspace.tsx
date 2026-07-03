import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Plus, Building2, Users as UsersIcon, FileText,
  Pencil, Ban, MoreHorizontal, RotateCcw, UserPlus, CornerDownRight,
  Link2, Unlink, Activity, ClipboardList, X, AlertTriangle,
  Check, MapPin, Trash2,
} from "lucide-react";
import { Badge, Button, EmptyState, Tabs, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, cn } from "@wts/ui";
import { Organization } from "./organizations-data";
import {
  LegalEntity, OrgUser, Engagement, VatRegistration, ActivityLogEntry, AccessScope,
  EntityStatus, EngagementStatus,
  LEGAL_ENTITIES, ENGAGEMENTS, USERS, VAT_REGISTRATIONS, ACTIVITY_LOG, GROUPS,
  computeEngagementStatus, userEngagementCombos, engagementLabel,
  Group, GroupType, today as todayIso, countryCodeFor, registrationById, registrationsForEntity, UserRole,
  EntityIdentifier, entityIdentifiers, identifierLabel,
} from "./org-details-data";
import { OrgWorkspaceData } from "./demo-data";
import { can } from "./permissions";
import { GroupsTab, EntityGroupMembershipsSection } from "./groups-tab";
import { CreateGroupModal, AddMembersModal, CreateGroupDraft } from "./group-modals";
import { LegalEntityModal, LegalEntityDraft, VatRow } from "./legal-entity-modal";
import { InviteUserModal, InviteDraft } from "./invite-user-modal";
import { AccessUserModal, AccessUserDraft } from "./access-user-modal";
import { EngagementDetailPage } from "./engagement-detail-page";
import { DisableEntityDialog } from "./entity-dialogs";
import { OrganizationPanel } from "./organization-panel";
import { DisableDialog } from "./disable-dialog";
import {
  CreateEngagementModal, EditEngagementModal, DisableEngagementDialog,
  ReenableEngagementDialog, AssignEngagementModal, RemoveAssignmentDialog,
  EngagementStatusPill, EngagementDraft, ServiceLinesCell,
} from "./engagement-modals";

// Super Admin workspace.
type WorkspaceTab = "entities" | "engagements" | "users" | "groups" | "activity" | "org-details";

// Default seed = the hand-authored "mixed" world, used when no dataset is injected
// (e.g. the standalone admin/user workspaces).
const DEFAULT_WORKSPACE_DATA: OrgWorkspaceData = {
  legalEntities: LEGAL_ENTITIES,
  engagements: ENGAGEMENTS,
  users: USERS,
  vatRegistrations: VAT_REGISTRATIONS,
  groups: GROUPS,
  activityLog: ACTIVITY_LOG,
};

export function OrgWorkspace({ org: initialOrg, onBack, actingRole = "Super Admin", data = DEFAULT_WORKSPACE_DATA }: {
  org: Organization;
  onBack: () => void;
  // V7 — the acting lens. Every role sees every tab and all content; capability-gated
  // buttons decide who can perform each write action. Defaults to Super Admin so this
  // component still renders the full experience when used standalone.
  actingRole?: UserRole;
  // Injected seed dataset (empty / mixed / full). Defaults to the mixed world.
  data?: OrgWorkspaceData;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("entities");
  // Local copy so Edit / Disable from the Organization Details tab reflect live.
  const [org, setOrg] = useState<Organization>(initialOrg);

  // Capability set — one place to check what the acting lens may do. Downstream tab
  // components take a `caps` prop rather than individual booleans, so adding a new gate
  // means adding a capability + a `caps.foo` check, not threading a new prop through.
  const caps = {
    orgEdit: can(actingRole, "org.edit"),
    entityCreate: can(actingRole, "entity.create"),
    entityEdit: can(actingRole, "entity.edit"),
    entityDisable: can(actingRole, "entity.disable"),
    engagementCreate: can(actingRole, "engagement.create"),
    engagementEditDetail: can(actingRole, "engagement.editDetail"),
    groupManage: can(actingRole, "group.manage"),
    // V11-A — invite is now split by level.
    userInviteOrg: can(actingRole, "user.invite.org"),
    userInviteEntity: can(actingRole, "user.invite.entity"),
    userInviteEngagement: can(actingRole, "user.invite.engagement"),
    userManage: can(actingRole, "user.manage"),
  };

  // Entity state — seeded from the injected dataset, filtered to this org.
  const [entities, setEntities] = useState<LegalEntity[]>(() => data.legalEntities.filter((e) => e.orgId === org.id));
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(() => {
    const first = data.legalEntities.find((e) => e.orgId === org.id);
    return first ? first.id : null;
  });

  // Engagement state
  const [engagements, setEngagements] = useState<Engagement[]>(() => data.engagements.filter((e) => e.orgId === org.id));
  const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>(null);

  // User state — a user belongs to this org if any of their legal entities is in
  // the org, or they are a WTS super admin with access to all entities.
  const [users, setUsers] = useState<OrgUser[]>(() => {
    const orgEntityIds = new Set(data.legalEntities.filter((e) => e.orgId === org.id).map((e) => e.id));
    return data.users.filter((u) => u.allEntities || u.entityIds.some((id) => orgEntityIds.has(id)));
  });

  // VAT state (managed only through entity modals)
  const [vatRegs, setVatRegs] = useState<VatRegistration[]>(() =>
    data.vatRegistrations.filter((v) => data.legalEntities.some((e) => e.orgId === org.id && e.id === v.entityId))
  );

  // Group state
  const [groups, setGroups] = useState<Group[]>(() => data.groups.filter((g) => g.orgId === org.id));
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    const first = data.groups.find((g) => g.orgId === org.id);
    return first ? first.id : null;
  });
  const [groupModal, setGroupModal] = useState<
    { mode: "create"; prefill?: { type?: GroupType; jurisdiction?: string; memberEntityId?: string } } | null
  >(null);
  const [addMembersTarget, setAddMembersTarget] = useState<Group | null>(null);

  // Activity log
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() =>
    data.activityLog.filter((a) => a.orgId === org.id)
  );

  // Entity modals
  const [entityModal, setEntityModal] = useState<{ mode: "create" | "edit"; entity: LegalEntity | null } | null>(null);
  const [disableEntityTarget, setDisableEntityTarget] = useState<LegalEntity | null>(null);

  // User modal (add / edit). kind "access" = new Access-Scope modal (Users tab); "invite" = legacy entity-level invite.
  const [userModal, setUserModal] = useState<{ kind: "access" | "invite"; mode: "add" | "edit"; user: OrgUser | null; defaultEntityId: string | null; allowSuperAdmin?: boolean } | null>(null);

  // Engagement modals
  const [createEngOpen, setCreateEngOpen] = useState(false);
  const [editEngTarget, setEditEngTarget] = useState<Engagement | null>(null);
  const [disableEngTarget, setDisableEngTarget] = useState<Engagement | null>(null);
  const [reenableEngTarget, setReenableEngTarget] = useState<Engagement | null>(null);
  const [assignEngEntityId, setAssignEngEntityId] = useState<string | null>(null);
  const [removeAssign, setRemoveAssign] = useState<{ engagement: Engagement; entityId: string } | null>(null);

  // Org Details modals
  const [editOrgOpen, setEditOrgOpen] = useState(false);
  const [disableOrgOpen, setDisableOrgOpen] = useState(false);

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) ?? null;
  const selectedEngagement = engagements.find((e) => e.id === selectedEngagementId) ?? null;

  // A freshly-created org has no legal entities yet: Engagements + Groups are gated
  // on having at least one entity, so those tabs are disabled until the first is added.
  const noEntities = entities.length === 0;
  useEffect(() => {
    if (noEntities && (activeTab === "engagements" || activeTab === "groups")) {
      setActiveTab("entities");
    }
  }, [noEntities, activeTab]);

  // The acting user in this prototype is always the WTS Super Admin.
  // V11-G — optional {previous, current} pair for change events. Left off for pure
  // creations / deletions where a delta isn't meaningful.
  function addLogEntry(
    action: string,
    legalEntity: string = "—",
    change?: { previous: string; current: string },
  ) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setActivityLog((prev) => [
      { id: `log-${Date.now()}`, orgId: org.id, timestamp: ts, userEmail: "super.admin@wts.de", legalEntity, action, previous: change?.previous, current: change?.current },
      ...prev,
    ]);
  }
  function entityNamesLabel(ids: string[]) {
    return ids.length ? ids.map((id) => entities.find((e) => e.id === id)?.legalName ?? id).join(", ") : "—";
  }

  // Entity handlers
  function handleEntitySubmit(
    draft: LegalEntityDraft,
    vatRows: VatRow[],
    groupAssignments: { groupId: string; makeRepresentative: boolean }[] = [],
    createNewGroup = false,
    assignedUserIds: string[] = [],
  ) {
    if (entityModal?.mode === "create") {
      const id = `le-${Date.now()}`;
      const newEntity: LegalEntity = {
        ...draft, id, orgId: org.id,
        vatId: "", countryCode: "", status: "Active",
      };
      setEntities((prev) => [...prev, newEntity]);
      setSelectedEntityId(id);
      const newVatRegs = vatRows.map((v, i) => ({
        id: v.id ?? `vat-${Date.now()}-${i}`, entityId: id, country: v.country, vatNumber: v.vatNumber, taxAuthority: "",
        validFrom: v.validFrom, validTo: v.validTo ?? null, address: v.address,
      }));
      setVatRegs((prev) => [...prev, ...newVatRegs]);
      addLogEntry(`Created legal entity "${draft.legalName}"`, draft.legalName);
      // Surface 2 hand-off: apply checked group assignments, then optionally open Create Group.
      applyGroupAssignments(id, groupAssignments);
      // V10-C — attach selected org users to the new entity (org-pool users) so they show
      // up in its Users section immediately.
      if (assignedUserIds.length) {
        setUsers((prev) => prev.map((u) => {
          if (!assignedUserIds.includes(u.id)) return u;
          const rows = u.access ?? [];
          if (rows.some((r) => r.entityId === id)) return u; // already
          const nextAccess = [...rows, { entityId: id, engagementIds: [], vatRegistrationIds: [] }];
          return { ...u, access: nextAccess, entityIds: Array.from(new Set([...(u.entityIds ?? []), id])) };
        }));
        addLogEntry(`Assigned ${assignedUserIds.length} user(s) to "${draft.legalName}"`, draft.legalName);
      }
      if (createNewGroup) {
        setGroupModal({ mode: "create", prefill: { jurisdiction: draft.jurisdiction, memberEntityId: id } });
      }
    } else if (entityModal?.mode === "edit" && entityModal.entity) {
      const id = entityModal.entity.id;
      setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, ...draft } : e)));
      // Replace VAT regs for this entity
      setVatRegs((prev) => [
        ...prev.filter((v) => v.entityId !== id),
        ...vatRows.map((v, i) => ({ id: v.id ?? `vat-${Date.now()}-${i}`, entityId: id, country: v.country, vatNumber: v.vatNumber, taxAuthority: "", validFrom: v.validFrom, validTo: v.validTo ?? null, address: v.address })),
      ]);
      addLogEntry(`Updated legal entity "${draft.legalName}"`, draft.legalName);
    }
    setEntityModal(null);
  }

  function setEntityStatus(id: string, status: EntityStatus) {
    const entity = entities.find((e) => e.id === id);
    setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    if (entity) {
      addLogEntry(
        `${status === "Disabled" ? "Disabled" : "Re-enabled"} legal entity "${entity.legalName}"`,
        entity.legalName,
        { previous: entity.status, current: status },
      );
    }
    setDisableEntityTarget(null);
  }

  // ─── Group handlers (enforce the spec's business rules) ───

  // Rule 2: end any prior ACTIVE membership of `entityId` in a same-TYPE group
  // (regardless of jurisdiction, other than `keepGroupId`) by setting its validTo
  // to today — silently, not blocked.
  // Change 9 — VAT membership keys on the entity's registration in the group's jurisdiction
  // (a company joins a country's VAT group via its registration there). CIT / Income-tax / other
  // types key on the entity (undefined). Keeps the picker flow entity-based, membership reg-keyed.
  function vatRegForMember(type: GroupType, jurisdiction: string, entityId: string): string | undefined {
    if (type !== "VAT") return undefined;
    const regs = registrationsForEntity(entityId, vatRegs);
    return (regs.find((r) => r.country === jurisdiction) ?? regs[0])?.id;
  }

  function supersede(list: Group[], entityId: string, type: GroupType, keepGroupId: string): Group[] {
    const now = todayIso();
    return list.map((g) => {
      if (g.id === keepGroupId || g.type !== type) return g;
      let changed = false;
      const members = g.members.map((m) => {
        if (m.entityId === entityId && m.validFrom <= now && (m.validTo === null || m.validTo >= now)) {
          changed = true;
          return { ...m, validTo: now };
        }
        return m;
      });
      return changed ? { ...g, members } : g;
    });
  }

  function createGroup(draft: CreateGroupDraft) {
    const id = `grp-${Date.now()}`;
    const newGroup: Group = {
      id, orgId: org.id, name: draft.name, type: draft.type, jurisdiction: draft.jurisdiction,
      members: draft.members.map((m) => ({
        entityId: m.entityId, vatRegistrationId: vatRegForMember(draft.type, draft.jurisdiction, m.entityId),
        representative: m.entityId === draft.representativeId, validFrom: m.validFrom, validTo: m.validTo,
      })),
    };
    setGroups((prev) => {
      let next = [...prev, newGroup];
      for (const m of draft.members) next = supersede(next, m.entityId, draft.type, id);
      return next;
    });
    setSelectedGroupId(id);
    addLogEntry(`Created ${draft.type} group "${draft.name}"`);
    setGroupModal(null);
  }

  function addMembers(groupId: string, entityIds: string[], validFrom: string, validTo: string | null) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const now = todayIso();
    setGroups((prev) => {
      let next = prev.map((g) =>
        g.id === groupId
          ? { ...g, members: [...g.members, ...entityIds.map((eid) => ({ entityId: eid, vatRegistrationId: vatRegForMember(group.type, group.jurisdiction, eid), representative: false, validFrom, validTo }))] }
          : g,
      );
      if (validFrom <= now && (validTo === null || validTo >= now)) {
        for (const eid of entityIds) next = supersede(next, eid, group.type, groupId);
      }
      return next;
    });
    addLogEntry(`Added ${entityIds.length} member(s) to "${group.name}"`);
    setAddMembersTarget(null);
  }

  // V11-F — "remove member" now ENDS the active membership (validTo = today) instead of
  // deleting the row, so the member moves to the Inactive list as a past member. The rep
  // guard (rule 1) still holds: the current representative can't be removed until promoted.
  function removeMember(groupId: string, entityId: string) {
    // End the membership effective yesterday. `periodStatus` only treats a membership as
    // "Ended" when validTo < today (strict), so end-dating to today would leave it Active;
    // using yesterday makes the member immediately Ended → it moves to Inactive Members.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const end = yesterday.toISOString().slice(0, 10);
    const group = groups.find((g) => g.id === groupId);
    const memberName = entities.find((e) => e.id === entityId)?.legalName ?? entityId;
    setGroups((prev) => prev.map((g) => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        members: g.members.map((m) => {
          if (m.entityId !== entityId) return m;
          if (m.representative) return m; // guarded — must promote another first
          if (m.validTo != null) return m; // already ended
          return { ...m, validTo: end };
        }),
      };
    }));
    if (group) addLogEntry(`Removed "${memberName}" from group "${group.name}"`);
  }

  // V11-E — delete an entire group.
  function deleteGroup(groupId: string) {
    const g = groups.find((x) => x.id === groupId);
    setGroups((prev) => prev.filter((x) => x.id !== groupId));
    if (selectedGroupId === groupId) setSelectedGroupId(null);
    if (g) addLogEntry(`Deleted group "${g.name}"`);
  }

  // Rule 1: promote sets exactly one representative (target true, all others false).
  function promoteRep(groupId: string, entityId: string) {
    const g = groups.find((x) => x.id === groupId);
    const prevRep = g?.members.find((m) => m.representative);
    const newRep = g?.members.find((m) => m.entityId === entityId);
    const nameOf = (eid?: string) => (eid ? (entities.find((e) => e.id === eid)?.legalName ?? eid) : "—");
    setGroups((prev) => prev.map((x) =>
      x.id === groupId
        ? { ...x, members: x.members.map((m) => ({ ...m, representative: m.entityId === entityId })) }
        : x,
    ));
    if (g && newRep) {
      addLogEntry(
        `Changed representative of "${g.name}"`,
        "—",
        { previous: nameOf(prevRep?.entityId), current: nameOf(entityId) },
      );
    }
  }

  function cancelPending(groupId: string, entityId: string) {
    const now = todayIso();
    setGroups((prev) => prev.map((g) =>
      g.id === groupId
        ? { ...g, members: g.members.filter((m) => !(m.entityId === entityId && m.validFrom > now)) }
        : g,
    ));
  }

  // Applied after entity creation (Surface 2 hand-off): add the new entity to each
  // checked group, honoring the rep swap and rule-2 supersede.
  function applyGroupAssignments(entityId: string, assignments: { groupId: string; makeRepresentative: boolean }[]) {
    if (!assignments.length) return;
    const now = todayIso();
    setGroups((prev) => {
      let next = prev.map((g) => {
        const a = assignments.find((x) => x.groupId === g.id);
        if (!a) return g;
        const members = (a.makeRepresentative ? g.members.map((m) => ({ ...m, representative: false })) : [...g.members]);
        members.push({ entityId, vatRegistrationId: vatRegForMember(g.type, g.jurisdiction, entityId), representative: a.makeRepresentative, validFrom: now, validTo: null });
        return { ...g, members };
      });
      for (const a of assignments) {
        const g = next.find((x) => x.id === a.groupId);
        if (g) next = supersede(next, entityId, g.type, g.id);
      }
      return next;
    });
  }

  // User handlers
  function handleSubmitUser(d: InviteDraft) {
    // A Super Admin user has access to every legal entity ("ALL").
    const isSuperAdmin = d.role === "Super Admin";
    const entityIds = isSuperAdmin ? [] : d.entityIds;
    const allEntities = isSuperAdmin || undefined;
    const accessLabel = isSuperAdmin ? "ALL" : entityNamesLabel(d.entityIds);
    if (userModal?.mode === "edit" && userModal.user) {
      const id = userModal.user.id;
      setUsers((prev) => prev.map((u) => u.id === id ? {
        ...u, email: d.email, userType: d.userType, role: d.role as any, entityIds, allEntities,
      } : u));
      addLogEntry(`Updated user ${d.email}`, accessLabel);
    } else {
      // Super admin adds users directly (no invitation step) → Active
      const name = d.email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      setUsers((prev) => [{
        id: `u-${Date.now()}`, entityIds, allEntities, name, email: d.email,
        userType: d.userType, role: d.role as any, status: "Active",
        invitedBy: "Thomas Becker", dateAdded: new Date().toISOString().slice(0, 10),
      }, ...prev]);
      addLogEntry(`Added user ${d.email}`, accessLabel);
    }
  }

  // Users tab Add/Edit via the Access-Scope modal.
  function handleSubmitAccessUser(d: AccessUserDraft, editingUserId: string | null) {
    const isSuperAdmin = d.role === "Super Admin";
    const access = isSuperAdmin ? undefined : d.access;
    const entityIds = isSuperAdmin ? [] : Array.from(new Set(d.access.map((a) => a.entityId)));
    const allEntities = isSuperAdmin || undefined;
    const accessLabel = isSuperAdmin ? "ALL" : entityNamesLabel(entityIds);
    if (editingUserId) {
      setUsers((prev) => prev.map((u) => u.id === editingUserId ? {
        ...u, name: d.name, email: d.email, userType: d.userType, role: d.role, roles: d.roles,
        poolLevel: d.poolLevel, canCreateCases: d.canCreateCases, caseCountryScope: d.caseCountryScope,
        access, entityIds, allEntities,
      } : u));
      addLogEntry(`Updated user ${d.email}`, accessLabel);
    } else {
      setUsers((prev) => [{
        id: `u-${Date.now()}`, entityIds, access, allEntities, name: d.name, email: d.email,
        userType: d.userType, role: d.role, roles: d.roles,
        poolLevel: d.poolLevel, canCreateCases: d.canCreateCases, caseCountryScope: d.caseCountryScope,
        status: "Active",
        invitedBy: "Thomas Becker", dateAdded: new Date().toISOString().slice(0, 10),
      }, ...prev]);
      addLogEntry(`Added user ${d.email}`, accessLabel);
    }
  }

  function approveUser(id: string) {
    const u = users.find((x) => x.id === id);
    setUsers((prev) => prev.map((x) => x.id === id ? { ...x, status: "Approved" } : x));
    if (u) addLogEntry(`Approved user ${u.email}`, entityNamesLabel(u.entityIds));
  }

  function rejectUser(id: string) {
    const u = users.find((x) => x.id === id);
    setUsers((prev) => prev.map((x) => x.id === id ? { ...x, status: "Rejected" } : x));
    if (u) addLogEntry(`Rejected user ${u.email}`, entityNamesLabel(u.entityIds));
  }

  function removeUser(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  // Engagement handlers
  function today() {
    return new Date().toISOString().slice(0, 10);
  }
  function handleCreateEngagement(draft: EngagementDraft) {
    const id = `eng-${Date.now()}`;
    const base: Engagement = {
      id, orgId: org.id, entityIds: [],
      contractRef: draft.contractRef, serviceLines: draft.serviceLines,
      status: draft.status, startDate: fromInputDate(draft.startDate),
      endDate: draft.endDate ? fromInputDate(draft.endDate) : null,
      createdBy: "super.admin@wts.de", lastUpdated: today(),
    };
    setEngagements((prev) => [...prev, { ...base, status: computeEngagementStatus(base) }]);
    addLogEntry(`Created engagement ${draft.contractRef}`);
    setCreateEngOpen(false);
    // Treat a newly created engagement as "new": open it so the user lands on its
    // (empty) detail page and can connect legal entities / users next.
    setSelectedEngagementId(id);
  }

  function handleEditEngagement(draft: EngagementDraft) {
    if (!editEngTarget) return;
    setEngagements((prev) => prev.map((e) => {
      if (e.id !== editEngTarget.id) return e;
      const updated: Engagement = {
        ...e, contractRef: draft.contractRef, serviceLines: draft.serviceLines,
        status: draft.status, startDate: fromInputDate(draft.startDate),
        endDate: draft.endDate ? fromInputDate(draft.endDate) : null,
        lastUpdated: today(),
      };
      return { ...updated, status: computeEngagementStatus(updated) };
    }));
    addLogEntry(`Updated engagement ${draft.contractRef}`);
    setEditEngTarget(null);
  }

  // Connect / disconnect legal entities on an engagement (from the Engagement detail page).
  function connectEntitiesToEngagement(engId: string, entityIds: string[]) {
    const eng = engagements.find((e) => e.id === engId);
    setEngagements((prev) => prev.map((e) => {
      if (e.id !== engId) return e;
      const merged = Array.from(new Set([...e.entityIds, ...entityIds]));
      const updated = { ...e, entityIds: merged, lastUpdated: today() };
      return { ...updated, status: computeEngagementStatus(updated) };
    }));
    entityIds.forEach((eid) => {
      const name = entities.find((e) => e.id === eid)?.legalName ?? "—";
      if (eng) addLogEntry(`Connected ${name} to engagement ${eng.contractRef}`, name);
    });
  }
  function disconnectEntityFromEngagement(engId: string, entityId: string) {
    const eng = engagements.find((e) => e.id === engId);
    const name = entities.find((e) => e.id === entityId)?.legalName ?? "—";
    setEngagements((prev) => prev.map((e) => {
      if (e.id !== engId) return e;
      const updated = { ...e, entityIds: e.entityIds.filter((id) => id !== entityId), lastUpdated: today() };
      return { ...updated, status: computeEngagementStatus(updated) };
    }));
    if (eng) addLogEntry(`Removed ${name} from engagement ${eng.contractRef}`, name);
  }

  // Merge an engagement's access for a set of entities into a user's existing access rows.
  // Change 2 — carries per-entity VAT-registration scope from the draft onto the merged rows.
  function mergeEngagementAccess(existing: AccessScope[] | undefined, engId: string, draftRows: AccessScope[]): AccessScope[] {
    const map = new Map<string, Set<string>>();
    const regMap = new Map<string, string[] | undefined>();
    (existing ?? []).forEach((a) => { map.set(a.entityId, new Set(a.engagementIds)); regMap.set(a.entityId, a.vatRegistrationIds); });
    map.forEach((set) => set.delete(engId));
    draftRows.forEach((r) => {
      if (!map.has(r.entityId)) map.set(r.entityId, new Set());
      map.get(r.entityId)!.add(engId);
      // Registration scope is per (user, entity) — the draft row is the source of truth for it.
      regMap.set(r.entityId, r.vatRegistrationIds && r.vatRegistrationIds.length ? [...r.vatRegistrationIds] : undefined);
    });
    return [...map.entries()].filter(([, s]) => s.size > 0).map(([entityId, s]) => ({ entityId, engagementIds: [...s], vatRegistrationIds: regMap.get(entityId) }));
  }

  // Add / edit a user from the Engagement detail page (engagement is locked).
  function handleEngagementUserSubmit(d: AccessUserDraft, editingUserId: string | null) {
    const engId = selectedEngagementId;
    if (!engId) return;
    const eng = engagements.find((e) => e.id === engId);
    if (editingUserId) {
      setUsers((prev) => prev.map((u) => {
        if (u.id !== editingUserId) return u;
        const access = mergeEngagementAccess(u.access, engId, d.access);
        return { ...u, name: d.name, email: d.email, userType: d.userType, role: d.role, roles: d.roles, poolLevel: d.poolLevel, canCreateCases: d.canCreateCases, caseCountryScope: d.caseCountryScope, access, entityIds: Array.from(new Set(access.map((a) => a.entityId))) };
      }));
      addLogEntry(`Updated access for ${d.email}${eng ? ` on engagement ${eng.contractRef}` : ""}`);
    } else {
      const access = mergeEngagementAccess(undefined, engId, d.access);
      setUsers((prev) => [{
        id: `u-${Date.now()}`, entityIds: Array.from(new Set(access.map((a) => a.entityId))), access,
        name: d.name, email: d.email, userType: d.userType, role: d.role, roles: d.roles, poolLevel: d.poolLevel, canCreateCases: d.canCreateCases, caseCountryScope: d.caseCountryScope, status: "Active",
        invitedBy: "Thomas Becker", dateAdded: today(),
      }, ...prev]);
      addLogEntry(`Added user ${d.email}${eng ? ` to engagement ${eng.contractRef}` : ""}`);
    }
  }

  // V10-B — assign existing users to the currently-open engagement. For each user, add
  // this engagement to every access row whose entity is connected to the engagement.
  function assignUsersToEngagement(userIds: string[]) {
    const engId = selectedEngagementId;
    if (!engId) return;
    const eng = engagements.find((e) => e.id === engId);
    if (!eng) return;
    const connected = new Set(eng.entityIds);
    setUsers((prev) => prev.map((u) => {
      if (!userIds.includes(u.id)) return u;
      const eligibleEntityIds = u.allEntities
        ? [...connected]
        : u.entityIds.filter((id) => connected.has(id));
      if (eligibleEntityIds.length === 0) return u; // no overlap → nothing to assign
      // Seed missing access rows for eligible entities, then add engId to each.
      const map = new Map<string, Set<string>>();
      const regMap = new Map<string, string[] | undefined>();
      (u.access ?? []).forEach((a) => { map.set(a.entityId, new Set(a.engagementIds)); regMap.set(a.entityId, a.vatRegistrationIds); });
      for (const eid of eligibleEntityIds) {
        if (!map.has(eid)) map.set(eid, new Set());
        map.get(eid)!.add(engId);
      }
      const access = [...map.entries()].map(([entityId, s]) => ({ entityId, engagementIds: [...s], vatRegistrationIds: regMap.get(entityId) }));
      return { ...u, access, entityIds: Array.from(new Set([...(u.entityIds ?? []), ...eligibleEntityIds])) };
    }));
    addLogEntry(`Assigned ${userIds.length} user(s) to engagement ${eng.contractRef}`);
  }

  // Revoke a user's access to the currently-open engagement (from the Assigned Users table).
  function revokeEngagementFromUser(userId: string) {
    const engId = selectedEngagementId;
    if (!engId) return;
    const eng = engagements.find((e) => e.id === engId);
    const u = users.find((x) => x.id === userId);
    setUsers((prev) => prev.map((x) => {
      if (x.id !== userId) return x;
      const access = mergeEngagementAccess(x.access, engId, []); // remove engId from all rows
      return { ...x, access, entityIds: Array.from(new Set(access.map((a) => a.entityId))) };
    }));
    if (u && eng) addLogEntry(`Removed ${u.email} from engagement ${eng.contractRef}`);
  }

  function setEngStatus(id: string, status: EngagementStatus) {
    const eng = engagements.find((e) => e.id === id);
    setEngagements((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
    if (eng) addLogEntry(
      `${status === "Disabled" ? "Disabled" : "Re-enabled"} engagement ${eng.contractRef}`,
      entityNamesLabel(eng.entityIds),
      { previous: eng.status, current: status },
    );
  }

  function assignEngagementsToEntity(entityId: string, engIds: string[]) {
    setEngagements((prev) => prev.map((e) =>
      engIds.includes(e.id) && !e.entityIds.includes(entityId)
        ? { ...e, entityIds: [...e.entityIds, entityId] }
        : e
    ));
    const entityName = entities.find((e) => e.id === entityId)?.legalName ?? "—";
    engIds.forEach((engId) => {
      const eng = engagements.find((e) => e.id === engId);
      if (eng) addLogEntry(`Assigned engagement ${eng.contractRef} to ${entityName}`, entityName);
    });
    setAssignEngEntityId(null);
  }

  function removeEngagementFromEntity(entityId: string, engId: string) {
    const eng = engagements.find((e) => e.id === engId);
    setEngagements((prev) => prev.map((e) =>
      e.id === engId ? { ...e, entityIds: e.entityIds.filter((id) => id !== entityId) } : e
    ));
    const entityName = entities.find((e) => e.id === entityId)?.legalName ?? "—";
    if (eng) addLogEntry(`Removed engagement ${eng.contractRef} from ${entityName}`, entityName);
    setRemoveAssign(null);
  }

  // Derive VAT rows for editing
  function entityVatRows(entityId: string): VatRow[] {
    return vatRegs.filter((v) => v.entityId === entityId).map((v) => ({ id: v.id, country: v.country, vatNumber: v.vatNumber, validFrom: v.validFrom, validTo: v.validTo ?? null, address: v.address }));
  }

  // Organization handlers (Organization Details tab)
  function handleOrgSubmit(data: { name: string; description: string; status: any; logoUrl?: string }) {
    const nameChanged = data.name !== org.name;
    setOrg((o) => ({ ...o, name: data.name, description: data.description, status: data.status, logoUrl: data.logoUrl }));
    addLogEntry(
      "Updated organization details",
      "—",
      nameChanged ? { previous: org.name, current: data.name } : undefined,
    );
    setEditOrgOpen(false);
  }
  function handleOrgDisable() {
    addLogEntry("Disabled organization", "—", { previous: org.status, current: "Disabled" });
    setOrg((o) => ({ ...o, status: "Disabled" }));
    setDisableOrgOpen(false);
  }
  function handleOrgEnable() {
    addLogEntry("Re-enabled organization", "—", { previous: org.status, current: "Active" });
    setOrg((o) => ({ ...o, status: "Active" }));
  }

  return (
    <div className="flex flex-col min-h-full">
      {selectedEngagement ? (
        <EngagementDetailPage
          org={org}
          engagement={selectedEngagement}
          entities={entities}
          engagements={engagements}
          users={users}
          log={activityLog}
          onBack={() => setSelectedEngagementId(null)}
          onEditEngagement={() => setEditEngTarget(selectedEngagement)}
          onDisable={() => setDisableEngTarget(selectedEngagement)}
          onReenable={() => setReenableEngTarget(selectedEngagement)}
          onConnectEntities={(ids) => connectEntitiesToEngagement(selectedEngagement.id, ids)}
          onDisconnectEntity={(eid) => disconnectEntityFromEngagement(selectedEngagement.id, eid)}
          onSubmitUser={handleEngagementUserSubmit}
          onAssignUsers={assignUsersToEngagement}
          onRemoveUser={revokeEngagementFromUser}
          onOpenEntity={(id) => { setSelectedEngagementId(null); setActiveTab("entities"); setSelectedEntityId(id); }}
          canEdit={caps.engagementEditDetail}
          canInviteUsers={caps.userInviteEngagement}
        />
      ) : (
      <>
      {/* Page Header */}
      <div className="border-b bg-neutral-50 border-neutral-200 px-8 pt-5 pb-0">
        <Button type="button" variant="link" onClick={onBack} className="mb-4 h-auto p-0">
          <ArrowLeft /> Back
        </Button>
        <div className="flex items-center gap-3 mb-5">
          <div className="items-center flex justify-center w-10 h-10 rounded-full overflow-hidden shrink-0 bg-primary text-white">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[16px] leading-none" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>
                {org.name.charAt(0)}
              </span>
            )}
          </div>
          <h1 className="text-primary text-[26px] leading-[32px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>
            {org.name}
          </h1>
        </div>

        <Tabs
          variant="line"
          value={activeTab}
          onChange={(v) => setActiveTab(v as WorkspaceTab)}
          options={[
            { value: "entities", label: <span className="inline-flex items-center gap-1.5"><Building2 className="size-4" /> Legal Entities</span>, count: entities.length },
            { value: "engagements", label: <span className="inline-flex items-center gap-1.5"><FileText className="size-4" /> Engagements</span>, count: engagements.length, disabled: noEntities },
            { value: "users", label: <span className="inline-flex items-center gap-1.5"><UsersIcon className="size-4" /> Users</span>, count: users.length },
            { value: "groups", label: <span className="inline-flex items-center gap-1.5"><UsersIcon className="size-4" /> Groups</span>, count: groups.length, disabled: noEntities },
            { value: "activity", label: <span className="inline-flex items-center gap-1.5"><Activity className="size-4" /> Activity Log</span>, count: activityLog.length },
            { value: "org-details", label: <span className="inline-flex items-center gap-1.5"><ClipboardList className="size-4" /> Organization Details</span> },
          ]}
        />
      </div>

      {/* Tab Content */}
      <div className="flex grow">
        {activeTab === "entities" && (
          <EntitiesTab
            entities={entities}
            selectedId={selectedEntityId}
            onSelect={setSelectedEntityId}
            onAdd={() => setEntityModal({ mode: "create", entity: null })}
            selectedEntity={selectedEntity}
            engagements={engagements}
            users={users}
            vatRegs={vatRegs}
            onEditEntity={(e) => setEntityModal({ mode: "edit", entity: e })}
            onDisableEntity={(e) => setDisableEntityTarget(e)}
            onReenableEntity={(e) => setEntityStatus(e.id, "Active")}
            onAssignEng={() => selectedEntityId && setAssignEngEntityId(selectedEntityId)}
            onRemoveEngAssignment={(eng) => selectedEntityId && setRemoveAssign({ engagement: eng, entityId: selectedEntityId })}
            onOpenEngagement={(id) => setSelectedEngagementId(id)}
            onAddUser={() => setUserModal({ kind: "access", mode: "add", user: null, defaultEntityId: selectedEntityId })}
            onEditUser={(u) => setUserModal({ kind: "access", mode: "edit", user: u, defaultEntityId: null })}
            onApproveUser={approveUser}
            onRejectUser={rejectUser}
            onRemoveUser={removeUser}
            groups={groups}
            onOpenGroup={(id) => { setActiveTab("groups"); setSelectedGroupId(id); }}
            caps={caps}
          />
        )}

        {activeTab === "groups" && (
          <GroupsTab
            groups={groups}
            entities={entities}
            selectedId={selectedGroupId}
            onSelect={setSelectedGroupId}
            onAddGroup={() => setGroupModal({ mode: "create" })}
            onAddMembers={(g) => setAddMembersTarget(g)}
            onRemoveMember={removeMember}
            onPromoteRep={promoteRep}
            onCancelPending={cancelPending}
            onDeleteGroup={deleteGroup}
            canManage={caps.groupManage}
            onOpenConsolidationCase={(g) => {
              // TODO: navigate to Case Management focused on this group's consolidation case.
              // Case Management is out of scope for this build — stub the affordance only.
              console.info(`[stub] Open consolidation case for group "${g.name}" (${g.consolidationCase?.name ?? "—"}) in Case Management`);
            }}
          />
        )}

        {activeTab === "engagements" && (
          <div className="flex grow flex-col px-8 py-6 w-full">
            <EngagementsTab
              engagements={engagements}
              entities={entities}
              onCreate={() => setCreateEngOpen(true)}
              onEdit={setEditEngTarget}
              onDisable={setDisableEngTarget}
              onReenable={setReenableEngTarget}
              onOpenEngagement={(id) => setSelectedEngagementId(id)}
              canCreate={caps.engagementCreate}
              canManage={caps.engagementEditDetail}
            />
          </div>
        )}

        {activeTab === "users" && (
          <div className={cn("flex grow flex-col w-full", users.length === 0 ? "p-6" : "px-8 py-6")}>
            <UsersTab
              users={users}
              entities={entities}
              engagements={engagements}
              onOpenEngagement={(id) => setSelectedEngagementId(id)}
              onAdd={() => setUserModal({ kind: "access", mode: "add", user: null, defaultEntityId: null, allowSuperAdmin: true })}
              onEditUser={(u) => setUserModal({ kind: "access", mode: "edit", user: u, defaultEntityId: null, allowSuperAdmin: true })}
              onApproveUser={approveUser}
              onRejectUser={rejectUser}
              onRemoveUser={removeUser}
              canInvite={caps.userInviteOrg}
              canManage={caps.userManage}
            />
          </div>
        )}

        {activeTab === "activity" && (
          <div className={cn("flex grow flex-col w-full", activityLog.length === 0 ? "p-6" : "px-8 py-6")}>
            <ActivityLogTab log={activityLog} />
          </div>
        )}

        {activeTab === "org-details" && (
          <div className="px-8 py-6 w-full">
            <OrgDetailsTab
              org={org}
              entityCount={entities.length}
              engagementCount={engagements.length}
              userCount={users.length}
              onEdit={() => setEditOrgOpen(true)}
              onDisable={() => setDisableOrgOpen(true)}
              onEnable={handleOrgEnable}
              canManage={caps.orgEdit}
            />
          </div>
        )}
      </div>
      </>
      )}

      {/* Entity modals */}
      {entityModal && (
        <LegalEntityModal
          mode={entityModal.mode}
          entity={entityModal.entity}
          siblings={entities}
          initialVatRegs={entityModal.entity ? entityVatRows(entityModal.entity.id) : []}
          orgId={org.id}
          groups={groups}
          orgUsers={users.filter((u) => !u.allEntities)}
          onClose={() => setEntityModal(null)}
          onSubmit={handleEntitySubmit}
        />
      )}
      {disableEntityTarget && (
        <DisableEntityDialog
          entity={disableEntityTarget}
          onCancel={() => setDisableEntityTarget(null)}
          onConfirm={() => setEntityStatus(disableEntityTarget.id, "Disabled")}
        />
      )}

      {/* User modal */}
      {userModal && userModal.kind === "access" && (
        <AccessUserModal
          mode={userModal.mode}
          user={userModal.user}
          entities={entities}
          engagements={engagements}
          allowSuperAdminRole={userModal.allowSuperAdmin}
          defaultEntityId={userModal.defaultEntityId}
          onClose={() => setUserModal(null)}
          onSubmit={(d) => handleSubmitAccessUser(d, userModal.mode === "edit" ? userModal.user?.id ?? null : null)}
        />
      )}
      {userModal && userModal.kind === "invite" && (
        <InviteUserModal
          entities={entities}
          mode={userModal.mode}
          user={userModal.user}
          defaultEntityId={userModal.defaultEntityId}
          allowSuperAdminRole={userModal.allowSuperAdmin}
          onClose={() => setUserModal(null)}
          onSubmit={handleSubmitUser}
        />
      )}

      {/* Engagement modals */}
      {createEngOpen && <CreateEngagementModal onClose={() => setCreateEngOpen(false)} onSubmit={handleCreateEngagement} />}
      {editEngTarget && (
        <EditEngagementModal
          engagement={editEngTarget}
          entities={entities}
          onClose={() => setEditEngTarget(null)}
          onSubmit={handleEditEngagement}
          onOpenEntity={(id) => { setActiveTab("entities"); setSelectedEntityId(id); }}
        />
      )}
      {disableEngTarget && (
        <DisableEngagementDialog
          engagement={disableEngTarget}
          onCancel={() => setDisableEngTarget(null)}
          onConfirm={() => { setEngStatus(disableEngTarget.id, "Disabled"); setDisableEngTarget(null); }}
        />
      )}
      {reenableEngTarget && (
        <ReenableEngagementDialog
          engagement={reenableEngTarget}
          onCancel={() => setReenableEngTarget(null)}
          onConfirm={() => {
            const current = computeEngagementStatus({ ...reenableEngTarget, status: "Active" });
            setEngagements((prev) => prev.map((e) => e.id === reenableEngTarget.id ? { ...e, status: computeEngagementStatus({ ...e, status: "Active" }) } : e));
            addLogEntry(
              `Re-enabled engagement ${reenableEngTarget.contractRef}`,
              entityNamesLabel(reenableEngTarget.entityIds),
              { previous: reenableEngTarget.status, current },
            );
            setReenableEngTarget(null);
          }}
        />
      )}
      {assignEngEntityId && (() => {
        const available = engagements.filter((e) => !e.entityIds.includes(assignEngEntityId) && e.status !== "Disabled");
        return <AssignEngagementModal available={available} onClose={() => setAssignEngEntityId(null)} onAssign={(ids) => assignEngagementsToEntity(assignEngEntityId, ids)} />;
      })()}
      {removeAssign && (
        <RemoveAssignmentDialog
          engagement={removeAssign.engagement}
          entityName={entities.find((e) => e.id === removeAssign.entityId)?.legalName ?? ""}
          onCancel={() => setRemoveAssign(null)}
          onConfirm={() => removeEngagementFromEntity(removeAssign.entityId, removeAssign.engagement.id)}
        />
      )}

      {/* Org Details modals */}
      {editOrgOpen && (
        <OrganizationPanel mode="edit" org={org} onClose={() => setEditOrgOpen(false)} onSubmit={handleOrgSubmit} />
      )}
      {disableOrgOpen && (
        <DisableDialog org={org} onCancel={() => setDisableOrgOpen(false)} onConfirm={handleOrgDisable} />
      )}

      {/* Group modals */}
      {groupModal && (
        <CreateGroupModal
          orgId={org.id}
          entities={entities}
          groups={groups}
          prefill={groupModal.prefill}
          onClose={() => setGroupModal(null)}
          onCreate={createGroup}
          onViewGroup={(id) => { setActiveTab("groups"); setSelectedGroupId(id); }}
        />
      )}
      {addMembersTarget && (
        <AddMembersModal
          group={groups.find((g) => g.id === addMembersTarget.id) ?? addMembersTarget}
          entities={entities}
          onClose={() => setAddMembersTarget(null)}
          onAdd={(ids, from, to) => addMembers(addMembersTarget.id, ids, from, to)}
        />
      )}
    </div>
  );
}

/* ─── TAB 1 — Legal Entities ─────────────────────────────────────────────── */
export type WorkspaceCaps = {
  orgEdit: boolean;
  entityCreate: boolean;
  entityEdit: boolean;
  entityDisable: boolean;
  engagementCreate: boolean;
  engagementEditDetail: boolean;
  groupManage: boolean;
  userInviteOrg: boolean;
  userInviteEntity: boolean;
  userInviteEngagement: boolean;
  userManage: boolean;
};

function EntitiesTab({
  entities, selectedId, onSelect, onAdd,
  selectedEntity, engagements, users, vatRegs,
  onEditEntity, onDisableEntity, onReenableEntity,
  onAssignEng, onRemoveEngAssignment, onOpenEngagement,
  onAddUser, onEditUser, onApproveUser, onRejectUser, onRemoveUser,
  groups, onOpenGroup,
  caps,
}: {
  entities: LegalEntity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  selectedEntity: LegalEntity | null;
  engagements: Engagement[];
  users: OrgUser[];
  vatRegs: VatRegistration[];
  onEditEntity: (e: LegalEntity) => void;
  onDisableEntity: (e: LegalEntity) => void;
  onReenableEntity: (e: LegalEntity) => void;
  onAssignEng: () => void;
  onRemoveEngAssignment: (eng: Engagement) => void;
  onOpenEngagement: (id: string) => void;
  onAddUser: () => void;
  onEditUser: (u: OrgUser) => void;
  onApproveUser: (id: string) => void;
  onRejectUser: (id: string) => void;
  onRemoveUser: (id: string) => void;
  groups: Group[];
  onOpenGroup: (id: string) => void;
  caps: WorkspaceCaps;
}) {
  const childrenOf = (id: string) => entities.filter((e) => e.parentId === id);
  // Roots = entities with no parent (or whose parent isn't part of this org's set)
  const roots = entities.filter((e) => !e.parentId || !entities.some((x) => x.id === e.parentId));

  // Recursively render the full hierarchy tree (HQ → subsidiary → sub-subsidiary → …)
  function renderTree(node: LegalEntity, depth: number): React.ReactNode {
    return (
      <React.Fragment key={node.id}>
        <HierarchyRow entity={node} selected={selectedId === node.id} onSelect={onSelect} depth={depth} />
        {childrenOf(node.id).map((c) => renderTree(c, depth + 1))}
      </React.Fragment>
    );
  }
  // Freshly-created org (no entities): show a single prompt-only empty state — no
  // sidebar, no repeated actions. The single CTA is the only way to add the first entity.
  if (entities.length === 0) {
    return (
      <div className="flex grow flex-col bg-white p-6" style={{ minHeight: "calc(100vh - 200px)" }}>
        <EmptyBlock
          icon={<Building2 />}
          title="No legal entities yet"
          text="This organization was just created. Add your first legal entity to get started — engagements and groups unlock once an entity exists."
          cta={caps.entityCreate ? "Add Legal Entity" : undefined}
          onCta={caps.entityCreate ? onAdd : undefined}
        />
      </div>
    );
  }
  return (
    <div className="flex grow overflow-hidden" style={{ minHeight: "calc(100vh - 200px)" }}>
      {/* Left: Entity Hierarchy — always visible (no collapse) */}
      <div className="flex w-[288px] flex-col border-r border-neutral-200 shrink-0 bg-white overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-100 gap-2">
            <p className="text-neutral-400 text-[11px] leading-[16px] uppercase tracking-wide font-medium pl-1 shrink-0">Legal Entities</p>
            {caps.entityCreate && (
              <Button type="button" variant="outline" size="sm" onClick={onAdd}>
                <Plus className="size-4" /> Add Legal Entity
              </Button>
            )}
          </div>
          <div className="flex flex-col grow overflow-auto p-3 gap-2">
            {entities.length === 0 ? (
              <div className="flex flex-col items-center text-center gap-2 py-10 px-4">
                <Building2 className="w-7 h-7 text-neutral-300" />
                <p className="text-neutral-500 text-[13px] leading-[18px]">No legal entities yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {roots.map((r) => renderTree(r, 0))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Selected Entity Detail */}
      <div className="flex flex-col grow overflow-auto bg-white">
        {!selectedEntity ? (
          <div className="flex grow flex-col p-6">
            <EmptyBlock
              icon={<Building2 />}
              title="No legal entity selected"
              text="Select a legal entity from the hierarchy to view its details, or add a new one."
              cta={caps.entityCreate ? "Add Legal Entity" : undefined}
              onCta={caps.entityCreate ? onAdd : undefined}
            />
          </div>
        ) : (
          <div className="px-8 py-6 flex flex-col gap-8 bg-[#ffffff00]">
            {/* Entity Header */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <h2 className="text-primary text-[22px] leading-[28px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>
                    {selectedEntity.legalName}
                  </h2>
                  {selectedEntity.status === "Disabled" && (
                    <StatusBadge variant="disabled">Disabled</StatusBadge>
                  )}
                  <span className="items-center inline-flex border bg-neutral-50 border-neutral-200 text-neutral-600 text-[12px] leading-[16px] px-2.5 py-1 rounded-full">
                    {selectedEntity.type}
                  </span>
                </div>
                {(() => {
                  const addr = [selectedEntity.address, selectedEntity.postalCode, selectedEntity.city, selectedEntity.country].filter(Boolean).join(", ");
                  return (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="items-center inline-flex gap-1.5 w-fit text-neutral-500 text-[14px] leading-[20px] hover:text-brand hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5 shrink-0" />{addr}
                    </a>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                {caps.entityEdit && (
                  <button
                    type="button"
                    onClick={() => onEditEntity(selectedEntity)}
                    className="items-center flex gap-2 border border-neutral-200 bg-white text-neutral-700 text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-neutral-50"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                )}
                {caps.entityDisable && (selectedEntity.status === "Active" ? (
                  <button
                    type="button"
                    onClick={() => onDisableEntity(selectedEntity)}
                    className="items-center flex gap-2 border border-neutral-200 bg-white text-brand text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-red-50"
                  >
                    <Ban className="w-4 h-4" /> Disable
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onReenableEntity(selectedEntity)}
                    className="items-center flex gap-2 border border-neutral-200 bg-white text-emerald-700 text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-emerald-50"
                  >
                    <RotateCcw className="w-4 h-4" /> Re-enable
                  </button>
                ))}
              </div>
            </div>

            <div className={selectedEntity.status === "Disabled" ? "opacity-60 pointer-events-none" : ""}>
              {/* Details & Tax Footprint */}
              <section>
                <div className="grid grid-cols-2 gap-5">
                  <DetailCard title="Details">
                    <DetailRow label="Legal Name" value={selectedEntity.legalName} />
                    <DetailRow label="Legal Form" value={selectedEntity.legalForm} />
                    <DetailRow label="Fiscal Year" value={`${selectedEntity.fiscalYearStart} – ${selectedEntity.fiscalYearEnd}`} />
                    {(() => {
                      const ids = entityIdentifiers(selectedEntity);
                      const last = ids.length === 0;
                      return (
                        <>
                          <DetailRow label="Level of Shareholding" value={selectedEntity.levelOfShareholding ? `${selectedEntity.levelOfShareholding}%` : "—"} last={last} />
                          {ids.length > 0 && (
                            <div className="text-[12px] leading-[16px] font-medium text-neutral-500 pt-3 pb-1">Additional Identifiers</div>
                          )}
                          {ids.map((id, i) => (
                            <IdentifierRow key={id.id} id={id} last={i === ids.length - 1} />
                          ))}
                        </>
                      );
                    })()}
                  </DetailCard>
                  <DetailCard title="Tax Footprint">
                    {(() => {
                      // TIN CIT is a single scalar (entity.citNumber). TIN VAT lives per-country
                      // on VAT registrations. Both display as plain values — no status or dates.
                      const regs = vatRegs.filter((v) => v.entityId === selectedEntity.id);
                      const branches = selectedEntity.establishments ?? [];
                      const noVat = regs.length === 0;
                      const noBranches = branches.length === 0;
                      return (
                        <>
                          <div className="text-[12px] leading-[16px] font-medium text-neutral-500 pb-1">Head Office (Hauptsitz)</div>
                          <DetailRow label="Jurisdiction" value={selectedEntity.country} />
                          <DetailRow label="Tax Authority" value={selectedEntity.taxAuthority || "—"} />
                          <DetailRow label="TIN CIT" value={selectedEntity.citNumber || "—"} mono />
                          <DetailRow label="TIN Wage Tax" value={selectedEntity.wageTaxNumber || "—"} mono last={noBranches && noVat} />
                          {branches.map((b, bi) => (
                            <React.Fragment key={bi}>
                              <div className="text-[12px] leading-[16px] font-medium text-neutral-500 pt-3 pb-1">Branch · {b.jurisdiction}</div>
                              <DetailRow label="Jurisdiction" value={b.jurisdiction} />
                              <DetailRow label="Tax Authority" value={b.taxAuthority || "—"} />
                              <DetailRow label="TIN CIT" value={b.citNumber || "—"} mono />
                              <DetailRow label="TIN Wage Tax" value={b.wageTaxNumber || "—"} mono last={bi === branches.length - 1 && noVat} />
                            </React.Fragment>
                          ))}
                          {regs.length > 0 && (
                            <div className="text-[12px] leading-[16px] font-medium text-neutral-500 pt-3 pb-1">VAT Registrations (TIN VAT)</div>
                          )}
                          {regs.map((v, i) => <VatRegistrationRow key={v.id} reg={v} last={i === regs.length - 1} />)}
                        </>
                      );
                    })()}
                  </DetailCard>
                </div>
              </section>

              {/* Engagements (entity-level) — assigning engagements to an entity is the
                  Engagement Admin's remit (engagement.create capability). */}
              <section className="mt-8">
                <EntityEngagementsSection
                  entity={selectedEntity}
                  engagements={engagements}
                  onAssign={onAssignEng}
                  onRemove={onRemoveEngAssignment}
                  onOpenEngagement={onOpenEngagement}
                  canManage={caps.engagementCreate}
                />
              </section>

              {/* Group memberships (reciprocal link into the Groups tab) */}
              <section className="mt-8">
                <EntityGroupMembershipsSection
                  entity={selectedEntity}
                  groups={groups}
                  onOpenGroup={onOpenGroup}
                />
              </section>

              {/* Users — Add User is a user.invite affordance (all roles including
                  Contributor); the row actions (Edit / Approve / Reject / Remove) require
                  user.manage. Both are threaded through the section. */}
              <section className="mt-8">
                <EntityUsersSection
                  users={users.filter((u) => u.allEntities || u.entityIds.includes(selectedEntity.id))}
                  entityName={selectedEntity.legalName}
                  onAdd={onAddUser}
                  onEdit={onEditUser}
                  onApprove={onApproveUser}
                  onReject={onRejectUser}
                  onRemove={onRemoveUser}
                  canInvite={caps.userInviteEntity}
                  canManage={caps.userManage}
                />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function HierarchyRow({ entity, selected, onSelect, depth = 0 }: { entity: LegalEntity; selected: boolean; onSelect: (id: string) => void; depth?: number }) {
  const disabled = entity.status === "Disabled";
  const isChild = depth > 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(entity.id)}
      style={{ paddingLeft: 10 + depth * 18 }}
      className={`items-center flex gap-2 text-left text-[14px] leading-[20px] rounded-md py-2 pr-2.5 ${
        selected ? "bg-[rgba(200,16,46,0.1)] text-brand" : "text-neutral-700 hover:bg-neutral-100"
      } ${disabled ? "opacity-50" : ""}`}
    >
      {isChild ? (
        <CornerDownRight className={`w-3.5 h-3.5 shrink-0 ${selected ? "text-brand" : "text-neutral-400"}`} />
      ) : (
        <Building2 className={`w-4 h-4 shrink-0 ${selected ? "text-brand" : "text-neutral-400"}`} />
      )}
      <span className="truncate grow">{entity.legalName}</span>
      {disabled && (
        <span className="text-[10px] leading-[14px] uppercase tracking-wide text-neutral-400 shrink-0">Disabled</span>
      )}
    </button>
  );
}

/* ─── Entity-level Engagements section ───────────────────────────────────── */
export function EntityEngagementsSection({
  entity, engagements, onAssign, onRemove, onOpenEngagement, canManage = true,
}: {
  entity: LegalEntity;
  engagements: Engagement[];
  onAssign: () => void;
  onRemove: (eng: Engagement) => void;
  onOpenEngagement?: (id: string) => void;
  canManage?: boolean; // Change 3 — assigning/removing engagements is an Organisation-Admin action
}) {
  const assigned = engagements.filter((e) => e.entityIds.includes(entity.id));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-primary text-[18px] leading-[24px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Engagements</h3>
        {canManage && (
          <button
            type="button"
            onClick={onAssign}
            className="items-center flex gap-2 border border-neutral-200 bg-white text-neutral-700 text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-neutral-50"
          >
            <Link2 className="w-4 h-4" /> Add Engagement
          </button>
        )}
      </div>
      {assigned.length === 0 ? (
        <EmptyBlock
          icon={<FileText className="w-7 h-7 text-neutral-300" />}
          title="No engagements connected"
          text="No engagements are currently connected to this legal entity."
          cta={canManage ? "Add Engagement" : undefined}
          onCta={canManage ? onAssign : undefined}
        />
      ) : (
        <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
          <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 text-left bg-neutral-50">
                <Th>Contract Reference</Th>
                <Th>Status</Th>
                <Th>Start Date</Th>
                <Th>End Date</Th>
                <Th>Service Lines</Th>
                <ThActions>Actions</ThActions>
              </tr>
            </thead>
            <tbody>
              {assigned.map((eng) => (
                <tr key={eng.id} className={`border-b border-neutral-100 last:border-0 ${eng.status === "Disabled" ? "opacity-60" : ""}`}>
                  <Td>
                    {onOpenEngagement ? (
                      <Button variant="link" type="button" onClick={() => onOpenEngagement(eng.id)} className="h-auto p-0">{eng.contractRef}</Button>
                    ) : (
                      <span className="text-neutral-900">{eng.contractRef}</span>
                    )}
                  </Td>
                  <Td><EngagementStatusPill status={eng.status} /></Td>
                  <Td className="text-neutral-700">{eng.startDate}</Td>
                  <Td className="text-neutral-700">{eng.endDate ?? "—"}</Td>
                  <Td className="text-neutral-700"><ServiceLinesCell serviceLines={eng.serviceLines} /></Td>
                  <TdActions>
                    {canManage ? (
                      <RowActionsMenu ariaLabel={`Actions for engagement ${eng.contractRef}`}>
                        <DropdownMenuItem onSelect={() => onRemove(eng)} className="text-brand focus:text-brand focus:bg-red-50">
                          <Unlink className="w-3.5 h-3.5" /> Remove
                        </DropdownMenuItem>
                      </RowActionsMenu>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </TdActions>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Entity-level Users section ─────────────────────────────────────────── */
export function EntityUsersSection({
  users, entityName, onAdd, onEdit, onApprove, onReject, onRemove, canInvite = true, canManage = true,
}: {
  users: OrgUser[];
  entityName: string;
  onAdd: () => void;
  onEdit: (u: OrgUser) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRemove: (id: string) => void;
  // V7 — Add User is user.invite (all roles including Contributor); row actions require
  // user.manage (admins only). Defaults kept `true` so callers that only pass one still work.
  canInvite?: boolean;
  canManage?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-primary text-[18px] leading-[24px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Users</h3>
        {canInvite && (
          <button
            type="button"
            onClick={onAdd}
            className="items-center flex gap-2 border border-neutral-200 bg-white text-neutral-700 text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-neutral-50"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>
      {users.length === 0 ? (
        <EmptyBlock
          icon={<UsersIcon className="w-7 h-7 text-neutral-300" />}
          title="No users yet"
          text={`No users are associated with ${entityName}.`}
          cta={canInvite ? "Add User" : undefined}
          onCta={canInvite ? onAdd : undefined}
        />
      ) : (
        <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
          <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 text-left bg-neutral-50">
                <Th>Name</Th><Th>Email</Th><Th>User Type</Th><Th>Role</Th><Th>Status</Th><Th>Invited By</Th><ThActions>Actions</ThActions>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-b border-neutral-100 last:border-0 ${u.status === "Rejected" ? "opacity-50" : ""}`}>
                  <Td className="text-neutral-900">{u.name}</Td>
                  <Td className="text-neutral-600">{u.email}</Td>
                  <Td><UserTypeBadge type={u.userType} /></Td>
                  <Td className="text-neutral-700">{u.role}</Td>
                  <Td><UserStatusBadge status={u.status} /></Td>
                  <Td className="text-neutral-600">{u.invitedBy}</Td>
                  <TdActions>
                    {canManage ? (
                      <UserRowActions user={u} onEdit={onEdit} onApprove={onApprove} onReject={onReject} onRemove={onRemove} />
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </TdActions>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* Status-aware action set for a user row.
   - Pending external request → Super Admin can Approve / Reject
   - Active / Approved → Edit / Remove
   - Rejected → Remove */
// V11-C — shared 3-dot menu trigger for table row actions. Radix DropdownMenu is portaled
// to the document body so it renders above overflow containers (fixes the last-row clipping).
export function RowActionsMenu({ children, ariaLabel = "Row actions" }: { children: React.ReactNode; ariaLabel?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        className="items-center flex justify-center w-8 h-8 text-neutral-500 hover:bg-neutral-100 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-200"
      >
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserRowActions({
  user, onEdit, onApprove, onReject, onRemove,
}: {
  user: OrgUser;
  onEdit: (u: OrgUser) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  // The WTS Super Admin is fixed — it cannot be edited or removed by anyone.
  if (user.role === "Super Admin") {
    return <span className="text-neutral-300 text-[13px] leading-[18px]">—</span>;
  }
  return (
    <RowActionsMenu ariaLabel={`Actions for ${user.email}`}>
      {user.status === "Pending" && (
        <>
          <DropdownMenuItem onSelect={() => onApprove(user.id)} className="text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50">
            <Check className="w-3.5 h-3.5" /> Approve
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onReject(user.id)} className="text-brand focus:text-brand focus:bg-red-50">
            <X className="w-3.5 h-3.5" /> Reject
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      {user.status !== "Rejected" && user.status !== "Pending" && (
        <DropdownMenuItem onSelect={() => onEdit(user)}>
          <Pencil className="w-3.5 h-3.5" /> Edit user
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onSelect={() => onRemove(user.id)} className="text-brand focus:text-brand focus:bg-red-50">
        <Trash2 className="w-3.5 h-3.5" /> Remove
      </DropdownMenuItem>
    </RowActionsMenu>
  );
}

/* ─── TAB 2 — Engagements ────────────────────────────────────────────────── */
export function EngagementsTab({
  engagements, entities, onCreate, onEdit, onDisable, onReenable, onOpenEngagement,
  canCreate = true, canManage = true,
}: {
  engagements: Engagement[];
  entities: LegalEntity[];
  onCreate: () => void;
  onEdit: (e: Engagement) => void;
  onDisable: (e: Engagement) => void;
  onReenable: (e: Engagement) => void;
  onOpenEngagement: (id: string) => void;
  // Change 3 — gate structural actions. canCreate: Organisation Admin (creates engagements);
  // canManage: edit/disable/re-enable rows (engagement-detail edit → Engagement Admin).
  canCreate?: boolean;
  canManage?: boolean;
}) {
  return (
    <div className="flex grow flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-primary text-[22px] leading-[28px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Engagements</h2>
          <p className="text-neutral-500 text-[13px] leading-[18px] mt-0.5">All engagements belonging to this organization.</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="items-center flex gap-2 bg-primary text-white text-[14px] leading-[20px] px-4 py-2 rounded-lg hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Create Engagement
          </button>
        )}
      </div>
      {engagements.length === 0 ? (
        <EmptyBlock icon={<FileText className="w-7 h-7 text-neutral-300" />} title="No engagements yet" text={canCreate ? "Create the first engagement for this organization." : "No engagements to show."} cta={canCreate ? "Create Engagement" : undefined} onCta={canCreate ? onCreate : undefined} />
      ) : (
        <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
          <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 text-left bg-neutral-50">
                <Th>Contract Reference</Th>
                <Th>Status</Th>
                <Th>Start Date</Th>
                <Th>End Date</Th>
                <Th>Service Lines</Th>
                <Th>Connected Legal Entities</Th>
                <ThActions>Actions</ThActions>
              </tr>
            </thead>
            <tbody>
              {engagements.map((eng) => (
                <tr key={eng.id} className={`border-b border-neutral-100 last:border-0 ${eng.status === "Disabled" ? "opacity-60" : ""}`}>
                  <Td>
                    <Button variant="link" type="button" onClick={() => onOpenEngagement(eng.id)} className="h-auto p-0">{eng.contractRef}</Button>
                  </Td>
                  <Td><EngagementStatusPill status={eng.status} /></Td>
                  <Td className="text-neutral-700">{eng.startDate}</Td>
                  <Td className="text-neutral-700">{eng.endDate ?? "—"}</Td>
                  <Td className="text-neutral-700"><ServiceLinesCell serviceLines={eng.serviceLines} /></Td>
                  <Td><span className="text-neutral-700">{eng.entityIds.length}</span></Td>
                  <TdActions>
                    {!canManage ? (
                      <span className="text-neutral-300">—</span>
                    ) : (
                      <RowActionsMenu ariaLabel={`Actions for engagement ${eng.contractRef}`}>
                        <DropdownMenuItem onSelect={() => onEdit(eng)}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </DropdownMenuItem>
                        {eng.status === "Disabled" ? (
                          <DropdownMenuItem onSelect={() => onReenable(eng)}>
                            <RotateCcw className="w-3.5 h-3.5" /> Re-enable
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => onDisable(eng)} className="text-brand focus:text-brand focus:bg-red-50">
                            <Ban className="w-3.5 h-3.5" /> Disable
                          </DropdownMenuItem>
                        )}
                      </RowActionsMenu>
                    )}
                  </TdActions>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── TAB 3 — Users ──────────────────────────────────────────────────────── */
// Change 3 — composable role badges. Change 4/5 — pool + case-creation indicators.
const ROLE_TONE: Record<UserRole, "gray" | "red" | "blue" | "green" | "orange"> = {
  "Super Admin": "red",
  "Organisation Admin": "blue",
  "Engagement Admin": "orange",
  Contributor: "gray",
};
export function RoleBadges({ user }: { user: OrgUser }) {
  const roles = user.roles?.length ? user.roles : [user.role];
  return (
    <span className="flex flex-wrap gap-1">
      {roles.map((r) => <Badge key={r} tone={ROLE_TONE[r]} size="sm">{r}</Badge>)}
    </span>
  );
}
export function UserScopeCell({ user }: { user: OrgUser }) {
  if (user.allEntities) return <span className="text-neutral-400">—</span>;
  const scopeStr = user.caseCountryScope
    ? `${user.caseCountryScope.mode === "only" ? "Only" : "Except"} ${user.caseCountryScope.countries.map(countryCodeFor).join(", ")}`
    : "";
  return (
    <span className="flex flex-col gap-1 items-start">
      <Badge tone={user.poolLevel === "org" ? "blue" : "gray"} size="sm">
        {user.poolLevel === "engagement" ? "Engagement" : "Org pool"}
      </Badge>
      {user.canCreateCases && (
        <span title={scopeStr ? `Case creation — ${scopeStr}` : "Case creation"}>
          <Badge tone="green" size="sm">Cases{scopeStr ? ` · ${scopeStr}` : ""}</Badge>
        </span>
      )}
    </span>
  );
}

function UsersTab({
  users, entities, engagements, onOpenEngagement, onAdd, onEditUser, onApproveUser, onRejectUser, onRemoveUser,
  canInvite = true, canManage = true,
}: {
  users: OrgUser[];
  entities: LegalEntity[];
  engagements: Engagement[];
  onOpenEngagement: (id: string) => void;
  onAdd: () => void;
  onEditUser: (u: OrgUser) => void;
  onApproveUser: (id: string) => void;
  onRejectUser: (id: string) => void;
  onRemoveUser: (id: string) => void;
  canInvite?: boolean;
  canManage?: boolean;
}) {
  const entityMap = useMemo(() => {
    const m = new Map<string, string>();
    entities.forEach((e) => m.set(e.id, e.legalName));
    return m;
  }, [entities]);

  function entityNames(u: OrgUser): string[] {
    if (u.allEntities) return ["ALL"];
    return u.entityIds.map((id) => entityMap.get(id) ?? id);
  }

  // Empty state stands alone — no title/subtitle header above it.
  if (users.length === 0) {
    return (
      <EmptyBlock icon={<UsersIcon />} title="No users yet" text="No users are associated with this organization." cta={canInvite ? "Add User" : undefined} onCta={canInvite ? onAdd : undefined} />
    );
  }

  return (
    <div className="flex grow flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-primary text-[22px] leading-[28px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Users</h2>
          <p className="text-neutral-500 text-[13px] leading-[18px] mt-0.5">All users connected to this organisation. Users need both Legal Entity access and Engagement access before they can work on cases.</p>
        </div>
        {canInvite && (
          <button
            type="button"
            onClick={onAdd}
            className="items-center flex gap-2 bg-primary text-white text-[14px] leading-[20px] px-4 py-2 rounded-lg hover:opacity-90"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>
      {users.length === 0 ? (
        <EmptyBlock icon={<UsersIcon className="w-7 h-7 text-neutral-300" />} title="No users yet" text="No users are associated with this organization." cta={canInvite ? "Add User" : undefined} onCta={canInvite ? onAdd : undefined} />
      ) : (
        <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
          <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 text-left bg-neutral-50">
                <Th>Name</Th><Th>Email</Th><Th>User Type</Th><Th>Roles</Th><Th>Legal Entities</Th><Th>Engagements</Th><Th>Scope</Th><Th>Status</Th><Th>Invited By</Th><ThActions>Actions</ThActions>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const combos = u.allEntities ? [] : userEngagementCombos(u, engagements);
                // Unique engagements (compact view); expanded shows engagement — entity lines.
                const uniqueEngs = Array.from(new Map(combos.map((c) => [c.engagement.id, c.engagement])).values());
                const expandedEngs = combos.map((c) => ({ label: engagementLabel(c.engagement), entity: entityMap.get(c.entityId) ?? c.entityId, id: c.engagement.id }));
                return (
                <tr key={u.id} className={`border-b border-neutral-100 last:border-0 ${u.status === "Rejected" ? "opacity-50" : ""}`}>
                  <Td className="text-neutral-900">{u.name}</Td>
                  <Td className="text-neutral-600">{u.email}</Td>
                  <Td><UserTypeBadge type={u.userType} /></Td>
                  <Td><RoleBadges user={u} /></Td>
                  <Td>
                    {u.allEntities ? (
                      <span className="items-center inline-flex font-medium border bg-neutral-900 border-neutral-900 text-white text-[11px] leading-[14px] px-2 py-0.5 rounded-full">ALL</span>
                    ) : (
                      <TruncatedCell
                        items={u.entityIds.map((id) => {
                          const scope = u.access?.find((a) => a.entityId === id);
                          const codes = (scope?.vatRegistrationIds ?? [])
                            .map((rid) => registrationById(rid))
                            .filter(Boolean)
                            .map((r) => countryCodeFor(r!.country));
                          return {
                            key: id,
                            node: (
                              <span className="text-neutral-700">
                                {entityMap.get(id) ?? id}
                                {codes.length > 0 && (
                                  <span className="ml-1.5 text-[11px] leading-[14px] text-neutral-500" title="VAT-registration (country) scope on this entity">({codes.join(", ")} only)</span>
                                )}
                              </span>
                            ),
                          };
                        })}
                        emptyText="—"
                      />
                    )}
                  </Td>
                  <Td>
                    {u.allEntities ? (
                      <span className="text-neutral-400">—</span>
                    ) : (
                      <TruncatedCell
                        items={uniqueEngs.map((e) => ({ key: e.id, node: (
                          <Button variant="link" type="button" onClick={() => onOpenEngagement(e.id)} className="h-auto p-0 justify-start text-left">{engagementLabel(e)}</Button>
                        ) }))}
                        emptyText="—"
                        expandedItems={expandedEngs.map((e, i) => ({ key: `${e.id}-${i}`, node: (
                          <span className="text-neutral-700"><Button variant="link" type="button" onClick={() => onOpenEngagement(e.id)} className="h-auto p-0 inline">{e.label}</Button> — {e.entity}</span>
                        ) }))}
                      />
                    )}
                  </Td>
                  <Td><UserScopeCell user={u} /></Td>
                  <Td><UserStatusBadge status={u.status} /></Td>
                  <Td className="text-neutral-600">{u.invitedBy}</Td>
                  <TdActions>
                    {canManage ? (
                      <UserRowActions user={u} onEdit={onEditUser} onApprove={onApproveUser} onReject={onRejectUser} onRemove={onRemoveUser} />
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </TdActions>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── TAB 4 — Activity Log ───────────────────────────────────────────────── */
function ActivityLogTab({ log }: { log: ActivityLogEntry[] }) {
  // Empty state stands alone — no title/subtitle header above it.
  if (log.length === 0) {
    return (
      <EmptyBlock icon={<Activity />} title="No activity yet" text="Actions taken on this organization will appear here." />
    );
  }

  return (
    <div className="flex grow flex-col">
      <div className="mb-4">
        <h2 className="text-primary text-[22px] leading-[28px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Activity Log</h2>
        <p className="text-neutral-500 text-[13px] leading-[18px] mt-0.5">Chronological audit trail for this organization.</p>
      </div>
      {log.length === 0 ? (
        <EmptyBlock icon={<Activity className="w-7 h-7 text-neutral-300" />} title="No activity yet" text="Actions taken on this organization will appear here." />
      ) : (
        <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
          <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 text-left bg-neutral-50">
                <Th>Timestamp</Th>
                <Th>User Email</Th>
                <Th>Legal Entity</Th>
                <Th>Action</Th>
                <Th>Previous</Th>
                <Th>Current</Th>
              </tr>
            </thead>
            <tbody>
              {log.map((entry) => (
                <tr key={entry.id} className="border-b border-neutral-100 last:border-0">
                  <Td><span className="text-neutral-600 text-[13px] whitespace-nowrap">{entry.timestamp}</span></Td>
                  <Td className="text-neutral-700">{entry.userEmail}</Td>
                  <Td className="text-neutral-700">{entry.legalEntity}</Td>
                  <Td className="text-neutral-900">{entry.action}</Td>
                  <Td className="text-neutral-500">{entry.previous ?? "—"}</Td>
                  <Td className="text-neutral-700">{entry.current ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── TAB 5 — Organization Details ──────────────────────────────────────── */
function OrgDetailsTab({
  org, entityCount, engagementCount, userCount, onEdit, onDisable, onEnable, canManage = true,
}: {
  org: Organization;
  entityCount: number;
  engagementCount: number;
  userCount: number;
  onEdit: () => void;
  onDisable: () => void;
  onEnable: () => void;
  // V7 — organisation-level edit / enable / disable is Super Admin only (org.edit).
  canManage?: boolean;
}) {
  const disabled = org.status === "Disabled";
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h2 className="text-primary text-[22px] leading-[28px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Organization Details</h2>
        {canManage && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onEdit}
              className="items-center flex gap-2 border border-neutral-200 bg-white text-neutral-700 text-[14px] leading-[20px] px-4 py-2 rounded-lg hover:bg-neutral-50"
            >
              <Pencil className="w-4 h-4" /> Edit Organization
            </button>
            {disabled ? (
              <button
                type="button"
                onClick={onEnable}
                className="items-center flex gap-2 border border-neutral-200 bg-white text-emerald-700 text-[14px] leading-[20px] px-4 py-2 rounded-lg hover:bg-emerald-50"
              >
                <RotateCcw className="w-4 h-4" /> Enable Organization
              </button>
            ) : (
              <button
                type="button"
                onClick={onDisable}
                className="items-center flex gap-2 border border-neutral-200 bg-white text-brand text-[14px] leading-[20px] px-4 py-2 rounded-lg hover:bg-red-50"
              >
                <Ban className="w-4 h-4" /> Disable Organization
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary — 3 standalone gray cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCounter label="Legal Entities" count={entityCount} />
        <SummaryCounter label="Engagements" count={engagementCount} />
        <SummaryCounter label="Users" count={userCount} />
      </div>

      {/* Information + Metadata — two columns on large screens, equal height (V11-H) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <DetailCard title="Organization Information">
          <DetailRow label="Organization Name" value={org.name} />
          <DetailRow label="Description" value={org.description ?? "—"} />
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-neutral-500 text-[14px] leading-[20px] shrink-0">Status</span>
            <StatusBadge variant={disabled ? "disabled" : "active"}>{org.status}</StatusBadge>
          </div>
        </DetailCard>
        <DetailCard title="Metadata">
          <DetailRow label="Created By" value="Sarah Klein" />
          <DetailRow label="Created Date" value="01.01.2024" />
          <DetailRow label="Last Modified By" value="Super Admin" />
          <DetailRow label="Last Modified Date" value="16.06.2026" last />
        </DetailCard>
      </div>
    </div>
  );
}

function SummaryCounter({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex flex-col gap-1 items-center justify-center p-4 rounded-lg bg-neutral-50 border border-neutral-100">
      <span className="text-[28px] leading-none text-neutral-900" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>{count}</span>
      <span className="text-neutral-500 text-[13px] leading-[18px]">{label}</span>
    </div>
  );
}

/* ─── Shared primitives ──────────────────────────────────────────────────── */
export function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`items-center inline-flex gap-1.5 px-4 py-2.5 text-[14px] leading-[20px] border-b-2 -mb-px transition-colors ${
        active
          ? "border-brand text-brand"
          : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

export function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-6 h-full">
      <h3 className="text-primary text-[15px] leading-[20px] mb-4" style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontWeight: 600 }}>{title}</h3>
      {children}
    </div>
  );
}

// V8-E — the `mono` prop is retained for API compat but no longer switches to a monospace
// stack; the whole prototype now uses only IBM Plex Sans (body) + Cera Pro (display).
export function DetailRow({ label, value, mono: _mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 ${last ? "" : "border-b border-neutral-100"}`}>
      <span className="text-neutral-500 text-[14px] leading-[20px] shrink-0">{label}</span>
      <span className="text-neutral-900 text-[14px] leading-[20px] text-right">{value}</span>
    </div>
  );
}

/* Country → display code + flag emoji (display codes match the WTS mock, e.g. Poland → PO) */
const COUNTRY_META: Record<string, { code: string; flag: string }> = {
  Germany: { code: "DE", flag: "🇩🇪" },
  Austria: { code: "AT", flag: "🇦🇹" },
  Switzerland: { code: "CH", flag: "🇨🇭" },
  Italy: { code: "IT", flag: "🇮🇹" },
  France: { code: "FR", flag: "🇫🇷" },
  Netherlands: { code: "NL", flag: "🇳🇱" },
  Spain: { code: "ES", flag: "🇪🇸" },
  Poland: { code: "PO", flag: "🇵🇱" },
};

export function VatIdRow({ vatNumber, country, last }: { vatNumber: string; country: string; last?: boolean }) {
  const meta = COUNTRY_META[country] ?? { code: vatNumber.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase(), flag: "" };
  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 ${last ? "" : "border-b border-neutral-100"}`}>
      <span className="text-neutral-500 text-[14px] leading-[20px] shrink-0">VAT ID</span>
      <span className="flex items-center gap-2 text-neutral-900 text-[14px] leading-[20px] text-right">
        <span>{vatNumber.replace(/\s+/g, "")}</span>
        <span className="text-[16px] leading-none" aria-hidden>{meta.flag}</span>
        <span className="text-neutral-500">{meta.code}</span>
      </span>
    </div>
  );
}

/* V9-B — small flat SVG flags used inline in row labels. Each flag is a 20×14 rectangle
   with rounded corners; simple three-stripe approximations are fine at this scale. Falls
   back to nothing when we don't have art for the country. */
export function CountryFlag({ country, className = "" }: { country: string; className?: string }) {
  const w = 20, h = 14, r = 2;
  const style: React.CSSProperties = { display: "inline-block", verticalAlign: "middle" };
  const wrap = (children: React.ReactNode) => (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} style={style} aria-hidden>
      <rect x="0" y="0" width={w} height={h} rx={r} ry={r} fill="#fff" />
      <g style={{ clipPath: `inset(0 round ${r}px)` }}>
        {children}
      </g>
      <rect x="0.25" y="0.25" width={w - 0.5} height={h - 0.5} rx={r} ry={r} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="0.5" />
    </svg>
  );
  switch (country) {
    case "Germany":
      return wrap(<>
        <rect x="0" y="0" width={w} height={h / 3} fill="#000" />
        <rect x="0" y={h / 3} width={w} height={h / 3} fill="#DD0000" />
        <rect x="0" y={(2 * h) / 3} width={w} height={h / 3} fill="#FFCE00" />
      </>);
    case "France":
      return wrap(<>
        <rect x="0" y="0" width={w / 3} height={h} fill="#0055A4" />
        <rect x={w / 3} y="0" width={w / 3} height={h} fill="#FFFFFF" />
        <rect x={(2 * w) / 3} y="0" width={w / 3} height={h} fill="#EF4135" />
      </>);
    case "Poland":
      return wrap(<>
        <rect x="0" y="0" width={w} height={h / 2} fill="#FFFFFF" />
        <rect x="0" y={h / 2} width={w} height={h / 2} fill="#DC143C" />
      </>);
    case "Austria":
      return wrap(<>
        <rect x="0" y="0" width={w} height={h / 3} fill="#ED2939" />
        <rect x="0" y={h / 3} width={w} height={h / 3} fill="#FFFFFF" />
        <rect x="0" y={(2 * h) / 3} width={w} height={h / 3} fill="#ED2939" />
      </>);
    case "Italy":
      return wrap(<>
        <rect x="0" y="0" width={w / 3} height={h} fill="#008C45" />
        <rect x={w / 3} y="0" width={w / 3} height={h} fill="#FFFFFF" />
        <rect x={(2 * w) / 3} y="0" width={w / 3} height={h} fill="#CD212A" />
      </>);
    case "Belgium":
      return wrap(<>
        <rect x="0" y="0" width={w / 3} height={h} fill="#000000" />
        <rect x={w / 3} y="0" width={w / 3} height={h} fill="#FDDA24" />
        <rect x={(2 * w) / 3} y="0" width={w / 3} height={h} fill="#EF3340" />
      </>);
    case "Netherlands":
      return wrap(<>
        <rect x="0" y="0" width={w} height={h / 3} fill="#AE1C28" />
        <rect x="0" y={h / 3} width={w} height={h / 3} fill="#FFFFFF" />
        <rect x="0" y={(2 * h) / 3} width={w} height={h / 3} fill="#21468B" />
      </>);
    case "Spain":
      return wrap(<>
        <rect x="0" y="0" width={w} height={h / 4} fill="#AA151B" />
        <rect x="0" y={h / 4} width={w} height={h / 2} fill="#F1BF00" />
        <rect x="0" y={(3 * h) / 4} width={w} height={h / 4} fill="#AA151B" />
      </>);
    case "Switzerland":
      return wrap(<>
        <rect x="0" y="0" width={w} height={h} fill="#DA291C" />
        <rect x={w * 0.35} y={h * 0.28} width={w * 0.3} height={h * 0.44} fill="#FFFFFF" />
        <rect x={w * 0.42} y={h * 0.18} width={w * 0.16} height={h * 0.64} fill="#FFFFFF" />
      </>);
    case "Hungary":
      return wrap(<>
        <rect x="0" y="0" width={w} height={h / 3} fill="#CE2939" />
        <rect x="0" y={h / 3} width={w} height={h / 3} fill="#FFFFFF" />
        <rect x="0" y={(2 * h) / 3} width={w} height={h / 3} fill="#477050" />
      </>);
    default:
      return null;
  }
}

// V9-A — VAT registration row: country name + flat flag on the left, ID on the right.
// "TIN VAT" suffix removed (the section header "VAT Registrations (TIN VAT)" already
// says what these are).
export function VatRegistrationRow({ reg, last }: { reg: VatRegistration; last?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 ${last ? "" : "border-b border-neutral-100"}`}>
      <span className="flex items-center gap-2 text-neutral-500 text-[14px] leading-[20px] shrink-0">
        <CountryFlag country={reg.country} />
        {reg.country}
      </span>
      <span className="text-neutral-900 text-[14px] leading-[20px] text-right font-sans">
        {reg.vatNumber.replace(/\s+/g, "")}
      </span>
    </div>
  );
}

// Additional Identifier row — plain label → value line for Client Identifier / DUNS / DATEV /
// Custom. No validity or status is shown; the identifier is a simple pair.
export function IdentifierRow({ id, last }: { id: EntityIdentifier; last?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 ${last ? "" : "border-b border-neutral-100"}`}>
      <span className="text-neutral-500 text-[14px] leading-[20px] shrink-0">{identifierLabel(id)}</span>
      <span className="text-neutral-900 text-[14px] leading-[20px] text-right">
        {id.value}
      </span>
    </div>
  );
}


export function StatusBadge({ children, variant }: { children: React.ReactNode; variant: "active" | "disabled" }) {
  return (
    <Badge tone={variant === "active" ? "green" : "gray"} size="sm">
      {children}
    </Badge>
  );
}

export function UserTypeBadge({ type }: { type: OrgUser["userType"] }) {
  return type === "Internal" ? (
    <Badge tone="red" size="sm">Internal</Badge>
  ) : (
    <Badge tone="gray" size="sm">External</Badge>
  );
}

export function UserStatusBadge({ status }: { status: OrgUser["status"] }) {
  const tone: Record<OrgUser["status"], "green" | "blue" | "orange" | "gray"> = {
    Active: "green",
    Approved: "blue",
    Pending: "orange",
    Rejected: "gray",
  };
  return <Badge tone={tone[status]} size="sm">{status}</Badge>;
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-[13px] leading-[18px] px-4 py-3 whitespace-nowrap">{children}</th>;
}
export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>;
}

// Sticky, right-aligned Actions column — stays pinned to the right edge while a wide
// table scrolls horizontally, so the 3-dot menu is always reachable. The inset shadow
// draws a subtle left divider; the opaque bg hides the scrolling content beneath.
export function ThActions({ children }: { children: React.ReactNode }) {
  return (
    <th className="sticky right-0 z-20 bg-neutral-50 px-4 py-3 text-right text-[13px] leading-[18px] whitespace-nowrap shadow-[inset_1px_0_0_0_rgba(0,0,0,0.06)]">
      {children}
    </th>
  );
}
export function TdActions({ children }: { children: React.ReactNode }) {
  return (
    <td className="sticky right-0 z-10 bg-white px-4 py-3 align-top shadow-[inset_1px_0_0_0_rgba(0,0,0,0.06)]">
      <div className="flex justify-end">{children}</div>
    </td>
  );
}

// Compact cell: shows the first item + a "+N" chip that expands to the full list.
function TruncatedCell({
  items, emptyText, expandedItems,
}: {
  items: { key: string; node: React.ReactNode }[];
  emptyText?: string;
  expandedItems?: { key: string; node: React.ReactNode }[];
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return <span className="text-neutral-400">{emptyText ?? "—"}</span>;
  const extra = items.length - 1;
  const list = expandedItems ?? items;
  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <span>{items[0].node}</span>
        {extra > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-[11px] leading-[14px] text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-full px-1.5 py-0.5 hover:bg-neutral-200 shrink-0"
          >
            +{extra}
          </button>
        )}
      </div>
      {open && extra > 0 && (
        <div className="absolute z-30 mt-1 min-w-[220px] max-w-[320px] bg-white border border-neutral-200 rounded-lg shadow-lg p-2 flex flex-col gap-1.5">
          {list.map((it) => <div key={it.key} className="text-[13px] leading-[18px]">{it.node}</div>)}
        </div>
      )}
    </div>
  );
}
function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`items-center flex w-full gap-2.5 text-left text-[14px] leading-[20px] px-2.5 py-2 rounded-md hover:bg-neutral-50 ${danger ? "text-brand" : "text-neutral-800"}`}
    >
      <span className={danger ? "text-brand" : "text-neutral-500"}>{icon}</span>{label}
    </button>
  );
}
export function EmptyBlock({ icon, title, text, cta, onCta }: { icon: React.ReactNode; title: string; text: string; cta?: string; onCta?: () => void }) {
  const normalizedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "size-6 text-muted-foreground" })
    : icon;
  return (
    <EmptyState
      icon={normalizedIcon}
      title={title}
      description={text}
      action={
        cta && onCta ? (
          <Button onClick={onCta}>
            <Plus className="h-4 w-4" /> {cta}
          </Button>
        ) : undefined
      }
    />
  );
}

export function fromInputDate(yyyy_mm_dd: string): string {
  const parts = yyyy_mm_dd.split("-");
  if (parts.length !== 3) return yyyy_mm_dd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
