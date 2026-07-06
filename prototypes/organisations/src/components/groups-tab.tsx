import { useState } from 'react'
import { Building2, ChevronDown, ChevronRight, Crown, MoreHorizontal, Plus, Trash2, UserPlus, X } from 'lucide-react'
import {
  Badge,
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  cn,
} from '@wts/ui'

import { LegalEntity } from './org-details-data'
import {
  ConsolidationStatus,
  Group,
  Member,
  activeMembers,
  consolidationTotal,
  groupStart,
  groupsForEntity,
  inactiveMembers,
  membershipStatus,
  memberLabel,
  representativeOf,
} from './org-details-data'

/* ─── helpers ────────────────────────────────────────────────────────────── */

const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const memberRange = (m: Member) =>
  m.validTo ? `${fmtDate(m.validFrom)} – ${fmtDate(m.validTo)}` : `Since ${fmtDate(m.validFrom)}`

// req §4 — VAT and CIT perimeters must NEVER be blended in any overview. Groups are always
// presented and counted per single type; keep any future summary strictly per-type.
const groupTypeTone = (t: Group['type']) => (t === 'VAT' ? 'blue' : 'violet')

const caseStatusTone = (s: ConsolidationStatus) =>
  s === 'In preparation' ? 'gray' : s === 'In review' ? 'orange' : s === 'Client Approval' ? 'blue' : 'green'

function entityName(entities: LegalEntity[], id: string) {
  return entities.find((e) => e.id === id)?.legalName ?? id
}

/* Small bordered card matching the entity detail column's DetailCard look. */
function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[15px] font-semibold leading-5 text-primary">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ─── Groups tab (master-detail) ─────────────────────────────────────────── */

export interface GroupsTabProps {
  groups: Group[]
  entities: LegalEntity[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddGroup: () => void
  onAddMembers: (group: Group) => void
  onRemoveMember: (groupId: string, entityId: string) => void
  onPromoteRep: (groupId: string, entityId: string) => void
  onCancelPending: (groupId: string, entityId: string) => void
  onOpenConsolidationCase: (group: Group) => void
  // V11-E — delete an entire group. Only surfaced when canManage is true; wrapped in a
  // ConfirmDialog confirmation inside GroupDetail before the callback fires.
  onDeleteGroup?: (groupId: string) => void
  // V7 — group.manage capability. When false the create/add-members/remove/promote/cancel
  // affordances are hidden; the panel is view-only.
  canManage?: boolean
}

export function GroupsTab({
  groups,
  entities,
  selectedId,
  onSelect,
  onAddGroup,
  onAddMembers,
  onRemoveMember,
  onPromoteRep,
  onCancelPending,
  onOpenConsolidationCase,
  onDeleteGroup,
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
      {/* Left: group list */}
      <div className="flex w-[288px] shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white">
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
        <div className="flex grow flex-col gap-2 overflow-auto p-3">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Building2 className="h-7 w-7 text-neutral-300" />
              <p className="text-[13px] leading-[18px] text-neutral-500">No groups yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {groups.map((g) => {
                const isSel = g.id === selectedId
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onSelect(g.id)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-md px-2.5 py-2 text-left transition-colors',
                      isSel ? 'bg-[rgba(200,16,46,0.1)] text-brand' : 'text-neutral-700 hover:bg-neutral-100',
                    )}
                  >
                    <span className="text-[14px] font-medium leading-5">{g.name}</span>
                    <span className="flex items-center gap-1.5">
                      <Badge tone={groupTypeTone(g.type)} size="sm">
                        {g.type}
                      </Badge>
                      <span className="text-[12px] leading-4 text-neutral-500">
                        {g.jurisdiction} · {activeMembers(g).length} active
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
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
            onAddMembers={onAddMembers}
            onRemoveMember={onRemoveMember}
            onPromoteRep={onPromoteRep}
            onCancelPending={onCancelPending}
            onOpenConsolidationCase={onOpenConsolidationCase}
            onDeleteGroup={onDeleteGroup}
            canManage={canManage}
          />
        )}
      </div>
    </div>
  )
}

