import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { LegalEntity, OrgUser, UserType } from "./org-details-data";
import { ModalShell, ModalFooter, Field, inputCls, primaryBtn, secondaryBtn } from "./legal-entity-modal";

export interface InviteDraft {
  email: string;
  userType: UserType;
  role: string;
  entityIds: string[];
}

export function InviteUserModal({
  entities,
  defaultEntityId,
  mode = "add",
  variant = "manage",
  allowSuperAdminRole = false,
  user,
  onClose,
  onSubmit,
}: {
  entities: LegalEntity[];
  defaultEntityId?: string | null;
  mode?: "add" | "edit";
  variant?: "manage" | "invite";
  allowSuperAdminRole?: boolean; // org-level Users tab only: a Super Admin can grant Super Admin
  user?: OrgUser | null;
  onClose: () => void;
  onSubmit: (draft: InviteDraft) => void;
}) {
  const isEdit = mode === "edit";
  const isInvite = variant === "invite"; // User role: locked entity, fixed Contributor role, "invite" wording
  const [email, setEmail] = useState(user?.email ?? "");
  const [userType, setUserType] = useState<UserType>(user?.userType ?? "Internal");
  const [role, setRole] = useState<string>(user?.role ?? "Contributor");
  const isSuperAdminRole = role === "Super Admin"; // ALL-entity access; locks the legal-entity picker
  const [entityIds, setEntityIds] = useState<string[]>(
    user?.entityIds ?? (defaultEntityId ? [defaultEntityId] : [])
  );
  const [err, setErr] = useState(false);
  const [closeOnSubmit, setCloseOnSubmit] = useState(true);

  function handleTypeChange(t: UserType) {
    setUserType(t);
    setRole("Contributor");
  }

  // Reviewer is a case-level permission, not an org/entity role.
  // Super Admin is only offered when explicitly allowed (org-level Users tab) and for Internal users.
  const internalRoles = allowSuperAdminRole ? ["Super Admin", "Organisation Admin", "Engagement Admin", "Contributor"] : ["Organisation Admin", "Engagement Admin", "Contributor"];

  function submit() {
    const needsEntity = !isSuperAdminRole; // Super Admins get ALL entities
    if (!email.trim() || !email.includes("@") || (needsEntity && entityIds.length === 0)) { setErr(true); return; }
    onSubmit({ email: email.trim(), userType, role: isInvite ? "Contributor" : role, entityIds });
    if (isEdit || closeOnSubmit) {
      onClose();
    } else {
      setEmail("");
      setEntityIds(defaultEntityId ? [defaultEntityId] : []);
      setErr(false);
    }
  }

  return (
    <ModalShell title={isEdit ? "Edit User" : isInvite ? "Invite User" : "Add User"} onClose={onClose} width="480px">
      <div className="flex flex-col gap-4">
        <Field label="Email" required error={err}>
          <input
            className={inputCls(err && (!email.trim() || !email.includes("@")))}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErr(false); }}
            placeholder="name@company.com"
          />
        </Field>

        {/* User Type — segmented control */}
        <Field label="User Type">
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden w-fit">
            {(["Internal", "External"] as UserType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`px-5 py-2 text-[14px] leading-[20px] border-r last:border-r-0 border-neutral-200 transition-colors ${
                  userType === t ? "bg-primary text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        {/* Role */}
        <Field label="Role">
          {isInvite ? (
            <div className="flex items-center h-10 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-[14px] leading-[20px] text-neutral-600 gap-2">
              Contributor
              <span className="text-neutral-400 text-[12px]">(invited users join as Contributor)</span>
            </div>
          ) : userType === "External" ? (
            <div className="flex items-center h-10 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-[14px] leading-[20px] text-neutral-600 gap-2">
              Contributor
              <span className="text-neutral-400 text-[12px]">(auto-selected for External users)</span>
            </div>
          ) : (
            <div className="flex rounded-lg border border-neutral-200 overflow-hidden w-fit">
              {internalRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-5 py-2 text-[14px] leading-[20px] border-r last:border-r-0 border-neutral-200 transition-colors ${
                    role === r ? "bg-primary text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </Field>

        {/* Legal Entities */}
        {isInvite ? (
          <Field label="Legal Entity">
            <div className="flex items-center h-10 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-[14px] leading-[20px] text-neutral-500">
              {entities.find((e) => e.id === entityIds[0])?.legalName ?? "—"}
            </div>
          </Field>
        ) : isSuperAdminRole ? (
          <Field label="Legal Entities">
            <div className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 flex items-center gap-2 opacity-70 cursor-not-allowed">
              <span className="items-center inline-flex font-medium border bg-neutral-900 border-neutral-900 text-white text-[11px] leading-[14px] px-2 py-0.5 rounded-full">ALL</span>
              <span className="text-[14px] leading-[20px] text-neutral-500">All legal entities</span>
            </div>
            <span className="text-[12px] leading-[16px] text-neutral-400">
              Super Admins have access to all legal entities — selection is disabled.
            </span>
          </Field>
        ) : (
          <Field label="Legal Entities" required>
            <EntityMultiSelect
              entities={entities}
              selected={entityIds}
              onChange={(v) => { setEntityIds(v); setErr(false); }}
              error={err && entityIds.length === 0}
            />
            <span className="text-[12px] leading-[16px] text-neutral-400">
              Users belong to Legal Entities, not directly to Organizations. Add to one or more.
            </span>
          </Field>
        )}
      </div>

      <ModalFooter>
        {!isEdit && (
          <label className="flex items-center gap-2 mr-auto cursor-pointer select-none">
            <input
              type="checkbox"
              checked={closeOnSubmit}
              onChange={(e) => setCloseOnSubmit(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 accent-[#0a0a0a] cursor-pointer"
            />
            <span className="text-[13px] leading-[18px] text-neutral-600">Close on submitting</span>
          </label>
        )}
        <button type="button" onClick={onClose} className={secondaryBtn}>Cancel</button>
        <button type="button" onClick={submit} className={primaryBtn}>{isEdit ? "Save Changes" : isInvite ? "Send Invitation" : "Add User"}</button>
      </ModalFooter>
    </ModalShell>
  );
}

/* Multi-select for legal entities (chips + checkbox dropdown) */
function EntityMultiSelect({
  entities, selected, onChange, error,
}: { entities: LegalEntity[]; selected: string[]; onChange: (v: string[]) => void; error?: boolean }) {
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
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }
  const nameOf = (id: string) => entities.find((e) => e.id === id)?.legalName ?? id;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full bg-neutral-50 border rounded-lg px-3 py-2 text-[14px] leading-[20px] flex items-center justify-between gap-2 text-left focus:outline-none focus:ring-2 focus:ring-neutral-200 ${error ? "border-brand" : "border-neutral-200"}`}
      >
        {selected.length === 0 ? (
          <span className="text-neutral-400 py-0.5">Select legal entities</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {selected.map((id) => (
              <span key={id} className="items-center inline-flex gap-1 bg-neutral-100 border border-neutral-200 text-neutral-700 text-[12px] leading-[16px] px-2 py-0.5 rounded-full">
                {nameOf(id)}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${nameOf(id)}`}
                  onClick={(e) => { e.stopPropagation(); toggle(id); }}
                  className="items-center flex text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto p-1">
          {entities.length === 0 ? (
            <p className="text-neutral-400 text-[13px] px-2.5 py-2">No legal entities available.</p>
          ) : entities.map((en) => {
            const active = selected.includes(en.id);
            return (
              <button
                key={en.id}
                type="button"
                onClick={() => toggle(en.id)}
                className="items-center flex w-full gap-2.5 text-left text-[14px] leading-[20px] px-2.5 py-2 rounded-md hover:bg-neutral-50"
              >
                <span className={`items-center flex justify-center w-4 h-4 rounded border shrink-0 ${active ? "bg-brand border-brand text-white" : "border-neutral-300"}`}>
                  {active && <Check className="w-3 h-3" />}
                </span>
                <span className="text-neutral-800">{en.legalName}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
