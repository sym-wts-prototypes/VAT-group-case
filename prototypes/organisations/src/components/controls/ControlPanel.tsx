import { ShieldCheck, Building, Briefcase, User } from 'lucide-react'
import { cn } from '@wts/ui'

import { useOrgStore } from '@/store/useOrgStore'
import type { Role } from '../role-switcher'

const ROLES: { value: Role; icon: React.ReactNode; description: string }[] = [
  { value: 'Super Admin', icon: <ShieldCheck className="w-4 h-4" />, description: 'Platform — creates organisations and links admins. Full CRUD in the prototype.' },
  { value: 'Organisation Admin', icon: <Building className="w-4 h-4" />, description: 'Creates legal entities, manages users at organisation and entity level.' },
  { value: 'Engagement Admin', icon: <Briefcase className="w-4 h-4" />, description: 'Creates engagements, adds engagement users, connects engagements to entities.' },
  { value: 'Contributor', icon: <User className="w-4 h-4" />, description: 'Works only on cases they are attached to. No structural changes.' },
]

/**
 * Playground Controls for the Organisations prototype. The role selector is a
 * stack of buttons (one per role) rather than a dropdown, so all four lenses
 * are visible at a glance and switching is a single click.
 */
export function ControlPanel() {
  const role = useOrgStore((state) => state.role)
  const setRole = useOrgStore((state) => state.setRole)
  const description = ROLES.find((r) => r.value === role)?.description

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Controls</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Role drives which workspace is rendered and which actions are enabled.
          Each lens enforces its own capability boundary.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Prototype role
        </span>
        <div className="flex flex-col gap-1.5">
          {ROLES.map((r) => {
            const active = role === r.value
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                aria-pressed={active}
                className={cn(
                  'items-center flex gap-2 w-full text-left text-[13px] leading-[18px] px-3 py-2 rounded-lg border transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-muted',
                )}
              >
                <span className={active ? 'text-primary-foreground' : 'text-muted-foreground'}>{r.icon}</span>
                <span className="font-medium">{r.value}</span>
              </button>
            )
          })}
        </div>
        {description && (
          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
