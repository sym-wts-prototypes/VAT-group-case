import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Layers, MoreHorizontal, Plus, Search, X } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  JurisdictionFlag,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from '@wts/ui'

import { useDemoStore } from '@/store/useDemoStore'
import { useGeneratedCasesStore } from '@/store/useGeneratedCasesStore'
import type { Phase, Role } from '@/types'

import {
  Case,
  CASE_STATUS_LABEL,
  CASE_STATUS_TONE,
  CaseStatus,
  DUMMY_CASES,
  DUMMY_GROUP_CASES,
  isGroupCase,
  type CaseListItem,
  type VatGroupCase,
} from './case-management-data'
import { CreateCaseDrawer } from './create-case-drawer'
import { countryCodeFor, Group, LegalEntity } from './org-details-data'
import { Organization } from './organizations-data'

// Recreates reference/WTS20Platform's Case Management list (case-list.tsx + case-list-filters.tsx
// + case-list-columns.tsx) with dummy data, plus a second case type — VAT Group Case — that
// expands to show its per-legal-entity children. The list is a CSS Grid "table" (role="table"
// etc.) rather than a real <table>: shadcn's Accordion renders <div>s for AccordionItem/Content,
// which can't legally live inside a <tbody>, so a real <table> can't host it. Same visual
// columns, same cell styling — just a different DOM so the group rows can expand/collapse.

// Case Management is a launcher into the existing (Role, Phase) prototype scenarios, not a
// real case detail view — clicking an individual (or child) row only carries over "My role" +
// "Status"; every other column is dummy display data and is intentionally discarded.
export const ROLE_TO_PLAYGROUND_ROLE: Record<Case['myRole'], Role> = {
  Creator: 'creator',
  Reviewer: 'reviewer',
  Partner: 'partner',
  Client: 'client',
}
const STATUS_TO_PHASE: Record<CaseStatus, Phase> = {
  Draft: 'draft',
  InPreparation: 'inPreparation',
  InReview: 'inReview',
  ClientApproval: 'clientApproval',
  Submission: 'submitted',
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const formatDate = (iso: string) => dateFormatter.format(new Date(iso))

// Shared column layout for the header, individual rows, group parent rows, and group children.
// Case ID/Client/Case name/Jurisdiction/Service line/My role are widened so medium-length values
// stay fully visible; only genuinely long values still truncate (see TruncatedText below).
const GRID_COLS =
  'grid-cols-[200px_220px_220px_110px_90px_100px_110px_100px_130px_120px_110px_minmax(160px,1fr)_44px]'
// Uniform row height so Client/Organisation text lands at the same baseline whether the row is
// an individual case, a VAT Group Case parent, or a group child — otherwise a row with a taller
// cell (e.g. a two-line "Latest activity") stretches and visually shifts its siblings' centering.
const ROW_MIN_HEIGHT = 'min-h-14'
// Row actions stay pinned to the right edge of the horizontally-scrolling table. `pr-6` replaces
// the scroll container's own right padding (removed — see the comment above the container) so
// the sticky cell's box reaches all the way to the true clip edge, with no gap for another
// column's tail to scroll into and peek out past it. The hover background is `bg-muted` at full
// opacity (not the row's usual `hover:bg-muted/50`) — a translucent tint here would let whatever
// column has scrolled underneath this sticky cell show through while hovering.
const STICKY_ACTIONS_CELL = 'sticky right-0 z-10 border-l border-border bg-background pr-6 group-hover/row:bg-muted'

const HEADER_LABELS = [
  'Case ID',
  'Client',
  'Case name',
  'Service line',
  'Case Type',
  'Frequency',
  'Jurisdiction',
  'My role',
  'Status',
  'Statutory Deadline',
  'Next deadline',
  'Latest activity',
  '',
]

function matchesSearch(item: CaseListItem, q: string): boolean {
  if (isGroupCase(item)) {
    const groupText = `${item.id} ${item.organisation} ${item.representativeEntity} ${item.caseName} ${item.vatGroupName}`.toLowerCase()
    return groupText.includes(q) || item.children.some((child) => matchesSearch(child, q))
  }
  return `${item.id} ${item.client} ${item.caseName}`.toLowerCase().includes(q)
}

// Renders text with CSS ellipsis truncation, but only wraps it in a Tooltip (showing the full
// value) once it has actually measured as truncated — untruncated cells get no tooltip at all.
function TruncatedText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setIsTruncated(el.scrollWidth > el.clientWidth)
  }, [text])

  const span = (
    <span ref={ref} className={cn('block min-w-0 truncate', className)}>
      {text}
    </span>
  )

  if (!isTruncated) return span

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{span}</TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function NextDeadlineCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>

  const daysLeft = Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const tone = daysLeft <= 7 ? 'red' : daysLeft <= 21 ? 'orange' : 'green'
  const label = daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`

  return (
    <div className="flex flex-col gap-1">
      <span>{formatDate(value)}</span>
      <Badge variant="soft" tone={tone} size="sm" className="w-fit">
        {label}
      </Badge>
    </div>
  )
}

function RowActions({ id, onEdit }: { id: string; onEdit: () => void }) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label={`Actions for case ${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-200"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>Edit Case</DropdownMenuItem>
          <DropdownMenuItem disabled>Activity Log</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(id)}>Copy Case ID</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// One individual case row — reused for both top-level cases and every VAT Group Case child,