function GroupDetail({
  group,
  entities,
  onAddMembers,
  onRemoveMember,
  onPromoteRep,
  onCancelPending,
  onOpenConsolidationCase,
  onDeleteGroup,
  canManage,
}: {
  group: Group
  entities: LegalEntity[]
  onAddMembers: (group: Group) => void
  onRemoveMember: (groupId: string, entityId: string) => void
  onPromoteRep: (groupId: string, entityId: string) => void
  onCancelPending: (groupId: string, entityId: string) => void
  onOpenConsolidationCase: (group: Group) => void
  onDeleteGroup?: (groupId: string) => void
  canManage: boolean
}) {
  const rep = representativeOf(group)
  const actives = activeMembers(group)
  const inactives = inactiveMembers(group)
  const start = groupStart(group)
  const isGermanVat = group.type === 'VAT' && group.jurisdiction === 'Germany'
  // V11-E — confirmation dialog state. One pending action at a time.
  const [confirm, setConfirm] = useState<
    | { kind: 'promote'; entityId: string; entityName: string }
    | { kind: 'remove'; entityId: string; entityName: string }
    | { kind: 'cancel'; entityId: string; entityName: string }
    | { kind: 'delete' }
    | null
  >(null)
  const runConfirmed = () => {
    if (!confirm) return
    if (confirm.kind === 'promote') onPromoteRep(group.id, confirm.entityId)
    else if (confirm.kind === 'remove') onRemoveMember(group.id, confirm.entityId)
    else if (confirm.kind === 'cancel') onCancelPending(group.id, confirm.entityId)
    else if (confirm.kind === 'delete') onDeleteGroup?.(group.id)
    setConfirm(null)
  }
  // Route "Cancel pending membership" through the shared confirmation dialog.
  const requestCancelPending = (_groupId: string, entityId: string) =>
    setConfirm({
      kind: 'cancel',
      entityId,
      entityName: entities.find((e) => e.id === entityId)?.legalName ?? entityId,
    })

  return (
    <div className="flex flex-col gap-8 px-8 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-[22px] font-bold leading-7 text-primary">{group.name}</h2>
            <Badge tone={groupTypeTone(group.type)} size="sm">
              {group.type}
            </Badge>
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12px] leading-4 text-neutral-600">
              {group.jurisdiction}
            </span>
          </div>
        {start && (
          <p className="text-[14px] leading-5 text-neutral-500">Active since {fmtDate(start)}</p>
        )}
        {isGermanVat && (
          <p className="text-[12px] leading-4 text-neutral-400">
            Known in Germany as an <span className="italic">Organschaft</span> — representative (Organträger),
            members (Organgesellschaften).
          </p>
        )}
        </div>
        {/* V11-E — group-level 3-dot menu with Delete group action. */}
        {/* modal={false} — the Delete item opens a ConfirmDialog; avoids Radix leaving
            `pointer-events: none` stuck on <body> when menu-close races dialog-open. */}
        {canManage && onDeleteGroup && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              aria-label={`Actions for group ${group.name}`}
              className="items-center flex justify-center w-8 h-8 text-neutral-500 hover:bg-neutral-100 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-200"
            >
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem
                onSelect={() => setConfirm({ kind: 'delete' })}
                className="text-brand focus:text-brand focus:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Representative callout */}
      {rep && (
        <div className="flex items-center gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
          <Crown className="h-4 w-4 shrink-0 text-sky-700" />
          <span className="text-[14px] leading-5 text-sky-900">
            <span className="font-medium">Representative:</span> {memberLabel(rep, entities)}
          </span>
        </div>
      )}

      {/* Consolidation case — read-only link out to Case Management (omitted when absent) */}
      {group.consolidationCase && (
        <button
          type="button"
          onClick={() => onOpenConsolidationCase(group)}
          className="flex w-full items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-6 text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-[14px] font-medium leading-5 text-neutral-900">
                {group.consolidationCase.name}
              </span>
              <Badge tone={caseStatusTone(group.consolidationCase.status)} size="sm">
                {group.consolidationCase.status}
              </Badge>
            </div>
            <span className="text-[13px] leading-[18px] text-neutral-500">
              {group.consolidationCase.completedCount} of {consolidationTotal(group)} member cases complete
            </span>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
        </button>
      )}

      {/* Members (active) */}
      <Card
        title="Members"
        action={
          canManage ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onAddMembers(group)}>
              <UserPlus className="size-4" /> Add members
            </Button>
          ) : null
        }
      >
        {actives.length === 0 ? (
          <p className="py-2 text-[14px] leading-5 text-neutral-500">No active members.</p>
        ) : (
          <div className="flex flex-col">
            {actives.map((m, i) => {
              const isRep = m.representative
              return (
                <div
                  key={m.entityId}
                  className={cn(
                    'flex items-center justify-between gap-4 py-3',
                    i < actives.length - 1 && 'border-b border-neutral-100',
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-[14px] leading-5 text-neutral-900">
                      {memberLabel(m, entities)}
                    </span>
                    <span className="text-[12px] leading-4 text-neutral-500">{memberRange(m)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {isRep ? (
                      <Badge tone="sky" size="sm">
                        Representative
                      </Badge>
                    ) : (
                      canManage && (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0"
                          onClick={() =>
                            setConfirm({ kind: 'promote', entityId: m.entityId, entityName: memberLabel(m, entities) })
                          }
                        >
                          Make representative
                        </Button>
                      )
                    )}
                    {canManage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={isRep}
                        title={
                          isRep
                            ? 'Promote another member to representative before removing this one.'
                            : 'Remove member'
                        }
                        aria-label="Remove member"
                        onClick={() =>
                          setConfirm({ kind: 'remove', entityId: m.entityId, entityName: memberLabel(m, entities) })
                        }
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* V10-D — Inactive members grouped by entity; the collapsed row shows the most
          recent period, and expanding reveals earlier periods (Pending or Ended) when an
          entity has been part of the group in multiple occasions. */}
      {inactives.length > 0 && (
        <Card title="Inactive members">
          <InactiveMembersList
            inactives={inactives}
            entities={entities}
            groupId={group.id}
            canManage={canManage}
            onCancelPending={requestCancelPending}
          />
        </Card>
      )}

      {/* V11-E / V12 — shared confirmation dialog for representative promotion,
          member removal, pending-membership cancellation, and group deletion. */}
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        onConfirm={runConfirmed}
        destructive={confirm?.kind !== 'promote'}
        title={
          confirm?.kind === 'promote'
            ? 'Change representative?'
            : confirm?.kind === 'remove'
              ? 'Remove member?'
              : confirm?.kind === 'cancel'
                ? 'Cancel pending membership?'
                : 'Delete group?'
        }
        confirmLabel={
          confirm?.kind === 'promote'
            ? 'Change representative'
            : confirm?.kind === 'remove'
              ? 'Remove member'
              : confirm?.kind === 'cancel'
                ? 'Cancel membership'
                : 'Delete group'
        }
        description={
          <>
            {confirm?.kind === 'promote' && (
              <>
                {confirm.entityName} will become the representative of {group.name}.{' '}
                The current representative ({rep ? memberLabel(rep, entities) : '—'}) will be demoted.
              </>
            )}
            {confirm?.kind === 'remove' && (
              <>
                {confirm.entityName}'s membership in {group.name} will end today. They will move to
                the Inactive members list as a past member.
              </>
            )}
            {confirm?.kind === 'cancel' && (
              <>
                The pending membership for {confirm.entityName} in {group.name} will be cancelled.
                This scheduled membership will not take effect.
              </>
            )}
            {confirm?.kind === 'delete' && (
              <>
                {group.name} will be permanently removed, including its member history. This cannot
                be undone.
              </>
            )}
          </>
        }
      />
    </div>
  )
}

/* V10-D — inactive-members list grouped by entity. The collapsed row shows the most
   recent period (Pending or Ended); expanding reveals prior periods for the same entity
   when it has been part of the group in multiple stretches. */
function InactiveMembersList({
  inactives,
  entities,
  groupId,
  canManage,
  onCancelPending,
}: {
  inactives: Member[]
  entities: LegalEntity[]
  groupId: string
  canManage: boolean
  onCancelPending: (groupId: string, entityId: string) => void
}) {
  // Group by entity, then sort periods newest-first.
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
    <div className="flex flex-col">
      {entityRows.map(([entityId, periods], rowIdx) => (
        <EntityInactiveRow
          key={entityId}
          entityId={entityId}
          periods={periods}
          entities={entities}
          groupId={groupId}
          canManage={canManage}
          onCancelPending={onCancelPending}
          isLast={rowIdx === entityRows.length - 1}
        />
      ))}
    </div>
  )
}

function EntityInactiveRow({
  entityId,
  periods,
  entities,
  groupId,
  canManage,
  onCancelPending,
  isLast,
}: {
  entityId: string
  periods: Member[]
  entities: LegalEntity[]
  groupId: string
  canManage: boolean
  onCancelPending: (groupId: string, entityId: string) => void
  isLast: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [most, ...rest] = periods
  const hasHistory = rest.length > 0
  const entityName = entities.find((e) => e.id === entityId)?.legalName ?? entityId

  const renderPeriod = (m: Member, showEntityName: boolean) => {
    const status = membershipStatus(m)
    const ended = status === 'Ended'
    return (
      <div className={cn('flex items-center justify-between gap-4 py-2', ended && 'opacity-60')}>
        <div className="flex flex-col">
          {showEntityName && (
            <span className="text-[14px] leading-5 text-neutral-900">{memberLabel(m, entities)}</span>
          )}
          <span className="text-[12px] leading-4 text-neutral-500">{memberRange(m)}</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={status === 'Pending' ? 'orange' : 'gray'} size="sm">
            {status}
          </Badge>
          {status === 'Pending' && canManage && (
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-neutral-500"
              onClick={() => onCancelPending(groupId, m.entityId)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(!isLast && 'border-b border-neutral-100', 'py-2')}>
      {/* Collapsed / summary row */}
      <div className="flex items-center gap-3">
        {hasHistory ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse history' : 'Expand history'}
            className="items-center flex justify-center w-6 h-6 -ml-1 text-neutral-500 hover:bg-neutral-100 rounded-md"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-5" aria-hidden />
        )}
        <div className="grow">{renderPeriod(most, true)}</div>
      </div>
      {/* Expanded prior periods for the same entity */}
      {expanded && hasHistory && (
        <div className="pl-6 mt-1 border-l-2 border-neutral-100 ml-2">
          <p className="text-[11px] leading-4 text-neutral-400 uppercase tracking-wide mb-1">
            Earlier periods for {entityName}
          </p>
          {rest.map((m, i) => (
            <div key={`${m.entityId}-${m.validFrom}-${i}`}>{renderPeriod(m, false)}</div>
          ))}
        </div>
      )}
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
  onOpenGroup: (groupId: string) => void
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
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onOpenGroup(g.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-4 px-5 py-3 text-left hover:bg-neutral-50',
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
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
