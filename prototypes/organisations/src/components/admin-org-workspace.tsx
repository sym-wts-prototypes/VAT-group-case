import React, { useState } from "react";
import {
  ArrowLeft, Building2, CornerDownRight, Pencil, Ban, RotateCcw, MapPin,
  ChevronLeft, ChevronRight, FileText, Plus,
} from "lucide-react";
import { Organization } from "./organizations-data";
import {
  LegalEntity, OrgUser, Engagement, VatRegistration, AccessScope, EntityStatus, EngagementStatus, UserRole,
  LEGAL_ENTITIES, USERS, VAT_REGISTRATIONS, engagementsForOrg, computeEngagementStatus,
} from "./org-details-data";
import { can } from "./permissions";
import { LegalEntityModal, LegalEntityDraft, VatRow } from "./legal-entity-modal";
import { InviteUserModal, InviteDraft } from "./invite-user-modal";
import { AccessUserDraft } from "./access-user-modal";
import { EngagementDetailPage } from "./engagement-detail-page";
import { DisableEntityDialog } from "./entity-dialogs";
import {
  AssignEngagementModal, RemoveAssignmentDialog,
  CreateEngagementModal, EditEngagementModal, DisableEngagementDialog, ReenableEngagementDialog,
  EngagementDraft,
} from "./engagement-modals";
import {
  EntityEngagementsSection, EntityUsersSection, HierarchyRow,
  DetailCard, DetailRow, VatRegistrationRow, IdentifierRow, StatusBadge, EmptyBlock, fromInputDate,
  EngagementsTab, TabButton,
} from "./org-workspace";
import { entityIdentifiers } from "./org-details-data";

/**
 * Admin role workspace — shared by BOTH admin lenses (Change 3), parametrised by `actingRole`.
 * The `can(...)` capability map enforces the boundary rather than merely labelling it:
 *   • Organisation Admin — edits legal-entity data, assigns engagements, manages users,
 *     and CREATES engagements, but cannot edit an engagement's internal detail.
 *   • Engagement Admin — edits engagement detail, but cannot touch legal-entity data,
 *     assign engagements, manage org users, or create engagements.
 * Switching the demo lens re-renders this workspace under the other role's boundary.
 */
