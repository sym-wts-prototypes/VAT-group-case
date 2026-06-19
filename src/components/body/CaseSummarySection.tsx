import { useState, type ReactNode } from 'react'
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  Download,
  ExternalLink,
  EyeOff,
  File,
  Flag,
  FolderOpen,
  History,
  Landmark,
  StickyNote,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { packageFileNameForProcess } from '@/config/packageBanners'
import { cn } from '@/lib/cn'
import type { Role } from '@/types'

type AssessmentGroupLabel = 'Federal' | 'Municipal'

interface SummaryAssessment {
  id: string
  group: AssessmentGroupLabel
  authority: string
  documentName: string
  received: string
  resolution: { kind: 'matched' | 'objection'; label: string }
  flagged?: boolean
  note?: { kind: 'flag' | 'object'; text: string }
  files: string[]
}

const ORIGINAL_ASSESSMENT_FILE = 'Tax assessment.pdf'
const CLEAN_ASSESSMENT_FILE = 'Tax assessment (no yellow pages).pdf'

const SUMMARY_ASSESSMENTS: SummaryAssessment[] = [
  {
    id: 'federal-1',
    group: 'Federal',
    authority: 'Körperschaftsteuer 2025',
    documentName: 'Körperschaftsteuer_2025.pdf',
    received: '04.06.2026',
    resolution: { kind: 'matched', label: 'Approved' },
    files: [ORIGINAL_ASSESSMENT_FILE, CLEAN_ASSESSMENT_FILE],
  },
  {
    id: 'municipal-berlin',
    group: 'Municipal',
    authority: 'Stadtverwaltung Berlin',
    documentName: 'Berlin_Gewerbesteuer.pdf',
    received: '16.05.2026',
    resolution: { kind: 'matched', label: 'Approved' },
    files: [ORIGINAL_ASSESSMENT_FILE, CLEAN_ASSESSMENT_FILE],
  },
  {
    id: 'municipal-hamburg',
    group: 'Municipal',
    authority: 'Landkreis Hamburg',
    documentName: 'Hamburg_Gewerbesteuer.pdf',
    received: '24.05.2026',
    resolution: {
      kind: 'objection',
      label: 'Objection · OBJ_ID-2142',
    },
    files: [ORIGINAL_ASSESSMENT_FILE, CLEAN_ASSESSMENT_FILE],
  },
  {
    id: 'municipal-koeln',
    group: 'Municipal',
    authority: 'Stadt Köln',
    documentName: 'Köln_Gewerbesteuer.pdf',
    received: '25.04.2026',
    resolution: { kind: 'matched', label: 'Approved' },
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
    documentName: 'Stuttgart_Gewerbesteuer.pdf',
    received: '02.02.2026',
    resolution: {
      kind: 'objection',
      label: 'Objection · OBJ_ID-2088',
    },
    files: [ORIGINAL_ASSESSMENT_FILE, CLEAN_ASSESSMENT_FILE],
  },
]

const GROUP_ORDER: AssessmentGroupLabel[] = ['Federal', 'Municipal']

interface CaseSummarySectionProps {
  role: Role
}

