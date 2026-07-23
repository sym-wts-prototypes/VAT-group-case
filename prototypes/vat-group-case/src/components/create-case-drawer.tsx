import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@wts/ui'

import type { CaseListItem } from './case-management-data'
import { Group, LegalEntity } from './org-details-data'
import { Organization } from './organizations-data'
import { SingleCaseFormContent } from './single-case-form'

export interface CreateCaseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entities: LegalEntity[]
  organisations: Organization[]
  groups: Group[]
  onCasesGenerated?: (items: CaseListItem[]) => void
}

// The Case Management page's "Create case" drawer — Single Case is the only case-creation
// path (the Single/Group case-type toggle has been removed). Selecting "VAT Group Case" in
// the Single Case form's own Case Type dropdown is what now leads into the group-case flow —
// see single-case-form.tsx.
export function CreateCaseDrawer({
  open,
  onOpenChange,
  entities,
  organisations,
  groups,
  onCasesGenerated,
}: CreateCaseDrawerProps) {
  const handleClose = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle className="font-display text-lg font-semibold">Create case</SheetTitle>
        </SheetHeader>

        <SingleCaseFormContent
          open={open}
          onClose={handleClose}
          entities={entities}
          organisations={organisations}
          groups={groups}
          onCasesGenerated={onCasesGenerated}
        />
      </SheetContent>
    </Sheet>
  )
}