export function AdminOrgWorkspace({ org, onBack, actingRole = "Organisation Admin" }: { org: Organization; onBack: () => void; actingRole?: UserRole }) {
  // Capability gates — the single source for which affordances this lens may use.
  const canEditEntity = can(actingRole, "entity.edit");
  const canEntityCreate = can(actingRole, "entity.create");
  const canDisableEntity = can(actingRole, "entity.disable");
  const canCreateEngagement = can(actingRole, "engagement.create");
  const canEditEngagementDetail = can(actingRole, "engagement.editDetail");
  const canManageUsers = can(actingRole, "user.manage");
  const [entities, setEntities] = useState<LegalEntity[]>(() => LEGAL_ENTITIES.filter((e) => e.orgId === org.id));
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(() => {
    const first = LEGAL_ENTITIES.find((e) => e.orgId === org.id);
    return first ? first.id : null;
  });
  const [engagements, setEngagements] = useState<Engagement[]>(() => engagementsForOrg(org.id));
  const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>(null);
  const [users, setUsers] = useState<OrgUser[]>(() => {
    const orgEntityIds = new Set(LEGAL_ENTITIES.filter((e) => e.orgId === org.id).map((e) => e.id));
    return USERS.filter((u) => u.allEntities || u.entityIds.some((id) => orgEntityIds.has(id)));
  });
  const [vatRegs, setVatRegs] = useState<VatRegistration[]>(() =>
    VAT_REGISTRATIONS.filter((v) => LEGAL_ENTITIES.some((e) => e.orgId === org.id && e.id === v.entityId))
  );

  const [hierarchyCollapsed, setHierarchyCollapsed] = useState(false);
  // V4-B — the two admin lenses land on their own primary surface:
  //   Organisation Admin manages organisations, entities and their child entities → Entities.
  //   Engagement Admin manages engagements → Engagements (and the Legal Entities tab is hidden).
  const [activeTab, setActiveTab] = useState<"entities" | "engagements">(
    actingRole === "Engagement Admin" ? "engagements" : "entities",
  );
  const showEntitiesTab = canEditEntity; // hides Legal Entities for Engagement Admin

  // Modals
  const [entityModal, setEntityModal] = useState<{ mode: "create" | "edit"; entity: LegalEntity | null } | null>(null);
  const [disableEntityTarget, setDisableEntityTarget] = useState<LegalEntity | null>(null);
  const [assignEngEntityId, setAssignEngEntityId] = useState<string | null>(null);
  const [removeAssign, setRemoveAssign] = useState<{ engagement: Engagement; entityId: string } | null>(null);
  const [userModal, setUserModal] = useState<{ mode: "add" | "edit"; user: OrgUser | null; defaultEntityId: string | null } | null>(null);

  // Engagement management (full: create / edit / disable / re-enable)
  const [createEngOpen, setCreateEngOpen] = useState(false);
  const [editEngTarget, setEditEngTarget] = useState<Engagement | null>(null);
  const [disableEngTarget, setDisableEngTarget] = useState<Engagement | null>(null);
  const [reenableEngTarget, setReenableEngTarget] = useState<Engagement | null>(null);

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) ?? null;
  const selectedEngagement = engagements.find((e) => e.id === selectedEngagementId) ?? null;
  const childrenOf = (id: string) => entities.filter((e) => e.parentId === id);
  const roots = entities.filter((e) => !e.parentId || !entities.some((x) => x.id === e.parentId));

  function renderTree(node: LegalEntity, depth: number): React.ReactNode {
    return (
      <React.Fragment key={node.id}>
        <HierarchyRow entity={node} selected={selectedEntityId === node.id} onSelect={setSelectedEntityId} depth={depth} />
        {childrenOf(node.id).map((c) => renderTree(c, depth + 1))}
      </React.Fragment>
    );
  }
  function renderRail(node: LegalEntity, depth: number): React.ReactNode {
    return (
      <React.Fragment key={node.id}>
        <button
          type="button"
          title={node.legalName}
          onClick={() => setSelectedEntityId(node.id)}
          className={`items-center flex justify-center w-8 h-8 rounded-md ${selectedEntityId === node.id ? "bg-[rgba(200,16,46,0.12)] text-brand" : "text-neutral-400 hover:bg-neutral-100"}`}
        >
          {depth === 0 ? <Building2 className="w-4 h-4" /> : <CornerDownRight className="w-3.5 h-3.5" />}
        </button>
        {childrenOf(node.id).map((c) => renderRail(c, depth + 1))}
      </React.Fragment>
    );
  }

  // ── Entity handlers (create + edit + disable/re-enable) ──
  function handleEntitySubmit(draft: LegalEntityDraft, vatRows: VatRow[]) {
    if (!entityModal) return;
    if (entityModal.mode === "create") {
      const id = `le-${Date.now()}`;
      const newEntity: LegalEntity = { ...draft, id, orgId: org.id, vatId: "", countryCode: "", status: "Active" };
      setEntities((prev) => [...prev, newEntity]);
      setSelectedEntityId(id);
      setVatRegs((prev) => [
        ...prev,
        ...vatRows.map((v, i) => ({ id: v.id ?? `vat-${Date.now()}-${i}`, entityId: id, country: v.country, vatNumber: v.vatNumber, taxAuthority: "", validFrom: v.validFrom, validTo: v.validTo ?? null, address: v.address })),
      ]);
    } else if (entityModal.entity) {
      const id = entityModal.entity.id;
      setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, ...draft } : e)));
      setVatRegs((prev) => [
        ...prev.filter((v) => v.entityId !== id),
        ...vatRows.map((v, i) => ({ id: v.id ?? `vat-${Date.now()}-${i}`, entityId: id, country: v.country, vatNumber: v.vatNumber, taxAuthority: "", validFrom: v.validFrom, validTo: v.validTo ?? null, address: v.address })),
      ]);
    }
    setEntityModal(null);
  }
  function setEntityStatus(id: string, status: EntityStatus) {
    setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    setDisableEntityTarget(null);
  }
  function entityVatRows(entityId: string): VatRow[] {
    return vatRegs.filter((v) => v.entityId === entityId).map((v) => ({ id: v.id, country: v.country, vatNumber: v.vatNumber, validFrom: v.validFrom, validTo: v.validTo ?? null, address: v.address }));
  }

  // ── Engagement assignment handlers ──
  function assignEngagementsToEntity(entityId: string, engIds: string[]) {
    setEngagements((prev) => prev.map((e) =>
      engIds.includes(e.id) && !e.entityIds.includes(entityId) ? { ...e, entityIds: [...e.entityIds, entityId] } : e
    ));
    setAssignEngEntityId(null);
  }
  function removeEngagementFromEntity(entityId: string, engId: string) {
    setEngagements((prev) => prev.map((e) =>
      e.id === engId ? { ...e, entityIds: e.entityIds.filter((id) => id !== entityId) } : e
    ));
    setRemoveAssign(null);
  }

  // ── User handlers ──
  function handleSubmitUser(d: InviteDraft) {
    if (userModal?.mode === "edit" && userModal.user) {
      const id = userModal.user.id;
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, email: d.email, userType: d.userType, role: d.role as any, entityIds: d.entityIds } : u));
    } else {
      const name = d.email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      setUsers((prev) => [{
        id: `u-${Date.now()}`, entityIds: d.entityIds, name, email: d.email,
        userType: d.userType, role: d.role as any, status: "Active",
        invitedBy: "Admin", dateAdded: new Date().toISOString().slice(0, 10),
      }, ...prev]);
    }
  }
  function approveUser(id: string) { setUsers((prev) => prev.map((x) => x.id === id ? { ...x, status: "Active" } : x)); }
  function rejectUser(id: string) { setUsers((prev) => prev.map((x) => x.id === id ? { ...x, status: "Rejected" } : x)); }
  function removeUser(id: string) { setUsers((prev) => prev.filter((u) => u.id !== id)); }

  // ── Engagement management handlers ──
  const today = () => new Date().toISOString().slice(0, 10);
  function handleCreateEngagement(draft: EngagementDraft) {
    const id = `eng-${Date.now()}`;
    const base: Engagement = {
      id, orgId: org.id, entityIds: [],
      contractRef: draft.contractRef, serviceLines: draft.serviceLines,
      status: draft.status, startDate: fromInputDate(draft.startDate),
      endDate: draft.endDate ? fromInputDate(draft.endDate) : null,
      createdBy: "admin@wts.de", lastUpdated: today(),
    };
    setEngagements((prev) => [...prev, { ...base, status: computeEngagementStatus(base) }]);
    setCreateEngOpen(false);
  }
  function handleEditEngagement(draft: EngagementDraft) {
    if (!editEngTarget) return;
    setEngagements((prev) => prev.map((e) => {
      if (e.id !== editEngTarget.id) return e;
      const updated: Engagement = {
        ...e, contractRef: draft.contractRef, serviceLines: draft.serviceLines,
        status: draft.status, startDate: fromInputDate(draft.startDate),
        endDate: draft.endDate ? fromInputDate(draft.endDate) : null, lastUpdated: today(),
      };
      return { ...updated, status: computeEngagementStatus(updated) };
    }));
    setEditEngTarget(null);
  }
  function setEngStatus(id: string, status: EngagementStatus) {
    setEngagements((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
  }

  // ── Engagement detail: connect/disconnect entities + user access ──
  function connectEntitiesToEngagement(engId: string, entityIds: string[]) {
    setEngagements((prev) => prev.map((e) => {
      if (e.id !== engId) return e;
      const merged = Array.from(new Set([...e.entityIds, ...entityIds]));
      const updated = { ...e, entityIds: merged, lastUpdated: today() };
      return { ...updated, status: computeEngagementStatus(updated) };
    }));
  }
  function disconnectEntityFromEngagement(engId: string, entityId: string) {
    setEngagements((prev) => prev.map((e) => {
      if (e.id !== engId) return e;
      const updated = { ...e, entityIds: e.entityIds.filter((id) => id !== entityId), lastUpdated: today() };
      return { ...updated, status: computeEngagementStatus(updated) };
    }));
  }
  function mergeEngagementAccess(existing: AccessScope[] | undefined, engId: string, draftRows: AccessScope[]): AccessScope[] {
    const map = new Map<string, Set<string>>();
    const regMap = new Map<string, string[] | undefined>();
    (existing ?? []).forEach((a) => { map.set(a.entityId, new Set(a.engagementIds)); regMap.set(a.entityId, a.vatRegistrationIds); });
    map.forEach((set) => set.delete(engId));
    draftRows.forEach((r) => {
      if (!map.has(r.entityId)) map.set(r.entityId, new Set());
      map.get(r.entityId)!.add(engId);
      regMap.set(r.entityId, r.vatRegistrationIds && r.vatRegistrationIds.length ? [...r.vatRegistrationIds] : undefined);
    });
    return [...map.entries()].filter(([, s]) => s.size > 0).map(([entityId, s]) => ({ entityId, engagementIds: [...s], vatRegistrationIds: regMap.get(entityId) }));
  }
  function handleEngagementUserSubmit(d: AccessUserDraft, editingUserId: string | null) {
    const engId = selectedEngagementId;
    if (!engId) return;
    if (editingUserId) {
      setUsers((prev) => prev.map((u) => {
        if (u.id !== editingUserId) return u;
        const access = mergeEngagementAccess(u.access, engId, d.access);
        return { ...u, name: d.name, email: d.email, userType: d.userType, role: d.role, roles: d.roles, poolLevel: d.poolLevel, canCreateCases: d.canCreateCases, caseCountryScope: d.caseCountryScope, access, entityIds: Array.from(new Set(access.map((a) => a.entityId))) };
      }));
    } else {
      const access = mergeEngagementAccess(undefined, engId, d.access);
      setUsers((prev) => [{
        id: `u-${Date.now()}`, entityIds: Array.from(new Set(access.map((a) => a.entityId))), access,
        name: d.name, email: d.email, userType: d.userType, role: d.role, roles: d.roles, poolLevel: d.poolLevel, canCreateCases: d.canCreateCases, caseCountryScope: d.caseCountryScope, status: "Active",
        invitedBy: "Admin", dateAdded: today(),
      }, ...prev]);
    }
  }
  function revokeEngagementFromUser(userId: string) {
    const engId = selectedEngagementId;
    if (!engId) return;
    setUsers((prev) => prev.map((x) => {
      if (x.id !== userId) return x;
      const access = mergeEngagementAccess(x.access, engId, []);
      return { ...x, access, entityIds: Array.from(new Set(access.map((a) => a.entityId))) };
    }));
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
          log={[]}
          onBack={() => setSelectedEngagementId(null)}
          onEditEngagement={() => setEditEngTarget(selectedEngagement)}
          onDisable={() => setDisableEngTarget(selectedEngagement)}
          onReenable={() => setReenableEngTarget(selectedEngagement)}
          onConnectEntities={(ids) => connectEntitiesToEngagement(selectedEngagement.id, ids)}
          onDisconnectEntity={(eid) => disconnectEntityFromEngagement(selectedEngagement.id, eid)}
          onSubmitUser={handleEngagementUserSubmit}
          onRemoveUser={revokeEngagementFromUser}
          onOpenEntity={(id) => { setSelectedEngagementId(null); setActiveTab("entities"); setSelectedEntityId(id); }}
          canEdit={canEditEngagementDetail}
        />
      ) : (
      <>
      {/* Header — org identity + tabs (no org actions) */}
      <div className="border-b bg-neutral-50 border-neutral-200 px-8 pt-5 pb-0">
        <button
          type="button"
          onClick={onBack}
          className="items-center flex gap-1.5 text-[14px] leading-[20px] hover:text-neutral-900 mb-4 text-[#c80000]"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="items-center flex justify-center w-10 h-10 rounded-full overflow-hidden shrink-0 bg-primary text-white">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[16px] leading-none" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>{org.name.charAt(0)}</span>
            )}
          </div>
          <h1 className="text-primary text-[26px] leading-[32px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>
            {org.name}
          </h1>
        </div>

        {/* Tabs — Engagement Admin sees only "Engagements" (their remit).
            Organisation Admin sees both, defaulted to "Legal Entities". */}
        <div className="flex items-center gap-0">
          {showEntitiesTab && (
            <TabButton active={activeTab === "entities"} onClick={() => setActiveTab("entities")}>
              <Building2 className="w-4 h-4" /> Legal Entities
            </TabButton>
          )}
          <TabButton active={activeTab === "engagements"} onClick={() => setActiveTab("engagements")}>
            <FileText className="w-4 h-4" /> Engagements
          </TabButton>
        </div>
      </div>

      {activeTab === "engagements" ? (
        <div className="px-8 py-6 w-full">
          <EngagementsTab
            engagements={engagements}
            entities={entities}
            onCreate={() => setCreateEngOpen(true)}
            onEdit={setEditEngTarget}
            onDisable={setDisableEngTarget}
            onReenable={setReenableEngTarget}
            onOpenEngagement={(id) => setSelectedEngagementId(id)}
            canCreate={canCreateEngagement}
            canManage={canEditEngagementDetail}
          />
        </div>
      ) : (
      /* Body — entity view */
      <div className="flex grow overflow-hidden" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Left: Entity hierarchy (no Add) */}
        <div
          className="flex flex-col border-r border-neutral-200 shrink-0 bg-white transition-[width] duration-200 overflow-hidden"
          style={{ width: hierarchyCollapsed ? 48 : 288 }}
        >
          {hierarchyCollapsed ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-center p-2 border-b border-neutral-100">
                <button type="button" aria-label="Expand entity hierarchy" onClick={() => setHierarchyCollapsed(false)} className="items-center flex justify-center w-8 h-8 text-neutral-400 hover:bg-neutral-100 rounded-md">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col grow overflow-auto p-1.5 gap-0.5 items-center">
                {roots.map((r) => renderRail(r, 0))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-100 gap-2">
                <p className="text-neutral-400 text-[11px] leading-[16px] uppercase tracking-wide font-medium pl-1 shrink-0">Legal Entities</p>
                <button type="button" aria-label="Collapse entity hierarchy" onClick={() => setHierarchyCollapsed(true)} className="items-center flex justify-center w-7 h-7 text-neutral-400 hover:bg-neutral-100 rounded-md shrink-0">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col grow overflow-auto p-3 gap-2">
                <div className="flex flex-col gap-0.5">
                  {roots.map((r) => renderTree(r, 0))}
                </div>
                {canEntityCreate && (
                  <button
                    type="button"
                    onClick={() => setEntityModal({ mode: "create", entity: null })}
                    className="items-center flex gap-2 mt-2 border border-neutral-200 bg-white text-neutral-700 text-[13px] leading-[18px] px-3 py-2 rounded-lg hover:bg-neutral-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Legal Entity
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Selected entity detail */}
        <div className="flex flex-col grow overflow-auto bg-white">
          {!selectedEntity ? (
            <div className="flex items-center justify-center grow py-20 px-6">
              <EmptyBlock
                icon={<Building2 className="w-7 h-7 text-neutral-300" />}
                title="No legal entity selected"
                text="Select a legal entity from the list to view its details."
              />
            </div>
          ) : (
            <div className="px-8 py-6 flex flex-col gap-8">
              {/* Entity header */}
              <div className="flex items-start justify-between gap-6">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-primary text-[22px] leading-[28px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>
                      {selectedEntity.legalName}
                    </h2>
                    {selectedEntity.status === "Disabled" && <StatusBadge variant="disabled">Disabled</StatusBadge>}
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
                  {canEditEntity && (
                    <button
                      type="button"
                      onClick={() => setEntityModal({ mode: "edit", entity: selectedEntity })}
                      className="items-center flex gap-2 border border-neutral-200 bg-white text-neutral-700 text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-neutral-50"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                  )}
                  {canDisableEntity && (selectedEntity.status === "Active" ? (
                    <button
                      type="button"
                      onClick={() => setDisableEntityTarget(selectedEntity)}
                      className="items-center flex gap-2 border border-neutral-200 bg-white text-brand text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-red-50"
                    >
                      <Ban className="w-4 h-4" /> Disable
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEntityStatus(selectedEntity.id, "Active")}
                      className="items-center flex gap-2 border border-neutral-200 bg-white text-emerald-700 text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-emerald-50"
                    >
                      <RotateCcw className="w-4 h-4" /> Re-enable
                    </button>
                  ))}
                  {/* Change 3 — Engagement Admins cannot edit legal-entity data. */}
                  {!canEditEntity && (
                    <span className="items-center inline-flex gap-1.5 border border-neutral-200 bg-neutral-50 text-neutral-500 text-[12px] leading-[16px] px-2.5 py-1 rounded-full">
                      View only — legal-entity data is the Organisation Admin's remit
                    </span>
                  )}
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

                {/* Engagements (assign / unassign) */}
                <section className="mt-8">
                  <EntityEngagementsSection
                    entity={selectedEntity}
                    engagements={engagements}
                    onAssign={() => setAssignEngEntityId(selectedEntity.id)}
                    onRemove={(eng) => setRemoveAssign({ engagement: eng, entityId: selectedEntity.id })}
                    onOpenEngagement={(id) => setSelectedEngagementId(id)}
                    canManage={canCreateEngagement}
                  />
                </section>

                {/* Users (add / edit / remove / approve / reject) */}
                <section className="mt-8">
                  <EntityUsersSection
                    users={users.filter((u) => u.allEntities || u.entityIds.includes(selectedEntity.id))}
                    entityName={selectedEntity.legalName}
                    onAdd={() => setUserModal({ mode: "add", user: null, defaultEntityId: selectedEntity.id })}
                    onEdit={(u) => setUserModal({ mode: "edit", user: u, defaultEntityId: null })}
                    onApprove={approveUser}
                    onReject={rejectUser}
                    onRemove={removeUser}
                    canManage={canManageUsers}
                  />
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
      </>
      )}

      {/* Modals */}
      {entityModal && (
        <LegalEntityModal
          mode={entityModal.mode}
          entity={entityModal.entity}
          siblings={entities}
          initialVatRegs={entityModal.entity ? entityVatRows(entityModal.entity.id) : []}
          orgId={org.id}
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
      {userModal && (
        <InviteUserModal
          entities={entities}
          mode={userModal.mode}
          user={userModal.user}
          defaultEntityId={userModal.defaultEntityId}
          onClose={() => setUserModal(null)}
          onSubmit={handleSubmitUser}
        />
      )}

      {/* Engagement management modals */}
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
            setEngagements((prev) => prev.map((e) => e.id === reenableEngTarget.id ? { ...e, status: computeEngagementStatus({ ...e, status: "Active" }) } : e));
            setReenableEngTarget(null);
          }}
        />
      )}
    </div>
  );
}
