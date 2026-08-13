import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Search } from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  DatePicker,
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

import { LegalEntity } from './org-details-data'
import {
  GROUP_TYPES,
  DISABLED_GROUP_TYPES,
  Group,
  GroupType,
  periodStatus,
  today,
} from './org-details-data'

// "A", "A and B", "A, B and C" — for composing the Feature 6 add/remove banner's sentences.
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}.`
}

// EntityDraft keeps yyyy-mm-dd strings (matching the wider validFrom/validTo period-status
// model in org-details-data.ts) — these two only convert at the DatePicker UI boundary.
function isoToDate(iso: string): Date | undefined {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}
function dateToIso(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

interface EntityDraft {
  validFrom: string
  validTo: string
}

/** One selectable legal-entity row: collapsed shows just the name and a select toggle;
 * selecting it expands into Valid-from/to dates. Shared by the Create and Edit Group modals
 * so the two don't drift into two different pickers for the same job. People assignment used
 * to live here too — removed; per-entity role assignment now happens later, at VAT Scheduler
 * time (see vat-scheduler-modal.tsx), not at group creation/edit time. */
function EntityAssignmentRow({
  entity,
  isSelected,
  isActive,
  draft,
  onToggle,
  onUpdateDraft,
  badge,
  rowRef,
}: {
  entity: LegalEntity
  isSelected: boolean
  /** Feature 3 — only a currently-Active member is "ticked/green"; a Pending one (future Valid
   * from) is still selected (its fields are editable below) but reads as neutral here, with its
   * own "Pending" pill + activation date instead. Meaningless when `isSelected` is false. */
  isActive?: boolean
  draft?: EntityDraft
  onToggle: () => void
  onUpdateDraft: (patch: Partial<{ validFrom: string; validTo: string }>) => void
  /** e.g. a "Representative" badge next to the name once chosen via the dedicated dropdown. */
  badge?: React.ReactNode
  /** Lets the parent scroll a just-selected/just-expanded row into view. */
  rowRef?: (el: HTMLDivElement | null) => void
}) {
  const isPending = isSelected && !isActive
  return (
    <div
      ref={rowRef}
      className={cn(
        'flex flex-col gap-3 rounded-lg border px-3 py-2.5',
        isSelected && isActive
          ? 'border-green-300 bg-green-50/30'
          : isPending
            ? 'border-amber-200 bg-amber-50/20'
            : 'border-neutral-200',
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isSelected}
          aria-label={isSelected ? `Deselect ${entity.legalName}` : `Select ${entity.legalName}`}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
            isSelected && isActive
              ? 'border-green-600 bg-green-600 text-white'
              : isPending
                ? 'border-amber-500 bg-amber-500 text-white'
                : 'border-neutral-300',
          )}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </button>
        {/* Name + badges are their own tight column so the badges sit right under the name —
            not under the (taller, label-topped) date pickers, which live in their own sibling
            column and stay top-aligned via items-start on this row. */}
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-[14px] font-medium leading-5 text-neutral-900">
              {entity.legalName}
            </span>
            {(badge || (isPending && draft)) && (
              <div className="flex items-center gap-1.5">
                {badge}
                {/* Feature 3 — visible in the collapsed row too, not just once expanded: a
                    "Pending" pill plus exactly when it activates. */}
                {isPending && draft && (
                  <>
                    <Badge tone="orange" size="sm">Pending</Badge>
                    <span className="whitespace-nowrap text-[12px] text-neutral-500">
                      Active from {fmtDate(draft.validFrom)}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          {isSelected && draft && (
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <Label className="text-[11px] text-neutral-500">Valid from</Label>
                <DatePicker
                  value={draft.validFrom ? isoToDate(draft.validFrom) : undefined}
                  onChange={(date) => onUpdateDraft({ validFrom: date ? dateToIso(date) : '' })}
                  placeholder="dd mm yyyy"
                  className="h-8 w-[150px] text-foreground"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <Label className="text-[11px] text-neutral-500">Valid to (optional)</Label>
                <DatePicker
                  value={draft.validTo ? isoToDate(draft.validTo) : undefined}
                  onChange={(date) => onUpdateDraft({ validTo: date ? dateToIso(date) : '' })}
                  placeholder="dd mm yyyy"
                  className="h-8 w-[150px] text-foreground"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Create / Edit Group (shared form) ──────────────────────────────────── */

export interface GroupMemberDraft {
  entityId: string
  validFrom: string
  validTo: string | null
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
  group,
  prefill,
  onClose,
  onCreate,
  onSave,
}: {
  mode: 'create' | 'edit'
  orgId: string
  entities: LegalEntity[]
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
      // Feature 4 — only ever seed the entity's CURRENT (Active/Pending) stint here. Ended
      // stints are its history, not "selected" — they're preserved on save (see updateGroup)
      // without ever surfacing in this checklist, so re-editing a group can't clobber them.
      if (periodStatus(m.validFrom, m.validTo) === 'Ended') continue
      initial[m.entityId] = {
        validFrom: m.validFrom,
        validTo: m.validTo ?? '',
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
    setDrafts({ [id]: { validFrom: today(), validTo: '' } })
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
      return { ...prev, [id]: { validFrom: today(), validTo: '' } }
    })

  const updateDraft = (id: string, patch: Partial<{ validFrom: string; validTo: string }>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  // Feature 5/7 — choosing a representative instantly selects it too (seeding a draft if it
  // isn't already one), forcing the user to assign its responsible people before saving. This
  // is also the ONLY place a representative changes — never by clicking a card on the main page.
  const chooseRepresentative = (id: string) => {
    setRepId(id)
    setJustExpandedId(id)
    setDrafts((prev) => (prev[id] ? prev : { ...prev, [id]: { validFrom: today(), validTo: '' } }))
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

  // Every entity that was a CURRENT (Active/Pending) member when this Edit session opened —
  // used below to spot ones being newly added in THIS session (including an entity whose only
  // prior record is Ended history — re-adding it is "new" for validation/banner purposes, even
  // though its history sticks around either way), as opposed to pre-existing members just
  // being reviewed/re-assigned.
  const initialMemberIds = useMemo(
    () => new Set(group?.members.filter((m) => periodStatus(m.validFrom, m.validTo) !== 'Ended').map((m) => m.entityId) ?? []),
    [group],
  )

  // Group creation/editing requires a REPRESENTATIVE to be selected (and present-active — see
  // below). Per-role people assignment no longer happens here; it happens per legal entity at
  // VAT Scheduler time instead (see vat-scheduler-modal.tsx).
  const repDraft = repId ? drafts[repId] : undefined
  // Feature 3 (representative date restriction ticket) — a representative must be a
  // present-active member, never one whose stint hasn't started yet.
  const repIsFutureDated = !!repDraft && repDraft.validFrom > today()
  const canSubmit = !!name.trim() && !!repId && !!repDraft && !repIsFutureDated

  // Feature 6 — live preview of what this session is about to add/remove, named by legal
  // entity, so the user sees exactly what they're confirming before saving.
  const addedNames = mode === 'edit'
    ? selected.filter((id) => !initialMemberIds.has(id)).map((id) => orgEntities.find((e) => e.id === id)?.legalName ?? id)
    : []
  const removedNames = mode === 'edit'
    ? [...initialMemberIds].filter((id) => !selected.includes(id)).map((id) => orgEntities.find((e) => e.id === id)?.legalName ?? id)
    : []

  // Feature 3 (banner ticket) — dismissing the banner should only hide it for the add/remove
  // set that earned it; the next toggle that changes that set brings it right back.
  const changeSignature = `${addedNames.join('|')}::${removedNames.join('|')}`
  const [dismissedChangeSignature, setDismissedChangeSignature] = useState<string | null>(null)
  const showChangeBanner =
    mode === 'edit' && (addedNames.length > 0 || removedNames.length > 0) && dismissedChangeSignature !== changeSignature

  const buildDraft = (): GroupFormDraft => ({
    name: name.trim(),
    type,
    jurisdiction,
    members: selected.map((entityId) => ({
      entityId,
      validFrom: drafts[entityId].validFrom,
      validTo: drafts[entityId].validTo || null,
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
      {/* Tall, not gratuitously wide (Feature 7, "VAT Groups" ticket) — per-entity role
          assignment moved out of this modal entirely (see EntityAssignmentRow's docs above), but
          a selected row's inline Valid-from/Valid-to date pickers still need real width right
          next to the legal entity name, so the cap can't go as narrow as a single-column form —
          1200px keeps a long legal entity name from truncating next to those date pickers while
          still landing well short of the old 90vw. Height stays tall — a group can hold ~50
          legal entities, and while the list itself scrolls internally, keeping the box tall
          keeps far more of them on screen at once before that scroll kicks in. Locked
          header/footer with only the middle content scrolling: the outer DialogContent is a
          fixed-height flex column, the header and footer are `shrink-0`, and only the entity
          list inside the row below scrolls — so adding/expanding entities never grows the modal
          itself. Wider than a single column: a left column for group-level fields, a right
          column for member selection. */}
      <DialogContent
        overlayClassName="bg-background/40 backdrop-blur-sm"
        className="flex h-[90vh] max-h-[90vh] w-[90vw] max-w-[1200px] flex-col gap-0 overflow-hidden p-0"
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
                  {orgEntities.map((e) => {
                    // Feature 3 — an entity already drafted with a future Valid from (Pending)
                    // can't be the representative: it isn't active in the present time frame
                    // yet. An entity not drafted at all is fine — picking it here seeds it with
                    // today's date (see chooseRepresentative), so it starts out Active.
                    const draftFrom = drafts[e.id]?.validFrom
                    const futureDated = !!draftFrom && draftFrom > today()
                    return (
                      <SelectItem key={e.id} value={e.id} disabled={futureDated}>
                        {e.legalName}
                        {futureDated && <span className="text-neutral-400"> · Pending until {fmtDate(draftFrom!)}</span>}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {!repId ? (
                <p className="text-[12px] leading-4 text-neutral-400">
                  Required — adds this entity to the group on the right.
                </p>
              ) : repIsFutureDated ? (
                <p className="text-[12px] leading-4 text-red-500">
                  This entity's Valid from date is in the future — a representative must be
                  active now. Change its date or pick another entity.
                </p>
              ) : null}
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
            {/* Feature 6 (banner ticket)/Feature 3 (this ticket) — a live, dismissible summary of
                what this session is about to add/remove, named by legal entity: only the lines
                that actually apply render (both, either, or neither), always closing with the
                future-cases impact note. Sits right under the search box, not in the footer, so
                it's visible while still picking members. Feature 2 (people-assignment removal
                ticket) — removing the representative clears repId (see toggle above), so this
                same banner also has to carry the save-blocked warning; there's no other UI on
                this modal that explains why the Save button just disabled itself. */}
            {showChangeBanner && (
              <Alert variant="info" onClose={() => setDismissedChangeSignature(changeSignature)} className="shrink-0">
                {removedNames.length > 0 && (
                  <>
                    <span className="font-semibold">{joinNames(removedNames)}</span>{' '}
                    {removedNames.length === 1 ? 'has' : 'have'} been removed.{' '}
                  </>
                )}
                {addedNames.length > 0 && (
                  <>
                    <span className="font-semibold">{joinNames(addedNames)}</span>{' '}
                    {addedNames.length === 1 ? 'has' : 'have'} been added.{' '}
                  </>
                )}
                Future cases will be impacted.
                {!repId && ' Saving is blocked until a representative is selected.'}
              </Alert>
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
                    isActive={!!drafts[e.id] && drafts[e.id].validFrom <= today()}
                    draft={drafts[e.id]}
                    onToggle={() => toggle(e.id)}
                    onUpdateDraft={(patch) => updateDraft(e.id, patch)}
                    badge={repId === e.id ? <Badge tone="sky" size="sm">Representative</Badge> : undefined}
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
            <Alert variant="warning" title="This change affects future cases.">
              Any case not yet created will use the group membership in effect at the time it is
              generated. Cases already created and in progress are not altered by this change and must
              still be finalised under their original assignment. Confirm this is intentional before
              saving.
            </Alert>
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
