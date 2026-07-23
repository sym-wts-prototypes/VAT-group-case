import { History } from "lucide-react";
import { ConfirmDialog } from "@wts/ui";
import { LegalEntity } from "./org-details-data";
import { ModalShell } from "./legal-entity-modal";

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
    <ConfirmDialog
      overlayClassName="bg-background/40 backdrop-blur-sm"
      open
      onOpenChange={(open) => !open && onCancel()}
      onConfirm={onConfirm}
      title="Disable legal entity?"
      description={
        <>
          Disabling{" "}
          <span className="font-semibold text-foreground">{entity.legalName}</span> hides it from
          standard users while preserving all historical data, engagements, and users. It remains
          visible to Super Admins and can be re-enabled later.
        </>
      }
      confirmLabel="Disable legal entity"
    />
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
