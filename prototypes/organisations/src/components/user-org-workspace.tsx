import React, { useState } from "react";
import {
  ArrowLeft, Building2, CornerDownRight, MapPin, UserPlus, FileText,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Organization } from "./organizations-data";
import {
  LegalEntity, OrgUser, Engagement, VatRegistration,
  LEGAL_ENTITIES, USERS, VAT_REGISTRATIONS, USER_ENTITY_ID, engagementsForOrg, entityIdentifiers,
} from "./org-details-data";
import { InviteUserModal, InviteDraft } from "./invite-user-modal";
import { EngagementStatusPill, ServiceLinesCell } from "./engagement-modals";
import {
  HierarchyRow, DetailCard, DetailRow, VatRegistrationRow, IdentifierRow, StatusBadge, EmptyBlock,
  UserTypeBadge, UserStatusBadge,
} from "./org-workspace";

/**
 * User role workspace — the most restricted view.
 * Scoped to a single legal entity (read-only details/engagements).
 * The only action is inviting users to this entity:
 * Internal (WTS) → auto Active; External (client) → Pending (needs Admin/Super Admin approval).
 */
export function UserOrgWorkspace({ org, onBack }: { org: Organization; onBack: () => void }) {
  // Scope to the single assigned entity (HQ and siblings are hidden).
  const [entities] = useState<LegalEntity[]>(() => LEGAL_ENTITIES.filter((e) => e.id === USER_ENTITY_ID));
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(USER_ENTITY_ID);
  const [engagements] = useState<Engagement[]>(() => engagementsForOrg(org.id));
  const [users, setUsers] = useState<OrgUser[]>(() =>
    USERS.filter((u) => u.allEntities || u.entityIds.includes(USER_ENTITY_ID))
  );
  const [vatRegs] = useState<VatRegistration[]>(() => VAT_REGISTRATIONS.filter((v) => v.entityId === USER_ENTITY_ID));

  const [hierarchyCollapsed, setHierarchyCollapsed] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) ?? null;

  function handleInvite(d: InviteDraft) {
    const name = d.email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    // WTS (Internal) users are provisioned automatically; client (External) users await approval.
    const status: OrgUser["status"] = d.userType === "Internal" ? "Active" : "Pending";
    setUsers((prev) => [{
      id: `u-${Date.now()}`, entityIds: [USER_ENTITY_ID], name, email: d.email,
      userType: d.userType, role: "Contributor", status,
      invitedBy: "Markus Weber", dateAdded: new Date().toISOString().slice(0, 10),
    }, ...prev]);
  }

  const assignedEngagements = selectedEntity ? engagements.filter((e) => e.entityIds.includes(selectedEntity.id)) : [];
  const entityUsers = selectedEntity ? users.filter((u) => u.allEntities || u.entityIds.includes(selectedEntity.id)) : [];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header — no tabs, no actions */}
      <div className="border-b bg-neutral-50 border-neutral-200 px-8 pt-5 pb-5">
        <button
          type="button"
          onClick={onBack}
          className="items-center flex gap-1.5 text-[14px] leading-[20px] hover:text-neutral-900 mb-4 text-[#c80000]"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3">
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
      </div>

      {/* Body */}
      <div className="flex grow overflow-hidden" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Left: entity list (single entity, no add) */}
        <div
          className="flex flex-col border-r border-neutral-200 shrink-0 bg-white transition-[width] duration-200 overflow-hidden"
          style={{ width: hierarchyCollapsed ? 48 : 288 }}
        >
          {hierarchyCollapsed ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-center p-2 border-b border-neutral-100">
                <button type="button" aria-label="Expand entity list" onClick={() => setHierarchyCollapsed(false)} className="items-center flex justify-center w-8 h-8 text-neutral-400 hover:bg-neutral-100 rounded-md">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col grow overflow-auto p-1.5 gap-0.5 items-center">
                {entities.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    title={e.legalName}
                    onClick={() => setSelectedEntityId(e.id)}
                    className={`items-center flex justify-center w-8 h-8 rounded-md ${selectedEntityId === e.id ? "bg-[rgba(200,16,46,0.12)] text-brand" : "text-neutral-400 hover:bg-neutral-100"}`}
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-100 gap-2">
                <p className="text-neutral-400 text-[11px] leading-[16px] uppercase tracking-wide font-medium pl-1 shrink-0">Legal Entities</p>
                <button type="button" aria-label="Collapse entity list" onClick={() => setHierarchyCollapsed(true)} className="items-center flex justify-center w-7 h-7 text-neutral-400 hover:bg-neutral-100 rounded-md shrink-0">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col grow overflow-auto p-3 gap-2">
                <div className="flex flex-col gap-0.5">
                  {entities.map((e) => (
                    <HierarchyRow key={e.id} entity={e} selected={selectedEntityId === e.id} onSelect={setSelectedEntityId} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: read-only entity detail + invite */}
        <div className="flex flex-col grow overflow-auto bg-white">
          {!selectedEntity ? (
            <div className="flex items-center justify-center grow py-20 px-6">
              <EmptyBlock icon={<Building2 className="w-7 h-7 text-neutral-300" />} title="No legal entity" text="You have not been assigned to a legal entity yet." />
            </div>
          ) : (
            <div className="px-8 py-6 flex flex-col gap-8">
              {/* Entity header — no edit/disable */}
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

              {/* Engagements — read-only */}
              <section>
                <h3 className="text-primary text-[18px] leading-[24px] mb-4" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Engagements</h3>
                {assignedEngagements.length === 0 ? (
                  <EmptyBlock icon={<FileText className="w-7 h-7 text-neutral-300" />} title="No engagements" text="No engagements are connected to this legal entity." />
                ) : (
                  <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
                    <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
                      <thead>
                        <tr className="border-b border-neutral-200 text-neutral-500 text-left bg-neutral-50">
                          <Th>Contract Reference</Th><Th>Status</Th><Th>Start Date</Th><Th>End Date</Th><Th>Service Lines</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedEngagements.map((eng) => (
                          <tr key={eng.id} className={`border-b border-neutral-100 last:border-0 ${eng.status === "Disabled" ? "opacity-60" : ""}`}>
                            <Td><span className="text-neutral-900">{eng.contractRef}</span></Td>
                            <Td><EngagementStatusPill status={eng.status} /></Td>
                            <Td className="text-neutral-700">{eng.startDate}</Td>
                            <Td className="text-neutral-700">{eng.endDate ?? "—"}</Td>
                            <Td className="text-neutral-700"><ServiceLinesCell serviceLines={eng.serviceLines} /></Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Users — invite only, no row actions */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-primary text-[18px] leading-[24px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Users</h3>
                  <button
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    className="items-center flex gap-2 border border-neutral-200 bg-white text-neutral-700 text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-neutral-50"
                  >
                    <UserPlus className="w-4 h-4" /> Invite User
                  </button>
                </div>
                {entityUsers.length === 0 ? (
                  <EmptyBlock icon={<UserPlus className="w-7 h-7 text-neutral-300" />} title="No users yet" text={`No users are associated with ${selectedEntity.legalName}.`} cta="Invite User" onCta={() => setInviteOpen(true)} />
                ) : (
                  <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
                    <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
                      <thead>
                        <tr className="border-b border-neutral-200 text-neutral-500 text-left bg-neutral-50">
                          <Th>Name</Th><Th>Email</Th><Th>User Type</Th><Th>Role</Th><Th>Status</Th><Th>Invited By</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {entityUsers.map((u) => (
                          <tr key={u.id} className={`border-b border-neutral-100 last:border-0 ${u.status === "Rejected" ? "opacity-50" : ""}`}>
                            <Td className="text-neutral-900">{u.name}</Td>
                            <Td className="text-neutral-600">{u.email}</Td>
                            <Td><UserTypeBadge type={u.userType} /></Td>
                            <Td className="text-neutral-700">{u.role}</Td>
                            <Td><UserStatusBadge status={u.status} /></Td>
                            <Td className="text-neutral-600">{u.invitedBy}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {inviteOpen && selectedEntity && (
        <InviteUserModal
          entities={entities}
          variant="invite"
          defaultEntityId={selectedEntity.id}
          onClose={() => setInviteOpen(false)}
          onSubmit={handleInvite}
        />
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="font-medium text-[13px] leading-[18px] px-4 py-3 whitespace-nowrap">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>;
}