// so children "visually resemble a normal individual case" for free.
function CaseRow({ item, onOpen, indented }: { item: Case; onOpen: () => void; indented?: boolean }) {
  return (
    <div
      role="row"
      onClick={onOpen}
      className={cn(
        'group/row grid cursor-pointer items-center border-b transition-colors hover:bg-muted/50',
        ROW_MIN_HEIGHT,
        GRID_COLS,
      )}
      title="Open the matching prototype scenario for this role + status"
    >
      <div role="cell" className={cn('min-w-0 p-2 text-sm font-medium', indented && 'flex items-center gap-1.5 pl-4')}>
        {/* Branch connector — reads as descending from the parent VAT Group Case row above.
            Purely decorative (aria-hidden); one self-contained "└" per row, not a cross-row
            line, so it doesn't need to know whether it's the last child. */}
        {indented && (
          <span className="relative h-5 w-3 shrink-0" aria-hidden="true">
            <span className="absolute left-1/2 top-0 h-1/2 w-px -translate-x-1/2 bg-border" />
            <span className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 bg-border" />
          </span>
        )}
        <TruncatedText text={item.id} />
      </div>
      <div role="cell" className="min-w-0 p-2 text-sm font-medium text-foreground">
        <TruncatedText text={item.client} />
      </div>
      <div role="cell" className="min-w-0 p-2 text-sm">
        <TruncatedText text={item.caseName} />
      </div>
      <div role="cell" className="p-2 text-sm">
        <Badge variant="soft" tone="gray" size="sm">
          {item.serviceLine}
        </Badge>
      </div>
      <div role="cell" className="p-2 text-sm">
        {item.caseType}
      </div>
      <div role="cell" className="p-2 text-sm">
        {item.frequency}
      </div>
      <div role="cell" className="p-2 text-sm">
        <JurisdictionFlag code={countryCodeFor(item.jurisdiction)} />
      </div>
      <div role="cell" className="p-2 text-sm">
        {item.myRole}
      </div>
      <div role="cell" className="p-2 text-sm">
        <Badge variant="soft" tone={CASE_STATUS_TONE[item.status]} size="sm">
          {CASE_STATUS_LABEL[item.status]}
        </Badge>
      </div>
      <div role="cell" className="whitespace-nowrap p-2 text-sm">
        {formatDate(item.statutoryDeadline)}
      </div>
      <div role="cell" className="p-2 text-sm">
        <NextDeadlineCell value={item.nextDeadline} />
      </div>
      <div role="cell" className="max-w-40 p-2 text-sm">
        <div className="flex flex-col">
          <span className="truncate font-medium text-foreground" title={item.latestActivity.actor}>
            {item.latestActivity.actor}
          </span>
          <span className="truncate text-muted-foreground text-xs" title={item.latestActivity.description}>
            {item.latestActivity.description}
          </span>
        </div>
      </div>
      <div role="cell" className={cn('flex items-center p-2 text-sm', STICKY_ACTIONS_CELL)}>
        <RowActions id={item.id} onEdit={onOpen} />
      </div>
    </div>
  )
}

