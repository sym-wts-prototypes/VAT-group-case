import { Eye, File, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DRAFT_REQUIREMENT_LIST } from '@/config/sampleData'
import {
  draftToolbarActionsForRole,
  type DraftToolbarAction,
} from '@/lib/draftRequirementsToolbar'
import { cn } from '@/lib/cn'
import type { Role } from '@/types'

interface DraftRequirementsToolbarProps {
  role: Role
  className?: string
}

const ACTION_CONFIG: Record<
  DraftToolbarAction,
  {
    label: string
    variant: 'secondary' | 'outline'
    icon: typeof File
  }
> = {
  import: { label: 'Import from file', variant: 'secondary', icon: File },
  add: { label: 'Create new', variant: 'secondary', icon: Plus },
  requestReview: {
    label: 'Request review',
    variant: 'outline',
    icon: Eye,
  },
}

/** Pro Blocks / Section Header / 2. — Figma 8720:17235. */
export function DraftRequirementsToolbar({
  role,
  className,
}: DraftRequirementsToolbarProps) {
  const actions = draftToolbarActionsForRole(role)

  return (
    <div
      className={cn(
        'flex flex-col gap-0 px-6 pb-6',
        className,
      )}
    >
      <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="font-display text-xl font-semibold leading-7 text-foreground">
            {DRAFT_REQUIREMENT_LIST.title}
          </h2>
          <p className="text-sm leading-5 text-muted-foreground">
            {DRAFT_REQUIREMENT_LIST.subtitle}
          </p>
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {actions.map((action) => {
              const { label, variant, icon: Icon } = ACTION_CONFIG[action]
              return (
                <Button
                  key={action}
                  variant={variant}
                  size="default"
                  className="h-9 gap-2 rounded-md px-4 shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
