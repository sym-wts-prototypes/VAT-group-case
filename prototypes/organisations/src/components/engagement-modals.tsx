import React, { useState, useRef, useEffect } from "react";
import { X, Ban, AlertTriangle, ChevronDown, Check, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Badge } from "@wts/ui";
import { Engagement, EngagementStatus, LegalEntity, ServiceLineAssignment, SERVICE_CATALOGUE } from "./org-details-data";

/* ─── Shared modal shell ─────────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[760px] flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 shrink-0">
          <h2 className="text-primary text-[20px] leading-[28px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="items-center flex justify-center w-8 h-8 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex flex-col grow">{children}</div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-neutral-700 text-[14px] leading-[20px] font-medium mb-1.5">{children}</label>;
}
function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-[14px] leading-[20px] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.22_25)] focus:border-transparent"
    />
  );
}
function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-neutral-200 rounded-lg px-3 py-2.5 text-[14px] leading-[20px] text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.22_25)] focus:border-transparent appearance-none"
    >
      {children}
    </select>
  );
}

function MultiSelect({ options, selected, onChange, placeholder }: { options: string[]; selected: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-[14px] leading-[20px] bg-white flex items-center justify-between gap-2 text-left focus:outline-none focus:ring-2 focus:ring-[oklch(0.55_0.22_25)]"
      >
        {selected.length === 0 ? (
          <span className="text-neutral-400 py-0.5">{placeholder ?? "Select…"}</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {selected.map((s) => (
              <span key={s} className="items-center inline-flex gap-1 bg-neutral-100 border border-neutral-200 text-neutral-700 text-[12px] leading-[16px] px-2 py-0.5 rounded-full">
                {s}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${s}`}
                  onClick={(e) => { e.stopPropagation(); toggle(s); }}
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
          {options.map((opt) => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="items-center flex w-full gap-2.5 text-left text-[14px] leading-[20px] px-2.5 py-2 rounded-md hover:bg-neutral-50"
              >
                <span className={`items-center flex justify-center w-4 h-4 rounded border shrink-0 ${active ? "bg-brand border-brand text-white" : "border-neutral-300"}`}>
                  {active && <Check className="w-3 h-3" />}
                </span>
                <span className="text-neutral-800">{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Engagement draft ───────────────────────────────────────────────────── */
export interface EngagementDraft {
  contractRef: string;
  serviceLines: ServiceLineAssignment[];
  status: EngagementStatus;
  startDate: string;
  endDate: string;
}

/* ─── Service Lines editor — chip multi-select ─────────────────────────────
   V8-A — every service line is a togglable badge. Case types were removed from the
   engagement form, so a row is now just `{ serviceLine, caseTypes: [] }`; downstream
   consumers keep working via the empty `caseTypes` array. */
