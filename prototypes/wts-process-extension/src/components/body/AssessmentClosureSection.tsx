import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  Clock4,
  Download,
  EyeOff,
  File,
  Flag,
  History,
  Landmark,
  Plus,
  Search,
  StickyNote,
  TimerReset,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'

import { Button } from '@wts/ui'
import { Separator } from '@wts/ui'
import { AddItemDialog } from '@/components/body/AddItemDialog'
import { ApproveDialog } from '@/components/body/ApproveDialog'
import {
  CommentsAffordance,
  type AssessmentComment,
} from '@/components/body/CommentsThread'
import { ObjectionDialog } from '@/components/body/ObjectionDialog'
import { RemoveItemDialog } from '@/components/body/RemoveItemDialog'
import { ReturnDialog } from '@/components/body/ReturnDialog'
import { packageFileNameForProcess } from '@/config/packageBanners'
import { SAMPLE_PEOPLE } from '@/config/sampleData'
import { cn } from '@wts/ui'
import type { AssessmentsState } from '@/store/useDemoStore'
import type { Role } from '@/types'

const CREATOR_NAME = SAMPLE_PEOPLE.creator ?? 'Creator'
const REVIEWER_NAME = SAMPLE_PEOPLE.reviewer ?? 'Reviewer'
const REVIEWER_FIRST_NAME = REVIEWER_NAME.split(' ')[0] ?? REVIEWER_NAME

/** Action the creator proposed; drives the review-stage badge + confirmation. */
type ProposedAction = 'approve' | 'object'

type AssessmentStatus = 'arrived' | 'review' | 'done'

type AssessmentGroupLabel = 'Federal' | 'Municipal'

interface AssessmentItem {
  id: string
  group: AssessmentGroupLabel
  authority: string
  /** Display string "Received: DD.MM.YYYY." — drives the objection window. */
  received?: string
  status: AssessmentStatus
  /** Set once the creator proposes an action (moves the item to "review"). */
  proposedAction?: ProposedAction
  /** An approval that carries a minor flag into next year. */
  flagged?: boolean
  resolution?: { kind: 'objection' | 'matched'; label: string }
  /**
   * An objection runs as a separate case with its own handling window. Once
   * that window lapses unhandled, the assessment becomes final (the client
   * must pay the assessed tax).
   */
  objectionExpired?: boolean
  /** Note left by the creator when flagging an approval or objecting. */
  note?: { kind: 'flag' | 'object'; text: string }
  /** Reviewer returned the item for changes (clears on re-submit). */
  returned?: boolean
  /** Item-level comment thread (returns, future notes). */
  comments?: AssessmentComment[]
  files?: string[]
}

/**
 * Documents accrue across an item's lifecycle:
 * - Arrived: the original tax assessment only (1 file).
 * - Under review / resolved (approve or object): + the clean copy for the
 *   client (2 files). The objection letter is uploaded later, at the
 *   objection-case stage, so it is not collected here.
 */
const ORIGINAL_ASSESSMENT_FILE = 'Tax assessment.pdf'
const CLEAN_ASSESSMENT_FILE = 'Tax assessment (no yellow pages).pdf'

const BASE_ITEMS: AssessmentItem[] = [
  {
    id: 'federal-1',
    group: 'Federal',
    authority: 'Körperschaftsteuer 2025',
    received: 'Received: 04.06.2026.',
    status: 'review',
    proposedAction: 'approve',
    files: [ORIGINAL_ASSESSMENT_FILE, CLEAN_ASSESSMENT_FILE],
  },
  {
    id: 'municipal-berlin',
    group: 'Municipal',
    authority: 'Stadtverwaltung Berlin',
    received: 'Received: 30.05.2026.',
    status: 'arrived',
    returned: true,
    comments: [
      {
        author: REVIEWER_NAME,
        role: 'Reviewer',
        text: 'The trade tax rate looks off versus the working sheet — please re-check before approving.',
        time: '2026-06-08T09:24:00',
        type: 'return',
      },
    ],
    files: [ORIGINAL_ASSESSMENT_FILE],
  },
  {
    id: 'municipal-hamburg',
    group: 'Municipal',
    authority: 'Landkreis Hamburg',
    received: 'Received: 24.05.2026.',
    status: 'done',
    resolution: { kind: 'objection', label: 'Objection created / OBJ_ID-2142' },
    note: {
      kind: 'object',
      text: 'Trade tax base deviates from our computation by EUR 8,200 — objection filed to correct the assessed figure.',
    },
    files: [ORIGINAL_ASSESSMENT_FILE, CLEAN_ASSESSMENT_FILE],
  },
  {
    id: 'municipal-koeln',
    group: 'Municipal',
    authority: 'Stadt Köln',
    received: 'Received: 06.06.2026.',
    status: 'review',
    proposedAction: 'approve',
    flagged: true,
    note: {
      kind: 'flag',
      text: 'Rounding difference of EUR 60 — immaterial this year, carry the note into next year.',
    },
    files: [ORIGINAL_ASSESSMENT_FILE, CLEAN_ASSESSMENT_FILE],
  },
  {
    id: 'municipal-stuttgart',
    group: 'Municipal',
    authority: 'Stadt Stuttgart',
    received: 'Received: 02.02.2026.',
    status: 'done',
    resolution: { kind: 'objection', label: 'Objection created / OBJ_ID-2088' },
    objectionExpired: true,
    note: {
      kind: 'object',
      text: 'Trade tax base overstated by EUR 11,400 — objection filed to correct the assessed figure.',
    },
    files: [ORIGINAL_ASSESSMENT_FILE, CLEAN_ASSESSMENT_FILE],
  },
]

