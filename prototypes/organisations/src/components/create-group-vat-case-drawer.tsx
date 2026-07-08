import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@wts/ui'

import { GroupCaseFormContent } from './group-case-form'
import { Group, LegalEntity } from './org-details-data'
import { Organization } from './organizations-data'

// The Organisation → Group entry point ("Create a group VAT case" in groups-tab.tsx) — always
// locked to one group (no Case Type toggle, no Single Case option; see the Case Management
// entry point's create-case-drawer.tsx for that). Reuses the exact same GroupCaseFormContent
// and VatSchedulerModal implementation as Case Management's Group Case flow, so both entry
// points share one scheduler experience instead of two parallel implementations.
export interface CreateGroupVatCaseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: Group
  entities: LegalEntity[]
  organisations: Organization[]
  groups: Group[]
}

export function CreateGroupVatCaseDrawer({
  open,
  onOpenChange,
  group,
  entities,
  organisations,
  groups,
}: CreateGroupVatCaseDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle className="font-display text-lg font-semibold">Create a group case</SheetTitle>
        </SheetHeader>
        <GroupCaseFormContent
          open={open}
          onClose={() => onOpenChange(false)}
          group={group}
          entities={entities}
          organisations={organisations}
          groups={groups}
        />
      </SheetContent>
    </Sheet>
  )
}
