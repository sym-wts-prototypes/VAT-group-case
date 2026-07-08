import { useEffect, useState } from 'react'
import { OptionPills, Sheet, SheetContent, SheetHeader, SheetTitle } from '@wts/ui'

import { GroupCaseFormContent } from './group-case-form'
import { Group, LegalEntity } from './org-details-data'
import { Organization } from './organizations-data'
import { SingleCaseFormContent } from './single-case-form'

type CaseKind = 'single' | 'group'

const TITLE: Record<CaseKind, string> = {
  single: 'Create case',
  group: 'Create group case',
}

export interface CreateCaseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entities: LegalEntity[]
  organisations: Organization[]
  groups: Group[]
}

// The Case Management page's "Create case" drawer — the ONLY entry point that offers a choice
// of case type. Header hierarchy, top to bottom: a single shared header (title depends on
// caseKind) → the Case Type toggle → whichever of the two independent, already-implemented
// forms is selected (SingleCaseFormContent / GroupCaseFormContent, fields + footer only — the
// header lives here, not in either form, so there's exactly one title per case type instead of
// each form rendering its own). Switching the toggle swaps which form is mounted without
// reopening the Sheet.
//
// The Organisation → VAT Group entry point (groups-tab.tsx) does NOT use this component — it
// renders GroupCaseFormContent directly (locked to one group, no toggle), preserving that flow
// exactly as it worked before this feature existed.
export function CreateCaseDrawer({ open, onOpenChange, entities, organisations, groups }: CreateCaseDrawerProps) {
  const [caseKind, setCaseKind] = useState<CaseKind>('single')

  // Single Case is the default every time the drawer is opened (Part 2) — reset regardless of
  // whatever the toggle was left on during a previous open.
  useEffect(() => {
    if (open) setCaseKind('single')
  }, [open])

  const handleClose = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle className="font-display text-lg font-semibold">{TITLE[caseKind]}</SheetTitle>
        </SheetHeader>

        {/* No divider below the toggle — it should read as part of the form that follows, not
            a separate chrome section (unlike the header above, which keeps its own border-b). */}
        <div className="px-6 pt-4">
          <OptionPills
            label="Case type"
            value={caseKind}
            onChange={setCaseKind}
            className="gap-1.5"
            labelClassName="text-sm font-medium normal-case tracking-normal text-foreground"
            options={[
              { value: 'single', label: 'Single case' },
              { value: 'group', label: 'Group case' },
            ]}
          />
        </div>

        {caseKind === 'single' ? (
          <SingleCaseFormContent open={open} onClose={handleClose} entities={entities} />
        ) : (
          <GroupCaseFormContent
            open={open}
            onClose={handleClose}
            entities={entities}
            organisations={organisations}
            groups={groups}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
