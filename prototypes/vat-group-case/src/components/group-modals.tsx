import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, Search } from 'lucide-react'
import {
  Badge,
  Button,
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
  GROUP_TYPES,
  DISABLED_GROUP_TYPES,
  Group,
  GroupType,
  today,
} from './org-details-data'
import { UserSelect } from './user-select'

/* ─── Shared: member assignee shape, validation, and the entity row ─────────
 * Feature 6 of the "upload modal & data-package visuals" ticket — who a selected legal entity's
 * Child Case will assign once a VAT group case is created from this group (the actual
 * case-creation wiring is a later task; this only collects the assignment). The "task element /
 * needs-changes / sidebar / create-group" and "Groups tab refactor" tickets reuse this exact
 * shape and row UI in both the Create and Edit Group modals instead of rebuilding it. */
export interface MemberAssigneeIds {
  creators: string[]
  reviewers: string[]
  partners: string[]
  clients: string[]
}

const EMPTY_ASSIGNEES: MemberAssigneeIds = { creators: [], reviewers: [], partners: [], clients: [] }

// Partner is the only optional role — Creator, Reviewer and Client each need at least one
// person on every entity being added before a batch can be saved / a group can be created.
function hasMandatoryRoles(assignees: MemberAssigneeIds): boolean {
  return assignees.creators.length >= 1 && assignees.reviewers.length >= 1 && assignees.clients.length >= 1
}

interface EntityDraft {
  validFrom: string
  validTo: string
  assignees: MemberAssigneeIds
}

/** One selectable legal-entity row: collapsed shows just the name and a select toggle;
 * selecting it expands into Valid-from/to dates and the Creator/Reviewer/Partner/Client
 * assignment fields. Shared by the Create and Edit Group modals so the two don't drift into
 * two different pickers for the same job. */
