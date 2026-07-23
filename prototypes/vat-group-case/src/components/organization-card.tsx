import { MoreVertical, Pencil, Ban, RotateCcw } from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
  cn,
} from '@wts/ui'

import { Organization } from './organizations-data'

export function OrganizationCard({
  org,
  onView,
  onEdit,
  onDisable,
  onEnable,
  showActions = true,
}: {
  org: Organization
  onView: (o: Organization) => void
  onEdit: (o: Organization) => void
  onDisable: (o: Organization) => void
  onEnable: (o: Organization) => void
  showActions?: boolean
}) {
  const disabled = org.status === 'Disabled'

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView(org)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onView(org)
        }
      }}
      className={cn(
        'group relative flex cursor-pointer flex-col gap-4 p-6 transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-12">
            {org.logoUrl ? <AvatarImage src={org.logoUrl} alt={org.name} /> : null}
            <AvatarFallback
              className={cn(
                'text-sm font-semibold',
                disabled
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary text-primary-foreground',
              )}
            >
              {org.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="truncate font-display text-xl font-bold leading-tight text-foreground">
              {org.name}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {disabled && (
                <Badge tone="gray" size="sm">
                  Disabled
                </Badge>
              )}
              {org.tags.map((tag) => (
                <Badge key={tag} tone="gray" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {showActions && (
          <div onClick={(e) => e.stopPropagation()}>
            {/* modal={false} — the Disable item opens a ConfirmDialog; avoids Radix leaving
                `pointer-events: none` on <body> when menu-close races dialog-open. */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Organization actions"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onSelect={() => onEdit(org)}
                  className="gap-2"
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                {disabled ? (
                  <DropdownMenuItem
                    onSelect={() => onEnable(org)}
                    className="gap-2"
                  >
                    <RotateCcw className="size-4" />
                    Re-enable Organization
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => onDisable(org)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Ban className="size-4" />
                    Disable Organization
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {org.legalEntities} Legal {org.legalEntities === 1 ? 'entity' : 'entities'} ·{' '}
        {org.activeEngagements} Active {org.activeEngagements === 1 ? 'case' : 'cases'}
      </p>
    </Card>
  )
}
