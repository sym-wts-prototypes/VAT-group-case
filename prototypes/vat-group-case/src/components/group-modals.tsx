import { useEffect, useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@wts/ui'

import { LegalEntity, OrgUser } from './org-details-data'
import {
  COUNTRIES,
  GROUP_TYPES,
  DISABLED_GROUP_TYPES,
  Group,
  GroupType,
  membershipStatus,
  today,
} from './org-details-data'
import { UserSelect } from './user-select'

// V10-G — only VAT + CIT remain; CIT reuses the violet tone that used to be Income tax.
const groupTypeTone = (t: GroupType) => (t === 'VAT' ? 'blue' : 'violet')

export interface CreateGroupMemberDraft {
  entityId: string
  validFrom: string
  validTo: string | null
}

export interface CreateGroupDraft {
  name: string
  type: GroupType
  jurisdiction: string
  members: CreateGroupMemberDraft[]
  representativeId: string
}

/* ─── Create Group ───────────────────────────────────────────────────────── */

export function CreateGroupModal({
  orgId,
  entities,
  groups,
  prefill,
  onClose,
  onCreate,
  onViewGroup,
}: {
  orgId: string
  entities: LegalEntity[]
  groups: Group[]
  prefill?: { type?: GroupType; jurisdiction?: string; memberEntityId?: string }
  onClose: () => void
  onCreate: (draft: CreateGroupDraft) => void
  onViewGroup: (groupId: string) => void
}) {
  // V10-G — CIT is a disabled chip in the picker; the initial default falls back to the
  // first enabled type when CIT would have been chosen by prefill.
  const enabledTypes = GROUP_TYPES.filter((t) => !DISABLED_GROUP_TYPES.includes(t))
  const initialType: GroupType = (prefill?.type && !DISABLED_GROUP_TYPES.includes(prefill.type)) ? prefill.type : (enabledTypes[0] ?? 'VAT')
  const [type, setType] = useState<GroupType>(initialType)
  const [jurisdiction, setJurisdiction] = useState(prefill?.jurisdiction ?? 'Germany')
  const [members, setMembers] = useState<CreateGroupMemberDraft[]>(
    prefill?.memberEntityId ? [{ entityId: prefill.memberEntityId, validFrom: today(), validTo: null }] : [],
  )
  const selected = members.map((m) => m.entityId)
  const [repId, setRepId] = useState<string>(prefill?.memberEntityId ?? '')
  // V10-E — group name is pre-filled from the representative's legal name and stays in
  // lockstep until the user hand-edits it. Once edited, we stop overwriting on rep change.
  const [name, setName] = useState('')
  const [nameEdited, setNameEdited] = useState(false)

  const orgEntities = useMemo(() => entities.filter((e) => e.orgId === orgId), [entities, orgId])

  // Auto-fill name from the representative until the user takes over.
  useEffect(() => {
    if (nameEdited) return
    const rep = orgEntities.find((e) => e.id === repId)
    setName(rep ? rep.legalName : '')
  }, [repId, nameEdited, orgEntities])

  // Parallel same-type + jurisdiction groups (rule 3) — informational only.
  const duplicates = groups.filter((g) => g.orgId === orgId && g.type === type && g.jurisdiction === jurisdiction)

  const toggleMember = (id: string) => {
    setMembers((prev) => {
      const exists = prev.some((m) => m.entityId === id)
      const next = exists
        ? prev.filter((m) => m.entityId !== id)
        : [...prev, { entityId: id, validFrom: today(), validTo: null }]
      if (next.length === 1) setRepId(next[0].entityId)
      else if (!next.some((m) => m.entityId === repId)) setRepId('')
      return next
    })
  }

  const updateMember = (id: string, patch: Partial<CreateGroupMemberDraft>) =>
    setMembers((prev) => prev.map((m) => (m.entityId === id ? { ...m, ...patch } : m)))

  const canCreate =
    !!name.trim() &&
    members.length >= 1 &&
    members.every((m) => !!m.validFrom) &&
    !!repId &&
    selected.includes(repId)

  const submit = () => {
    if (!canCreate) return
    onCreate({
      name: name.trim(),
      type,
      jurisdiction,
      members,
      representativeId: repId,
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent overlayClassName="bg-background/40 backdrop-blur-sm" className="max-h-[90vh] max-w-[560px] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">Create Group</DialogTitle>
          <DialogDescription>
            Set each member's active-from date and an optional active-to date.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* V10-F/G — type as chip picker; CIT chip disabled per DISABLED_GROUP_TYPES. */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Type</Label>
            <div className="flex flex-wrap gap-2">
              {GROUP_TYPES.map((t) => {
                const disabled = DISABLED_GROUP_TYPES.includes(t)
                const on = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setType(t)}
                    aria-pressed={on}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] leading-[18px] transition-colors',
                      on
                        ? 'bg-primary text-white border-primary'
                        : disabled
                          ? 'bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50',
                    )}
                    title={disabled ? 'Coming soon' : undefined}
                  >
                    {t}
                    {disabled && <span className="text-[11px] text-neutral-400">· soon</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Jurisdiction</Label>
            <Select value={jurisdiction} onValueChange={setJurisdiction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Group name</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameEdited(true)
              }}
              placeholder="Pick a representative to auto-fill…"
            />
            {!nameEdited && repId && (
              <p className="text-[12px] leading-4 text-neutral-400">
                Pre-filled from the representative — edit to override.
              </p>
            )}
          </div>

          {duplicates.length > 0 && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-[13px] leading-[18px] text-sky-900">
              A {type} group already exists for {jurisdiction}:{' '}
              {duplicates.map((g, i) => (
                <span key={g.id}>
                  <button
                    type="button"
                    className="font-medium underline hover:text-sky-700"
                    onClick={() => {
                      onViewGroup(g.id)
                      onClose()
                    }}
                  >
                    {g.name}
                  </button>
                  {i < duplicates.length - 1 ? ', ' : ''}
                </span>
              ))}
              . Parallel groups are allowed, but an entity can be an active member of only one {type} group at a time.
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Members</Label>
            <div className="flex max-h-[300px] flex-col divide-y divide-neutral-100 overflow-auto rounded-lg border border-neutral-200">
              {orgEntities.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-neutral-500">No legal entities available.</p>
              ) : (
                orgEntities.map((e) => {
                  const member = members.find((m) => m.entityId === e.id)
                  const checked = !!member
                  return (
                    <div key={e.id} className="flex flex-col gap-2 px-3 py-2.5 hover:bg-neutral-50">
                      <label className="flex cursor-pointer items-center gap-3">
                        <Checkbox checked={checked} onCheckedChange={() => toggleMember(e.id)} />
                        <span className="text-[14px] leading-5 text-neutral-900">{e.legalName}</span>
                      </label>
                      {checked && member && (
                        <div className="grid grid-cols-2 gap-3 pl-7">
                          <div className="flex flex-col gap-1">
                            <Label className="text-[12px] text-neutral-500">Active from</Label>
                            <Input
                              type="date"
                              value={member.validFrom}
                              onChange={(ev) => updateMember(e.id, { validFrom: ev.target.value })}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label className="text-[12px] text-neutral-500">Active to (optional)</Label>
                            <Input
                              type="date"
                              value={member.validTo ?? ''}
                              onChange={(ev) => updateMember(e.id, { validTo: ev.target.value || null })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* V10-F — representative chip picker, same visual pattern as Create Engagement's
              service-line chips. Single-select; picking a rep also seeds the group name. */}
          {selected.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Representative</Label>
              <div className="flex flex-wrap gap-2">
                {selected.map((id) => {
                  const on = repId === id
                  const label = entities.find((e) => e.id === id)?.legalName ?? id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setRepId(id)}
                      aria-pressed={on}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] leading-[18px] transition-colors',
                        on
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50',
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {!repId && (
                <p className="text-[12px] leading-4 text-neutral-400">
                  Pick a representative to enable Create.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={!canCreate}>
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Add Members ────────────────────────────────────────────────────────── */

/** Feature 6 of the "upload modal & data-package visuals" ticket — who a selected legal
 * entity's Child Case will assign once a VAT group case is created from this group (the actual
 * case-creation wiring is a later task; this modal only collects the assignment). */
export interface MemberAssigneeIds {
  creators: string[]
  reviewers: string[]
  partners: string[]
  clients: string[]
}

export interface AddMembersDraft {
  entityId: string
  validFrom: string
  validTo: string | null
  assignees: MemberAssigneeIds
}

const EMPTY_ASSIGNEES: MemberAssigneeIds = { creators: [], reviewers: [], partners: [], clients: [] }

// Entities beyond this many get a bounded, scrolling list instead of growing the modal
// indefinitely — a group can have up to ~60 members.
const ENTITY_LIST_SCROLL_THRESHOLD = 5
const ENTITY_LIST_MAX_HEIGHT = 'max-h-[320px]'

export function AddMembersModal({
  group,
  entities,
  orgUsers,
  onClose,
  onAdd,
}: {
  group: Group
  entities: LegalEntity[]
  /** Feature 6 — the choosable Creator/Reviewer/Partner/Client people are limited to this
   * organisation's own users, not every user on the platform. */
  orgUsers: OrgUser[]
  onClose: () => void
  onAdd: (drafts: AddMembersDraft[]) => void
}) {
  // Eligible = same-org entities not already active or pending in this group
  // (ended members can be re-added).
  const blocked = new Set(
    group.members.filter((m) => membershipStatus(m) !== 'Ended').map((m) => m.entityId),
  )
  const eligible = entities.filter((e) => e.orgId === group.orgId && !blocked.has(e.id))
  // Feature 6 — `orgUsers` is already scoped to this organisation by the caller (OrgWorkspace's
  // own `users` state only ever contains users belonging to the open org), so every one of them
  // is a valid Creator/Reviewer/Partner/Client pick regardless of which specific entity they're
  // otherwise connected to.
  const orgMembers = orgUsers

  const [entitySearch, setEntitySearch] = useState('')
  const visibleEligible = useMemo(() => {
    const q = entitySearch.trim().toLowerCase()
    if (!q) return eligible
    return eligible.filter((e) => e.legalName.toLowerCase().includes(q))
  }, [eligible, entitySearch])

  const [drafts, setDrafts] = useState<Record<string, { validFrom: string; validTo: string; assignees: MemberAssigneeIds }>>({})
  const selected = Object.keys(drafts)

  const toggle = (id: string) =>
    setDrafts((prev) => {
      if (prev[id]) {
        const { [id]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: { validFrom: today(), validTo: '', assignees: { ...EMPTY_ASSIGNEES } } }
    })

  const updateDraft = (id: string, patch: Partial<{ validFrom: string; validTo: string }>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const updateAssignees = (id: string, patch: Partial<MemberAssigneeIds>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], assignees: { ...prev[id].assignees, ...patch } } }))

  // Partner is the only optional role — Creator, Reviewer and Client each need at least one
  // person on every entity being added before the batch can be saved.
  const hasMandatoryRoles = (assignees: MemberAssigneeIds) =>
    assignees.creators.length >= 1 && assignees.reviewers.length >= 1 && assignees.clients.length >= 1

  const canAdd =
    selected.length >= 1 &&
    selected.every((id) => !!drafts[id].validFrom && hasMandatoryRoles(drafts[id].assignees))

  const submit = () => {
    onAdd(
      selected.map((entityId) => ({
        entityId,
        validFrom: drafts[entityId].validFrom,
        validTo: drafts[entityId].validTo || null,
        assignees: drafts[entityId].assignees,
      })),
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent overlayClassName="bg-background/40 backdrop-blur-sm" className="flex max-h-[92vh] max-w-[820px] flex-col gap-5 overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">Add members</DialogTitle>
          <DialogDescription>
            <span className="inline-flex items-center gap-1.5">
              Adding to
              <Badge tone={groupTypeTone(group.type)} size="sm">
                {group.type}
              </Badge>
              {group.name}. Dates apply to everyone added in this batch.
            </span>
          </DialogDescription>
        </DialogHeader>

        {eligible.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={entitySearch}
              onChange={(ev) => setEntitySearch(ev.target.value)}
              placeholder="Search by legal entity name"
              className="pl-9"
            />
          </div>
        )}

        <div
          className={cn(
            'flex flex-col gap-2',
            eligible.length > ENTITY_LIST_SCROLL_THRESHOLD && cn(ENTITY_LIST_MAX_HEIGHT, 'overflow-y-auto pr-1'),
          )}
        >
          {eligible.length === 0 ? (
            <p className="px-3 py-4 text-[13px] text-neutral-500">
              All eligible entities are already members.
            </p>
          ) : visibleEligible.length === 0 ? (
            <p className="px-3 py-4 text-[13px] text-neutral-500">
              No legal entity matches "{entitySearch}".
            </p>
          ) : (
            visibleEligible.map((e) => {
              const isSelected = !!drafts[e.id]
              const draft = drafts[e.id]
              return (
                <div
                  key={e.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-lg border px-3 py-2.5',
                    isSelected ? 'border-green-300 bg-green-50/30' : 'border-neutral-200',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(e.id)}
                      aria-pressed={isSelected}
                      aria-label={isSelected ? `Deselect ${e.legalName}` : `Select ${e.legalName}`}
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                        isSelected ? 'border-green-600 bg-green-600 text-white' : 'border-neutral-300',
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                    <span className="flex-1 text-[14px] font-medium leading-5 text-neutral-900">{e.legalName}</span>
                    {isSelected && (
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <Label className="text-[11px] text-neutral-500">Valid from</Label>
                          <Input
                            type="date"
                            className="h-8"
                            value={draft.validFrom}
                            onChange={(ev) => updateDraft(e.id, { validFrom: ev.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <Label className="text-[11px] text-neutral-500">Valid to (optional)</Label>
                          <Input
                            type="date"
                            className="h-8"
                            value={draft.validTo}
                            onChange={(ev) => updateDraft(e.id, { validTo: ev.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="grid grid-cols-1 gap-3 pl-8 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[12px] text-neutral-600">Creator</Label>
                        <UserSelect
                          multiple
                          users={orgMembers}
                          value={draft.assignees.creators}
                          onChange={(ids) => updateAssignees(e.id, { creators: ids })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[12px] text-neutral-600">Reviewer</Label>
                        <UserSelect
                          multiple
                          users={orgMembers}
                          value={draft.assignees.reviewers}
                          onChange={(ids) => updateAssignees(e.id, { reviewers: ids })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[12px] text-neutral-600">
                          Partner <span className="font-normal text-neutral-400">(optional)</span>
                        </Label>
                        <UserSelect
                          multiple
                          users={orgMembers}
                          value={draft.assignees.partners}
                          onChange={(ids) => updateAssignees(e.id, { partners: ids })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-[12px] text-neutral-600">Client</Label>
                        <UserSelect
                          multiple
                          users={orgMembers}
                          value={draft.assignees.clients}
                          onChange={(ids) => updateAssignees(e.id, { clients: ids })}
                        />
                      </div>
                      {!hasMandatoryRoles(draft.assignees) && (
                        <p className="col-span-full text-[12px] text-amber-600">
                          Creator, Reviewer and Client each need at least one person before this entity can be added.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={!canAdd} onClick={submit}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
