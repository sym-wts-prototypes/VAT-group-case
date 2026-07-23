import React, { useEffect, useRef, useState } from "react";
import { ChevronsUpDown, Check, ShieldCheck, Building, Briefcase, User } from "lucide-react";

// Demo lens — maps 1:1 to the platform UserRole hierarchy (Change 3). Switching the lens
// re-renders the workspace under that role's enforced permission boundaries.
export type Role = "Super Admin" | "Organisation Admin" | "Engagement Admin" | "Contributor";

const ROLES: { value: Role; icon: React.ReactNode; hint: string }[] = [
  { value: "Super Admin", icon: <ShieldCheck className="w-4 h-4" />, hint: "Platform — org setup & admins" },
  { value: "Organisation Admin", icon: <Building className="w-4 h-4" />, hint: "Entities & engagements" },
  { value: "Engagement Admin", icon: <Briefcase className="w-4 h-4" />, hint: "Engagement detail only" },
  { value: "Contributor", icon: <User className="w-4 h-4" />, hint: "Cases they're attached to" },
];

export function RoleSwitcher({
  role,
  onChange,
  collapsed,
}: {
  role: Role;
  onChange: (r: Role) => void;
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const active = ROLES.find((r) => r.value === role)!;

  if (collapsed) {
    return (
      <div ref={ref} className="relative flex justify-center">
        <button
          type="button"
          title={`Prototype role: ${active.value}`}
          onClick={() => setOpen((o) => !o)}
          className="items-center flex justify-center w-9 h-9 border border-neutral-200 bg-white hover:bg-neutral-50 rounded-lg text-brand"
        >
          {active.icon}
        </button>
        {open && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden p-1">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => { onChange(r.value); setOpen(false); }}
                className="items-center flex justify-between w-full gap-2 text-left hover:bg-neutral-50 px-2 py-2 rounded-md"
              >
                <span className="items-center flex gap-2">
                  <span className="text-neutral-500">{r.icon}</span>
                  <span className="text-[13px] leading-[18px] font-medium text-neutral-900">{r.value}</span>
                </span>
                {r.value === role && <Check className="w-4 h-4 text-brand shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative px-2 pb-2">
      <span className="block text-neutral-400 text-[11px] leading-[16px] uppercase tracking-wide px-1 pb-1.5">
        Prototype role
      </span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="items-center flex justify-between w-full gap-2 border border-neutral-200 bg-white hover:bg-neutral-50 text-left text-[13px] leading-[18px] px-2.5 py-2 rounded-lg"
      >
        <span className="items-center flex gap-2 min-w-0">
          <span className="text-brand">{active.icon}</span>
          <span className="truncate font-medium text-neutral-900">{active.value}</span>
        </span>
        <ChevronsUpDown className="w-4 h-4 text-neutral-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-2 right-2 mt-1 z-50 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden p-1">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                onChange(r.value);
                setOpen(false);
              }}
              className="items-center flex justify-between w-full gap-2 text-left hover:bg-neutral-50 px-2 py-2 rounded-md"
            >
              <span className="items-center flex gap-2">
                <span className="text-neutral-500">{r.icon}</span>
                <span className="flex flex-col">
                  <span className="text-[13px] leading-[18px] font-medium text-neutral-900">{r.value}</span>
                  <span className="text-[11px] leading-[14px] text-neutral-400">{r.hint}</span>
                </span>
              </span>
              {r.value === role && <Check className="w-4 h-4 text-brand shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
