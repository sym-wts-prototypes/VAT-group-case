import { useEffect, useMemo, useState } from 'react'
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

import { LegalEntity } from './org-details-data'
import { COUNTRIES, Group, registrationsForEntity, representativeOf } from './org-details-data'
import { SelectableUser, UserSelect } from './user-select'

// VAT-only slice of the reference platform's "Create case" drawer (see
// reference/WTS20Platform/src/components/case-management/create-case-drawer.tsx). Service
// line is fixed to VAT here since this button only exists on VAT groups — the CIT/HR-only
// fields (fiscal year range, internal/statutory deadlines) don't apply and are omitted.
// The reference's follow-on "VAT scheduler" modal is intentionally out of scope for now.
const CASE_TYPE_OPTIONS = ['Return']

// Dummy directory for the Creator/Reviewer/Partner/Client pickers — placeholder data until
// this wires into a real user directory.
const DUMMY_USERS: SelectableUser[] = [
  { id: 'maria-fischer', name: 'Maria Fischer', email: 'maria.fischer@example.com' },
  { id: 'jordan-miller', name: 'Jordan Miller', email: 'jordan.miller@example.com' },
  { id: 'oscar-wilson', name: 'Oscar Wilson', email: 'oscar.wilson@example.com' },
  { id: 'emma-johnson', name: 'Emma Johnson', email: 'emma.johnson@example.com' },
  { id: 'lucas-brown', name: 'Lucas Brown', email: 'lucas.brown@example.com' },
  { id: 'sophie-martin', name: 'Sophie Martin', email: 'sophie.martin@example.com' },
  { id: 'noah-davis', name: 'Noah Davis', email: 'noah.davis@example.com' },
  { id: 'olivia-taylor', name: 'Olivia Taylor', email: 'olivia.taylor@example.com' },
]
const DEFAULT_CREATOR_ID = 'maria-fischer'
const DEFAULT_REVIEWER_ID = 'jordan-miller'
const DEFAULT_CLIENT_ID = 'oscar-wilson'

export interface CreateGroupVatCaseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  entities: LegalEntity[]
}

export function CreateGroupVatCaseDrawer({ open, onOpenChange, group, entities }: CreateGroupVatCaseDrawerProps) {
  const orgEntities = useMemo(() => entities.filter((e) => e.orgId === group.orgId), [entities, group.orgId])
  // Legal entity and group are both fixed by the entry point (this drawer only ever opens
  // from one specific group's detail view) — neither is user-editable.
  const legalEntityId = useMemo(() => {
    const rep = representativeOf(group)
    return rep?.entityId ?? orgEntities[0]?.id ?? ''
  }, [group, orgEntities])

  const [jurisdiction, setJurisdiction] = useState(group.jurisdiction)
  const [caseType, setCaseType] = useState(CASE_TYPE_OPTIONS[0])
  const [projectCode, setProjectCode] = useState('')
  const [creatorId, setCreatorId] = useState<string | undefined>(DEFAULT_CREATOR_ID)
  const [reviewerId, setReviewerId] = useState<string | undefined>(DEFAULT_REVIEWER_ID)
  const [partnerIds, setPartnerIds] = useState<string[]>([])
  const [clientId, setClientId] = useState<string | undefined>(DEFAULT_CLIENT_ID)

  // Reset to a fresh prefill every time the drawer opens, rather than persisting stale
  // picks from a previous open (mirrors the reference drawer's reset-on-close behavior).
  useEffect(() => {
    if (!open) return
    setJurisdiction(group.jurisdiction)
    setCaseType(CASE_TYPE_OPTIONS[0])
    setProjectCode('')
    setCreatorId(DEFAULT_CREATOR_ID)
    setReviewerId(DEFAULT_REVIEWER_ID)
    setPartnerIds([])
    setClientId(DEFAULT_CLIENT_ID)
  }, [open, group.jurisdiction])

  const legalEntity = orgEntities.find((e) => e.id === legalEntityId)
  const legalEntityName = legalEntity?.legalName ?? ''

  const vatRegistration = useMemo(() => {
    if (!legalEntityId) return ''
    const regs = registrationsForEntity(legalEntityId)
    const reg = regs.find((r) => r.country === jurisdiction) ?? regs[0]
    return reg?.vatNumber ?? ''
  }, [legalEntityId, jurisdiction])

  const creatorOptions = DUMMY_USERS.filter((u) => u.id !== reviewerId)
  const reviewerOptions = DUMMY_USERS.filter((u) => u.id !== creatorId)

  // Partner is optional and excluded on purpose — every other field here is required.
  const canCreate = !!legalEntityId && !!group.id && !!caseType && !!creatorId && !!reviewerId && !!clientId

  const caseNamePreview = caseType ? `VAT | ${caseType}` : null

  const handleClose = () => onOpenChange(false)

  const handleSubmit = () => {
    if (!canCreate) return
    // No backend yet — the reference's VAT-scheduler follow-on modal is a separate,
    // larger piece of work deferred for a later pass. For now, creating just closes.
    handleClose()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[560px]">
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle className="font-display text-lg font-semibold">Create a group case</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Legal entity</Label>
            <Input value={legalEntityName} disabled readOnly data-testid="create-vat-case-legal-entity" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Select group</Label>
            <Select value={group.id} disabled>
              <SelectTrigger data-testid="create-vat-case-group">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={group.id}>{group.name}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Service line</Label>
              <Select value="VAT" disabled>
                <SelectTrigger data-testid="create-vat-case-service-line">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAT">VAT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Case type</Label>
              <Select value={caseType} onValueChange={setCaseType}>
                <SelectTrigger data-testid="create-vat-case-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CASE_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Jurisdiction</Label>
            <Select value={jurisdiction} onValueChange={setJurisdiction}>
              <SelectTrigger data-testid="create-vat-case-jurisdiction">
                <SelectValue placeholder="Select a jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">VAT registration</Label>
            <Input value={vatRegistration} disabled readOnly data-testid="create-vat-case-registration" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Project code</Label>
            <Input
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              placeholder="Optional"
              data-testid="create-vat-case-project-code"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Creator</Label>
            <UserSelect
              users={creatorOptions}
              value={creatorId}
              onChange={setCreatorId}
              data-testid="create-vat-case-creator"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Reviewer</Label>
            <UserSelect
              users={reviewerOptions}
              value={reviewerId}
              onChange={setReviewerId}
              data-testid="create-vat-case-reviewer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">
              Partner <span className="font-normal text-neutral-400">(optional)</span>
            </Label>
            <UserSelect
              multiple
              users={DUMMY_USERS}
              value={partnerIds}
              onChange={setPartnerIds}
              data-testid="create-vat-case-partner"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Client</Label>
            <UserSelect
              users={DUMMY_USERS}
              value={clientId}
              onChange={setClientId}
              data-testid="create-vat-case-client"
            />
          </div>

          {caseNamePreview && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-[12px] text-neutral-500">Case name</p>
              <p className="text-[14px] font-semibold text-neutral-900">{caseNamePreview}</p>
            </div>
          )}
        </div>

        <SheetFooter className="gap-2 border-t px-6 py-4 sm:flex-col sm:space-x-0">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!canCreate}
            onClick={handleSubmit}
            data-testid="create-vat-case-submit"
          >
            VAT Scheduler
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleClose}
            data-testid="create-vat-case-cancel"
          >
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
