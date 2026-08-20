import { RefreshCw, Sparkles } from 'lucide-react'

import { Button } from '@wts/ui'
import { AssignedPeople, adaptLegacyPeople } from '@/components/assigned-people'
import { useAiMatchRun, useRequirementsStore } from '@/store/useRequirementsStore'
import type { Process } from '@/types'

import { Actions } from './parts/Actions'
import { BackLink } from './parts/BackLink'
import { DueDate } from './parts/DueDate'
import { HeaderShell } from './parts/HeaderShell'
import { PeopleRow } from './parts/PeopleRow'
import { CaseIdentityPills, Title } from './parts/Title'
import { VerticalSeparator } from './parts/VerticalSeparator'
import type { HeaderDescriptor } from '@/types'

interface RequirementListHeaderProps {
  descriptor: HeaderDescriptor
  compact?: boolean
  /** CIT AI file-matcher simulation ticket — only CIT gets the "Start/Re-run AI file matching"
   *  button; VAT's categories are preset and never run the matcher. Rendered directly here
   *  rather than through the shared `actions` descriptor, since `requirementList`'s config
   *  object is reused verbatim by HR and VAT (see config/headers.ts) and gating it there would
   *  leak the button into both. */
  process?: Process
}

/**
 * Figma Requirement List header (15359:9052):
 * row1 back + outline actions; row2 title | due date | client+edit
 */
export function RequirementListHeader({
  descriptor,
  compact,
  process,
}: RequirementListHeaderProps) {
  const aiMatchRun = useAiMatchRun()
  const runAiFileMatching = useRequirementsStore((s) => s.runAiFileMatching)

  return (
    <HeaderShell variant="slim" compact={compact}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          {descriptor.backLink ? (
            <BackLink
              label={descriptor.backLink.label}
              href={descriptor.backLink.href}
            />
          ) : (
            <span className="h-10" />
          )}
          <div className="flex items-center gap-2.5">
            {process === 'cit' && (
              <Button
                type="button"
                variant="outline"
                size={compact ? 'sm' : 'lg'}
                className="gap-2 text-destructive"
                onClick={runAiFileMatching}
              >
                {aiMatchRun ? (
                  <RefreshCw className="h-4 w-4" aria-hidden />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden />
                )}
                {aiMatchRun ? 'Re-run Ai matching' : 'Ai match files'}
              </Button>
            )}
            <Actions
              primary={descriptor.actions.primary}
              secondary={descriptor.actions.secondary}
              size={compact ? 'sm' : 'lg'}
              allOutline
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <Title title={descriptor.title} size="slim" />
            <VerticalSeparator />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
              {descriptor.dueDate && (
                <DueDate date={descriptor.dueDate} variant="gray" />
              )}
              {/* Creator/Reviewer/Partner see the same AssignedPeople cluster+dropdown the
                  Case header uses, all 4 role columns — `caseIdentity` is only set for those
                  roles (see PlaygroundMain.tsx), so its presence doubles as that gate. Client
                  keeps the plain text PeopleRow it always had. `align="end"` (unlike the Case
                  header's own default "start") since this trigger sits on the right edge of the
                  header — anchoring the popover's right edge instead keeps it from opening
                  further right, off the viewport. */}
              {descriptor.caseIdentity ? (
                <AssignedPeople
                  people={descriptor.assignedPeople ?? adaptLegacyPeople(descriptor.people)}
                  align="end"
                  editable={descriptor.assignedPeopleEditable}
                  editTooltip={descriptor.editTooltip}
                  onEdit={descriptor.onEditAssignedPeople}
                  className="shrink-0"
                />
              ) : (
                descriptor.people && (
                  <PeopleRow
                    people={descriptor.people}
                    editable={descriptor.editable}
                    fields={['client']}
                    className="shrink-0"
                  />
                )
              )}
            </div>
          </div>
          {/* The case's own name + legal-entity/VAT-code pills, under the Requirements/Due Date
              row — not shown for the Client (see PlaygroundMain.tsx's `caseIdentity`, only set
              for non-Client roles). */}
          {descriptor.caseIdentity && (
            <CaseIdentityPills
              parentCaseName={descriptor.caseIdentity.parentCaseName}
              legalEntityName={descriptor.caseIdentity.legalEntityName}
              caseName={descriptor.caseIdentity.caseName}
              vatRegNumber={descriptor.caseIdentity.vatRegNumber}
            />
          )}
        </div>
      </div>
    </HeaderShell>
  )
}
