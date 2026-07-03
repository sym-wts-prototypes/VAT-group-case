import React, { useMemo, useState } from "react";
import { ArrowLeft, Pencil, Ban, RotateCcw, Plus, Unlink, Trash2, ExternalLink, FileText, Users as UsersIcon, Activity, Check } from "lucide-react";
import { Badge, Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DropdownMenuItem, cn } from "@wts/ui";
import {
  Organization,
} from "./organizations-data";
import {
  Engagement, LegalEntity, OrgUser, ActivityLogEntry, userEngagementCombos,
} from "./org-details-data";
import {
  DetailCard, DetailRow, StatusBadge, Th, Td, EmptyBlock, UserTypeBadge, UserStatusBadge, RowActionsMenu,
} from "./org-workspace";
import { EngagementStatusPill, ServiceLinesCell, ConnectEntityModal } from "./engagement-modals";
import { AccessUserModal, AccessUserDraft } from "./access-user-modal";

export function EngagementDetailPage({
  org, engagement, entities, engagements, users, log,
  onBack, onEditEngagement, onDisable, onReenable,
  onConnectEntities, onDisconnectEntity,
  onSubmitUser, onRemoveUser, onOpenEntity, onAssignUsers,
  canEdit = true, canInviteUsers = true,
}: {
  org: Organization;
  engagement: Engagement;
  entities: LegalEntity[];
  engagements: Engagement[];
  users: OrgUser[];
  log: ActivityLogEntry[];
  onBack: () => void;
  onEditEngagement: () => void;
  onDisable: () => void;
  onReenable: () => void;
  onConnectEntities: (entityIds: string[]) => void;
  onDisconnectEntity: (entityId: string) => void;
  onSubmitUser: (draft: AccessUserDraft, editingUserId: string | null) => void;
  onRemoveUser: (userId: string) => void;
  onOpenEntity?: (entityId: string) => void;
  // V10-B — assign existing org/entity users to this engagement. The parent decides how
  // each user's access rows are updated (typically: add this engagement to every entity
  // access row the user already has that is connected to this engagement).
  onAssignUsers?: (userIds: string[]) => void;
  // Engagement-detail editing is the Engagement Admin's boundary. When false (e.g. Org
  // Admin) the edit / disable / connect-entity / remove-user affordances are hidden.
  canEdit?: boolean;
  // Inviting engagement users is a lower-privilege capability (user.invite) — all roles
  // including Contributor have it, so it is gated independently of the edit boundary.
  canInviteUsers?: boolean;
}) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [userModal, setUserModal] = useState<{ mode: "edit"; user: OrgUser } | null>(null);
  // V10-B — Assign User picker state (multi-select).
  const [assignOpen, setAssignOpen] = useState(false);

  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const connectedEntities = entities.filter((e) => engagement.entityIds.includes(e.id));

  // Users assigned to this engagement (via their access combinations).
  const assigned = users.filter((u) =>
    userEngagementCombos(u, engagements).some((c) => c.engagement.id === engagement.id),
  );
  // For a user, the legal entities they can access within THIS engagement.
  function userEntitiesHere(u: OrgUser): LegalEntity[] {
    const ids = new Set(
      userEngagementCombos(u, engagements)
        .filter((c) => c.engagement.id === engagement.id)
        .map((c) => c.entityId),
    );
    return [...ids].map((id) => entityMap.get(id)).filter(Boolean) as LegalEntity[];
  }
  function assignedUserCountFor(entityId: string): number {
    return users.filter((u) =>
      userEngagementCombos(u, engagements).some((c) => c.engagement.id === engagement.id && c.entityId === entityId),
    ).length;
  }

  const engLog = log.filter((l) => l.action.includes(engagement.contractRef));

  return (
    <div className="flex flex-col grow overflow-auto bg-white">
      <div className="px-8 py-6 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Button type="button" variant="link" onClick={onBack} className="h-auto p-0 w-fit">
            <ArrowLeft /> Back to {org.name}
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-neutral-500 text-[13px] leading-[18px]">{org.name}</span>
              <div className="flex items-center gap-3">
                <h1 className="text-primary text-[26px] leading-[32px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>
                  Engagement {engagement.contractRef}
                </h1>
                <EngagementStatusPill status={engagement.status} />
              </div>
            </div>
            {canEdit ? (
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={onEditEngagement} className="items-center flex gap-2 border border-neutral-200 bg-white text-neutral-700 text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-neutral-50">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                {engagement.status === "Disabled" ? (
                  <button type="button" onClick={onReenable} className="items-center flex gap-2 border border-neutral-200 bg-white text-neutral-700 text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-neutral-50">
                    <RotateCcw className="w-4 h-4" /> Re-enable
                  </button>
                ) : (
                  <button type="button" onClick={onDisable} className="items-center flex gap-2 border border-neutral-200 bg-white text-neutral-700 text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-red-50 hover:text-brand">
                    <Ban className="w-4 h-4" /> Disable
                  </button>
                )}
              </div>
            ) : (
              <span className="items-center inline-flex gap-1.5 shrink-0 border border-neutral-200 bg-neutral-50 text-neutral-500 text-[12px] leading-[16px] px-2.5 py-1 rounded-full">
                View only — engagement detail is the Engagement Admin's remit
              </span>
            )}
          </div>
        </div>

        {/* 1. Engagement Details + 2. Service Lines */}
        <div className="grid grid-cols-2 gap-6">
          <DetailCard title="Engagement Details">
            <DetailRow label="Contract Reference" value={engagement.contractRef} mono />
            <DetailRow label="Status" value={engagement.status} />
            <DetailRow label="Start Date" value={engagement.startDate || "—"} />
            <DetailRow label="End Date" value={engagement.endDate ?? "—"} />
            <DetailRow label="Created By" value={engagement.createdBy ?? "—"} />
            <DetailRow label="Last Updated" value={engagement.lastUpdated ?? "—"} last />
          </DetailCard>

          <DetailCard title="Service Lines & Case Types">
            <div className="flex items-start justify-between gap-4">
              <div className="text-[14px] leading-[20px] text-neutral-700">
                <ServiceLinesCell serviceLines={engagement.serviceLines} />
              </div>
            </div>
            {canEdit && (
              <div className="mt-4 pt-3 border-t border-neutral-100">
                <button type="button" onClick={onEditEngagement} className="items-center flex gap-1.5 text-[13px] leading-[18px] text-brand hover:opacity-80">
                  <Pencil className="w-3.5 h-3.5" /> Edit Service Lines
                </button>
              </div>
            )}
          </DetailCard>
        </div>

        {/* 3. Connected Legal Entities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-primary text-[18px] leading-[24px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Connected Legal Entities</h3>
            {canEdit && (
              <button type="button" onClick={() => setConnectOpen(true)} className="items-center flex gap-2 border border-neutral-200 bg-white text-neutral-700 text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-neutral-50">
                <Plus className="w-4 h-4" /> Add Legal Entity
              </button>
            )}
          </div>
          {connectedEntities.length === 0 ? (
            <EmptyBlock
              icon={<FileText className="w-7 h-7 text-neutral-300" />}
              title="No legal entities connected"
              text="Connect at least one legal entity to activate this engagement."
              cta={canEdit ? "Add Legal Entity" : undefined}
              onCta={canEdit ? () => setConnectOpen(true) : undefined}
            />
          ) : (
            <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
              <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 text-left bg-neutral-50">
                    <Th>Legal Entity</Th>
                    <Th>Legal Form</Th>
                    <Th>Jurisdiction</Th>
                    <Th>Status</Th>
                    <Th>Assigned Users</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {connectedEntities.map((e) => (
                    <tr key={e.id} className="border-b border-neutral-100 last:border-0">
                      <Td>
                        <Button variant="link" type="button" onClick={() => onOpenEntity?.(e.id)} className="h-auto p-0 gap-1.5">
                          {e.legalName}<ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Td>
                      <Td className="text-neutral-700">{e.legalForm}</Td>
                      <Td className="text-neutral-700">{e.jurisdiction ?? e.country}</Td>
                      <Td><StatusBadge variant={e.status === "Active" ? "active" : "disabled"}>{e.status}</StatusBadge></Td>
                      <Td className="text-neutral-700">{assignedUserCountFor(e.id)}</Td>
                      <Td>
                        {canEdit ? (
                          <RowActionsMenu ariaLabel={`Actions for ${e.legalName}`}>
                            <DropdownMenuItem onSelect={() => onDisconnectEntity(e.id)} className="text-brand focus:text-brand focus:bg-red-50">
                              <Unlink className="w-3.5 h-3.5" /> Remove from engagement
                            </DropdownMenuItem>
                          </RowActionsMenu>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. Assigned Users */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-primary text-[18px] leading-[24px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Assigned Users</h3>
            {canInviteUsers && (
              <Button
                type="button"
                onClick={() => setAssignOpen(true)}
                disabled={engagement.entityIds.length === 0}
                title={engagement.entityIds.length === 0 ? "Connect a legal entity first" : undefined}
              >
                <UsersIcon /> Assign User
              </Button>
            )}
          </div>
          {assigned.length === 0 ? (
            <EmptyBlock
              icon={<UsersIcon className="w-7 h-7 text-neutral-300" />}
              title="No users assigned"
              text="No users currently have access to this engagement."
            />
          ) : (
            <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
              <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 text-left bg-neutral-50">
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>User Type</Th>
                    <Th>Role</Th>
                    <Th>Legal Entities</Th>
                    <Th>Status</Th>
                    <Th>Invited By</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {assigned.map((u) => (
                    <tr key={u.id} className={`border-b border-neutral-100 last:border-0 ${u.status === "Rejected" ? "opacity-50" : ""}`}>
                      <Td className="text-neutral-900">{u.name}</Td>
                      <Td className="text-neutral-600">{u.email}</Td>
                      <Td><UserTypeBadge type={u.userType} /></Td>
                      <Td className="text-neutral-700">{u.role}</Td>
                      <Td className="text-neutral-700">{userEntitiesHere(u).map((e) => e.legalName).join(", ") || "—"}</Td>
                      <Td><UserStatusBadge status={u.status} /></Td>
                      <Td className="text-neutral-600">{u.invitedBy}</Td>
                      <Td>
                        {canEdit ? (
                          <RowActionsMenu ariaLabel={`Actions for ${u.email}`}>
                            <DropdownMenuItem onSelect={() => setUserModal({ mode: "edit", user: u })}>
                              <Pencil className="w-3.5 h-3.5" /> Edit access
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onRemoveUser(u.id)} className="text-brand focus:text-brand focus:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </DropdownMenuItem>
                          </RowActionsMenu>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5. Activity Log */}
        <div>
          <h3 className="text-primary text-[18px] leading-[24px] mb-4" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Activity Log</h3>
          {engLog.length === 0 ? (
            <EmptyBlock icon={<Activity className="w-7 h-7 text-neutral-300" />} title="No activity yet" text="Changes to this engagement will appear here." />
          ) : (
            <div className="border border-neutral-200 rounded-lg overflow-x-auto bg-white">
              <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 text-left bg-neutral-50">
                    <Th>Timestamp</Th>
                    <Th>User Email</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {engLog.map((entry) => (
                    <tr key={entry.id} className="border-b border-neutral-100 last:border-0">
                      <Td><span className="text-neutral-600 text-[13px] whitespace-nowrap">{entry.timestamp}</span></Td>
                      <Td className="text-neutral-700">{entry.userEmail}</Td>
                      <Td className="text-neutral-900">{entry.action}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {connectOpen && (
        <ConnectEntityModal
          engagement={engagement}
          entities={entities}
          onClose={() => setConnectOpen(false)}
          onConnect={(ids) => { onConnectEntities(ids); setConnectOpen(false); }}
        />
      )}

      {userModal && (
        <AccessUserModal
          mode={userModal.mode}
          user={userModal.user}
          entities={entities}
          engagements={engagements}
          lockedEngagement={engagement}
          onClose={() => setUserModal(null)}
          onSubmit={(draft) => { onSubmitUser(draft, userModal.user.id); setUserModal(null); }}
        />
      )}

      {assignOpen && (
        <AssignUsersModal
          engagement={engagement}
          entities={entities}
          users={users}
          engagements={engagements}
          onClose={() => setAssignOpen(false)}
          onAssign={(ids) => { onAssignUsers?.(ids); setAssignOpen(false); }}
        />
      )}
    </div>
  );
}

/* V10-B — Assign User picker. Lists org users who have access to at least one of this
   engagement's connected entities and aren't already assigned; on confirm, the parent
   extends each user's access to include this engagement. */
function AssignUsersModal({
  engagement, entities, users, engagements, onClose, onAssign,
}: {
  engagement: Engagement;
  entities: LegalEntity[];
  users: OrgUser[];
  engagements: Engagement[];
  onClose: () => void;
  onAssign: (userIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  // V11-D — search field to filter the pool by name / email.
  const [query, setQuery] = useState("");
  const connectedIds = new Set(engagement.entityIds);
  const alreadyAssigned = new Set(
    users
      .filter((u) => userEngagementCombos(u, engagements).some((c) => c.engagement.id === engagement.id))
      .map((u) => u.id),
  );

  const eligible = useMemo(() => {
    return users.filter((u) => {
      if (alreadyAssigned.has(u.id)) return false;
      if (u.allEntities) return true;
      // Must have access to at least one entity connected to this engagement.
      return u.entityIds.some((id) => connectedIds.has(id));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, engagement.id]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligible;
    return eligible.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [eligible, query]);

  const entityNameOf = (id: string) => entities.find((e) => e.id === id)?.legalName ?? id;
  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[560px] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">Assign users</DialogTitle>
          <DialogDescription>
            Pick from the users already created at organisation / entity level. They'll gain access to engagement {engagement.contractRef}.
          </DialogDescription>
        </DialogHeader>

        {eligible.length === 0 ? (
          <p className="text-[13px] leading-[18px] text-neutral-500 py-6 text-center">
            No eligible users. Add users at the organisation or legal-entity level first — an eligible user must already have access to at least one of this engagement's connected legal entities.
          </p>
        ) : (
          <>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-[14px] leading-[20px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 mb-2"
              aria-label="Search users"
            />
          {visible.length === 0 ? (
            <p className="text-[13px] leading-[18px] text-neutral-500 py-6 text-center">
              No users match "{query}".
            </p>
          ) : (
          <div className="flex flex-col divide-y divide-neutral-100 rounded-lg border border-neutral-200 max-h-[360px] overflow-auto">
            {visible.map((u) => {
              const on = selected.includes(u.id);
              const entityNames = u.allEntities
                ? "ALL entities"
                : u.entityIds.filter((id) => connectedIds.has(id)).map(entityNameOf).join(", ") || "—";
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50",
                    on && "bg-neutral-50",
                  )}
                >
                  <span
                    className={cn(
                      "items-center flex justify-center w-4 h-4 rounded border shrink-0",
                      on ? "bg-brand border-brand text-white" : "border-neutral-300",
                    )}
                  >
                    {on && <Check className="w-3 h-3" />}
                  </span>
                  <span className="flex flex-col grow">
                    <span className="text-[14px] leading-5 text-neutral-900">{u.name}</span>
                    <span className="text-[12px] leading-4 text-neutral-500">{u.email} · {entityNames}</span>
                  </span>
                  <Badge tone={u.userType === "Internal" ? "red" : "blue"} size="sm">{u.userType}</Badge>
                </button>
              );
            })}
          </div>
          )}
          </>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => onAssign(selected)} disabled={selected.length === 0}>
            Assign {selected.length > 0 ? `(${selected.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
