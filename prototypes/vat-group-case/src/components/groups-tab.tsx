import { useState } from 'react'
import { Building2, ChevronDown, ChevronRight, Info, Pencil, Plus, X } from 'lucide-react'
import {
  Badge,
  Button,
  EmptyState,
  cn,
} from '@wts/ui'

import { LegalEntity } from './org-details-data'
import {
  Group,
  Member,
  activeMembers,
  endedMembers,
  entityHistory,
  groupsForEntity,
  membershipStatus,
  memberLabel,
  pendingMembers,
} from './org-details-data'

/* ─── helpers ────────────────────────────────────────────────────────────── */

const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}.`
}

const memberRange = (m: Member) =>
  m.validTo ? `Valid from ${fmtDate(m.validFrom)} Valid to ${fmtDate(m.validTo)}` : `Valid from ${fmtDate(m.validFrom)}`

// req §4 — VAT and CIT perimeters must NEVER be blended in any overview. Groups are always
// presented and counted per single type; keep any future summary strictly per-type.
const groupTypeTone = (t: Group['type']) => (t === 'VAT' ? 'blue' : 'violet')

// "A", "A and B", "A, B and C" — for composing the Feature 7 add/remove banner's sentence.
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** Feature 7 of the "case-table labels / pending logic / edit filtering" ticket — what just
 * changed on a group via the Edit modal, shown as a dismissible banner on this page. */
export interface GroupChangeNotice {
  groupId: string
  added: string[]
  removed: string[]
}

/* ─── Groups tab (master-detail) ─────────────────────────────────────────── */

export interface GroupsTabProps {
  groups: Group[]
  entities: LegalEntity[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddGroup: () => void
  // Feature 3/7 of the "Groups tab refactor" ticket — representative changes, member add/
  // remove, and assignee edits all happen through this one Edit modal now; nothing on this
  // page triggers them directly.
  onEditGroup: (group: Group) => void
  // Feature 7 — set right after a successful Edit-modal save; shown as a banner on whichever
  // group it applies to, dismissible.
  changeNotice?: GroupChangeNotice | null
  onDismissChangeNotice?: () => void
  // V7 — group.manage capability. When false the create/edit affordances are hidden, the
  // panel is view-only.
  canManage?: boolean
}

export function GroupsTab({
  groups,
  entities,
  selectedId,
  onSelect,
  onAddGroup,
  onEditGroup,
  changeNotice,
  onDismissChangeNotice,
  canManage = true,
}: GroupsTabProps) {
  const selected = groups.find((g) => g.id === selectedId) ?? null

  // No groups yet: show a single prompt-only empty state — no sidebar, no repeated
  // actions. The single CTA is the only way to create the first group.
  if (groups.length === 0) {
    return (
      <div className="flex grow flex-col bg-white p-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <EmptyState
          icon={<Building2 className="size-6 text-muted-foreground" />}
          title="No groups yet"
          description="Create the first VAT or CIT group for this organization to consolidate its legal entities."
          action={
            canManage ? (
              <Button onClick={onAddGroup}>
                <Plus className="h-4 w-4" /> Add Group
              </Button>
            ) : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="flex grow overflow-hidden" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Left: group list — minimal, name + type only (Feature 1). */}
      <div className="flex w-[240px] shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2.5">
          <p className="pl-1 text-[11px] font-medium uppercase leading-4 tracking-wide text-neutral-400 shrink-0">
            Groups
          </p>
          {canManage && (
            <Button type="button" variant="outline" size="sm" onClick={onAddGroup}>
              <Plus className="size-4" /> Add Group
            </Button>
          )}
        </div>
        <div className="flex grow flex-col gap-0.5 overflow-auto p-2">
          {groups.map((g) => {
            const isSel = g.id === selectedId
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelect(g.id)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left transition-colors',
                  isSel ? 'bg-[rgba(200,16,46,0.1)] text-brand' : 'text-neutral-700 hover:bg-neutral-100',
                )}
              >
                <span className="text-[14px] font-medium leading-5">{g.name}</span>
                <span className={cn('text-[12px] leading-4', isSel ? 'text-brand/70' : 'text-neutral-400')}>
                  {g.type}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: group detail */}
      <div className="flex grow flex-col overflow-auto bg-white">
        {!selected ? (
          <div className="flex grow flex-col p-6">
            <EmptyState
              icon={<Building2 className="size-6 text-muted-foreground" />}
              title="No group selected"
              description="Select a group from the list to view its members, or add a new one."
            />
          </div>
        ) : (
          <GroupDetail
            group={selected}
            entities={entities}
            onEditGroup={onEditGroup}
            changeNotice={changeNotice?.groupId === selected.id ? changeNotice : null}
            onDismissChangeNotice={onDismissChangeNotice}
            canManage={canManage}
          />
        )}
      </div>
    </div>
  )
}

/* One flat, minimal member row shared by Active/Pending/Inactive — no per-row actions (Feature
 * 7: representative + membership changes only happen via the group's Edit button). */
function MemberRow({
  member,
  entities,
  showEntityName = true,
  isRep = false,
}: {
  member: Member
  entities: LegalEntity[]
  showEntityName?: boolean
  isRep?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex flex-col gap-0.5">
        {showEntityName && (
          <div className="flex items-center gap-2">
            <span className="text-[14px] leading-5 text-neutral-900">{memberLabel(member, entities)}</span>
            {isRep && (
              <Badge tone="sky" size="sm" className="shrink-0 self-start">
                Representative
              </Badge>
            )}
          </div>
        )}
        <span className="text-[12px] leading-4 text-neutral-500">{memberRange(member)}</span>
      </div>
    </div>
  )
}

function GroupDetail({
  group,
  entities,
  onEditGroup,
  changeNotice,
  onDismissChangeNotice,
  canManage,
}: {
  group: Group
  entities: LegalEntity[]
  onEditGroup: (group: Group) => void
  changeNotice?: GroupChangeNotice | null
  onDismissChangeNotice?: () => void
  canManage: boolean
}) {
  const actives = activeMembers(group)
  const pendings = pendingMembers(group)
  const endeds = endedMembers(group)

  return (
    <div className="flex flex-col gap-6 px-8 py-6">
      {/* Header — decluttered (Feature 1): just identity, a dynamic active-member count, and
          the Edit entry point every membership/representative change now goes through
          (Feature 8 — the three-dot / Delete group menu that used to sit here is gone). */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-[22px] font-bold leading-7 text-primary">{group.name}</h2>
            <Badge tone={groupTypeTone(group.type)} size="sm">
              {group.type}
            </Badge>
          </div>
          <p className="text-[14px] leading-5 text-neutral-500">
            {actives.length} Active {actives.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        {canManage && (
          <Button type="button" variant="outline" size="sm" onClick={() => onEditGroup(group)}>
            <Pencil className="size-4" /> Edit
          </Button>
        )}
      </div>

      {/* Feature 7 — dismissible banner after an Edit-modal save that added/removed members,
          noting added entities take effect from the next VAT Scheduler period rather than
          immediately. */}
      {changeNotice && (changeNotice.added.length > 0 || changeNotice.removed.length > 0) && (
        <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-3 text-[13px] leading-[18px] text-sky-900">
          <Info className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden />
          <p className="flex-1">
            {changeNotice.removed.length > 0 && (
              <>
                <span className="font-semibold">{joinNames(changeNotice.removed)}</span>{' '}
                {changeNotice.removed.length === 1 ? 'has' : 'have'} been removed from this group.{' '}
              </>
            )}
            {changeNotice.added.length > 0 && (
              <>
                <span className="font-semibold">{joinNames(changeNotice.added)}</span>{' '}
                {changeNotice.added.length === 1 ? 'has' : 'have'} been added and will be active from the next
                scheduling period defined in the VAT Scheduler.{' '}
              </>
            )}
          </p>
          {onDismissChangeNotice && (
            <button
              type="button"
              onClick={onDismissChangeNotice}
              aria-label="Dismiss"
              className="shrink-0 text-sky-600 hover:text-sky-800"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {/* Members — regrouped into Active / Pending / Inactive inside one container
          (Feature 1/4), each a flat, action-free row (Feature 7). */}
      <div className="flex flex-col divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white px-6">
        <section className="flex flex-col py-2">
          <h3 className="pt-3 font-display text-[15px] font-semibold leading-5 text-primary">Active members</h3>
          {actives.length === 0 ? (
            <p className="py-3 text-[14px] leading-5 text-neutral-500">No active members.</p>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100">
              {actives.map((m) => (
                <MemberHistoryRow
                  key={m.entityId}
                  member={m}
                  history={entityHistory(group, m.entityId)}
                  entities={entities}
                  isRep={m.representative}
                />
              ))}
            </div>
          )}
        </section>

        {pendings.length > 0 && (
          <section className="flex flex-col py-2">
            <h3 className="pt-3 font-display text-[15px] font-semibold leading-5 text-primary">Pending members</h3>
            <div className="flex flex-col divide-y divide-neutral-100">
              {pendings.map((m) => (
                <MemberHistoryRow
                  key={`${m.entityId}-${m.validFrom}`}
                  member={m}
                  history={entityHistory(group, m.entityId)}
                  entities={entities}
                />
              ))}
            </div>
          </section>
        )}

        {endeds.length > 0 && (
          <section className="flex flex-col py-2">
            <h3 className="pt-3 font-display text-[15px] font-semibold leading-5 text-primary">Inactive members</h3>
            <InactiveMembersList inactives={endeds} entities={entities} />
          </section>
        )}
      </div>
    </div>
  )
}

/* Shared by Active/Pending/Inactive: the entity's CURRENT row (whatever status it's in) plus,
 * if it has any, an expand toggle revealing its past (Ended) periods underneath — Feature 1 of
 * the "inactive→active history migration" ticket: history always travels with the entity to
 * wherever its current row lives, never staying behind under a stale Inactive section. */
function MemberHistoryRow({
  member,
  history,
  entities,
  isRep = false,
}: {
  member: Member
  history: Member[]
  entities: LegalEntity[]
  isRep?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const hasHistory = history.length > 0
  const entityName = entities.find((e) => e.id === member.entityId)?.legalName ?? member.entityId

  return (
    <div className="py-1">
      <div className="flex items-center gap-2">
        {hasHistory ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse history' : 'Expand history'}
            className="items-center flex justify-center w-6 h-6 -ml-1 shrink-0 text-neutral-500 hover:bg-neutral-100 rounded-md"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-5 shrink-0" aria-hidden />
        )}
        <div className="grow">
          <MemberRow member={member} entities={entities} isRep={isRep} />
        </div>
      </div>
      {expanded && hasHistory && (
        <div className="ml-8 border-l-2 border-neutral-100 pl-4">
          <p className="pt-2 text-[11px] uppercase leading-4 tracking-wide text-neutral-400">
            Earlier periods for {entityName}
          </p>
          {history.map((m, i) => (
            <MemberRow key={`${m.entityId}-${m.validFrom}-${i}`} member={m} entities={entities} showEntityName={false} />
          ))}
        </div>
      )}
    </div>
  )
}

/* Fully-inactive members (no current stint at all) grouped by entity; the collapsed row shows
 * the most recent period, and expanding reveals earlier periods when an entity has been part of
 * the group more than once. No per-row actions (Feature 7). */
function InactiveMembersList({
  inactives,
  entities,
}: {
  inactives: Member[]
  entities: LegalEntity[]
}) {
  const byEntity = new Map<string, Member[]>()
  for (const m of inactives) {
    if (!byEntity.has(m.entityId)) byEntity.set(m.entityId, [])
    byEntity.get(m.entityId)!.push(m)
  }
  for (const list of byEntity.values()) {
    list.sort((a, b) => (b.validFrom ?? '').localeCompare(a.validFrom ?? ''))
  }
  const entityRows = [...byEntity.entries()]

  return (
    <div className="flex flex-col divide-y divide-neutral-100">
      {entityRows.map(([entityId, periods]) => {
        const [most, ...rest] = periods
        return <MemberHistoryRow key={entityId} member={most} history={rest} entities={entities} />
      })}
    </div>
  )
}

/* ─── Reciprocal card: entity → its groups ───────────────────────────────── */

export function EntityGroupMembershipsSection({
  entity,
  groups,
  onOpenGroup,
}: {
  entity: LegalEntity
  groups: Group[]
  // Optional — when absent (Contributor lens) the rows are read-only and don't navigate.
  onOpenGroup?: (groupId: string) => void
}) {
  const memberships = groupsForEntity(entity.id, groups)

  return (
    <div>
      <h3 className="mb-4 font-display text-[18px] font-bold leading-6 text-primary">Group memberships</h3>
      {memberships.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white px-6 py-5">
          <p className="text-[14px] leading-5 text-neutral-500">Not part of any group.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {memberships.map((g, i) => {
            const m = g.members.find((mm) => mm.entityId === entity.id)!
            const status = membershipStatus(m)
            const role =
              status === 'Pending'
                ? { label: 'Pending', tone: 'orange' as const }
                : m.representative
                  ? { label: 'Representative', tone: 'sky' as const }
                  : { label: 'Member', tone: 'gray' as const }
            const clickable = !!onOpenGroup
            const Row = clickable ? 'button' : 'div'
            return (
              <Row
                key={g.id}
                {...(clickable ? { type: 'button' as const, onClick: () => onOpenGroup!(g.id) } : {})}
                className={cn(
                  'flex w-full items-center justify-between gap-4 px-5 py-3 text-left',
                  clickable && 'hover:bg-neutral-50',
                  i < memberships.length - 1 && 'border-b border-neutral-100',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[14px] leading-5 text-neutral-900">{g.name}</span>
                  <Badge tone={groupTypeTone(g.type)} size="sm">
                    {g.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] leading-4 text-neutral-500">{memberRange(m)}</span>
                  <Badge tone={role.tone} size="sm">
                    {role.label}
                  </Badge>
                </div>
              </Row>
            )
          })}
        </div>
      )}
    </div>
  )
}
