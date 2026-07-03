import React from "react";
import { Construction } from "lucide-react";
import { Role } from "./role-switcher";

export function PlaceholderView({ role }: { role: Role }) {
  return (
    <div>
      <div className="border-b flex flex-col bg-neutral-50 border-neutral-200 gap-1.5 p-6">
        <span className="block font-semibold text-neutral-950 text-[14px] leading-[20px]">Organizations</span>
        <h1 className="font-medium text-[30px] leading-[36px]" style={{ fontFamily: '"Cera Pro", sans-serif' }}>
          Organizations
        </h1>
        <p className="text-neutral-600 text-[14px] leading-[20px]">{role} experience</p>
      </div>
      <div className="flex flex-col items-center justify-center text-center gap-4 px-6 py-28">
        <div className="items-center flex justify-center w-20 h-20 rounded-full bg-neutral-50 border border-neutral-200">
          <Construction className="w-8 h-8 text-neutral-300" />
        </div>
        <div className="flex flex-col gap-1.5 max-w-[440px]">
          <h2 className="font-medium text-[20px] leading-[26px]" style={{ fontFamily: '"Cera Pro", sans-serif' }}>
            {role} view coming soon
          </h2>
          <p className="text-neutral-500 text-[14px] leading-[20px]">
            This prototype currently focuses on the Super Admin experience. The {role} role context is reserved for a
            future screen variant. Switch back to <span className="font-medium text-neutral-700">Super Admin</span> to
            explore the full flow.
          </p>
        </div>
      </div>
    </div>
  );
}