/** CIT Summary phase — read-only archive after the case is closed. */
export function CaseSummarySection({ role }: CaseSummarySectionProps) {
  const isClient = role === 'client'
  const assessments = SUMMARY_ASSESSMENTS

  return (
    <div className="flex flex-col gap-8">
      <CaseClosedBanner />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Case records</h2>
        <div className="flex flex-col gap-2">
          {!isClient && (
            <CaseRecordRow
              icon={<FolderOpen className="h-8 w-8 shrink-0 text-foreground" strokeWidth={1.5} />}
              title="Client data (raw)"
              subtitle="As provided by the client — open in Requirements"
              action={
                <button
                  type="button"
                  className="inline-flex h-9 shrink-0 items-center gap-2 text-sm font-medium text-[hsl(var(--link))] hover:underline"
                >
                  Open requirements
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </button>
              }
            />
          )}
          <CaseRecordRow
            icon={<File className="h-8 w-8 shrink-0 text-foreground" strokeWidth={1.5} />}
            title="Submitted package"
            subtitle={packageFileNameForProcess('cit')}
            action={
              <div className="flex shrink-0 flex-wrap items-center gap-4">
                {!isClient && (
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
                  Download
                </Button>
              </div>
            }
          />
          <CaseRecordRow
            icon={<File className="h-8 w-8 shrink-0 text-foreground" strokeWidth={1.5} />}
            title="Proof of submission"
            subtitle="Submission receipt.pdf"
            action={
              <Button variant="outline" size="default" className="gap-2">
                <Download className="h-4 w-4" aria-hidden />
                Download
              </Button>
            }
          />
          <CaseRecordRow
            icon={<File className="h-8 w-8 shrink-0 text-foreground" strokeWidth={1.5} />}
            title="Additional document"
            subtitle="Additional document.pdf"
            action={
              <Button variant="outline" size="default" className="gap-2">
                <Download className="h-4 w-4" aria-hidden />
                Download
              </Button>
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Tax assessment documents ({assessments.length})
        </h2>
        <div className="flex flex-col gap-6">
          {GROUP_ORDER.map((group) => {
            const groupItems = assessments.filter((item) => item.group === group)
            if (groupItems.length === 0) return null
            return (
              <div key={group} className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                <div className="flex flex-col gap-2">
                  {groupItems.map((item) => (
                    <SummaryAssessmentCard
                      key={item.id}
                      item={item}
                      isClient={isClient}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function CaseClosedBanner() {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-green-200 bg-green-50 px-4 py-4">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
        <Check className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex flex-col gap-1">
        <p className="font-display text-lg font-semibold leading-7 text-foreground">
          Case closed
        </p>
        <p className="text-sm text-muted-foreground">
          Closed 16 Jun · 5 assessments · 3 approved · 2 objections filed
        </p>
      </div>
    </div>
  )
}

function CaseRecordRow({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  action: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-header-sm">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle && (
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}

function SummaryAssessmentCard({
  item,
  isClient,
}: {
  item: SummaryAssessment
  isClient: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const visibleFiles = isClient
    ? item.files.filter((file) => file !== ORIGINAL_ASSESSMENT_FILE)
    : item.files
  const hasExpandedContent = Boolean(item.note?.text) || visibleFiles.length > 0

  return (
    <div className="rounded-lg border border-border bg-card shadow-header-sm">
      <div className="flex items-center gap-3 p-4">
        <Landmark className="h-6 w-6 shrink-0 text-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {item.authority}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {item.documentName} · received {item.received}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {item.flagged && <FlagChip />}
          <ResolutionBadge resolution={item.resolution} />
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label={expanded ? 'Collapse files' : 'Expand files'}
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                expanded && 'rotate-180',
              )}
            />
          </button>
        </div>
      </div>
      {expanded && hasExpandedContent && (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {item.note?.text && <NoteBanner note={item.note} />}
          {visibleFiles.map((file) => (
            <SummaryFileRow
              key={file}
              name={file}
              internal={!isClient && file === ORIGINAL_ASSESSMENT_FILE}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryFileRow({
  name,
  internal = false,
}: {
  name: string
  internal?: boolean
}) {
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

/** Marks the internal item-creation file, with a styled hover tooltip. */
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

function NoteBanner({ note }: { note: NonNullable<SummaryAssessment['note']> }) {
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

function ResolutionBadge({
  resolution,
}: {
  resolution: SummaryAssessment['resolution']
}) {
  if (resolution.kind === 'objection') {
    return (
      <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-red-600 px-3 text-xs font-medium leading-none text-white">
        {resolution.label}
        <ArrowUpRight className="h-4 w-4" aria-hidden />
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
