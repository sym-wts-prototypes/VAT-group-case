import { Actions } from './parts/Actions'
import { BackLink } from './parts/BackLink'
import { DueDate } from './parts/DueDate'
import { HeaderShell } from './parts/HeaderShell'
import { PeopleRow } from './parts/PeopleRow'
import { Title } from './parts/Title'
import { VerticalSeparator } from './parts/VerticalSeparator'
import type { HeaderDescriptor } from '@/types'

interface RequirementListHeaderProps {
  descriptor: HeaderDescriptor
  compact?: boolean
}

/**
 * Figma Requirement List header (15359:9052):
 * row1 back + outline actions; row2 title | due date | client+edit
 */
export function RequirementListHeader({
  descriptor,
  compact,
}: RequirementListHeaderProps) {
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
          <Actions
            primary={descriptor.actions.primary}
            secondary={descriptor.actions.secondary}
            size={compact ? 'sm' : 'lg'}
            allOutline
          />
        </div>

        <div className="flex items-center gap-4">
          <Title title={descriptor.title} size="slim" />
          <VerticalSeparator />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
            {descriptor.dueDate && (
              <DueDate date={descriptor.dueDate} variant="gray" />
            )}
            {descriptor.people && (
              <PeopleRow
                people={descriptor.people}
                editable={descriptor.editable}
                fields={['client']}
                className="shrink-0"
              />
            )}
          </div>
        </div>
      </div>
    </HeaderShell>
  )
}