// A VAT Group Case's collapsed parent row + its children, built on the real shadcn Accordion
// (Root/Item/Trigger/Content) — the interaction and open/close animation are 100% Radix. Only
// the chevron button (AccordionTrigger, scoped to just that one cell) expands/collapses the
// row; clicking anywhere else on the row opens the group like an individual case would
// (`onOpenGroup`, stopPropagation'd off the trigger so the two actions never both fire). Case
// name and every other cell render exactly like a normal CaseRow — the only visual markers of
// a group row are the chevron+icon in the Case ID cell and the grey "VAT Group" badge in the
// Service line column.
function GroupCaseRow({
  group,
  onOpenChild,
  onOpenGroup,
}: {
  group: VatGroupCase
  onOpenChild: (c: Case) => void
  onOpenGroup: (g: VatGroupCase) => void
}) {
  return (
    // Expanded by default (prototype-only default; still fully collapsible per-row).
    <Accordion type="single" collapsible defaultValue={group.id}>
      <AccordionItem value={group.id} className="border-none">
        <div
          role="row"
          onClick={() => onOpenGroup(group)}
          className={cn(
            // Muted/gray treatment sets the parent row apart from its (white/default) children
            // and from singular cases — CaseRow itself is untouched, so only group parents get it.
            'group/row grid cursor-pointer items-center border-b bg-muted/40 transition-colors hover:bg-muted/60',
            ROW_MIN_HEIGHT,
            GRID_COLS,
          )}
          // For now this opens the same per-role/status prototype scenario an individual case
          // does (see openGroupCase in CaseManagementPage) — a temporary stand-in until VAT
          // Group Cases get their own detail page.
          title="Open the matching prototype scenario for this group's representative entity"
        >
          <div role="cell" className="flex min-w-0 items-center gap-1.5 p-2 text-sm font-medium">
            {/* Scoped to just this cell so a click here toggles the accordion instead of
                bubbling up to the row's onOpenGroup — the two interactions stay independent. */}
            <AccordionTrigger
              onClick={(e) => e.stopPropagation()}
              aria-label={`Toggle ${group.id}`}
              className="h-6 w-6 flex-none items-center justify-center rounded p-0 font-normal hover:bg-muted hover:no-underline [&>svg]:mx-0 [&>svg]:size-3.5 [&>svg]:text-muted-foreground"
            />
            <Layers className="size-3.5 shrink-0 text-blue-600" aria-hidden />
            <TruncatedText text={group.id} className="min-w-0 flex-1" />
          </div>
          <div role="cell" className="min-w-0 p-2 text-sm font-medium text-foreground">
            <TruncatedText text={group.representativeEntity} />
          </div>
          <div role="cell" className="min-w-0 p-2 text-sm">
            <TruncatedText text={group.caseName} />
          </div>
          <div role="cell" className="p-2 text-sm">
            <Badge variant="soft" tone="gray" size="sm">
              VAT Group
            </Badge>
          </div>
          <div role="cell" className="p-2 text-sm">
            {group.caseType}
          </div>
          <div role="cell" className="p-2 text-sm">
            {group.frequency}
          </div>
          <div role="cell" className="p-2 text-sm">
            <JurisdictionFlag code={countryCodeFor(group.jurisdiction)} />
          </div>
          <div role="cell" className="p-2 text-sm text-muted-foreground">
            —
          </div>
          <div role="cell" className="p-2 text-sm">
            <Badge variant="soft" tone={CASE_STATUS_TONE[group.status]} size="sm">
              {CASE_STATUS_LABEL[group.status]}
            </Badge>
          </div>
          <div role="cell" className="whitespace-nowrap p-2 text-sm">
            {formatDate(group.statutoryDeadline)}
          </div>
          <div role="cell" className="p-2 text-sm">
            <NextDeadlineCell value={group.nextDeadline} />
          </div>
          <div role="cell" className="p-2 text-sm text-muted-foreground">
            {group.children.length} legal entities
          </div>
          <div
            role="cell"
            className={cn('flex items-center p-2 text-sm', STICKY_ACTIONS_CELL, 'bg-muted/40 group-hover/row:bg-muted/60')}
          >
            <RowActions id={group.id} onEdit={() => onOpenGroup(group)} />
          </div>
        </div>
        <AccordionContent className="p-0">
          {group.children.map((child) => (
            <CaseRow key={child.id} item={child} onOpen={() => onOpenChild(child)} indented />
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export interface CaseManagementPageProps {
  organisations: Organization[]
  groups: Group[]
  entities: LegalEntity[]
}

export function CaseManagementPage({ organisations, groups, entities }: CaseManagementPageProps) {
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const setRole = useDemoStore((state) => state.setRole)
  const setPhase = useDemoStore((state) => state.setPhase)
  const setShowCaseManagement = useDemoStore((state) => state.setShowCaseManagement)
  const setCaseKind = useDemoStore((state) => state.setCaseKind)
  const setGroupCaseView = useDemoStore((state) => state.setGroupCaseView)
  const generatedCases = useGeneratedCasesStore((state) => state.cases)
  const addGeneratedCases = useGeneratedCasesStore((state) => state.addCases)

  const openScenarioForCase = (c: Case) => {
    setRole(ROLE_TO_PLAYGROUND_ROLE[c.myRole])
    setPhase(STATUS_TO_PHASE[c.status])
    setShowCaseManagement(false)
  }

  // Opens the real Parent VAT Group Case page (see parent-vat-group-case-page.tsx), by
  // switching the Playground to Case Type → Group Case, Group Case View → Parent Case —
  // exactly as if the user had selected those controls manually (setCaseKind/setGroupCaseView
  // already own every conditional side effect: Process locked to VAT, Phase locked to In
  // Preparation, etc.), so this seam never has to duplicate that logic. Previously a stand-in
  // that launched the representative child's own scenario, before the Parent Case page existed.
  const openGroupCase = (_group: VatGroupCase) => {
    setCaseKind('group')
    setGroupCaseView('parent')
  }

  // Newly created cases (see create-case-drawer.tsx's scheduler modals) show up here
  // immediately, ahead of the static dummy dataset, and land back on this page — it's already
  // where case creation is entered from, but this also future-proofs a redirect if that ever
  // changes.
  const handleCasesGenerated = (items: CaseListItem[]) => {
    addGeneratedCases(items)
    setShowCaseManagement(true)
  }

  const allItems: CaseListItem[] = useMemo(
    () => [...generatedCases, ...DUMMY_CASES, ...DUMMY_GROUP_CASES],
    [generatedCases],
  )

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allItems
    return allItems.filter((item) => matchesSearch(item, q))
  }, [allItems, search])

  const hasActiveFilters = search.length > 0

  return (
    <div data-testid="case-management-page" className="flex h-full flex-col">
      <div className="flex items-start justify-between p-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display font-medium text-3xl text-foreground">Case management</h1>
          <p className="text-muted-foreground text-sm">Manage and track cases across the platform</p>
        </div>
        <Button data-testid="create-case-button" onClick={() => setDrawerOpen(true)}>
          <Plus className="size-4" />
          Create case
        </Button>
      </div>

      <div className="flex items-center gap-3 px-6 pb-6">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="case-list-search-input"
            placeholder="Search by case ID, client, or case name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Button variant="outline" onClick={() => setSearch('')} disabled={!hasActiveFilters}>
          Clear filters
        </Button>
      </div>

      {/* Right padding lives on the sticky actions cell (STICKY_ACTIONS_CELL), not here — padding
          on this scroll container would sit to the right of a `right-0` sticky cell, letting the
          Latest activity column's tail scroll into that gap and peek out past the actions column. */}
      <div className="overflow-x-auto pl-6">
        <div role="table" className="min-w-[1800px] text-sm">
          <div role="rowgroup">
            <div role="row" className={cn('grid border-b', GRID_COLS)}>
              {HEADER_LABELS.map((label, i) => (
                <div
                  key={i}
                  role="columnheader"
                  className={cn(
                    'flex h-10 items-center p-2 text-left font-medium text-muted-foreground text-sm',
                    i === HEADER_LABELS.length - 1 && STICKY_ACTIONS_CELL,
                  )}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div role="rowgroup">
            {filteredItems.map((item) =>
              isGroupCase(item) ? (
                <GroupCaseRow key={item.id} group={item} onOpenChild={openScenarioForCase} onOpenGroup={openGroupCase} />
              ) : (
                <CaseRow key={item.id} item={item} onOpen={() => openScenarioForCase(item)} />
              ),
            )}
          </div>
        </div>

        {filteredItems.length === 0 && (
          <p className="py-10 text-center text-muted-foreground text-sm">No cases match your search.</p>
        )}
      </div>

      <CreateCaseDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entities={entities}
        organisations={organisations}
        groups={groups}
        onCasesGenerated={handleCasesGenerated}
      />
    </div>
  )
}
