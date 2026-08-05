import { useEffect, useState } from 'react'
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@wts/ui'

import type { VatGroupCase } from './case-management-data'
import { REPRESENTATIVE_ASSIGNEES } from './vat-group-case-assignees'
import { SelectableUser, UserSelect } from './user-select'

// "Correction Case" ticket, Segment 1 — the button on the Parent Case header opens this,
// pre-populated and locked from `original` (only Creator/Reviewer/Partner/Client can change).
// Deliberately its own small component rather than reusing `GroupCaseFormContent`/
// `SingleCaseFormContent` as-is: those forms carry a lot of Organisation/Group-picking and
// CIT/HR branching that doesn't apply once every field but assignment is already decided —
// forking keeps this drawer simple and keeps the original forms' logic untouched.

// EUROPIPE's 5 real Organisation Users (see vat-group-case-assignees.ts) — the only people who
// may ever be assigned to a EUROPIPE case, same roster the Parent/Child Case pages use.
const EUROPIPE_USERS: SelectableUser[] = [
  { id: 'julia-hoffmann', name: 'Julia Hoffmann', email: 'julia.hoffmann@wts.com' },
  { id: 'sofia-rossi', name: 'Sofia Rossi', email: 'sofia.rossi@europipe.com' },
  { id: 'markus-weber', name: 'Markus Weber', email: 'markus.weber@europipe.com' },
  { id: 'klara-vogel', name: 'Klara Vogel', email: 'klara.vogel@europipe.com' },
  { id: 'tomasz-nowak', name: 'Tomasz Nowak', email: 'tomasz.nowak@europipe.com' },
]

function idsForNames(names: string[] | undefined): string[] {
  if (!names) return []
  return names
    .map((name) => EUROPIPE_USERS.find((u) => u.name === name)?.id)
    .filter((id): id is string => !!id)
}

export interface CreateCorrectionCaseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  original: VatGroupCase
  /** Opens the VAT Scheduler (Segment 2) once role assignment is confirmed. */
  onContinue: (assignees: { creatorNames: string[]; reviewerNames: string[]; partnerNames: string[]; clientNames: string[] }) => void
}

export function CreateCorrectionCaseDrawer({ open, onOpenChange, original, onContinue }: CreateCorrectionCaseDrawerProps) {
  const [creatorIds, setCreatorIds] = useState<string[]>([])
  const [reviewerIds, setReviewerIds] = useState<string[]>([])
  const [partnerIds, setPartnerIds] = useState<string[]>([])
  const [clientIds, setClientIds] = useState<string[]>([])

  // Prepopulate from the original Parent Case's own assignees every time the drawer opens —
  // same reset-on-open convention the other creation drawers already use.
  useEffect(() => {
    if (!open) return
    setCreatorIds(idsForNames(REPRESENTATIVE_ASSIGNEES.creator?.map((p) => p.name)))
    setReviewerIds(idsForNames(REPRESENTATIVE_ASSIGNEES.reviewer?.map((p) => p.name)))
    setPartnerIds(idsForNames(REPRESENTATIVE_ASSIGNEES.partner?.map((p) => p.name)))
    setClientIds(idsForNames(REPRESENTATIVE_ASSIGNEES.client?.map((p) => p.name)))
  }, [open])

  const canContinue = creatorIds.length > 0 && reviewerIds.length > 0 && clientIds.length > 0

  const handleContinue = () => {
    if (!canContinue) return
    onContinue({
      creatorNames: creatorIds.map((id) => EUROPIPE_USERS.find((u) => u.id === id)?.name ?? id),
      reviewerNames: reviewerIds.map((id) => EUROPIPE_USERS.find((u) => u.id === id)?.name ?? id),
      partnerNames: partnerIds.map((id) => EUROPIPE_USERS.find((u) => u.id === id)?.name ?? id),
      clientNames: clientIds.map((id) => EUROPIPE_USERS.find((u) => u.id === id)?.name ?? id),
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle className="font-display text-lg font-semibold">Create Correction Case</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Legal entity</Label>
            <Input value={original.representativeEntity} disabled readOnly />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Service line</Label>
              <Select value="VAT" disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAT">VAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Case type</Label>
              <Select value="VAT Group Case" disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAT Group Case">VAT Group Case</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Select group</Label>
            <Select value={original.vatGroupName} disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={original.vatGroupName}>{original.vatGroupName}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Jurisdiction</Label>
            <Input value={original.jurisdiction} disabled readOnly />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">VAT registration</Label>
            <Input value={original.id} disabled readOnly />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">
              Project code <span className="font-normal text-neutral-400">(optional)</span>
            </Label>
            <Input value="" disabled readOnly placeholder="—" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Creator</Label>
            <UserSelect multiple users={EUROPIPE_USERS} value={creatorIds} onChange={setCreatorIds} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Reviewer</Label>
            <UserSelect multiple users={EUROPIPE_USERS} value={reviewerIds} onChange={setReviewerIds} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">
              Partner <span className="font-normal text-neutral-400">(optional)</span>
            </Label>
            <UserSelect multiple users={EUROPIPE_USERS} value={partnerIds} onChange={setPartnerIds} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Client</Label>
            <UserSelect multiple users={EUROPIPE_USERS} value={clientIds} onChange={setClientIds} />
          </div>
        </div>

        <SheetFooter className="gap-2 border-t px-6 py-4 sm:flex-col sm:space-x-0">
          <Button type="button" size="lg" className="w-full" disabled={!canContinue} onClick={handleContinue}>
            VAT Scheduler
          </Button>
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
