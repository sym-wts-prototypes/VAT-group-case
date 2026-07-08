import { SectionLabel } from '@/components/body/BodyPlaceholder'
import { CasePhaseStepper } from '@/components/body/CasePhaseStepper'
import { HeaderRenderer } from '@/components/headers/HeaderRenderer'
import { CASE_MANAGEMENT_BREADCRUMB } from '@/config/sampleData'
import type { HeaderDescriptor } from '@/types'

import { DUMMY_GROUP_CASES } from './case-management-data'

// First version of the Parent VAT Group Case page (see "Case Management Improvements & Parent
// VAT Group Case Page" ticket, Part 3) — a static prototype page, structurally modelled on the
// HR Case Wrapper page (breadcrumb + title header, "cases in this wrapper" list) but adapted
// for a VAT Group Case's children, plus the process stepper the HR wrapper doesn't have.
// Reuses one of the existing dummy VAT Group Cases as its static content instead of inventing a
// parallel dataset. Deliberately self-contained (no props, no store reads beyond what
// PlaygroundMain needs to decide to render it) so a future, data-driven version can replace the
// static content here without touching how it's wired in.
const PARENT_CASE = DUMMY_GROUP_CASES[0]

const descriptor: HeaderDescriptor = {
  headerType: 'caseWrapper',
  breadcrumb: [CASE_MANAGEMENT_BREADCRUMB, { label: PARENT_CASE.id, current: true }],
  title: {
    parts: ['VAT', 'Group Case', PARENT_CASE.reportingPeriod],
    subtitle: `${PARENT_CASE.organisation} — ${PARENT_CASE.vatGroupName}`,
  },
  actions: {},
}

export function ParentVatGroupCasePage() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <HeaderRenderer descriptor={descriptor} />
      <CasePhaseStepper currentPhase="inPreparation" process="vat" />

      <div className="flex flex-col gap-4 bg-muted/30 p-6">
        <div className="flex flex-col gap-3">
          <SectionLabel>Child cases in this case group</SectionLabel>
          <div className="flex flex-col gap-2">
            {PARENT_CASE.children.map((child) => (
              <div
                key={child.id}
                className="rounded-lg border border-border bg-background px-4 py-3"
              >
                <span className="text-sm font-medium text-foreground">{child.client}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {child.serviceLine} · {child.caseType} · {child.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