function ServiceLinesEditor({ rows, onChange }: { rows: ServiceLineAssignment[]; onChange: (rows: ServiceLineAssignment[]) => void }) {
  const selected = new Set(rows.map((r) => r.serviceLine));
  function toggle(key: string) {
    if (selected.has(key)) {
      onChange(rows.filter((r) => r.serviceLine !== key));
    } else {
      onChange([...rows, { serviceLine: key, caseTypes: [] }]);
    }
  }
  return (
    <div>
      <span className="text-neutral-700 text-[14px] leading-[20px] font-medium block mb-3">Service Lines</span>
      <div className="flex flex-wrap gap-2">
        {SERVICE_CATALOGUE.map((s) => {
          const on = selected.has(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              aria-pressed={on}
              className={`items-center inline-flex gap-1.5 px-3 py-1.5 rounded-full border text-[13px] leading-[18px] transition-colors ${
                on
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      {rows.length === 0 && (
        <p className="text-neutral-400 text-[12px] leading-[16px] mt-2">Select one or more service lines.</p>
      )}
    </div>
  );
}

/* ─── Service Lines display cell — chip-style, one per selected line (V8-A) ─ */
export function ServiceLinesCell({ serviceLines }: { serviceLines: ServiceLineAssignment[] }) {
  if (!serviceLines || serviceLines.length === 0) return <span className="text-neutral-400">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {serviceLines.map((s, i) => (
        <span key={i} className="items-center inline-flex bg-neutral-50 border border-neutral-200 text-neutral-700 text-[12px] leading-[16px] px-2 py-0.5 rounded-full font-medium">
          {s.serviceLine}
        </span>
      ))}
    </span>
  );
}

/* ─── Create Engagement Modal ────────────────────────────────────────────── */
export function CreateEngagementModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (d: EngagementDraft) => void }) {
  const [draft, setDraft] = useState<EngagementDraft>({ contractRef: "", serviceLines: [{ serviceLine: SERVICE_CATALOGUE[0].key, caseTypes: [] }], status: "Active", startDate: "", endDate: "" });
  const set = (k: keyof EngagementDraft) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));
  // V8-A — case types were removed from the engagement form; a row is valid on its service line alone.
  const valid = draft.contractRef.trim() && draft.startDate && draft.serviceLines.length > 0 && draft.serviceLines.every((s) => s.serviceLine);

  return (
    <Modal title="Create Engagement" onClose={onClose}>
      <div className="px-6 py-5 flex flex-col gap-5">
        <div>
          <Label>Contract Reference</Label>
          <Input value={draft.contractRef} onChange={set("contractRef")} placeholder="e.g. 09059" />
        </div>
        <ServiceLinesEditor rows={draft.serviceLines} onChange={(rows) => setDraft((d) => ({ ...d, serviceLines: rows }))} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={draft.startDate} onChange={set("startDate")} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={draft.endDate} onChange={set("endDate")} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 shrink-0">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-neutral-200 text-neutral-700 font-medium text-[14px] leading-[20px] rounded-lg hover:bg-neutral-50">Cancel</button>
        <button type="button" disabled={!valid} onClick={() => valid && onSubmit(draft)} className="px-4 py-2 bg-primary text-white font-medium text-[14px] leading-[20px] rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">Create Engagement</button>
      </div>
    </Modal>
  );
}

/* ─── Edit Engagement Modal ──────────────────────────────────────────────── */
export function EditEngagementModal({
  engagement, entities, onClose, onSubmit, onOpenEntity,
}: { engagement: Engagement; entities: LegalEntity[]; onClose: () => void; onSubmit: (d: EngagementDraft) => void; onOpenEntity?: (id: string) => void }) {
  const [draft, setDraft] = useState<EngagementDraft>({
    contractRef: engagement.contractRef,
    serviceLines: engagement.serviceLines.map((s) => ({ serviceLine: s.serviceLine, caseTypes: [...s.caseTypes] })),
    status: engagement.status,
    startDate: toInputDate(engagement.startDate),
    endDate: engagement.endDate ? toInputDate(engagement.endDate) : "",
  });
  const set = (k: keyof EngagementDraft) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const assignedEntities = entities.filter((e) => engagement.entityIds.includes(e.id));

  return (
    <Modal title="Edit Engagement" onClose={onClose}>
      <div className="px-6 py-5 flex flex-col gap-5">
        <div>
          <Label>Contract Reference</Label>
          <Input value={draft.contractRef} onChange={set("contractRef")} />
        </div>
        <ServiceLinesEditor rows={draft.serviceLines} onChange={(rows) => setDraft((d) => ({ ...d, serviceLines: rows }))} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={draft.startDate} onChange={set("startDate")} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={draft.endDate} onChange={set("endDate")} />
          </div>
        </div>
        <div>
          <Label>Assigned Legal Entities</Label>
          {assignedEntities.length === 0 ? (
            <p className="text-neutral-400 text-[14px] leading-[20px]">No legal entities assigned.</p>
          ) : (
            <div className="flex flex-col gap-1.5 mt-1">
              {assignedEntities.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => { onOpenEntity?.(e.id); onClose(); }}
                  className="items-center inline-flex gap-1.5 w-fit text-brand text-[14px] leading-[20px] hover:underline"
                >
                  {e.legalName}
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 shrink-0">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-neutral-200 text-neutral-700 font-medium text-[14px] leading-[20px] rounded-lg hover:bg-neutral-50">Cancel</button>
        <button type="button" onClick={() => onSubmit(draft)} className="px-4 py-2 bg-primary text-white font-medium text-[14px] leading-[20px] rounded-lg hover:opacity-90">Save Changes</button>
      </div>
    </Modal>
  );
}

/* ─── Disable Engagement Dialog ──────────────────────────────────────────── */
export function DisableEngagementDialog({ engagement, onCancel, onConfirm }: { engagement: Engagement; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[440px]">
        <div className="flex items-start gap-4 px-6 py-5">
          <div className="items-center flex justify-center w-10 h-10 rounded-full bg-red-50 shrink-0">
            <Ban className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h2 className="text-primary text-[18px] leading-[26px] mb-1" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Disable Engagement</h2>
            <p className="text-neutral-600 text-[14px] leading-[20px]">
              Are you sure you want to disable engagement <span className="font-sans font-semibold">{engagement.contractRef}</span>?
              It will remain visible with a Disabled status and can be re-enabled at any time.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-neutral-200 text-neutral-700 font-medium text-[14px] leading-[20px] rounded-lg hover:bg-neutral-50">Cancel</button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 bg-brand text-white font-medium text-[14px] leading-[20px] rounded-lg hover:opacity-90">Disable Engagement</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Re-enable Engagement Dialog ────────────────────────────────────────── */
export function ReenableEngagementDialog({ engagement, onCancel, onConfirm }: { engagement: Engagement; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[440px]">
        <div className="flex items-start gap-4 px-6 py-5">
          <div className="items-center flex justify-center w-10 h-10 rounded-full bg-emerald-50 shrink-0">
            <AlertTriangle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-primary text-[18px] leading-[26px] mb-1" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Re-enable Engagement</h2>
            <p className="text-neutral-600 text-[14px] leading-[20px]">
              Re-enable engagement <span className="font-sans font-semibold">{engagement.contractRef}</span>? It will be set back to Active.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-neutral-200 text-neutral-700 font-medium text-[14px] leading-[20px] rounded-lg hover:bg-neutral-50">Cancel</button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 bg-primary text-white font-medium text-[14px] leading-[20px] rounded-lg hover:opacity-90">Re-enable</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Engagement Modal (entity-level) ────────────────────────────────── */
export function AssignEngagementModal({
  available, onClose, onAssign,
}: { available: Engagement[]; onClose: () => void; onAssign: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <Modal title="Add Engagement to Legal Entity" onClose={onClose}>
      <div className="px-6 py-5 flex flex-col gap-4">
        <p className="text-neutral-600 text-[14px] leading-[20px]">
          Select one or more existing Organization engagements to connect to this Legal Entity.
        </p>
        {available.length === 0 ? (
          <div className="text-neutral-400 text-[14px] leading-[20px] py-6 text-center border border-neutral-200 rounded-lg">
            All organization engagements are already connected to this Legal Entity.
          </div>
        ) : (
          <div className="border border-neutral-200 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 text-left">
                  <th className="w-10 px-3 py-2.5" />
                  <th className="px-3 py-2.5 text-[13px]">Contract Reference</th>
                  <th className="px-3 py-2.5 text-[13px]">Status</th>
                  <th className="px-3 py-2.5 text-[13px]">Start Date</th>
                  <th className="px-3 py-2.5 text-[13px]">End Date</th>
                  <th className="px-3 py-2.5 text-[13px]">Service Line · Case Types</th>
                </tr>
              </thead>
              <tbody>
                {available.map((eng, i) => (
                  <tr
                    key={eng.id}
                    onClick={() => toggle(eng.id)}
                    className={`border-b border-neutral-100 last:border-0 cursor-pointer hover:bg-neutral-50 ${selected.has(eng.id) ? "bg-[rgba(200,16,46,0.04)]" : ""}`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(eng.id)}
                        onChange={() => toggle(eng.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 accent-[oklch(0.55_0.22_25)]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-neutral-900">{eng.contractRef}</span>
                    </td>
                    <td className="px-3 py-3"><EngagementStatusPill status={eng.status} /></td>
                    <td className="px-3 py-3 text-neutral-700">{eng.startDate}</td>
                    <td className="px-3 py-3 text-neutral-700">{eng.endDate ?? "—"}</td>
                    <td className="px-3 py-3 text-neutral-700"><ServiceLinesCell serviceLines={eng.serviceLines} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 shrink-0">
        <span className="text-neutral-500 text-[13px] leading-[18px]">{selected.size} selected</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-neutral-200 text-neutral-700 font-medium text-[14px] leading-[20px] rounded-lg hover:bg-neutral-50">Cancel</button>
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => onAssign([...selected])}
            className="px-4 py-2 bg-primary text-white font-medium text-[14px] leading-[20px] rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Selected Engagements
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Remove Engagement Dialog ───────────────────────────────────────────── */
export function RemoveAssignmentDialog({ engagement, entityName, onCancel, onConfirm }: { engagement: Engagement; entityName: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[440px]">
        <div className="flex items-start gap-4 px-6 py-5">
          <div className="items-center flex justify-center w-10 h-10 rounded-full bg-amber-50 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-primary text-[18px] leading-[26px] mb-1" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Remove Engagement</h2>
            <p className="text-neutral-600 text-[14px] leading-[20px]">
              This will remove the Engagement from this Legal Entity only. The Engagement will remain available at Organization level and may still be used by other Legal Entities.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-neutral-200 text-neutral-700 font-medium text-[14px] leading-[20px] rounded-lg hover:bg-neutral-50">Cancel</button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 bg-brand text-white font-medium text-[14px] leading-[20px] rounded-lg hover:opacity-90">Remove Engagement</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Connect Legal Entity to Engagement Modal ───────────────────────────── */
export function ConnectEntityModal({
  engagement, entities, onClose, onConnect,
}: { engagement: Engagement; entities: LegalEntity[]; onClose: () => void; onConnect: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const available = entities.filter((e) => !engagement.entityIds.includes(e.id));
  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <Modal title="Add Legal Entity to Engagement" onClose={onClose}>
      <div className="px-6 py-5 flex flex-col gap-4">
        <p className="text-neutral-600 text-[14px] leading-[20px]">
          Connect one or more Legal Entities from this Organization to engagement <span className="font-sans font-semibold">{engagement.contractRef}</span>.
        </p>
        {available.length === 0 ? (
          <div className="text-neutral-400 text-[14px] leading-[20px] py-6 text-center border border-neutral-200 rounded-lg">
            All legal entities in this organization are already connected to this engagement.
          </div>
        ) : (
          <div className="border border-neutral-200 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[720px] text-[14px] leading-[20px]">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 text-left">
                  <th className="w-10 px-3 py-2.5" />
                  <th className="px-3 py-2.5 text-[13px]">Legal Entity</th>
                  <th className="px-3 py-2.5 text-[13px]">Legal Form</th>
                  <th className="px-3 py-2.5 text-[13px]">Jurisdiction</th>
                  <th className="px-3 py-2.5 text-[13px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {available.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => toggle(e.id)}
                    className={`border-b border-neutral-100 last:border-0 cursor-pointer hover:bg-neutral-50 ${selected.has(e.id) ? "bg-[rgba(200,16,46,0.04)]" : ""}`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(e.id)}
                        onChange={() => toggle(e.id)}
                        onClick={(ev) => ev.stopPropagation()}
                        className="w-4 h-4 accent-[oklch(0.55_0.22_25)]"
                      />
                    </td>
                    <td className="px-3 py-3 text-neutral-900">{e.legalName}</td>
                    <td className="px-3 py-3 text-neutral-700">{e.legalForm}</td>
                    <td className="px-3 py-3 text-neutral-700">{e.jurisdiction ?? e.country}</td>
                    <td className="px-3 py-3 text-neutral-700">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 shrink-0">
        <span className="text-neutral-500 text-[13px] leading-[18px]">{selected.size} selected</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-neutral-200 text-neutral-700 font-medium text-[14px] leading-[20px] rounded-lg hover:bg-neutral-50">Cancel</button>
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => onConnect([...selected])}
            className="px-4 py-2 bg-primary text-white font-medium text-[14px] leading-[20px] rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Selected Legal Entities
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Shared status pill ─────────────────────────────────────────────────── */
export function EngagementStatusPill({ status }: { status: EngagementStatus }) {
  const tone: Record<EngagementStatus, "orange" | "green" | "gray"> = {
    Draft: "orange",
    Active: "green",
    Expired: "gray",
    Disabled: "gray",
  };
  return <Badge tone={tone[status] ?? "gray"} size="sm">{status}</Badge>;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function toInputDate(ddmmyyyy: string): string {
  // Convert dd/mm/yyyy → yyyy-mm-dd for <input type="date">
  const parts = ddmmyyyy.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}
