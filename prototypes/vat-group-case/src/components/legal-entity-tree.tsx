import { ArrowLeft, Plus, Building2, CornerDownRight } from "lucide-react";
import { LegalEntity } from "./org-details-data";
import { Organization } from "./organizations-data";

export function LegalEntityTree({
  org,
  entities,
  selectedId,
  onSelect,
  onBack,
  onAdd,
}: {
  org: Organization;
  entities: LegalEntity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  onAdd: () => void;
}) {
  const hqs = entities.filter((e) => e.type === "HQ" || !e.parentId);
  const childrenOf = (id: string) => entities.filter((e) => e.parentId === id);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-neutral-200 px-4 py-4 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="items-center flex gap-1.5 text-brand font-medium text-[14px] leading-[20px] hover:opacity-80"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="mt-3 text-primary text-[22px] leading-[28px] truncate" style={{ fontFamily: '"Cera Pro", sans-serif', fontWeight: 700 }}>
          {org.name}
        </h2>
        <p className="text-neutral-400 text-[12px] leading-[16px] mt-0.5 uppercase tracking-wide">Legal entities</p>
      </div>

      <div className="flex flex-col grow overflow-auto p-3 gap-0.5">
        {entities.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-2 py-10 px-2">
            <Building2 className="w-7 h-7 text-neutral-300" />
            <p className="text-neutral-500 text-[13px] leading-[18px]">No legal entities yet.</p>
          </div>
        ) : (
          hqs.map((hq) => (
            <div key={hq.id} className="flex flex-col">
              <TreeRow entity={hq} selected={selectedId === hq.id} onSelect={onSelect} />
              {childrenOf(hq.id).map((child) => (
                <TreeRow key={child.id} entity={child} selected={selectedId === child.id} onSelect={onSelect} child />
              ))}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-neutral-200 p-3 shrink-0">
        <button
          type="button"
          onClick={onAdd}
          className="items-center flex justify-center gap-2 w-full border border-dashed border-neutral-300 text-neutral-700 font-medium text-[14px] leading-[20px] px-3 py-2 rounded-lg hover:bg-neutral-50 hover:border-neutral-400"
        >
          <Plus className="w-4 h-4" /> Add Legal Entity
        </button>
      </div>
    </div>
  );
}

function TreeRow({
  entity,
  selected,
  onSelect,
  child,
}: {
  entity: LegalEntity;
  selected: boolean;
  onSelect: (id: string) => void;
  child?: boolean;
}) {
  const disabled = entity.status === "Disabled";
  return (
    <button
      type="button"
      onClick={() => onSelect(entity.id)}
      className={`items-center flex gap-2 text-left text-[14px] leading-[20px] rounded-md py-2 pr-2.5 ${
        child ? "pl-7" : "pl-2.5"
      } ${
        selected
          ? "bg-[rgba(200,16,46,0.1)] text-brand font-medium"
          : "text-neutral-700 hover:bg-neutral-100"
      } ${disabled ? "opacity-50" : ""}`}
    >
      {child ? (
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
