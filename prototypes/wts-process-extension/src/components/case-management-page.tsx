import { useMemo, useState } from 'react'
import { ChevronRight, Layers, MoreHorizontal, Plus, Search, X } from 'lucide-react'
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
  cn,
} from '@wts/ui'

import { useDemoStore } from '@/store/useDemoStore'
import type { Phase, Role } from '@/types'

import {
  Case,
  CASE_STATUS_LABEL,
  CASE_STATUS_TONE,
  CaseStatus,
  DUMMY_CASES,
  DUMMY_GROUP_CASES,
  isGroupCase,
  jurisdictionFlag,
  type CaseListItem,
  type VatGroupCase,
} from './case-management-data'
import { CreateGroupVatCaseDrawer } from './create-group-vat-case-drawer'
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
const ROLE_TO_PLAYGROUND_ROLE: Record<Case['myRole'], Role> = {
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
const GRID_COLS =
  'grid-cols-[140px_170px_190px_100px_90px_100px_100px_90px_130px_120px_110px_minmax(160px,1fr)_40px]'
// Same as GRID_COLS minus the trailing actions column — the group parent row's AccordionTrigger
// can only cover columns 1-12 (it renders as a <button>, and the actions cell needs its own
// button for the kebab menu; buttons can't nest), so it gets its own 12-column template and
// sits inside a 13-column wrapper alongside a sibling actions cell.
const GRID_COLS_12 =
  'grid-cols-[140px_170px_190px_100px_90px_100px_100px_90px_130px_120px_110px_minmax(160px,1fr)]'

function matchesSearch(item: CaseListItem, q: string): boolean {
  if (isGroupCase(item)) {
    const groupText = `${item.id} ${item.organisation} ${item.caseName} ${item.vatGroupName}`.toLowerCase()
    return groupText.includes(q) || item.children.some((child) => matchesSearch(child, q))
  }
  return `${item.id} ${item.client} ${item.caseName}`.toLowerCase().includes(q)
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

function RowActions({ id, onView }: { id: string; onView: () => void }) {
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
          <DropdownMenuItem onSelect={onView}>View case</DropdownMenuItem>
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
      className={cn('grid cursor-pointer items-center border-b transition-colors hover:bg-muted/50', GRID_COLS)}
      title="Open the matching prototype scenario for this role + status"
    >
      <div role="cell" className={cn('max-w-32 truncate p-2 text-sm font-medium', indented && 'pl-8')} title={item.id}>
        {item.id}
      </div>
      <div role="cell" className="max-w-40 truncate p-2 text-sm font-medium text-foreground" title={item.client}>
        {item.client}
      </div>
      <div role="cell" className="max-w-40 truncate p-2 text-sm" title={item.caseName}>
        {item.caseName}
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
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span aria-hidden>{jurisdictionFlag(item.jurisdiction)}</span>
          {countryCodeFor(item.jurisdiction)}
        </span>
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
      <div role="cell" className="p-2 text-sm">
        <RowActions id={item.id} onView={onOpen} />
      </div>
    </div>
  )
}

// A VAT Group Case's collapsed parent row + its children, built on the real shadcn Accordion
// (Root/Item/Trigger/Content) — the interaction and open/close animation are 100% Radix; only
// the chevron is repositioned into the case-name cell so it fits the grid layout.
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
    <Accordion type="single" collapsible>
      <AccordionItem value={group.id} className="border-none">
        <div role="row" className={cn('grid items-stretch border-b transition-colors hover:bg-muted/50', GRID_COLS)}>
          {/* AccordionTrigger's outer wrapper is a Radix <Header> (renders as <h3>) that the
              `className` prop below can't reach — it only styles the inner <button>. Give the
              h3 its grid span here instead, and let the button fill it. */}
          <div className="[grid-column:1/-2]">
          <AccordionTrigger
            className={cn(
              'group w-full items-center rounded-none px-0 py-0 font-normal hover:no-underline [&>svg]:hidden',
              'grid',
              GRID_COLS_12,
            )}
          >
          <div role="cell" className="truncate p-2 text-sm font-medium" title={group.id}>
            {group.id}
          </div>
          <div role="cell" className="truncate p-2 text-sm font-medium text-foreground" title={group.organisation}>
            {group.organisation}
          </div>
          <div role="cell" className="flex min-w-0 items-center gap-1.5 p-2 text-sm">
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
            <Layers className="size-3.5 shrink-0 text-blue-600" aria-hidden />
            <span className="truncate" title={group.caseName}>
              {group.caseName}
            </span>
            <Badge variant="soft" tone="blue" size="sm" className="shrink-0">
              VAT Group
            </Badge>
          </div>
          <div role="cell" className="p-2 text-sm">
            <Badge variant="soft" tone="gray" size="sm">
              {group.serviceLine}
            </Badge>
          </div>
          <div role="cell" className="p-2 text-sm">
            {group.caseType}
          </div>
          <div role="cell" className="p-2 text-sm">
            {group.frequency}
          </div>
          <div role="cell" className="p-2 text-sm">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span aria-hidden>{jurisdictionFlag(group.jurisdiction)}</span>
              {countryCodeFor(group.jurisdiction)}
            </span>
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
          </AccordionTrigger>
          </div>
          <div role="cell" className="flex items-center p-2 text-sm">
            <RowActions id={group.id} onView={() => onOpenGroup(group)} />
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

  const openScenarioForCase = (c: Case) => {
    setRole(ROLE_TO_PLAYGROUND_ROLE[c.myRole])
    setPhase(STATUS_TO_PHASE[c.status])
    setShowCaseManagement(false)
  }

  // VAT Group Cases don't have a detail page yet — this is an intentional no-op for now so the
  // seam exists without having to touch this component again once that page is built.
  const openGroupCase = (_group: VatGroupCase) => {}

  const allItems: CaseListItem[] = useMemo(() => [...DUMMY_CASES, ...DUMMY_GROUP_CASES], [])

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

      <div className="overflow-x-auto px-6">
        <div role="table" className="min-w-[1650px] text-sm">
          <div role="rowgroup">
            <div role="row" className={cn('grid border-b', GRID_COLS)}>
              {[
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
              ].map((label, i) => (
                <div key={i} role="columnheader" className="flex h-10 items-center p-2 text-left font-medium text-muted-foreground text-sm">
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

      <CreateGroupVatCaseDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entities={entities}
        organisations={organisations}
        groups={groups}
      />
    </div>
  )
}
