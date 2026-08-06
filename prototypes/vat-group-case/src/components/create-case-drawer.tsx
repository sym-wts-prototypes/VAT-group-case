import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@wts/ui'

import type { CaseListItem } from './case-management-data'
import { Group, LegalEntity } from './org-details-data'
import { Organization } from './organizations-data'
import { EditCaseRolesContext, SingleCaseFormContent } from './single-case-form'

export interface CreateCaseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entities: LegalEntity[]
  organisations: Organization[]
  groups: Group[]
  onCasesGenerated?: (items: CaseListItem[]) => void
  /** "Edit roles" ticket — reuses this exact drawer to edit a Parent/Child Case's assignees
   * instead of creating a new case; see single-case-form.tsx's EditCaseRolesContext. */
  editContext?: EditCaseRolesContext
}

// The Case Management page's "Create case" drawer — Single Case is the only case-creation
// path (the Single/Group case-type toggle has been removed). Selecting "VAT Group Case" in
// the Single Case form's own Case Type dropdown is what now leads into the group-case flow —
// see single-case-form.tsx. Also reused, via `editContext`, as the "edit a VAT Group Case's
// assignees" drawer (see parent-vat-group-case-page.tsx) — the old CaseAssigneesModal is kept
// as a component for later, but no longer shown for that purpose.
export function CreateCaseDrawer({
  open,
  onOpenChange,
  entities,
  organisations,
  groups,
  onCasesGenerated,
  editContext,
}: CreateCaseDrawerProps) {
  const handleClose = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle className="font-display text-lg font-semibold">
            {editContext ? 'Edit case' : 'Create case'}
          </SheetTitle>
        </SheetHeader>

        <SingleCaseFormContent
          open={open}
          onClose={handleClose}
          entities={entities}
          organisations={organisations}
          groups={groups}
          onCasesGenerated={onCasesGenerated}
          editContext={editContext}
        />
      </SheetContent>
    </Sheet>
  )
}
