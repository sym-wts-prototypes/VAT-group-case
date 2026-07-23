import { ChevronDown, PencilLine } from 'lucide-react'

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@wts/ui'
import type { Role } from '@/types'

// Layout replicated from reference/wts-platform's `feat/multi_creator_reviewer` branch
// (prototypes/case-header/src/headers/Header4.tsx) — collapsed avatar stack, click-to-open
// popover with one column per role, role-tinted avatars. Only the layout is taken from there;
// this file's data model, dedup helpers, and edit-affordance wiring are written fresh.

export interface AssignedPerson {
  name: string
  email: string
}

/** Role -> the people assigned to it. A role with no one assigned is simply omitted/empty. */
export type AssignedPeopleData = Partial<Record<Role, AssignedPerson[]>>

const ROLE_ORDER: Role[] = ['creator', 'reviewer', 'partner', 'client']

const ROLE_LABEL: Record<Role, string> = {
  creator: 'Creator',
  reviewer: 'Reviewer',
  partner: 'Partner',
  client: 'Client',
}

// Segment 1 — distinct, non-semantic tint per role (hue carries no meaning; it's an identifier,
// not a status color), matching reference/wts-platform's avatar-colours.md derivation.
export const ROLE_AVATAR_CLASS: Record<Role, string> = {
  creator: 'bg-[#E4F0EE] text-[#134E4A]',
  reviewer: 'bg-[#EEE9F2] text-[#581C87]',
  partner: 'bg-[#E4EDF2] text-[#0C4A6E]',
  client: 'bg-[#F2EEDF] text-[#78350F]',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

interface UniquePerson {
  person: AssignedPerson
  role: Role
}

/** Every assigned person once, in first-seen role order — someone assigned to more than one
 * role (e.g. Reviewer and Partner) shows a single avatar, tinted by their first role. */
function uniquePeople(people: AssignedPeopleData): UniquePerson[] {
  const seen = new Set<string>()
  const out: UniquePerson[] = []
  for (const role of ROLE_ORDER) {
    for (const person of people[role] ?? []) {
      if (seen.has(person.name)) continue
      seen.add(person.name)
      out.push({ person, role })
    }
  }
  return out
}

const MAX_VISIBLE = 10

function PersonAvatar({ person, role }: { person: AssignedPerson; role: Role }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className="h-8 w-8">
          <AvatarFallback className={cn('text-xs font-medium', ROLE_AVATAR_CLASS[role])}>
            {initials(person.name)}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col">
          <span className="font-medium">{person.name}</span>
          <span className="text-xs opacity-80">{person.email}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export interface AssignedPeopleProps {
  people: AssignedPeopleData
  /** Creator/Reviewer can edit assignees; everyone else is view-only (see AGENTS-task Segment
   * 0 research — the reference's own edit drawer has no working save-back-to-header flow, so
   * this is a placeholder action for now, not a real add/remove). */
  editable?: boolean
  /** Explains the Edit action's scope, e.g. the Parent Case's edit-propagation rules. */
  editTooltip?: string
  onEdit?: () => void
  className?: string
}

export function AssignedPeople({ people, editable, editTooltip, onEdit, className }: AssignedPeopleProps) {
  const unique = uniquePeople(people)
  if (unique.length === 0 && !editable) return null

  const visible = unique.slice(0, MAX_VISIBLE)
  const overflow = unique.slice(MAX_VISIBLE)

  const editButton = (
    <Button type="button" variant="outline" size="sm" onClick={onEdit}>
      <PencilLine className="size-4" />
      Edit
    </Button>
  )

  return (
    <TooltipProvider>
      <Popover>
        <div className={className}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-1.5 py-1"
            >
              <AvatarGroup>
                {visible.map(({ person, role }) => (
                  <PersonAvatar key={person.name} person={person} role={role} />
                ))}
                {overflow.length > 0 && <AvatarGroupCount count={overflow.length} />}
              </AvatarGroup>
              <span className="pl-1 text-sm text-muted-foreground">{unique.length} people</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
        </div>
        {/* Prevents Radix from auto-focusing the Edit button when the popover opens — without
            this, the Edit button's own Tooltip (see below) shows immediately via focus, as an
            unprompted floating text box rather than only on hover.
            align="start" anchors the panel's left edge to the trigger's left edge, whether it
            opens above or below (Radix keeps align fixed across a side flip). The four role
            columns stay in a single row at a fixed, capped width — wrapping to a second row or
            growing to fit long names/emails would make the panel wide enough that Radix's
            collision-avoidance shifts the whole panel away from that left anchor to stay
            on-screen. overflow-x-auto is the fallback for whatever still doesn't fit (a cramped
            corner of the viewport) — it scrolls instead of shifting the anchor or clipping
            content outright. */}
        <PopoverContent
          align="start"
          className="w-auto max-w-[92vw] p-4"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex max-w-[680px] flex-nowrap gap-x-6 overflow-x-auto pb-1">
            {ROLE_ORDER.map((role) => {
              const rolePeople = people[role] ?? []
              return (
                <div key={role} className="flex w-[152px] shrink-0 flex-col gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {ROLE_LABEL[role]}
                  </span>
                  {rolePeople.length === 0 ? (
                    <span className="text-sm text-muted-foreground">—</span>
                  ) : (
                    rolePeople.map((person) => (
                      <div key={person.name} className="flex items-center gap-2.5">
                        <PersonAvatar person={person} role={role} />
                        <div className="flex min-w-0 flex-col leading-tight">
                          <span className="truncate text-sm font-medium text-foreground">
                            {person.name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {person.email}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
          {editable && (
            <div className="mt-4 flex justify-end border-t border-border pt-3">
              {editTooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>{editButton}</TooltipTrigger>
                  <TooltipContent className="max-w-xs">{editTooltip}</TooltipContent>
                </Tooltip>
              ) : (
                editButton
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}

// Adapts the legacy flat-name `PeopleRow` shape (single string | string[] per role, no email)
// into `AssignedPeopleData`, synthesizing a plausible email per person. Used as a fallback so
// generic demo headers that haven't been given real org-sourced data still render correctly.
export function adaptLegacyPeople(
  people: Partial<Record<Role, string | string[] | undefined>> | undefined,
  domain = 'wts.com',
): AssignedPeopleData {
  if (!people) return {}
  const out: AssignedPeopleData = {}
  for (const role of ROLE_ORDER) {
    const value = people[role]
    if (!value) continue
    const names = Array.isArray(value) ? value : [value]
    out[role] = names.map((name) => ({
      name,
      email: `${name.trim().toLowerCase().replace(/\s+/g, '.')}@${domain}`,
    }))
  }
  return out
}

export { ROLE_LABEL, ROLE_ORDER }
