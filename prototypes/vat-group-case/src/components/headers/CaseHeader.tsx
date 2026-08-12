import { AssignedPeople, adaptLegacyPeople } from '@/components/assigned-people'

import { Actions } from './parts/Actions'
import { Breadcrumb } from './parts/Breadcrumb'
import { HeaderShell } from './parts/HeaderShell'
import { NextDeadline } from './parts/NextDeadline'
import { ParentCaseIndicator, Title, TitleSubtitle } from './parts/Title'
import type { HeaderDescriptor } from '@/types'

interface CaseHeaderProps {
  descriptor: HeaderDescriptor
  compact?: boolean
  primaryDisabled?: boolean
  onPrimaryClick?: (label: string) => void
}

/**
 * Figma Case header (15359:1834): flat strip, breadcrumb + actions,
 * title + company pills, people row + due date.
 */
export function CaseHeader({
  descriptor,
  compact,
  primaryDisabled,
  onPrimaryClick,
}: CaseHeaderProps) {
  return (
    <HeaderShell variant="case" compact={compact}>
      <div className="flex flex-1 flex-col gap-7">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            {descriptor.breadcrumb ? (
              <Breadcrumb items={descriptor.breadcrumb} />
            ) : (
              <span className="h-10" />
            )}
            <Actions
              primary={descriptor.actions.primary}
              nextStep={descriptor.actions.nextStep}
              secondary={descriptor.actions.secondary}
              primaryDisabled={primaryDisabled}
              onPrimaryClick={onPrimaryClick}
              size={compact ? 'sm' : 'lg'}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Title
              title={descriptor.title}
              size={compact ? 'slim' : 'case'}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <TitleSubtitle title={descriptor.title} />
              {descriptor.parentCaseName && (
                <ParentCaseIndicator name={descriptor.parentCaseName} />
              )}
            </div>
          </div>
        </div>

        {/* items-center — the AssignedPeople pill (~42px, driven by its 32px avatars) is
            noticeably taller than the NextDeadline chip (~30px); bottom-aligning them left
            the chip visually offset below the pill's center. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {descriptor.people || descriptor.assignedPeople ? (
            <AssignedPeople
              people={descriptor.assignedPeople ?? adaptLegacyPeople(descriptor.people)}
              editable={descriptor.assignedPeopleEditable ?? descriptor.editable}
              editTooltip={descriptor.editTooltip}
              onEdit={descriptor.onEditAssignedPeople}
              className="min-w-0"
            />
          ) : (
            <span />
          )}
          {descriptor.dueDate && (
            <NextDeadline
              date={descriptor.dueDate}
              label={descriptor.dueDateLabel ?? 'Due Date'}
              className="shrink-0"
            />
          )}
        </div>
      </div>
    </HeaderShell>
  )
}
