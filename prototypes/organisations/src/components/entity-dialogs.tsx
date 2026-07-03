import React from "react";
import { AlertTriangle, History } from "lucide-react";
import { LegalEntity } from "./org-details-data";
import { ModalShell, secondaryBtn } from "./legal-entity-modal";

export function DisableEntityDialog({
  entity,
  onCancel,
  onConfirm,
}: {
  entity: LegalEntity;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-[440px] bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-4">
        <div className="items-start flex gap-3">
          <div className="items-center flex justify-center w-10 h-10 rounded-full bg-red-50 text-brand shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[18px] leading-[24px]" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>Disable Legal Entity</h2>
            <p className="text-[14px] leading-[20px] text-neutral-600">
              Disabling <span className="font-medium text-neutral-900">{entity.legalName}</span> hides it from standard
              users while preserving all historical data, engagements, and users. It remains visible to Super Admins and
              can be re-enabled later.
            </p>
          </div>
        </div>
        <div className="items-center flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className={secondaryBtn}>Cancel</button>
          <button type="button" onClick={onConfirm} className="bg-brand text-white font-medium text-[14px] leading-[20px] px-4 py-2 rounded-lg hover:opacity-90">
            Disable Legal Entity
          </button>
        </div>
      </div>
    </div>
  );
}

const HISTORY = [
  { actor: "Super Admin", action: "Updated VAT ID", date: "2026-05-28 14:21" },
  { actor: "Sarah Klein", action: "Added engagement 11204", date: "2026-04-15 09:03" },
  { actor: "Markus Weber", action: "Invited user sofia.rossi@europipe.com", date: "2026-02-03 11:47" },
  { actor: "System", action: "Legal entity created", date: "2025-09-04 16:30" },
];

export function HistoryDialog({ entity, onClose }: { entity: LegalEntity; onClose: () => void }) {
  return (
    <ModalShell title={`History — ${entity.legalName}`} onClose={onClose} width="520px">
      <ol className="flex flex-col">
        {HISTORY.map((h, i) => (
          <li key={i} className="flex gap-3 pb-5 last:pb-0 relative">
            <div className="flex flex-col items-center">
              <div className="items-center flex justify-center w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 shrink-0">
                <History className="w-4 h-4" />
              </div>
              {i < HISTORY.length - 1 && <span className="w-px grow bg-neutral-200 mt-1" />}
            </div>
            <div className="flex flex-col pb-1">
              <span className="text-neutral-900 text-[14px] leading-[20px] font-medium">{h.action}</span>
              <span className="text-neutral-500 text-[13px] leading-[18px]">{h.actor} · {h.date}</span>
            </div>
          </li>
        ))}
      </ol>
    </ModalShell>
  );
}