function EntityAssignmentRow({
  entity,
  isSelected,
  draft,
  orgUsers,
  onToggle,
  onUpdateDraft,
  onUpdateAssignees,
  badge,
  hideMandatoryHint,
  rowRef,
}: {
  entity: LegalEntity
  isSelected: boolean
  draft?: EntityDraft
  orgUsers: OrgUser[]
  onToggle: () => void
  onUpdateDraft: (patch: Partial<{ validFrom: string; validTo: string }>) => void
  onUpdateAssignees: (patch: Partial<MemberAssigneeIds>) => void
  /** e.g. a "Representative" badge next to the name once chosen via the dedicated dropdown. */
  badge?: React.ReactNode
  /** Create/Edit Group modals drop the inline validation copy (the restriction itself still
   * blocks submit) — Add Members-style callers keep it as an inline hint. */
  hideMandatoryHint?: boolean
  /** Lets the parent scroll a just-selected/just-expanded row into view. */
  rowRef?: (el: HTMLDivElement | null) => void
}) {
  return (
    <div
      ref={rowRef}
      className={cn(
        'flex flex-col gap-3 rounded-lg border px-3 py-2.5',
        isSelected ? 'border-green-300 bg-green-50/30' : 'border-neutral-200',
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isSelected}
          aria-label={isSelected ? `Deselect ${entity.legalName}` : `Select ${entity.legalName}`}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
            isSelected ? 'border-green-600 bg-green-600 text-white' : 'border-neutral-300',
          )}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-[14px] font-medium leading-5 text-neutral-900">
            {entity.legalName}
          </span>
          {/* self-start — a flex-col ancestor stretches children to its own width by default;
              without this the badge would fill the whole row instead of hugging its text. */}
          {badge && <span className="shrink-0 self-start">{badge}</span>}
        </div>
        {isSelected && draft && (
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <Label className="text-[11px] text-neutral-500">Valid from</Label>
              <Input
                type="date"
                className="h-8"
                value={draft.validFrom}
                onChange={(ev) => onUpdateDraft({ validFrom: ev.target.value })}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <Label className="text-[11px] text-neutral-500">Valid to (optional)</Label>
              <Input
                type="date"
                className="h-8"
                value={draft.validTo}
                onChange={(ev) => onUpdateDraft({ validTo: ev.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {isSelected && draft && (
        <div className="grid grid-cols-1 gap-3 pl-8 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-neutral-600">Creator</Label>
            <UserSelect
              multiple
              users={orgUsers}
              value={draft.assignees.creators}
              onChange={(ids) => onUpdateAssignees({ creators: ids })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-neutral-600">Reviewer</Label>
            <UserSelect
              multiple
              users={orgUsers}
              value={draft.assignees.reviewers}
              onChange={(ids) => onUpdateAssignees({ reviewers: ids })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-neutral-600">
              Partner <span className="font-normal text-neutral-400">(optional)</span>
            </Label>
            <UserSelect
              multiple
              users={orgUsers}
              value={draft.assignees.partners}
              onChange={(ids) => onUpdateAssignees({ partners: ids })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[12px] text-neutral-600">Client</Label>
            <UserSelect
              multiple
              users={orgUsers}
              value={draft.assignees.clients}
              onChange={(ids) => onUpdateAssignees({ clients: ids })}
            />
          </div>
          {!hideMandatoryHint && !hasMandatoryRoles(draft.assignees) && (
            <p className="col-span-full text-[12px] text-amber-600">
              Creator, Reviewer and Client each need at least one person before this entity can be added.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Create / Edit Group (shared form) ──────────────────────────────────── */

export interface GroupMemberDraft {
  entityId: string
  validFrom: string
  validTo: string | null
  assigneeIds: MemberAssigneeIds
}

export interface GroupFormDraft {
  name: string
  type: GroupType
  jurisdiction: string
  members: GroupMemberDraft[]
  representativeId: string
}

interface GroupFormModalProps {
  orgId: string
  entities: LegalEntity[]
  /** Creator/Reviewer/Partner/Client choices are limited to this organisation's own users. */
  orgUsers: OrgUser[]
  onClose: () => void
}

interface CreateGroupModalProps extends GroupFormModalProps {
  prefill?: { type?: GroupType; jurisdiction?: string; memberEntityId?: string }
  onCreate: (draft: GroupFormDraft) => void
}

interface EditGroupModalProps extends GroupFormModalProps {
  group: Group
  onSave: (groupId: string, draft: GroupFormDraft) => void
}

function GroupFormModal({
  mode,
  orgId,
  entities,
  orgUsers,
  group,
  prefill,
  onClose,
  onCreate,
  onSave,
}: {
  mode: 'create' | 'edit'
  orgId: string
  entities: LegalEntity[]
  orgUsers: OrgUser[]
  group?: Group
  prefill?: { type?: GroupType; jurisdiction?: string; memberEntityId?: string }
  onClose: () => void
  onCreate?: (draft: GroupFormDraft) => void
  onSave?: (groupId: string, draft: GroupFormDraft) => void
}) {
  // V10-G — CIT is a disabled option in the picker; the initial default falls back to the
  // first enabled type when CIT would have been chosen by prefill.
  const enabledTypes = GROUP_TYPES.filter((t) => !DISABLED_GROUP_TYPES.includes(t))
  const initialType: GroupType = group
    ? group.type
    : (prefill?.type && !DISABLED_GROUP_TYPES.includes(prefill.type)) ? prefill.type : (enabledTypes[0] ?? 'VAT')
  const [type, setType] = useState<GroupType>(initialType)
  // V10-E — group name is pre-filled from the representative's legal name and stays in
  // lockstep until the user hand-edits it (Create only — Edit starts from the real name).
  const [name, setName] = useState(group?.name ?? '')
  const [nameEdited, setNameEdited] = useState(mode === 'edit')
  const [repId, setRepId] = useState(group?.members.find((m) => m.representative)?.entityId ?? '')
  const [entitySearch, setEntitySearch] = useState('')
  const [drafts, setDrafts] = useState<Record<string, EntityDraft>>(() => {
    if (!group) return {}
    const initial: Record<string, EntityDraft> = {}
    for (const m of group.members) {
      initial[m.entityId] = {
        validFrom: m.validFrom,
        validTo: m.validTo ?? '',
        assignees: {
          creators: m.assigneeIds?.creators ?? [],
          reviewers: m.assigneeIds?.reviewers ?? [],
          partners: m.assigneeIds?.partners ?? [],
          clients: m.assigneeIds?.clients ?? [],
        },
      }
    }
    return initial
  })
  const selected = Object.keys(drafts)

  const orgEntities = useMemo(() => entities.filter((e) => e.orgId === orgId), [entities, orgId])
  const visibleEntities = useMemo(() => {
    const q = entitySearch.trim().toLowerCase()
    if (!q) return orgEntities
    return orgEntities.filter((e) => e.legalName.toLowerCase().includes(q))
  }, [orgEntities, entitySearch])

  // Seed from prefill (e.g. "create a group starting from this entity") once, on open. Edit
  // mode already seeded its drafts/repId above from the real group.
  useEffect(() => {
    if (mode !== 'create' || !prefill?.memberEntityId) return
    const id = prefill.memberEntityId
    setDrafts({ [id]: { validFrom: today(), validTo: '', assignees: { ...EMPTY_ASSIGNEES } } })
    setRepId(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scrolls a just-selected/just-expanded entity's row into view — the list is the only
  // scrollable region in this modal (Feature 6), so a row expanding below the fold would
  // otherwise go unnoticed.
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [justExpandedId, setJustExpandedId] = useState<string | null>(null)
  useEffect(() => {
    if (!justExpandedId) return
    rowRefs.current[justExpandedId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [justExpandedId])

  const toggle = (id: string) =>
    setDrafts((prev) => {
      if (prev[id]) {
        const { [id]: _removed, ...rest } = prev
        if (repId === id) setRepId('')
        return rest
      }
      setJustExpandedId(id)
      return { ...prev, [id]: { validFrom: today(), validTo: '', assignees: { ...EMPTY_ASSIGNEES } } }
    })

  const updateDraft = (id: string, patch: Partial<{ validFrom: string; validTo: string }>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const updateAssignees = (id: string, patch: Partial<MemberAssigneeIds>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], assignees: { ...prev[id].assignees, ...patch } } }))

  // Feature 5/7 — choosing a representative instantly selects it too (seeding a draft if it
  // isn't already one), forcing the user to assign its responsible people before saving. This
  // is also the ONLY place a representative changes — never by clicking a card on the main page.
  const chooseRepresentative = (id: string) => {
    setRepId(id)
    setJustExpandedId(id)
    setDrafts((prev) =>
      prev[id] ? prev : { ...prev, [id]: { validFrom: today(), validTo: '', assignees: { ...EMPTY_ASSIGNEES } } },
    )
  }

  // Auto-fill name from the representative until the user takes over (Create only).
  useEffect(() => {
    if (mode !== 'create' || nameEdited) return
    const rep = orgEntities.find((e) => e.id === repId)
    setName(rep ? rep.legalName : '')
  }, [mode, repId, nameEdited, orgEntities])

  // Jurisdiction is entity-locked (Change 9 elsewhere in this prototype), not user-picked —
  // derived from the representative's own Head Office jurisdiction/country once one is chosen.
  const repEntity = orgEntities.find((e) => e.id === repId)
  const jurisdiction = repEntity?.jurisdiction ?? repEntity?.country ?? group?.jurisdiction ?? ''

  // Every entity that was already a member when this Edit session opened — used below to spot
  // ones being newly added in THIS session, as opposed to pre-existing members just being
  // reviewed/re-assigned.
  const initialMemberIds = useMemo(() => new Set(group?.members.map((m) => m.entityId) ?? []), [group])

  // Group creation/editing requires the REPRESENTATIVE to have its mandatory roles assigned.
  // In Edit mode, any entity newly added this session (not already a member of the group) must
  // also have Creator/Reviewer/Client filled before it can be saved in — Partner stays optional.
  const repDraft = repId ? drafts[repId] : undefined
  const newlyAddedIncomplete =
    mode === 'edit' &&
    selected.some((id) => !initialMemberIds.has(id) && !hasMandatoryRoles(drafts[id].assignees))
  const canSubmit =
    !!name.trim() && !!repId && !!repDraft && hasMandatoryRoles(repDraft.assignees) && !newlyAddedIncomplete

  const buildDraft = (): GroupFormDraft => ({
    name: name.trim(),
    type,
    jurisdiction,
    members: selected.map((entityId) => ({
      entityId,
      validFrom: drafts[entityId].validFrom,
      validTo: drafts[entityId].validTo || null,
      assigneeIds: drafts[entityId].assignees,
    })),
    representativeId: repId,
  })

  const submit = () => {
    if (!canSubmit) return
    if (mode === 'create') onCreate?.(buildDraft())
    else if (group) onSave?.(group.id, buildDraft())
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      {/* Feature 6 — ~80% of the viewport height, locked header/footer with only the middle
          content scrolling: the outer DialogContent is a fixed-height flex column, the header
          and footer are `shrink-0`, and only the entity list inside the row below scrolls — so
          adding/expanding entities never grows the modal itself. Wider than a single column: a
          left column for group-level fields, a right column for member selection. */}
      <DialogContent
        overlayClassName="bg-background/40 backdrop-blur-sm"
        className="flex h-[80vh] max-h-[80vh] max-w-[1180px] flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 gap-1 border-b border-border px-6 py-5">
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            {mode === 'create' ? 'Create Group' : 'Edit group'}
          </DialogTitle>
          <DialogDescription>
            Set each member's active-from date and an optional active-to date.
          </DialogDescription>
        </DialogHeader>

        {/* This row itself no longer scrolls (`min-h-0 flex-1` only) — it's a bounded box that
            fills whatever space is left between the locked header/footer. The entity list below
            is the ONLY thing that scrolls internally, so expanding several entities' assignment
            fields can never grow the modal itself. The divider between columns is its own flex
            item (not a border tied to one column's content height) so it stretches to the row's
            full height regardless of which column has more content. */}
        <div className="flex min-h-0 flex-1">
          {/* Left — group-level fields. Order: Type -> Representative -> Group name. */}
          <div className="flex w-[360px] shrink-0 flex-col gap-5 overflow-y-auto p-6">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as GroupType)}>
                <SelectTrigger data-testid="group-form-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_TYPES.map((t) => {
                    const disabled = DISABLED_GROUP_TYPES.includes(t)
                    return (
                      <SelectItem key={t} value={t} disabled={disabled}>
                        {t}
                        {disabled && <span className="text-neutral-400"> · soon</span>}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Feature 4/5 — replaces the removed Jurisdiction field: picking a representative
                here instantly selects it in the member list on the right and derives the
                group's jurisdiction from it. */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Select the representative</Label>
              <Select value={repId || undefined} onValueChange={chooseRepresentative}>
                <SelectTrigger data-testid="group-form-representative">
                  <SelectValue placeholder="Select a legal entity" />
                </SelectTrigger>
                <SelectContent>
                  {orgEntities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!repId ? (
                <p className="text-[12px] leading-4 text-neutral-400">
                  Required — assigns Creator, Reviewer and Client for this entity on the right.
                </p>
              ) : (
                jurisdiction && (
                  <p className="text-[12px] leading-4 text-neutral-400">Jurisdiction: {jurisdiction}</p>
                )
              )}
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
              {mode === 'create' && !nameEdited && repId && (
                <p className="text-[12px] leading-4 text-neutral-400">
                  Pre-filled from the representative — edit to override.
                </p>
              )}
            </div>

            {/* Edit Group's own bottom-of-form warning lives in the footer area below, matching
                Create's structure (Feature 5) rather than a separate design. */}
          </div>

          {/* Explicit stretch divider — a plain flex item (not a border on either column)
              always spans the row's full height, regardless of which column's content is
              taller. */}
          <div className="w-px shrink-0 self-stretch bg-neutral-200" />

          {/* Right — member selection + assignment. Only the list itself (`flex-1 min-h-0
              overflow-y-auto` below) scrolls — Label/search stay put. */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-6">
            <Label className="text-sm">Members</Label>
            {orgEntities.length > 0 && (
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={entitySearch}
                  onChange={(ev) => setEntitySearch(ev.target.value)}
                  placeholder="Search by legal entity name"
                  className="pl-9"
                />
              </div>
            )}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {orgEntities.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-neutral-500">No legal entities available.</p>
              ) : visibleEntities.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-neutral-500">
                  No legal entity matches "{entitySearch}".
                </p>
              ) : (
                visibleEntities.map((e) => (
                  <EntityAssignmentRow
                    key={e.id}
                    entity={e}
                    isSelected={!!drafts[e.id]}
                    draft={drafts[e.id]}
                    orgUsers={orgUsers}
                    onToggle={() => toggle(e.id)}
                    onUpdateDraft={(patch) => updateDraft(e.id, patch)}
                    onUpdateAssignees={(patch) => updateAssignees(e.id, patch)}
                    badge={repId === e.id ? <Badge tone="sky" size="sm">Representative</Badge> : undefined}
                    hideMandatoryHint
                    rowRef={(el) => { rowRefs.current[e.id] = el }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-col items-stretch gap-3 border-t border-border px-6 py-4 sm:flex-col">
          {/* Feature 5 — Edit Group's formal warning that changing membership here reaches
              beyond this dialog: past-created cases are unaffected mid-flight, but anything not
              yet generated will pick up whatever membership is in effect when it is. */}
          {mode === 'edit' && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-[13px] leading-[18px] text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
              <p>
                <span className="font-semibold">This change affects future cases.</span> Any case not yet
                created will use the group membership in effect at the time it is generated. Cases already
                created and in progress are not altered by this change and must still be finalised under
                their original assignment. Confirm this is intentional before saving.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={submit} disabled={!canSubmit}>
              {mode === 'create' ? 'Create Group' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CreateGroupModal(props: CreateGroupModalProps) {
  return <GroupFormModal mode="create" {...props} />
}

export function EditGroupModal(props: EditGroupModalProps) {
  return <GroupFormModal mode="edit" {...props} />
}
