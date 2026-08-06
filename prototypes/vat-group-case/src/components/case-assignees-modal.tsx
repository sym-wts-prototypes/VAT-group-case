import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@wts/ui'

import type { AssignedPeopleData } from './assigned-people'
import { usersForOrg } from './org-details-data'
import { SelectableUser, UserSelect } from './user-select'

// "Edit assignees" modal for a single case (Parent or Child) — adapted from the VAT Scheduler's
// per-legal-entity role assignment row (vat-scheduler-modal.tsx), but standalone (one case at a
// time, not a whole group's list) and case-centric rather than entity-centric: people are
// assigned/deassigned from a CASE here, so the row names the case, not the legal entity it
// happens to belong to. No Client Approval switcher — that's a scheduling-time concern, not an
// assignee-editing one.

interface RoleAssignees {
  creators: string[]
  reviewers: string[]
  partners: string[]
  clients: string[]
}
const EMPTY_ASSIGNEES: RoleAssignees = { creators: [], reviewers: [], partners: [], clients: [] }

// Same rule as the VAT Scheduler's per-entity role assignment (vat-scheduler-modal.tsx) —
// Creator/Reviewer/Client are mandatory (>=1 person each); Partner is the only optional role.
function hasMandatoryRoles(a: RoleAssignees): boolean {
  return a.creators.length >= 1 && a.reviewers.length >= 1 && a.clients.length >= 1
}

function peopleDataToAssignees(people: AssignedPeopleData, pool: SelectableUser[]): RoleAssignees {
  const idByEmail = new Map(pool.map((u) => [u.email, u.id]))
  const idsFor = (role: keyof AssignedPeopleData) =>
    (people[role] ?? []).map((p) => idByEmail.get(p.email)).filter((id): id is string => !!id)
  return {
    creators: idsFor('creator'),
    reviewers: idsFor('reviewer'),
    partners: idsFor('partner'),
    clients: idsFor('client'),
  }
}

function assigneesToPeopleData(assignees: RoleAssignees, pool: SelectableUser[]): AssignedPeopleData {
  const byId = new Map(pool.map((u) => [u.id, u]))
  const peopleFor = (ids: string[]) =>
    ids.map((id) => byId.get(id)).filter((u): u is SelectableUser => !!u).map((u) => ({ name: u.name, email: u.email }))
  return {
    creator: peopleFor(assignees.creators),
    reviewer: peopleFor(assignees.reviewers),
    partner: peopleFor(assignees.partners),
    client: peopleFor(assignees.clients),
  }
}

export interface CaseAssigneesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The case's own name (not the legal entity's) — this modal assigns people to a case. */
  caseName: string
  /** e.g. a "Representative" badge next to the case name, when relevant. */
  badge?: React.ReactNode
  /** Limits every role picker to this organisation's own users. */
  orgId: string
  people: AssignedPeopleData
  onSave: (people: AssignedPeopleData) => void
}

export function CaseAssigneesModal({
  open,
  onOpenChange,
  caseName,
  badge,
  orgId,
  people,
  onSave,
}: CaseAssigneesModalProps) {
  const peoplePool: SelectableUser[] = useMemo(() => usersForOrg(orgId), [orgId])
  const [assignees, setAssignees] = useState<RoleAssignees>(EMPTY_ASSIGNEES)

  // Re-seed from the case's current assignees each time the modal opens — edits made and saved
  // previously are reflected back here (`people` comes from the caller's own state), not reset.
  useEffect(() => {
    if (open) setAssignees(peopleDataToAssignees(people, peoplePool))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const update = (patch: Partial<RoleAssignees>) => setAssignees((prev) => ({ ...prev, ...patch }))

  const rolesMissing = !hasMandatoryRoles(assignees)

  const handleSave = () => {
    if (rolesMissing) return
    onSave(assigneesToPeopleData(assignees, peoplePool))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName="bg-background/40 backdrop-blur-sm" className="flex max-w-[640px] flex-col gap-0 p-0">
        <DialogHeader className="gap-1.5 border-b border-border px-6 py-5">
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            {caseName}
            {badge}
          </DialogTitle>
          <DialogDescription>Assign the people who will work on this case.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Creator</Label>
            <UserSelect
              multiple
              users={peoplePool.filter((u) => !assignees.reviewers.includes(u.id))}
              value={assignees.creators}
              onChange={(ids) => update({ creators: ids })}
              data-testid="case-assignees-creator"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Reviewer</Label>
            <UserSelect
              multiple
              users={peoplePool.filter((u) => !assignees.creators.includes(u.id))}
              value={assignees.reviewers}
              onChange={(ids) => update({ reviewers: ids })}
              data-testid="case-assignees-reviewer"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">
              Partner <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <UserSelect
              multiple
              users={peoplePool}
              value={assignees.partners}
              onChange={(ids) => update({ partners: ids })}
              data-testid="case-assignees-partner"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Client</Label>
            <UserSelect
              multiple
              users={peoplePool}
              value={assignees.clients}
              onChange={(ids) => update({ clients: ids })}
              data-testid="case-assignees-client"
            />
          </div>
        </div>

        {rolesMissing && (
          <p className="px-6 pb-4 text-amber-600 text-xs">
            Creator, Reviewer and Client each need at least one assignee.
          </p>
        )}

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={rolesMissing}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
