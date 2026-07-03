import { useEffect, useMemo, useState } from 'react'
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
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@wts/ui'

import { LegalEntity } from './org-details-data'
import {
  COUNTRIES,
  GROUP_TYPES,
  DISABLED_GROUP_TYPES,
  Group,
  GroupType,
  membershipStatus,
  today,
} from './org-details-data'

// V10-G — only VAT + CIT remain; CIT reuses the violet tone that used to be Income tax.
const groupTypeTone = (t: GroupType) => (t === 'VAT' ? 'blue' : 'violet')

export interface CreateGroupDraft {
  name: string
  type: GroupType
  jurisdiction: string
  memberEntityIds: string[]
  representativeId: string
  validFrom: string
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
  const [selected, setSelected] = useState<string[]>(prefill?.memberEntityId ? [prefill.memberEntityId] : [])
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
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      if (next.length === 1) setRepId(next[0])
      else if (!next.includes(repId)) setRepId('')
      return next
    })
  }

  const canCreate = !!name.trim() && selected.length >= 1 && !!repId && selected.includes(repId)

  const submit = () => {
    if (!canCreate) return
    onCreate({
      name: name.trim(),
      type,
      jurisdiction,
      memberEntityIds: selected,
      representativeId: repId,
      validFrom: today(),
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[560px] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">Create Group</DialogTitle>
          <DialogDescription>
            Members start today. There is no separate group start date.
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
            <div className="flex max-h-[220px] flex-col divide-y divide-neutral-100 overflow-auto rounded-lg border border-neutral-200">
              {orgEntities.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-neutral-500">No legal entities available.</p>
              ) : (
                orgEntities.map((e) => {
                  const checked = selected.includes(e.id)
                  return (
                    <label
                      key={e.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-neutral-50"
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleMember(e.id)} />
                      <span className="text-[14px] leading-5 text-neutral-900">{e.legalName}</span>
                    </label>
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

export function AddMembersModal({
  group,
  entities,
  onClose,
  onAdd,
}: {
  group: Group
  entities: LegalEntity[]
  onClose: () => void
  onAdd: (entityIds: string[], validFrom: string, validTo: string | null) => void
}) {
  // Eligible = same-org entities not already active or pending in this group
  // (ended members can be re-added).
  const blocked = new Set(
    group.members.filter((m) => membershipStatus(m) !== 'Ended').map((m) => m.entityId),
  )
  const eligible = entities.filter((e) => e.orgId === group.orgId && !blocked.has(e.id))

  const [selected, setSelected] = useState<string[]>([])
  const [validFrom, setValidFrom] = useState(today())
  const [validTo, setValidTo] = useState('')

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const canAdd = selected.length >= 1 && !!validFrom

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-[520px] overflow-auto">
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

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Entities</Label>
            <div className="flex max-h-[220px] flex-col divide-y divide-neutral-100 overflow-auto rounded-lg border border-neutral-200">
              {eligible.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-neutral-500">
                  All eligible entities are already members.
                </p>
              ) : (
                eligible.map((e) => (
                  <label
                    key={e.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-neutral-50"
                  >
                    <Checkbox
                      checked={selected.includes(e.id)}
                      onCheckedChange={() => toggle(e.id)}
                    />
                    <span className="text-[14px] leading-5 text-neutral-900">{e.legalName}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Valid from</Label>
              <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={cn('text-sm')}>Valid to (optional)</Label>
              <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={!canAdd} onClick={() => onAdd(selected, validFrom, validTo || null)}>
            Add members
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
