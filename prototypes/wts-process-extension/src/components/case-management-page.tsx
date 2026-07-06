import { useMemo, useState } from 'react'
import { MoreHorizontal, Plus, Search, X } from 'lucide-react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@wts/ui'

import { CASE_STATUS_LABEL, CASE_STATUS_TONE, DUMMY_CASES, jurisdictionFlag } from './case-management-data'
import { CreateGroupVatCaseDrawer } from './create-group-vat-case-drawer'
import { countryCodeFor, Group, LegalEntity } from './org-details-data'
import { Organization } from './organizations-data'

// Recreates reference/WTS20Platform's Case Management list (case-list.tsx +
// case-list-filters.tsx + case-list-columns.tsx) with dummy individual cases — no group
// cases yet (see case-management-data.ts). Uses plain @wts/ui Table primitives rather than
// the TanStack-based DataTable: the reference's per-column sort/filter popovers are out of
// scope here, only the global real-time search the ticket asked for.

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const formatDate = (iso: string) => dateFormatter.format(new Date(iso))

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

export interface CaseManagementPageProps {
  organisations: Organization[]
  groups: Group[]
  entities: LegalEntity[]
}

export function CaseManagementPage({ organisations, groups, entities }: CaseManagementPageProps) {
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return DUMMY_CASES
    return DUMMY_CASES.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q) ||
        c.caseName.toLowerCase().includes(q),
    )
  }, [search])

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

      <div className="px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Case name</TableHead>
              <TableHead>Service line</TableHead>
              <TableHead>Case Type</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>My role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Statutory Deadline</TableHead>
              <TableHead>Next deadline</TableHead>
              <TableHead>Latest activity</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="max-w-32 truncate font-medium" title={c.id}>
                  {c.id}
                </TableCell>
                <TableCell className="max-w-40 truncate font-medium text-foreground" title={c.client}>
                  {c.client}
                </TableCell>
                <TableCell className="max-w-40 truncate" title={c.caseName}>
                  {c.caseName}
                </TableCell>
                <TableCell>
                  <Badge variant="soft" tone="gray" size="sm">
                    {c.serviceLine}
                  </Badge>
                </TableCell>
                <TableCell>{c.caseType}</TableCell>
                <TableCell>{c.frequency}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span aria-hidden>{jurisdictionFlag(c.jurisdiction)}</span>
                    {countryCodeFor(c.jurisdiction)}
                  </span>
                </TableCell>
                <TableCell>{c.myRole}</TableCell>
                <TableCell>
                  <Badge variant="soft" tone={CASE_STATUS_TONE[c.status]} size="sm">
                    {CASE_STATUS_LABEL[c.status]}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(c.statutoryDeadline)}</TableCell>
                <TableCell>
                  <NextDeadlineCell value={c.nextDeadline} />
                </TableCell>
                <TableCell className="max-w-40">
                  <div className="flex flex-col">
                    <span className="truncate font-medium text-foreground" title={c.latestActivity.actor}>
                      {c.latestActivity.actor}
                    </span>
                    <span className="truncate text-muted-foreground text-xs" title={c.latestActivity.description}>
                      {c.latestActivity.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger
                      aria-label={`Actions for case ${c.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => console.log('View case', c.id)}>
                        View case
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredCases.length === 0 && (
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
