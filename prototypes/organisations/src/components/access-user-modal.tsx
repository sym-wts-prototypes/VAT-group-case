import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, ChevronDown, Check, X } from "lucide-react";
import {
  AccessScope, Engagement, LegalEntity, OrgUser, UserRole, UserType, VatRegistration,
  engagementsForEntity, engagementLabel, registrationsForEntity, registrationShortLabel, registrationById,
} from "./org-details-data";
import { ModalShell, ModalFooter, Field, inputCls, primaryBtn, secondaryBtn } from "./legal-entity-modal";

export interface AccessUserDraft {
  name: string;
  email: string;
  userType: UserType;
  role: UserRole;              // primary role — derived from `roles`, kept for back-compat/display
  roles: UserRole[];           // Change 3 — composable (one user may hold both admin roles)
  poolLevel: "org" | "engagement"; // Change 4 — org-wide pool vs single-engagement user
  canCreateCases: boolean;         // Change 5 — distinct case-creation right
  caseCountryScope?: { mode: "only" | "except"; countries: string[] }; // Change 5
  access: AccessScope[];       // rows may carry vatRegistrationIds (Change 2)
}

/* Compact multi-select for engagements (value = engagement ids, label = "11204 · CIT") */
function EngagementMultiSelect({
  options, selected, onChange,
}: { options: Engagement[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }
  const byId = new Map(options.map((o) => [o.id, o]));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-[14px] leading-[20px] flex items-center justify-between gap-2 text-left focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:bg-white"
      >
        {selected.length === 0 ? (
          <span className="text-neutral-400 py-0.5">Select engagements…</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {selected.map((id) => {
              const eng = byId.get(id);
              if (!eng) return null;
              return (
                <span key={id} className="items-center inline-flex gap-1 bg-white border border-neutral-200 text-neutral-700 text-[12px] leading-[16px] px-2 py-0.5 rounded-full">
                  {engagementLabel(eng)}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${eng.contractRef}`}
                    onClick={(e) => { e.stopPropagation(); toggle(id); }}
                    className="items-center flex text-neutral-400 hover:text-neutral-700"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </span>
              );
            })}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto p-1">
          {options.length === 0 ? (
            <p className="text-neutral-400 text-[13px] leading-[18px] px-2.5 py-2">No engagements connected to this legal entity.</p>
          ) : options.map((eng) => {
            const active = selected.includes(eng.id);
            return (
              <button
                key={eng.id}
                type="button"
                onClick={() => toggle(eng.id)}
                className="items-center flex w-full gap-2.5 text-left text-[14px] leading-[20px] px-2.5 py-2 rounded-md hover:bg-neutral-50"
              >
                <span className={`items-center flex justify-center w-4 h-4 rounded border shrink-0 ${active ? "bg-brand border-brand text-white" : "border-neutral-300"}`}>
                  {active && <Check className="w-3 h-3" />}
                </span>
                <span className="text-neutral-800">{engagementLabel(eng)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Compact multi-select for VAT registrations (value = registration ids, label = "FR — FR123…") */
function RegistrationMultiSelect({
  options, selected, onChange,
}: { options: VatRegistration[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }
  const byId = new Map(options.map((o) => [o.id, o]));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-[14px] leading-[20px] flex items-center justify-between gap-2 text-left focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:bg-white"
      >
        {selected.length === 0 ? (
          <span className="text-neutral-400 py-0.5">All registrations (no country restriction)</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {selected.map((id) => {
              const reg = byId.get(id);
              if (!reg) return null;
              return (
                <span key={id} className="items-center inline-flex gap-1 bg-white border border-neutral-200 text-neutral-700 text-[12px] leading-[16px] px-2 py-0.5 rounded-full">
                  {registrationShortLabel(reg)}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Remove ${reg.country} registration`}
                    onClick={(e) => { e.stopPropagation(); toggle(id); }}
                    className="items-center flex text-neutral-400 hover:text-neutral-700"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </span>
              );
            })}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto p-1">
          {options.length === 0 ? (
            <p className="text-neutral-400 text-[13px] leading-[18px] px-2.5 py-2">This entity has no VAT registrations.</p>
          ) : options.map((reg) => {
            const active = selected.includes(reg.id);
            return (
              <button
                key={reg.id}
                type="button"
                onClick={() => toggle(reg.id)}
                className="items-center flex w-full gap-2.5 text-left text-[14px] leading-[20px] px-2.5 py-2 rounded-md hover:bg-neutral-50"
              >
                <span className={`items-center flex justify-center w-4 h-4 rounded border shrink-0 ${active ? "bg-brand border-brand text-white" : "border-neutral-300"}`}>
                  {active && <Check className="w-3 h-3" />}
                </span>
                <span className="text-neutral-800">{registrationShortLabel(reg)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AccessUserModal({
  mode, user, entities, engagements, lockedEngagement, defaultEntityId, lockEntity, variant = "add", onClose, onSubmit,
}: {
  mode: "add" | "edit";
  user?: OrgUser | null;
  entities: LegalEntity[];
  engagements: Engagement[];
  lockedEngagement?: Engagement;
  // V10-A — when the modal is opened from an entity-detail Users section, this seeds the
  // first Access Scope row with that entity so the flow feels contextual.
  defaultEntityId?: string | null;
  // When opened from a Legal Entity's Users section the entity is fixed and can't be changed,
  // so the seeded Access Scope row's Legal Entity picker is locked to `defaultEntityId`.
  lockEntity?: boolean;
  // "invite" = Contributor invitation flow: the exact same form as Add User, but the role is
  // locked to Contributor (picker hidden) and the invitee lands in Pending on submit.
  variant?: "add" | "invite";
  onClose: () => void;
  onSubmit: (draft: AccessUserDraft) => void;
}) {
  const isEngagementMode = !!lockedEngagement;
  const isInvite = variant === "invite";
  // The single entity that stays fixed when the form is opened in a legal-entity context.
  const lockedEntityId = lockEntity && !isEngagementMode ? defaultEntityId ?? null : null;

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [userType, setUserType] = useState<UserType>(user?.userType ?? "Internal");
  // Change 3 — composable roles.
  const initialRoles: UserRole[] = user?.roles?.length ? user.roles : user?.role ? [user.role] : ["Contributor"];
  const [roles, setRoles] = useState<UserRole[]>(initialRoles);
  // V8-C — poolLevel derives implicitly from Access Scope (empty engagementIds = org pool);
  // no separate UI toggle. Keep the field on the draft for downstream consumers.
  const derivedPoolLevel: "org" | "engagement" = lockedEngagement ? "engagement" : (user?.poolLevel ?? "org");
  // Change 5 — case-creation right. The country scope input was removed (V8-C); the countries
  // are inherited from the user's Access Scope VAT-registration selections below.
  const [canCreateCases, setCanCreateCases] = useState<boolean>(user?.canCreateCases ?? false);

  // Initial access rows — Change 2: preserve any per-(user,entity) VAT-registration scope.
  const initialRows: AccessScope[] = (() => {
    if (user?.access && user.access.length) return user.access.map((a) => ({ entityId: a.entityId, engagementIds: [...a.engagementIds], vatRegistrationIds: a.vatRegistrationIds ? [...a.vatRegistrationIds] : [] }));
    return [{ entityId: defaultEntityId ?? "", engagementIds: [], vatRegistrationIds: [] }];
  })();
  const [rows, setRows] = useState<AccessScope[]>(initialRows);
  const [err, setErr] = useState(false);

  const isSuperAdminRole = roles.includes("Super Admin");
  // Super Admin is a platform role — it can only be provisioned by developers (via seed
  // data), never granted through the user creation form. So it is never offered here.
  const roleOptions: UserRole[] = ["Organisation Admin", "Engagement Admin", "Contributor"];

  function primaryRole(rs: UserRole[]): UserRole {
    if (rs.includes("Super Admin")) return "Super Admin";
    if (rs.includes("Organisation Admin")) return "Organisation Admin";
    if (rs.includes("Engagement Admin")) return "Engagement Admin";
    return "Contributor";
  }
  // Super Admin is exclusive (platform); the other roles compose freely; never empty.
  function toggleRole(r: UserRole) {
    setRoles((prev) => {
      if (r === "Super Admin") return prev.includes("Super Admin") ? ["Contributor"] : ["Super Admin"];
      const without = prev.filter((x) => x !== "Super Admin");
      const next = without.includes(r) ? without.filter((x) => x !== r) : [...without, r];
      return next.length ? next : ["Contributor"];
    });
    setErr(false);
  }

  // Entity options for a row's single-select: not used by other rows (dedupe). In engagement mode,
  // only entities connected to the locked engagement are eligible.
  const eligibleEntities = isEngagementMode
    ? entities.filter((e) => lockedEngagement!.entityIds.includes(e.id))
    : entities;

  function entityOptionsFor(rowIdx: number): LegalEntity[] {
    const usedElsewhere = new Set(rows.filter((_, i) => i !== rowIdx).map((r) => r.entityId).filter(Boolean));
    return eligibleEntities.filter((e) => e.id === rows[rowIdx].entityId || !usedElsewhere.has(e.id));
  }

  function firstUnusedEntity(): string {
    const used = new Set(rows.map((r) => r.entityId).filter(Boolean));
    return eligibleEntities.find((e) => !used.has(e.id))?.id ?? "";
  }

  function addRow() {
    setRows((prev) => [...prev, { entityId: firstUnusedEntity(), engagementIds: [], vatRegistrationIds: [] }]);
  }
  function setRowEntity(i: number, entityId: string) {
    // No cascade (Change 2): switching entity clears both engagement and registration scope.
    setRows((prev) => prev.map((r, idx) => (idx === i ? { entityId, engagementIds: [], vatRegistrationIds: [] } : r)));
    setErr(false);
  }
  function setRowEngagements(i: number, engagementIds: string[]) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, engagementIds } : r)));
    setErr(false);
  }
  function setRowRegistrations(i: number, vatRegistrationIds: string[]) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, vatRegistrationIds } : r)));
    setErr(false);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleTypeChange(t: UserType) {
    setUserType(t);
    // External users are always Contributors and can never create cases.
    if (t === "External") { setRoles(["Contributor"]); setCanCreateCases(false); }
  }

  // "May create cases" is not available to External users.
  const canCreateDisabled = userType === "External";

  const effectiveRole: UserRole = userType === "External" ? "Contributor" : primaryRole(roles);
  const requiresAccess = !isSuperAdminRole && (effectiveRole === "Contributor" || userType === "External");

  function rowValid(r: AccessScope): boolean {
    if (!r.entityId) return false;
    if (isEngagementMode) return true; // engagement implied
    return r.engagementIds.length > 0;
  }

  const filledRows = rows.filter((r) => r.entityId);
  const accessValid = isSuperAdminRole
    ? true
    : (!requiresAccess || filledRows.length > 0) && rows.every((r) => !r.entityId || rowValid(r)) && filledRows.every(rowValid);

  const nameValid = name.trim() !== "";
  const emailValid = email.trim() !== "" && email.includes("@");
  const valid = nameValid && emailValid && accessValid;

  function submit() {
    if (!valid) { setErr(true); return; }
    let access: AccessScope[];
    if (isSuperAdminRole) {
      access = [];
    } else if (isEngagementMode) {
      access = filledRows.map((r) => ({ entityId: r.entityId, engagementIds: [lockedEngagement!.id], vatRegistrationIds: r.vatRegistrationIds && r.vatRegistrationIds.length ? [...r.vatRegistrationIds] : undefined }));
    } else {
      access = filledRows.filter((r) => r.engagementIds.length > 0).map((r) => ({ entityId: r.entityId, engagementIds: [...r.engagementIds], vatRegistrationIds: r.vatRegistrationIds && r.vatRegistrationIds.length ? [...r.vatRegistrationIds] : undefined }));
    }
    // Invitations only ever grant Contributor; External users are Contributors too.
    const finalRoles: UserRole[] = userType === "External" || isInvite ? ["Contributor"] : roles;
    // External users can never create cases (the checkbox is disabled for them).
    const submitCanCreate = canCreateDisabled ? false : canCreateCases;
    // V8-C — countries where the user may create cases are inherited from Access Scope:
    // the union of every selected VAT registration's country across their scopes.
    const inheritedCountries = Array.from(new Set(
      access.flatMap((row) => (row.vatRegistrationIds ?? []))
        .map((rid) => registrationById(rid)?.country)
        .filter((c): c is string => !!c),
    ));
    onSubmit({
      name: name.trim(), email: email.trim(), userType,
      role: isInvite ? "Contributor" : effectiveRole, roles: finalRoles,
      poolLevel: derivedPoolLevel, canCreateCases: submitCanCreate,
      caseCountryScope: submitCanCreate && inheritedCountries.length ? { mode: "only", countries: inheritedCountries } : undefined,
      access,
    });
    onClose();
  }

  return (
    <ModalShell title={mode === "edit" ? "Edit User Access" : isInvite ? "Invite User" : "Add User"} onClose={onClose} width="640px">
      <div className="flex flex-col gap-4">
        <Field label="Name" required error={err && !nameValid}>
          <input
            className={inputCls(err && !nameValid)}
            value={name}
            onChange={(e) => { setName(e.target.value); setErr(false); }}
            placeholder="e.g. Julia Hoffmann"
          />
        </Field>

        <Field label="Email" required error={err && !emailValid}>
          <input
            className={inputCls(err && !emailValid)}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErr(false); }}
            placeholder="name@company.com"
          />
        </Field>

        {/* User Type + Roles */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 min-w-0 max-w-[220px]">
            <label className="text-[13px] leading-[18px] font-medium text-neutral-500">User Type</label>
            <div className="flex grow rounded-lg border border-neutral-200 overflow-hidden w-full min-w-0">
              {(["Internal", "External"] as UserType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex-1 min-w-0 px-2 py-2 text-[13px] leading-[20px] text-center border-r last:border-r-0 border-neutral-200 transition-colors ${
                    userType === t ? "bg-primary text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="text-[13px] leading-[18px] font-medium text-neutral-500">{isInvite ? "Role" : "Roles"}</label>
            {isInvite ? (
              // Invitations can only grant the Contributor role, so the picker is locked.
              <div className="flex items-center px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[14px] leading-[20px] text-neutral-600 gap-2">
                Contributor
                <span className="text-neutral-400 text-[12px]">(invited users join as Contributor)</span>
              </div>
            ) : userType === "External" ? (
              <div className="flex items-center px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[14px] leading-[20px] text-neutral-600 gap-2">
                Contributor
                <span className="text-neutral-400 text-[12px]">(auto-selected for External users)</span>
              </div>
            ) : (
              <>
                {/* Change 3 — composable: an Internal user may hold both admin roles at once. */}
                <div className="flex flex-wrap gap-2">
                  {roleOptions.map((r) => {
                    const active = roles.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRole(r)}
                        className={`items-center inline-flex gap-2 px-3 py-2 text-[13px] leading-[18px] rounded-lg border transition-colors ${
                          active ? "bg-primary text-white border-primary" : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        <span className={`items-center flex justify-center w-4 h-4 rounded border shrink-0 ${active ? "bg-white/20 border-white/60 text-white" : "border-neutral-300"}`}>
                          {active && <Check className="w-3 h-3" />}
                        </span>
                        {r}
                      </button>
                    );
                  })}
                </div>
                {isSuperAdminRole && (
                  <p className="text-neutral-400 text-[12px] leading-[16px]">Super Admin is a platform role and cannot be combined with the others.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* V8-C — only the case-creation checkbox remains here. The pool-level toggle was
            removed (org/engagement scope is now implied by the Access Scope rows below), and
            the country picker was removed too — a user may create cases only for the countries
            reachable via their Access Scope VAT-registration selections. */}
        {!isSuperAdminRole && (
          <div className="mt-2 pt-4 border-t border-neutral-100 flex flex-col gap-2">
            <label className={`items-center flex gap-2.5 text-[13px] leading-[18px] ${canCreateDisabled ? "text-neutral-400 cursor-not-allowed" : "text-neutral-700 cursor-pointer"}`}>
              <span
                role="checkbox"
                aria-checked={canCreateDisabled ? false : canCreateCases}
                aria-disabled={canCreateDisabled}
                tabIndex={canCreateDisabled ? -1 : 0}
                onClick={() => { if (!canCreateDisabled) setCanCreateCases((v) => !v); }}
                className={`items-center flex justify-center w-4 h-4 rounded border shrink-0 ${
                  canCreateDisabled
                    ? "bg-neutral-100 border-neutral-200 text-neutral-300"
                    : canCreateCases ? "bg-brand border-brand text-white" : "border-neutral-300"
                }`}
              >
                {canCreateCases && !canCreateDisabled && <Check className="w-3 h-3" />}
              </span>
              May create cases <span className="text-neutral-400 text-[12px]">
                {canCreateDisabled
                  ? "(not available for External users)"
                  : "(a distinct right — countries are inherited from the Access Scope below)"}
              </span>
            </label>
          </div>
        )}

        {/* Access Scope */}
        {isSuperAdminRole ? (
          <div className="mt-2 pt-4 border-t border-neutral-100">
            <span className="text-[13px] leading-[18px] font-medium text-neutral-700 block mb-1.5">Access Scope</span>
            <div className="flex items-center gap-2">
              <span className="items-center inline-flex font-medium border bg-neutral-900 border-neutral-900 text-white text-[11px] leading-[14px] px-2 py-0.5 rounded-full">ALL</span>
              <span className="text-neutral-500 text-[13px] leading-[18px]">Super Admins have access to all legal entities and engagements.</span>
            </div>
          </div>
        ) : (
          <div className="mt-2 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] leading-[18px] font-medium text-neutral-700">Access Scope</span>
              <button
                type="button"
                onClick={addRow}
                disabled={rows.length >= eligibleEntities.length && eligibleEntities.length > 0}
                className="items-center flex gap-1.5 text-[13px] leading-[18px] text-brand hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> Add Legal Entity Access
              </button>
            </div>
            <p className="text-neutral-400 text-[12px] leading-[16px] mb-3">Users need both Legal Entity access and Engagement access before they can create or be assigned to cases.</p>

            {isEngagementMode && (
              <div className="mb-3 text-[13px] leading-[18px] text-neutral-600">
                Engagement: <span className="font-sans font-semibold text-neutral-900">{engagementLabel(lockedEngagement!)}</span> <span className="text-neutral-400">(locked)</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {rows.map((row, i) => {
                const entOptions = entityOptionsFor(i);
                const engOptions = row.entityId ? engagementsForEntity(row.entityId, engagements) : [];
                const regOptions = row.entityId ? registrationsForEntity(row.entityId) : [];
                const rowLocked = !!lockedEntityId && row.entityId === lockedEntityId;
                return (
                  <div key={i} className="border border-neutral-200 rounded-lg p-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] leading-[16px] font-medium text-neutral-500">Access Scope {i + 1}</span>
                      {rows.length > 1 && !rowLocked && (
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          aria-label="Remove access scope"
                          className="items-center flex gap-1 text-[12px] leading-[16px] text-neutral-400 hover:text-brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                    <div className={isEngagementMode ? "" : "grid grid-cols-2 gap-3"}>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] leading-[14px] text-neutral-500">Legal Entity</label>
                        <select
                          className={`${inputCls()} disabled:cursor-not-allowed disabled:text-neutral-500`}
                          value={row.entityId}
                          onChange={(e) => setRowEntity(i, e.target.value)}
                          disabled={rowLocked}
                        >
                          <option value="">— Select legal entity</option>
                          {entOptions.map((e) => <option key={e.id} value={e.id}>{e.legalName}</option>)}
                        </select>
                      </div>
                      {!isEngagementMode && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] leading-[14px] text-neutral-500">Engagements</label>
                          {row.entityId ? (
                            <EngagementMultiSelect
                              options={engOptions}
                              selected={row.engagementIds}
                              onChange={(ids) => setRowEngagements(i, ids)}
                            />
                          ) : (
                            <div className="flex items-center h-[38px] px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-[13px] leading-[18px] text-neutral-400">
                              Select a legal entity first
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Change 2 — VAT-registration (country) level: one step deeper than engagement,
                        per (user, entity), explicit (no cascade from the entity), never global.
                        TODO(open-q-1): provisionally nested UNDER the engagement here — it is
                        unconfirmed whether registration access should sit inside an engagement or
                        independently of it. If independent, lift this to its own (entity, registration) row. */}
                    {row.entityId && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] leading-[14px] text-neutral-500">VAT registrations (country scope)</label>
                        <RegistrationMultiSelect
                          options={regOptions}
                          selected={row.vatRegistrationIds ?? []}
                          onChange={(ids) => setRowRegistrations(i, ids)}
                        />
                        <p className="text-neutral-400 text-[11px] leading-[14px]">
                          Leave empty for all of this entity's registrations. Scoping to specific ones limits the user to those countries on <span className="font-medium">this entity only</span>.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {err && !accessValid && (
              <p className="text-[12px] leading-[16px] text-brand mt-2">
                Each access row needs a Legal Entity{isEngagementMode ? "" : " and at least one Engagement"}.{requiresAccess ? " Contributor and External users need at least one access row." : ""}
              </p>
            )}
          </div>
        )}
      </div>

      <ModalFooter>
        <button type="button" onClick={onClose} className={secondaryBtn}>Cancel</button>
        <button type="button" onClick={submit} className={primaryBtn}>
          {mode === "edit" ? "Save Changes" : isInvite ? "Send Invitation" : "Add User"}
        </button>
      </ModalFooter>
    </ModalShell>
  );
}
