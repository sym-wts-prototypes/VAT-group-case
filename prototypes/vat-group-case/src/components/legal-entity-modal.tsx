import React, { useState } from "react";
import { X, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Badge, Checkbox } from "@wts/ui";
import { LegalEntity, EntityType, Establishment, LEGAL_FORMS, COUNTRIES, ALL_COUNTRIES } from "./org-details-data";
import { Group, groupsForJurisdiction, representativeOf, EntityIdentifier, IdentifierType, IDENTIFIER_TYPES, entityIdentifiers } from "./org-details-data";
import { CountrySelect } from "./country-select";

// Change 1/6 — a VAT registration row carries its own validity window (its VAT ID's validity)
// and an optional id (preserved on edit so access rules / group membership keep referencing it).
// address is optional and defaults to the entity's address when absent.
export type VatRow = { id?: string; country: string; vatNumber: string; validFrom?: string; validTo?: string | null; address?: string };
export type GroupAssignment = { groupId: string; makeRepresentative: boolean };

export type LegalEntityDraft = Omit<LegalEntity, "id" | "orgId" | "vatId" | "countryCode" | "status">;

export function LegalEntityModal({
  mode,
  entity,
  siblings,
  initialVatRegs,
  orgId,
  groups = [],
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  entity: LegalEntity | null;
  siblings: LegalEntity[];
  initialVatRegs?: VatRow[];
  orgId: string;
  groups?: Group[];
  onClose: () => void;
  onSubmit: (draft: LegalEntityDraft, vatRows: VatRow[], groupAssignments?: GroupAssignment[], createNewGroup?: boolean) => void;
}) {
  const [f, setF] = useState<LegalEntityDraft>({
    legalName: entity?.legalName ?? "",
    legalForm: entity?.legalForm ?? "GmbH",
    clientId: entity?.clientId ?? "",
    taxAuthority: entity?.taxAuthority ?? "",
    citNumber: entity?.citNumber ?? "",
    establishments: entity?.establishments ? entity.establishments.map((b, i) => ({ ...b, id: b.id ?? `est-seed-${i}` })) : [],
    levelOfShareholding: entity?.levelOfShareholding ?? "",
    incomeTaxGroup: entity?.incomeTaxGroup ?? false,
    vatGroup: entity?.vatGroup ?? false,
    vatGroupRepresentative: entity?.vatGroupRepresentative ?? false,
    vatGroupRepresentativeId: entity?.vatGroupRepresentativeId,
    jurisdiction: entity?.jurisdiction ?? entity?.country ?? "",
    address: entity?.address ?? "",
    city: entity?.city ?? "",
    postalCode: entity?.postalCode ?? "",
    country: entity?.country ?? "",
    fiscalYearStart: entity?.fiscalYearStart ?? "1 January",
    fiscalYearEnd: entity?.fiscalYearEnd ?? "31 December",
    type: entity?.type ?? "HQ",
    parentId: entity?.parentId,
  });

  const [vatRows, setVatRows] = useState<VatRow[]>(
    initialVatRegs ?? []
  );

  // Unified Tax Numbers & IDs editor — one row per identifier. On edit, seed from
  // entityIdentifiers() so legacy scalar fields (clientId, citNumber) roll into the list too.
  const [idRows, setIdRows] = useState<EntityIdentifier[]>(
    entity ? entityIdentifiers(entity).map((id) => ({ ...id })) : []
  );

  const [err, setErr] = useState(false);
  const [branchErr, setBranchErr] = useState(false);

  // Groups section (create mode only) — initial memberships to apply on save.
  const [groupChecked, setGroupChecked] = useState<string[]>([]);
  const [groupRep, setGroupRep] = useState<string[]>([]);
  const [createNewGroup, setCreateNewGroup] = useState(false);

  function set<K extends keyof LegalEntityDraft>(k: K, v: LegalEntityDraft[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  // Rule 2 in the form: checking a group of a given type auto-unchecks any
  // already-checked group of the SAME type (an entity can't be active in two).
  function toggleGroup(g: Group) {
    setGroupChecked((prev) => {
      if (prev.includes(g.id)) {
        setGroupRep((r) => r.filter((x) => x !== g.id));
        return prev.filter((x) => x !== g.id);
      }
      const sameType = groups.filter((x) => x.type === g.type).map((x) => x.id);
      const next = prev.filter((id) => !sameType.includes(id)).concat(g.id);
      setGroupRep((r) => r.filter((x) => !sameType.includes(x) || x === g.id));
      return next;
    });
  }

  function addEstablishment() {
    // Every new branch starts completely empty and independent — it inherits nothing from the
    // head office, another branch, or the last selected country/jurisdiction. A stable id keys
    // the row so removing a branch never shifts entered state into a neighbouring branch.
    setF((prev) => ({
      ...prev,
      establishments: [
        ...(prev.establishments ?? []),
        {
          id: `est-${Date.now()}-${prev.establishments?.length ?? 0}`,
          address: "", city: "", postalCode: "",
          country: "", taxAuthority: "", jurisdiction: "",
          citNumber: "", wageTaxNumber: "",
        },
      ],
    }));
  }
  function updateEstablishment(i: number, field: keyof Establishment, value: string) {
    setF((prev) => ({
      ...prev,
      establishments: (prev.establishments ?? []).map((b, idx) => (idx !== i ? b : { ...b, [field]: value })),
    }));
    setBranchErr(false);
  }
  function removeEstablishment(i: number) {
    setF((prev) => ({ ...prev, establishments: (prev.establishments ?? []).filter((_, idx) => idx !== i) }));
  }

  function submit() {
    if (!f.legalName.trim()) { setErr(true); return; }
    // Branches require Country + Jurisdiction. Incomplete branches block submission (rather
    // than being silently dropped) so the user completes or explicitly removes them.
    const branches = f.establishments ?? [];
    const branchesValid = branches.every((b) => (b.country ?? "").trim() && (b.jurisdiction ?? "").trim());
    if (!branchesValid) { setBranchErr(true); return; }
    // Persist the identifier list onto the draft. Mirror the first Client Identifier back
    // into the legacy `clientId` scalar so downstream code that still reads it keeps working.
    // TIN CIT is captured directly on `citNumber` via the Head Office AddressFields.
    const kept = idRows.filter((r) => r.value.trim());
    const firstClient = kept.find((r) => r.type === "Client Identifier")?.value;
    const withIds: LegalEntityDraft = {
      ...f,
      identifiers: kept,
      clientId: firstClient ?? f.clientId,
    };
    if (mode === "create") {
      const assignments: GroupAssignment[] = groupChecked.map((id) => ({
        groupId: id,
        makeRepresentative: groupRep.includes(id),
      }));
      onSubmit(withIds, vatRows, assignments, createNewGroup);
    } else {
      onSubmit(withIds, vatRows);
    }
  }

  // A subsidiary can sit under any entity (HQ or another subsidiary), except
  // itself or one of its own descendants — that would create a cycle.
  const blockedParentIds = new Set<string>();
  if (entity) {
    const stack = [entity.id];
    while (stack.length) {
      const cur = stack.pop()!;
      siblings.filter((s) => s.parentId === cur).forEach((c) => { blockedParentIds.add(c.id); stack.push(c.id); });
    }
  }
  const possibleParents = siblings.filter((s) => s.id !== entity?.id && !blockedParentIds.has(s.id));

  function addIdRow() {
    // Suggest the least-populated type first so "Add number" lands somewhere useful.
    const counts: Record<IdentifierType, number> = { "Client Identifier": 0, DUNS: 0, DATEV: 0, Custom: 0 };
    idRows.forEach((r) => { counts[r.type] = (counts[r.type] ?? 0) + 1; });
    const nextType = (IDENTIFIER_TYPES.find((t) => counts[t] === 0) ?? "Client Identifier") as IdentifierType;
    setIdRows((prev) => [...prev, { id: `id-new-${Date.now()}-${prev.length}`, type: nextType, value: "" }]);
  }
  function updateIdRow(i: number, patch: Partial<EntityIdentifier>) {
    setIdRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeIdRow(i: number) {
    setIdRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addVatRow() {
    setVatRows((prev) => [...prev, { country: "Germany", vatNumber: "" }]);
  }

  function updateVatRow(i: number, field: keyof VatRow, value: string) {
    setVatRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function removeVatRow(i: number) {
    setVatRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <ModalShell title={mode === "create" ? "Create Legal Entity" : "Edit Legal Entity"} onClose={onClose} width="640px">
      <div className="grid grid-cols-4 gap-4">
        <Field label="Legal Name" required full error={err}>
          <input
            className={inputCls(err)}
            value={f.legalName}
            onChange={(e) => { set("legalName", e.target.value); setErr(false); }}
            placeholder="e.g. EUROPIPE GmbH"
          />
        </Field>
        <Field label="Legal Form" full>
          <select className={inputCls()} value={f.legalForm} onChange={(e) => set("legalForm", e.target.value)}>
            {LEGAL_FORMS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Fiscal Year Start">
          <MonthDayPicker value={f.fiscalYearStart} onChange={(v) => set("fiscalYearStart", v)} />
        </Field>
        <Field label="Fiscal Year End">
          <MonthDayPicker value={f.fiscalYearEnd} onChange={(v) => set("fiscalYearEnd", v)} />
        </Field>
        <Field label="Level of Shareholding (%)" full>
          <input
            className={inputCls()}
            type="number"
            step="0.0000000001"
            min="0"
            max="100"
            inputMode="decimal"
            value={f.levelOfShareholding ?? ""}
            onChange={(e) => set("levelOfShareholding", e.target.value)}
            placeholder="e.g. 100 or 0.0000000001"
          />
          <p className="text-neutral-400 text-[11px] leading-[14px] mt-1">Up to 10 digits after the decimal point (e.g. 0.0000000001%).</p>
        </Field>
      </div>

      {/* Entity Type (1/2) + Parent Legal Entity (1/2, only when Subsidiary) */}
      <div className="mt-5 grid grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] leading-[18px] font-medium text-neutral-500">Entity Type</label>
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden w-full">
            {(["HQ", "Subsidiary"] as EntityType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { set("type", t); if (t === "HQ") set("parentId", undefined); }}
                className={`flex-1 px-5 py-2 text-[14px] leading-[20px] border-r last:border-r-0 border-neutral-200 transition-colors ${
                  f.type === t
                    ? "bg-primary text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {f.type === "Subsidiary" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] leading-[18px] font-medium text-neutral-500">Parent Legal Entity</label>
            <select
              className={inputCls()}
              value={f.parentId ?? ""}
              onChange={(e) => set("parentId", e.target.value || undefined)}
            >
              <option value="">— Select parent</option>
              {possibleParents.map((p) => <option key={p.id} value={p.id}>{p.legalName}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Head Office — same field layout as a Branch, without card chrome.
          Includes TIN CIT and TIN Wage Tax at the entity level. */}
      <div className="mt-6 pt-5 border-t border-neutral-100">
        <span className="text-[13px] leading-[18px] font-medium text-neutral-700 block mb-3">Head Office</span>
        <AddressFields
          values={{ address: f.address, city: f.city, postalCode: f.postalCode, country: f.country, taxAuthority: f.taxAuthority, jurisdiction: f.jurisdiction, citNumber: f.citNumber, wageTaxNumber: f.wageTaxNumber }}
          onChange={(field, value) => set(field as keyof LegalEntityDraft, value as never)}
        />
      </div>

      {/* Branches / Establishments (Hauptniederlassung) */}
      <div className="mt-6 pt-5 border-t border-neutral-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] leading-[18px] font-medium text-neutral-700">Branches / Establishments</span>
          <button
            type="button"
            onClick={addEstablishment}
            className="items-center flex gap-1.5 text-[13px] leading-[18px] text-brand hover:opacity-80"
          >
            <Plus className="w-3.5 h-3.5" /> Add Branch / Establishment
          </button>
        </div>

        {(f.establishments ?? []).length === 0 ? (
          <p className="text-neutral-400 text-[13px] leading-[18px]">No branches / establishments added.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(f.establishments ?? []).map((b, i) => (
              <div key={b.id ?? i} className="border border-neutral-200 rounded-lg p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] leading-[16px] font-medium text-neutral-500">Branch {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeEstablishment(i)}
                    aria-label="Remove branch"
                    className="items-center flex gap-1 text-[12px] leading-[16px] text-neutral-400 hover:text-brand"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
                <AddressFields
                  values={b}
                  onChange={(field, value) => updateEstablishment(i, field as keyof Establishment, value)}
                  requireCountryJurisdiction
                  showErrors={branchErr}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VAT Registrations (TIN VAT) — one row per country. No validity dates. */}
      <div className="mt-6 pt-5 border-t border-neutral-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] leading-[18px] font-medium text-neutral-700">VAT Registrations (TIN VAT)</span>
          <button
            type="button"
            onClick={addVatRow}
            className="items-center flex gap-1.5 text-[13px] leading-[18px] text-brand hover:opacity-80"
          >
            <Plus className="w-3.5 h-3.5" /> Add VAT Registration
          </button>
        </div>

        {vatRows.length === 0 ? (
          <p className="text-neutral-400 text-[13px] leading-[18px]">No VAT registrations added yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_2fr_36px] gap-2 text-[12px] leading-[16px] text-neutral-500 font-medium px-1">
              <span>Country</span>
              <span>TIN VAT</span>
              <span />
            </div>
            {vatRows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_36px] gap-2 items-center">
                <select
                  className={inputCls()}
                  value={row.country}
                  onChange={(e) => updateVatRow(i, "country", e.target.value)}
                >
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input
                  className={inputCls()}
                  value={row.vatNumber}
                  onChange={(e) => updateVatRow(i, "vatNumber", e.target.value)}
                  placeholder="e.g. DE159933475"
                />
                <button
                  type="button"
                  onClick={() => removeVatRow(i)}
                  aria-label="Remove VAT registration"
                  className="items-center flex justify-center w-9 h-9 text-neutral-400 hover:text-brand hover:bg-red-50 rounded-lg border border-neutral-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* V5 — Additional Identifiers. NON-tax numbers only: Client Identifier, DUNS, DATEV, or
          Custom (with a user-provided name). No validity dates — values are plain pairs.
          TIN CIT lives inline in the Head Office section above; TIN VAT lives per country
          on the VAT Registrations section above. */}
      <div className="mt-6 pt-5 border-t border-neutral-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] leading-[18px] font-medium text-neutral-700">Additional Identifiers</span>
          <button
            type="button"
            onClick={addIdRow}
            className="items-center flex gap-1.5 text-[13px] leading-[18px] text-brand hover:opacity-80"
          >
            <Plus className="w-3.5 h-3.5" /> Add number
          </button>
        </div>

        {idRows.length === 0 ? (
          <p className="text-neutral-400 text-[13px] leading-[18px]">
            No identifiers added yet. Use <span className="font-medium">Add number</span> for Client Identifier, DUNS, DATEV, or a custom entry.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1.1fr_1.2fr_1.5fr_36px] gap-2 text-[12px] leading-[16px] text-neutral-500 font-medium px-1">
              <span>Type</span>
              <span>Name</span>
              <span>Value</span>
              <span />
            </div>
            {idRows.map((row, i) => (
              <div key={row.id} className="grid grid-cols-[1.1fr_1.2fr_1.5fr_36px] gap-2 items-center">
                <select
                  className={inputCls()}
                  value={row.type}
                  onChange={(e) => updateIdRow(i, { type: e.target.value as IdentifierType, label: e.target.value === "Custom" ? (row.label ?? "") : undefined })}
                >
                  {IDENTIFIER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {row.type === "Custom" ? (
                  <input
                    className={inputCls()}
                    value={row.label ?? ""}
                    onChange={(e) => updateIdRow(i, { label: e.target.value })}
                    placeholder="e.g. Internal Ref"
                  />
                ) : (
                  <div className="flex items-center px-3 h-[38px] text-[13px] leading-[18px] text-neutral-400 bg-neutral-50 border border-neutral-200 rounded-lg">
                    {row.type}
                  </div>
                )}
                <input
                  className={inputCls()}
                  value={row.value}
                  onChange={(e) => updateIdRow(i, { value: e.target.value })}
                  placeholder={row.type === "DUNS" ? "e.g. 31-563-9999" : row.type === "DATEV" ? "e.g. 77004411" : "value"}
                />
                <button
                  type="button"
                  onClick={() => removeIdRow(i)}
                  aria-label="Remove identifier"
                  className="items-center flex justify-center w-9 h-9 text-neutral-400 hover:text-brand hover:bg-red-50 rounded-lg border border-neutral-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* V4-A — the legacy "Part of VAT Group? / Is Representative?" Q&A was removed here.
          The Groups checklist below (create mode) and the Groups tab (edit mode) are the
          single source of truth for VAT-group membership; the boolean flags are inferred. */}

      {mode === "create" && (
        <div className="flex flex-col gap-3">
          <span className="text-[13px] leading-[18px] font-medium text-neutral-700 block">Groups</span>
          {(() => {
            const available = groupsForJurisdiction(f.jurisdiction ?? f.country, orgId, groups);
            return (
              <div className="flex flex-col divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                {available.length === 0 ? (
                  <p className="px-3 py-3 text-[13px] leading-[18px] text-neutral-500">
                    No groups exist yet for {f.jurisdiction ?? f.country}.
                  </p>
                ) : (
                  available.map((g) => {
                    const checked = groupChecked.includes(g.id);
                    const makeRep = groupRep.includes(g.id);
                    const currentRep = representativeOf(g);
                    const repName = currentRep
                      ? siblings.find((s) => s.id === currentRep.entityId)?.legalName ?? "another entity"
                      : null;
                    return (
                      <div key={g.id} className="flex flex-col gap-2 px-3 py-2.5">
                        <label className="flex cursor-pointer items-center gap-3">
                          <Checkbox checked={checked} onCheckedChange={() => toggleGroup(g)} />
                          <span className="text-[14px] leading-5 text-neutral-900">{g.name}</span>
                          <Badge tone={g.type === "VAT" ? "blue" : "violet"} size="sm">
                            {g.type}
                          </Badge>
                        </label>
                        {checked && (
                          <div className="flex flex-col gap-1.5 pl-7">
                            <label className="flex cursor-pointer items-center gap-2.5">
                              <Checkbox
                                checked={makeRep}
                                onCheckedChange={(v) =>
                                  setGroupRep((prev) => (v === true ? [...prev, g.id] : prev.filter((x) => x !== g.id)))
                                }
                              />
                              <span className="text-[13px] leading-[18px] text-neutral-600">Make representative</span>
                            </label>
                            {makeRep && currentRep && (
                              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[12px] leading-4 text-amber-800">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>
                                  {repName} is currently the representative of this group. Saving will replace them.
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {/* Deferred action — the entity doesn't exist yet to be added as a member. */}
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                  <Checkbox checked={createNewGroup} onCheckedChange={(v) => setCreateNewGroup(v === true)} />
                  <span className="text-[14px] leading-5 text-neutral-900">Create a new group for this entity</span>
                </label>
              </div>
            );
          })()}
        </div>
      )}

      <ModalFooter>
        <button type="button" onClick={onClose} className={secondaryBtn}>Cancel</button>
        <button type="button" onClick={submit} className={primaryBtn}>
          {mode === "create" ? "Create Legal Entity" : "Save Changes"}
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

/* ---------- Fiscal-year cadence picker (day + month, no year) ---------- */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Days available for the selected month (so 30 Feb etc. can't be chosen).
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Fiscal year is a recurring cadence — a day + month, never a calendar year.
// Stored as "D MMMM" (e.g. "1 January") to match how it's displayed elsewhere.
function MonthDayPicker({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const m = (value || "").trim().match(/^(\d{1,2})\s+([A-Za-z]+)/);
  const day = m ? parseInt(m[1], 10) : null;
  const monthIdx = m ? MONTHS.findIndex((mo) => mo.toLowerCase() === m[2].toLowerCase()) : -1;

  function emit(d: number | null, mi: number) {
    if (mi < 0) mi = 0;
    const maxDay = DAYS_IN_MONTH[mi];
    const safeDay = Math.min(d ?? 1, maxDay);
    onChange(`${safeDay} ${MONTHS[mi]}`);
  }

  const dayCount = DAYS_IN_MONTH[monthIdx >= 0 ? monthIdx : 0];

  return (
    <div className="grid grid-cols-[64px_1fr] gap-2">
      <select className={inputCls()} value={day ?? ""} onChange={(e) => emit(parseInt(e.target.value, 10), monthIdx)} aria-label="Day">
        <option value="">DD</option>
        {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <select className={inputCls()} value={monthIdx >= 0 ? monthIdx : ""} onChange={(e) => emit(day, parseInt(e.target.value, 10))} aria-label="Month">
        <option value="">Month</option>
        {MONTHS.map((mo, i) => <option key={mo} value={i}>{MONTHS_SHORT[i]}</option>)}
      </select>
    </div>
  );
}

/* ---------- Shared address + tax fields (Head Office + Branches) ----------

   One component drives both sections so their fields, labels, layout and styling stay
   identical. The only configurable behaviour is whether Country + Jurisdiction are required
   (branches) and whether to surface required-field errors. Each rendered instance owns its
   own local field state — there is no value copying between Head Office and Branches. */

type AddressValues = { address?: string; city?: string; postalCode?: string; country?: string; taxAuthority?: string; jurisdiction?: string; citNumber?: string; wageTaxNumber?: string };

function AddressFields({ values, onChange, requireCountryJurisdiction = false, showErrors = false }: {
  values: AddressValues;
  onChange: (field: string, value: string) => void;
  // Branches require Country + Jurisdiction; Head Office leaves them optional.
  requireCountryJurisdiction?: boolean;
  // When true (after a failed submit) missing required fields render in the error state.
  showErrors?: boolean;
}) {
  const countryMissing = requireCountryJurisdiction && !(values.country ?? "").trim();
  const jurisdictionMissing = requireCountryJurisdiction && !(values.jurisdiction ?? "").trim();

  // Selecting/changing Country auto-fills Jurisdiction ONLY when Jurisdiction is currently
  // empty — decided purely from the present value, with no persistent sync or override flag.
  function handleCountry(v: string) {
    onChange("country", v);
    if (v && !(values.jurisdiction ?? "").trim()) onChange("jurisdiction", v);
  }

  return (
    <div className="flex flex-col gap-3">
      <input className={inputCls()} value={values.address ?? ""} onChange={(e) => onChange("address", e.target.value)} placeholder="Street and number" />
      <div className="grid grid-cols-4 gap-2">
        <input className={`${inputCls()} col-span-2`} value={values.city ?? ""} onChange={(e) => onChange("city", e.target.value)} placeholder="City" />
        <input className={inputCls()} value={values.postalCode ?? ""} onChange={(e) => onChange("postalCode", e.target.value)} placeholder="Postal" />
        <CountrySelect
          value={values.country ?? ""}
          onChange={handleCountry}
          options={ALL_COUNTRIES}
          placeholder="Country"
          ariaLabel="Country"
          error={showErrors && countryMissing}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] leading-[14px] text-neutral-500">Tax Authority</label>
          <input className={inputCls()} value={values.taxAuthority ?? ""} onChange={(e) => onChange("taxAuthority", e.target.value)} placeholder="optional" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] leading-[14px] text-neutral-500">Jurisdiction {requireCountryJurisdiction && <span className="text-brand">*</span>}</label>
          <CountrySelect
            value={values.jurisdiction ?? ""}
            onChange={(v) => onChange("jurisdiction", v)}
            options={ALL_COUNTRIES}
            placeholder="Jurisdiction"
            ariaLabel="Jurisdiction"
            error={showErrors && jurisdictionMissing}
          />
        </div>
      </div>
      {/* TIN CIT + TIN Wage Tax, side by side — both optional for Head Office and Branches. */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] leading-[14px] text-neutral-500">TIN CIT</label>
          <input className={inputCls()} value={values.citNumber ?? ""} onChange={(e) => onChange("citNumber", e.target.value)} placeholder="optional" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] leading-[14px] text-neutral-500">TIN Wage Tax</label>
          <input className={inputCls()} value={values.wageTaxNumber ?? ""} onChange={(e) => onChange("wageTaxNumber", e.target.value)} placeholder="optional" />
        </div>
      </div>
      {requireCountryJurisdiction && showErrors && (countryMissing || jurisdictionMissing) && (
        <p className="text-[12px] leading-[16px] text-brand">Country and Jurisdiction are required.</p>
      )}
    </div>
  );
}

/* ---------- Shared modal primitives (also used by other modals) ---------- */

export function ModalShell({ title, onClose, width, children }: { title: string; onClose: () => void; width: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]" style={{ maxWidth: width }}>
        <div className="items-center border-b flex justify-between border-neutral-200 px-6 py-4 shrink-0">
          <h2 className="text-primary text-[20px] leading-[28px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="items-center flex justify-center w-8 h-8 text-neutral-500 hover:bg-neutral-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="items-center flex justify-end gap-2 pt-5 mt-5 border-t border-neutral-200">{children}</div>;
}

export function Field({ label, required, full, error, children }: { label: string; required?: boolean; full?: boolean; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "col-span-2" : ""}`}>
      <label className="text-[13px] leading-[18px] font-medium text-neutral-500">
        {label.replace(/\bassigned\b\s*/gi, '').trim()} {required && <span className="text-brand">*</span>}
      </label>
      {children}
      {error && required && <span className="text-[12px] leading-[16px] text-brand">This field is required.</span>}
    </div>
  );
}

export const inputCls = (error?: boolean) =>
  `w-full bg-neutral-50 border rounded-lg px-3 py-2 text-[14px] leading-[20px] outline-none focus:bg-white focus:ring-2 focus:ring-neutral-200 ${error ? "border-brand" : "border-neutral-200"}`;

export const pillCls = (active: boolean) =>
  `border rounded-lg px-3 py-2 text-[14px] leading-[20px] text-left ${active ? "border-brand bg-red-50/40 font-medium text-neutral-900" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"}`;

export const primaryBtn = "items-center flex gap-2 bg-primary text-white font-medium text-[14px] leading-[20px] px-4 py-2 rounded-lg hover:opacity-90";
export const secondaryBtn = "items-center flex gap-2 border border-neutral-200 text-neutral-700 font-medium text-[14px] leading-[20px] px-4 py-2 rounded-lg hover:bg-neutral-50";