const GROUP_ORDER: AssessmentGroupLabel[] = ['Federal', 'Municipal']

/** Format an ISO date (yyyy-mm-dd) as the display form "dd.mm.yyyy.". */
function formatReceived(iso: string): string {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${day}.${month}.${year}.`
}

/** Objection window length: four weeks from the received date. */
const OBJECTION_WINDOW_DAYS = 28

type WindowTone = 'blue' | 'amber' | 'red' | 'missed' | 'none'

interface ObjectionWindow {
  /** Badge label, e.g. "12d", or "-" once the window has elapsed. */
  label: string
  tone: WindowTone
  /** True when the four-week window has passed (objection no longer possible). */
  missed: boolean
}

/** Parse a "Received: DD.MM.YYYY." display string into a Date. */
function parseReceivedDate(received?: string): Date | null {
  if (!received) return null
  const match = received.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (!match) return null
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
}

/**
 * Objection window = 4 weeks from the received date. Blue when fresh, amber
 * with two weeks left, red within the final week, missed once it has elapsed.
 */
function objectionWindow(received?: string): ObjectionWindow {
  const date = parseReceivedDate(received)
  if (!date) return { label: '—', tone: 'none', missed: false }
  const deadline = new Date(date)
  deadline.setDate(deadline.getDate() + OBJECTION_WINDOW_DAYS)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysRemaining = Math.ceil(
    (deadline.getTime() - today.getTime()) / 86_400_000,
  )
  if (daysRemaining <= 0) return { label: '-', tone: 'missed', missed: true }
  const label = `${daysRemaining}d`
  if (daysRemaining <= 7) return { label, tone: 'red', missed: false }
  if (daysRemaining <= 14) return { label, tone: 'amber', missed: false }
  return { label, tone: 'blue', missed: false }
}

const PROPOSED_LABEL: Record<ProposedAction, string> = {
  approve: 'Proposed: Approve',
  object: 'Proposed: Object',
}

/** Reviewer confirmation button copy — mirrors the creator's proposal. */
const CONFIRM_LABEL: Record<ProposedAction, string> = {
  approve: 'Confirm approval',
  object: 'Confirm objection',
}

const CONFIRM_CLASS: Record<ProposedAction, string> = {
  object: 'bg-red-600 text-white hover:bg-red-700',
  approve: 'bg-green-600 text-white hover:bg-green-700',
}

/** Renders the icon matching an action's button (Approve / Object). */
function ActionIcon({
  action,
  className,
}: {
  action: ProposedAction
  className?: string
}) {
  if (action === 'approve') return <Check className={className} aria-hidden />
  return <X className={className} aria-hidden />
}

/** Resolve a confirmed proposal into a final resolution badge. */
function resolutionForAction(
  action: ProposedAction,
): NonNullable<AssessmentItem['resolution']> {
  if (action === 'object')
    return { kind: 'objection', label: 'Objection created / OBJ_ID-2142' }
  return { kind: 'matched', label: 'Approved' }
}

type TabId = 'all' | 'arrived' | 'review' | 'resolved'

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'arrived', label: 'Arrived' },
  { id: 'review', label: 'Under review' },
  { id: 'resolved', label: 'Resolved' },
]

/** Maps an assessment item to the tab it belongs to. */
function tabForItem(item: AssessmentItem): Exclude<TabId, 'all'> {
  if (item.status === 'arrived') return 'arrived'
  if (item.status === 'done') return 'resolved'
  return 'review'
}

/** When all assessments are marked done, every item resolves to "matched". */
function withAllDone(item: AssessmentItem): AssessmentItem {
  if (item.status === 'done') return item
  return {
    ...item,
    status: 'done',
    proposedAction: undefined,
    returned: undefined,
    received: item.received ?? 'Received: 13.03.2026.',
    resolution: item.resolution ?? { kind: 'matched', label: 'Approved' },
    // A matched (approved) assessment carries the original plus the clean
    // client copy the creator uploaded on sign-off.
    files: [item.files?.[0] ?? ORIGINAL_ASSESSMENT_FILE, CLEAN_ASSESSMENT_FILE],
  }
}

/** Reset an item to the freshly-arrived state (awaiting a review decision). */
function withArrived(item: AssessmentItem): AssessmentItem {
  return {
    ...item,
    status: 'arrived',
    proposedAction: undefined,
    flagged: undefined,
    note: undefined,
    returned: undefined,
    objectionExpired: undefined,
    // Fresh items have no review history yet, so drop any seeded comments.
    comments: undefined,
    received: item.received ?? 'Received: 13.03.2026.',
    resolution: undefined,
    // A freshly-arrived item only has the original tax assessment on file.
    files: [item.files?.[0] ?? ORIGINAL_ASSESSMENT_FILE],
  }
}

function resolveItems(
  items: AssessmentItem[],
  state: AssessmentsState,
): AssessmentItem[] {
  if (state === 'empty') return []
  if (state === 'done') return items.map(withAllDone)
  if (state === 'arrived') return items.map(withArrived)
  return items.map((item) => ({ ...item }))
}

function countForTab(items: AssessmentItem[], tab: TabId): number {
  if (tab === 'all') return items.length
  return items.filter((item) => tabForItem(item) === tab).length
}

function filterItems(items: AssessmentItem[], tab: TabId): AssessmentItem[] {
  if (tab === 'all') return items
  return items.filter((item) => tabForItem(item) === tab)
}

/** Case-insensitive match across authority, group, dates, files, and notes. */
function matchesSearch(item: AssessmentItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [
    item.authority,
    item.group,
    item.received,
    item.resolution?.label,
    item.note?.text,
    ...(item.files ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}

interface AssessmentClosureSectionProps {
  role: Role
  /** Demo control: how items resolve (drives counts + Close case gate). */
  assessmentsState?: AssessmentsState
}

/**
 * CIT Assessment & Closure phase body (Figma 9390:39865).
 * Creator can act (attach / match / object); reviewer and partner are read-only.
 */
export function AssessmentClosureSection({
  role,
  assessmentsState = 'mixed',
}: AssessmentClosureSectionProps) {
  const canEdit = role === 'creator'
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [addItemOpen, setAddItemOpen] = useState(false)

  // Live, interactive item state. Reset whenever the demo control changes.
  const baseItems = useMemo(
    () => resolveItems(BASE_ITEMS, assessmentsState),
    [assessmentsState],
  )
  const [items, setItems] = useState<AssessmentItem[]>(baseItems)
  useEffect(() => {
    setItems(baseItems)
  }, [baseItems])

  /**
   * Creator proposes an action → moves the item into review. Re-submitting
   * clears any prior "returned" mark (the comment history is kept).
   */
  const proposeAction = (
    id: string,
    action: ProposedAction,
    opts?: {
      note?: string
      flagged?: boolean
      cleanAssessment?: string | null
    },
  ) => {
    const note = opts?.note?.trim()
    const flagged = action === 'approve' && Boolean(opts?.flagged)
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        // Carry the original assessment forward and add the clean client copy
        // the creator uploads on sign-off (both approve and object). The
        // objection letter is added later, at the objection-case stage.
        const original = item.files?.[0] ?? ORIGINAL_ASSESSMENT_FILE
        const clean = opts?.cleanAssessment ?? CLEAN_ASSESSMENT_FILE
        const files = [original, clean]
        return {
          ...item,
          status: 'review',
          proposedAction: action,
          returned: false,
          flagged: action === 'approve' ? flagged : undefined,
          note:
            note && (action === 'object' || flagged)
              ? { kind: action === 'object' ? 'object' : 'flag', text: note }
              : undefined,
          files,
        }
      }),
    )
  }

  /** Creator withdraws their own proposal — silent, no comment. */
  const recallItem = (id: string) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'arrived',
              proposedAction: undefined,
              flagged: undefined,
              note: undefined,
              // Back to arrived → only the original assessment remains.
              files: [item.files?.[0] ?? ORIGINAL_ASSESSMENT_FILE],
            }
          : item,
      ),
    )

  /** Reviewer returns the item with a required reason → seeds the thread. */
  const returnItem = (id: string, reason: string) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'arrived',
              proposedAction: undefined,
              flagged: undefined,
              note: undefined,
              returned: true,
              // Back to arrived → only the original assessment remains.
              files: [item.files?.[0] ?? ORIGINAL_ASSESSMENT_FILE],
              comments: [
                ...(item.comments ?? []),
                {
                  author: REVIEWER_NAME,
                  role: 'Reviewer',
                  text: reason,
                  time: new Date().toISOString(),
                  type: 'return' as const,
                },
              ],
            }
          : item,
      ),
    )

  /** Reviewer confirms the proposed action → resolves the item. */
  const confirmItem = (id: string) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.proposedAction
          ? {
              ...item,
              status: 'done',
              resolution: resolutionForAction(item.proposedAction),
              proposedAction: undefined,
              returned: false,
            }
          : item,
      ),
    )
  const deleteItem = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id))

  /** Add a freshly-arrived assessment item from the Add item form. */
  const addItem = (payload: {
    level: AssessmentGroupLabel
    authority: string
    dateReceived: string
    fileNames: string[]
  }) =>
    setItems((prev) => [
      ...prev,
      {
        id: `${payload.level.toLowerCase()}-${Date.now()}`,
        group: payload.level,
        authority: payload.authority,
        received: payload.dateReceived
          ? `Received: ${formatReceived(payload.dateReceived)}`
          : undefined,
        status: 'arrived',
        files: payload.fileNames.length ? payload.fileNames : undefined,
      },
    ])

  // The client never sees the internal "under review" stage: while an item is
  // mid-review it shows as freshly Arrived, then moves to Resolved once the
  // reviewer confirms the outcome.
  const isClient = role === 'client'
  const scopedItems = isClient
    ? items.map((item) => (item.status === 'review' ? withArrived(item) : item))
    : items
  const hasSearchQuery = searchQuery.trim().length > 0
  const visibleItems = useMemo(() => {
    const tabItems = filterItems(scopedItems, activeTab)
    if (!hasSearchQuery) return tabItems
    return tabItems.filter((item) => matchesSearch(item, searchQuery))
  }, [scopedItems, activeTab, searchQuery, hasSearchQuery])
  const hasResults = visibleItems.length > 0
  const isEmpty = scopedItems.length === 0
  // On the client overview (All), always show both authority groups — an empty
  // group keeps its header with a placeholder so outstanding work is visible.
  const showEmptyGroups = isClient && activeTab === 'all' && !hasSearchQuery

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <DataPackageBanner hideVersionHistory={isClient} />
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,520px),1fr))]">
          <SubmissionFileCard name="Submission receipt.pdf" size="3.7MB" />
          <SubmissionFileCard name="Additional document.pdf" size="3.7MB" />
        </div>
      </div>

      {!isClient && <InfoToast />}

      {isEmpty ? (
        <EmptyAssessments
          role={role}
          canEdit={canEdit}
          onAddItem={() => setAddItemOpen(true)}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              activeTab={activeTab}
              onSelect={setActiveTab}
              items={scopedItems}
              hideReview={isClient}
            />
            <div className="flex items-center gap-2">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
              />
              {canEdit && (
                <Button
                  variant="outline"
                  size="default"
                  className="gap-2"
                  onClick={() => setAddItemOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              )}
            </div>
          </div>

          {GROUP_ORDER.map((group) => {
            const groupItems = visibleItems.filter(
              (item) => item.group === group,
            )
            if (groupItems.length === 0 && !showEmptyGroups) return null
            return (
              <AssessmentGroup
                key={group}
                label={group}
                items={groupItems}
                role={role}
                emptyHint={
                  groupItems.length === 0
                    ? 'No assessments here yet.'
                    : undefined
                }
                onPropose={proposeAction}
                onRecall={recallItem}
                onReturn={returnItem}
                onConfirm={confirmItem}
                onDelete={deleteItem}
              />
            )
          })}
          {!hasResults && hasSearchQuery && (
            <SearchEmptyState
              query={searchQuery}
              onClear={() => setSearchQuery('')}
            />
          )}
          {!hasResults && !hasSearchQuery && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No assessments in this view.
            </p>
          )}
        </>
      )}

      {canEdit && (
        <AddItemDialog
          open={addItemOpen}
          onClose={() => setAddItemOpen(false)}
          onSubmit={addItem}
        />
      )}
    </div>
  )
}

function SearchInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex h-9 w-[220px] items-center gap-1 rounded-md border border-input bg-background px-3 shadow-header-sm">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search"
        aria-label="Search assessments"
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  )
}

function SearchEmptyState({
  query,
  onClear,
}: {
  query: string
  onClear: () => void
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-md border border-border bg-card shadow-header-sm">
        <Search className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-semibold text-foreground">No results found</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Nothing matches{' '}
          <span className="font-medium text-foreground">&ldquo;{query.trim()}&rdquo;</span>.
          Try a different authority, municipality, or file name.
        </p>
      </div>
      <Button variant="outline" size="default" onClick={onClear}>
        Clear search
      </Button>
    </div>
  )
}

/** Role-specific empty state shown when no assessment items exist yet (Figma 308:2393). */
function EmptyAssessments({
  role,
  canEdit,
  onAddItem,
}: {
  role: Role
  canEdit: boolean
  onAddItem: () => void
}) {
  const copy =
    role === 'client'
      ? {
          title: 'No tax assessments yet',
          body: 'Once your advisor logs an assessment from the tax authority, it will appear here — grouped by authority, with its status.',
        }
      : role === 'creator'
        ? {
            title: 'No tax assessments yet',
            body: 'Add each one as you receive it. It shows up here, grouped by authority and ready to review.',
          }
        : {
            title: 'No tax assessments yet',
            body: 'Nothing here yet. Once the creator logs an assessment, it will appear here, grouped by authority with its status.',
          }

  return (
    <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center gap-6 rounded-lg border border-dashed border-border p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-md border border-border bg-card shadow-header-sm">
        <Landmark className="h-6 w-6 text-foreground" aria-hidden />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-xl font-semibold leading-7 text-foreground">
          {copy.title}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">{copy.body}</p>
      </div>
      {canEdit && (
        <Button size="default" className="gap-2" onClick={onAddItem}>
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      )}
    </div>
  )
}

function DataPackageBanner({
  hideVersionHistory = false,
}: {
  hideVersionHistory?: boolean
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border border-l-[6px] border-l-sky-600 bg-muted px-4 py-4 shadow-header-base sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Data Package</p>
        <p className="truncate text-sm text-muted-foreground">
          {packageFileNameForProcess('cit')}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-4">
        {!hideVersionHistory && (
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 text-sm font-medium text-[hsl(var(--link))] hover:underline"
          >
            <History className="h-4 w-4" aria-hidden />
            Version history
          </button>
        )}
        <Button variant="outline" size="default" className="gap-2">
          <Download className="h-4 w-4" aria-hidden />
          Download package
        </Button>
      </div>
    </div>
  )
}

/** Figma 2249:140259 — downloadable submission file (receipt + additional docs). */
function SubmissionFileCard({ name, size }: { name: string; size: string }) {
  return (
    <div className="flex h-16 items-center gap-3 rounded-lg bg-muted px-4">
      <File className="h-8 w-8 shrink-0 text-foreground" strokeWidth={1.5} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{size}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 shrink-0 gap-2 px-3 text-xs"
      >
        <Download className="h-4 w-4" aria-hidden />
        Download
      </Button>
    </div>
  )
}

/** Demo: when the return was submitted (start of the Assessment phase). */
const SUBMISSION_DATE = new Date('2026-02-10T00:00:00')

function formatElapsed(days: number): string {
  if (days <= 0) return 'today'
  if (days < 7) return `${days} day${days === 1 ? '' : 's'}`
  const weeks = Math.floor(days / 7)
  const remDays = days % 7
  const weekLabel = `${weeks} week${weeks === 1 ? '' : 's'}`
  if (remDays === 0) return weekLabel
  return `${weekLabel}, ${remDays} day${remDays === 1 ? '' : 's'}`
}

function InfoToast() {
  const now = new Date()
  const days = Math.max(
    0,
    Math.floor((now.getTime() - SUBMISSION_DATE.getTime()) / 86_400_000),
  )

  return (
    <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-4">
      <TimerReset className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium text-sky-900">
          In assessment for {formatElapsed(days)}
        </p>
        <p className="text-sm text-sky-800">
          Assessments arrive over weeks to months, each with a four-week
          objection window. The client sees a decision only after the reviewer
          confirms it.
        </p>
      </div>
    </div>
  )
}

/** Amber note left by the creator when flagging or objecting an assessment. */
function NoteBanner({ note }: { note: NonNullable<AssessmentItem['note']> }) {
  const title = note.kind === 'flag' ? 'Flag note' : 'Objection note'
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <StickyNote className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium text-amber-900">{title}</p>
        <p className="whitespace-pre-wrap break-words text-sm text-amber-800">
          {note.text}
        </p>
      </div>
    </div>
  )
}

/**
 * Shown when an objection's handling window lapses without resolution: the
 * assessment becomes final and the client must pay the assessed tax.
 */
function ObjectionClosedBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
      <p className="min-w-0 text-sm text-red-800">
        Objection window closed — the objection wasn’t handled in time, so the
        assessment is now final. The client must pay the tax stated in the
        assessment.
      </p>
    </div>
  )
}

function Tabs({
  activeTab,
  onSelect,
  items,
  hideReview = false,
}: {
  activeTab: TabId
  onSelect: (tab: TabId) => void
  items: AssessmentItem[]
  hideReview?: boolean
}) {
  const tabs = hideReview ? TABS.filter((tab) => tab.id !== 'review') : TABS
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        const count = countForTab(items, tab.id)
        const isDisabled = count === 0 && !isActive
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-pressed={isActive}
            disabled={isDisabled}
            className={cn(
              'flex min-w-[120px] items-center justify-center gap-2 rounded-md px-3 py-1 transition-colors',
              isActive
                ? 'bg-background shadow-header-base'
                : 'hover:bg-background/50',
              isDisabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
            )}
          >
            <span
              className={cn(
                'text-sm font-medium',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {tab.label}
            </span>
            <span className="flex items-center justify-center rounded-md bg-input p-1 text-xs leading-none text-foreground">
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

interface ItemActions {
  onPropose: (
    id: string,
    action: ProposedAction,
    opts?: {
      note?: string
      flagged?: boolean
      cleanAssessment?: string | null
    },
  ) => void
  onRecall: (id: string) => void
  onReturn: (id: string, reason: string) => void
  onConfirm: (id: string) => void
  onDelete: (id: string) => void
}

function AssessmentGroup({
  label,
  items,
  role,
  emptyHint,
  ...actions
}: {
  label: string
  items: AssessmentItem[]
  role: Role
  emptyHint?: string
} & ItemActions) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-6 pb-2 pt-4">
        <p className="text-sm font-semibold tracking-[0.16px] text-foreground">
          {label}
        </p>
        <Separator className="flex-1" />
      </div>
      {items.length === 0 && emptyHint ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyHint}
        </div>
      ) : (
        items.map((item) => (
          <AssessmentCard key={item.id} item={item} role={role} {...actions} />
        ))
      )}
    </div>
  )
}

function AssessmentCard({
  item,
  role,
  onPropose,
  onRecall,
  onReturn,
  onConfirm,
  onDelete,
}: {
  item: AssessmentItem
  role: Role
} & ItemActions) {
  const [expanded, setExpanded] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [objectionOpen, setObjectionOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const isCreator = role === 'creator'
  const isReviewer = role === 'reviewer'
  // The client sees a clean read-only view — internal review threads, returns,
  // and the amber "returned" accent are hidden.
  const isClient = role === 'client'
  // The client only receives the clean copy (yellow pages removed); the
  // internal original assessment is never exposed to them.
  const visibleFiles = isClient
    ? (item.files ?? []).filter((file) => file !== ORIGINAL_ASSESSMENT_FILE)
    : (item.files ?? [])
  const hasFiles = visibleFiles.length > 0
  const hasNote = Boolean(item.note?.text)
  const canExpand = hasFiles || hasNote
  const window = objectionWindow(item.received)
  const comments = item.comments ?? []
  const returnedBy = item.returned ? REVIEWER_FIRST_NAME : undefined

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card shadow-header-sm',
        item.returned && !isClient && 'border-l-[3px] border-l-amber-400',
        item.objectionExpired && 'border-l-[3px] border-l-red-500',
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="flex w-14 shrink-0 items-start">
          <StatusBadge
            status={item.status}
            window={window}
            resolutionKind={item.resolution?.kind}
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Landmark className="h-6 w-6 shrink-0 text-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {item.authority}
            </p>
            {item.received && (
              <p className="truncate text-sm text-muted-foreground opacity-90">
                {item.received}
              </p>
            )}
          </div>
        </div>

        {/* Resolved → outcome badge (with an amber flag chip if flagged). */}
        {item.status === 'done' && item.resolution && (
          <div className="flex shrink-0 items-center gap-3">
            {!isClient && <CommentsAffordance comments={comments} />}
            {item.flagged && <FlagChip />}
            <ResolutionBadge resolution={item.resolution} />
          </div>
        )}

        {/* Arrived → creator decides; everyone else waits on the creator. */}
        {item.status === 'arrived' && (
          <div className="flex shrink-0 items-center gap-2">
            {isReviewer && (
              <span className="text-sm text-muted-foreground">
                Awaiting {CREATOR_NAME}
              </span>
            )}
            {!isClient && (
              <CommentsAffordance comments={comments} returnedBy={returnedBy} />
            )}
            {isCreator && (
              <>
                <Button
                  variant="outline"
                  size="default"
                  className="h-8 w-[120px] gap-2 text-green-600"
                  onClick={() => setApproveOpen(true)}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className={cn(
                    'h-8 w-[120px] gap-2 text-destructive',
                    window.missed && 'opacity-50',
                  )}
                  disabled={window.missed}
                  title={
                    window.missed
                      ? 'Objection window has closed (4 weeks from received date).'
                      : undefined
                  }
                  onClick={() => setObjectionOpen(true)}
                >
                  <X className="h-4 w-4" />
                  Object
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  aria-label="Delete assessment"
                  onClick={() => setRemoveOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Review → proposal pending the reviewer's confirmation. */}
        {item.status === 'review' && item.proposedAction && (
          <div className="flex shrink-0 items-center gap-3">
            {isCreator && (
              <span className="text-sm text-muted-foreground">
                Waiting for {REVIEWER_NAME}
              </span>
            )}
            <CommentsAffordance comments={comments} />
            {item.flagged && <FlagChip />}
            <ProposedBadge action={item.proposedAction} />
            {isReviewer ? (
              <>
                <Button
                  variant="outline"
                  size="default"
                  className="h-8 gap-2"
                  onClick={() => setReturnOpen(true)}
                >
                  <Undo2 className="h-4 w-4" />
                  Return
                </Button>
                <Button
                  size="default"
                  className={cn('h-8 gap-2', CONFIRM_CLASS[item.proposedAction])}
                  onClick={() => onConfirm(item.id)}
                >
                  <ActionIcon
                    action={item.proposedAction}
                    className="h-4 w-4"
                  />
                  {CONFIRM_LABEL[item.proposedAction]}
                </Button>
              </>
            ) : (
              isCreator && (
                <Button
                  variant="outline"
                  size="default"
                  className="h-8 gap-2"
                  onClick={() => onRecall(item.id)}
                >
                  <Undo2 className="h-4 w-4" />
                  Recall
                </Button>
              )
            )}
          </div>
        )}

        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
            />
          </button>
        )}
      </div>

      {(item.objectionExpired || (canExpand && expanded)) && (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {item.objectionExpired && <ObjectionClosedBanner />}
          {canExpand && expanded && (
            <>
              {item.note?.text && <NoteBanner note={item.note} />}
              {visibleFiles.map((file) => (
                <FileRow
                  key={file}
                  name={file}
                  internal={!isClient && file === ORIGINAL_ASSESSMENT_FILE}
                />
              ))}
            </>
          )}
        </div>
      )}

      {isCreator && (
        <>
          <ApproveDialog
            open={approveOpen}
            onClose={() => setApproveOpen(false)}
            authority={item.authority}
            onSubmit={({ flagged, note, cleanAssessment }) =>
              onPropose(item.id, 'approve', { flagged, note, cleanAssessment })
            }
          />
          <ObjectionDialog
            open={objectionOpen}
            onClose={() => setObjectionOpen(false)}
            authority={item.authority}
            received={item.received}
            onSubmit={({ comment, cleanAssessment }) =>
              onPropose(item.id, 'object', {
                note: comment,
                cleanAssessment,
              })
            }
          />
          <RemoveItemDialog
            open={removeOpen}
            onClose={() => setRemoveOpen(false)}
            itemName={item.authority}
            onConfirm={() => onDelete(item.id)}
          />
        </>
      )}

      {isReviewer && (
        <ReturnDialog
          open={returnOpen}
          onClose={() => setReturnOpen(false)}
          authority={item.authority}
          creatorName={CREATOR_NAME}
          onSubmit={({ reason }) => onReturn(item.id, reason)}
        />
      )}
    </div>
  )
}

function FileRow({ name, internal = false }: { name: string; internal?: boolean }) {
  return (
    <div className="flex items-center rounded-md bg-muted">
      <p className="min-w-0 flex-1 truncate px-4 py-3 text-sm text-foreground">
        {name}
      </p>
      <div className="flex items-center gap-2 px-2">
        {internal && <InternalFileBadge />}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 shrink-0 gap-2 px-3"
          aria-label={`Download ${name}`}
        >
          <Download className="h-4 w-4" aria-hidden />
          Download
        </Button>
      </div>
    </div>
  )
}

/** Marks the item-creation file as internal-only, with a styled hover tooltip. */
function InternalFileBadge() {
  return (
    <span className="group relative inline-flex shrink-0">
      <span
        tabIndex={0}
        className="inline-flex cursor-help items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <EyeOff className="h-3.5 w-3.5" aria-hidden />
        Not visible to client
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[260px] -translate-x-1/2 translate-y-1 whitespace-normal rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium leading-snug text-white opacity-0 shadow-md transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        This file stays internal. The client only sees the file you upload when
        you approve or object.
      </span>
    </span>
  )
}

const WINDOW_TONE_CLASS: Record<WindowTone, string> = {
  blue: 'border-blue-200 bg-blue-100 text-blue-950',
  amber: 'border-amber-200 bg-amber-100 text-amber-900',
  red: 'border-red-200 bg-red-100 text-red-950',
  missed: 'border-border bg-muted text-muted-foreground',
  none: 'border-border bg-muted text-muted-foreground',
}

function StatusBadge({
  status,
  window,
  resolutionKind,
}: {
  status: AssessmentStatus
  window: ObjectionWindow
  resolutionKind?: 'objection' | 'matched'
}) {
  // A confirmed objection keeps running as a separate case with its own
  // window, so it stays on the day-counter badge rather than collapsing to the
  // "resolved" check. Other resolved items show the check.
  if (status === 'done' && resolutionKind !== 'objection') {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-background p-1.5 leading-none text-foreground">
        <Check className="h-3.5 w-3.5" aria-hidden />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border py-1 pl-1 pr-2.5 text-xs font-medium leading-none',
        WINDOW_TONE_CLASS[window.tone],
      )}
    >
      <Clock4 className="h-3.5 w-3.5" aria-hidden />
      {window.label}
    </span>
  )
}

/**
 * Icon-only amber flag chip — a subordinate qualifier placed before the
 * outcome badge to signal an approval carries a minor flag into next year.
 */
function FlagChip() {
  return (
    <span
      title="Flagged — note in details"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600"
    >
      <Flag className="h-4 w-4" aria-hidden />
      <span className="sr-only">Flagged — note in details</span>
    </span>
  )
}

/** Soft pill shown while a proposed action awaits confirmation. */
function ProposedBadge({ action }: { action: ProposedAction }) {
  const styles: Record<ProposedAction, string> = {
    object: 'border-red-200 bg-red-50 text-red-700',
    approve: 'border-green-200 bg-green-50 text-green-700',
  }
  return (
    <span
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium leading-none',
        styles[action],
      )}
    >
      <ActionIcon action={action} className="h-4 w-4" />
      {PROPOSED_LABEL[action]}
    </span>
  )
}

function ResolutionBadge({
  resolution,
}: {
  resolution: NonNullable<AssessmentItem['resolution']>
}) {
  if (resolution.kind === 'objection') {
    return (
      <span className="group relative inline-flex shrink-0">
        <span
          tabIndex={0}
          className="inline-flex h-8 cursor-help items-center gap-1.5 rounded-full bg-red-600 px-3 text-xs font-medium leading-none text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {resolution.label}
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[260px] -translate-x-1/2 translate-y-1 whitespace-normal rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium leading-snug text-white opacity-0 shadow-md transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
        >
          Internal status — not yet filed with the tax authority. Opens an
          objection case where you can manage and submit it.
        </span>
      </span>
    )
  }

  return (
    <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-green-600 px-3 text-xs font-medium leading-none text-white">
      <CheckCheck className="h-4 w-4" aria-hidden />
      {resolution.label}
    </span>
  )
}
