import { AssignedPeople, adaptLegacyPeople } from '@/components/assigned-people'

import { Actions } from './parts/Actions'
import { Breadcrumb } from './parts/Breadcrumb'
import { DueDate } from './parts/DueDate'
import { HeaderShell } from './parts/HeaderShell'
import { Title, TitleSubtitle } from './parts/Title'
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
            <TitleSubtitle title={descriptor.title} />
          </div>
        </div>

        {/* items-center — the AssignedPeople pill (~42px, driven by its 32px avatars) is
            noticeably taller than the DueDate badge (~26px, Badge's default `sm` size);
            bottom-aligning them left the badge visually offset below the pill's center. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {descriptor.people || descriptor.assignedPeople ? (
            <AssignedPeople
              people={descriptor.assignedPeople ?? adaptLegacyPeople(descriptor.people)}
              editable={descriptor.assignedPeopleEditable ?? descriptor.editable}
              editTooltip={descriptor.editTooltip}
              className="min-w-0"
            />
          ) : (
            <span />
          )}
          {descriptor.dueDate && (
            <DueDate
              date={descriptor.dueDate}
              variant="sky"
              label={descriptor.dueDateLabel}
              className="shrink-0"
            />
          )}
        </div>
      </div>
    </HeaderShell>
  )
}
