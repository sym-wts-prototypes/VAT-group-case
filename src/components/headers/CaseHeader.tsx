import { Actions } from './parts/Actions'
import { Breadcrumb } from './parts/Breadcrumb'
import { DueDate } from './parts/DueDate'
import { HeaderShell } from './parts/HeaderShell'
import { PeopleRow } from './parts/PeopleRow'
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
      <div className="flex h-full flex-col gap-7">
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

        <div className="flex flex-wrap items-end justify-between gap-4">
          {descriptor.people ? (
            <PeopleRow
              people={descriptor.people}
              editable={descriptor.editable}
              className="min-w-0 flex-1"
            />
          ) : (
            <span />
          )}
          {descriptor.dueDate && (
            <DueDate
              date={descriptor.dueDate}
              variant="blue"
              className="shrink-0"
            />
          )}
        </div>
      </div>
    </HeaderShell>
  )
}
