import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@wts/ui'

import { LegalEntity } from './org-details-data'
import {
  COUNTRIES,
  Group,
  SERVICE_CATALOGUE,
  registrationsForEntity,
  representativeOf,
  usersForEntity,
} from './org-details-data'

// VAT-only slice of the reference platform's "Create case" drawer (see
// reference/WTS20Platform/src/components/case-management/create-case-drawer.tsx). Service
// line is fixed to VAT here since this button only exists on VAT groups — the CIT/HR-only
// fields (fiscal year range, internal/statutory deadlines) don't apply and are omitted.
// The reference's follow-on "VAT scheduler" modal is intentionally out of scope for now.
const VAT_CASE_TYPES = SERVICE_CATALOGUE.find((s) => s.key === 'VAT')?.caseTypes ?? []

export interface CreateGroupVatCaseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  entities: LegalEntity[]
}

export function CreateGroupVatCaseDrawer({ open, onOpenChange, group, entities }: CreateGroupVatCaseDrawerProps) {
  const orgEntities = useMemo(() => entities.filter((e) => e.orgId === group.orgId), [entities, group.orgId])
  const defaultEntityId = useMemo(() => {
    const rep = representativeOf(group)
    return rep?.entityId ?? orgEntities[0]?.id ?? ''
  }, [group, orgEntities])

  const [legalEntityId, setLegalEntityId] = useState(defaultEntityId)
  const [jurisdiction, setJurisdiction] = useState(group.jurisdiction)
  const [caseType, setCaseType] = useState(VAT_CASE_TYPES[0] ?? '')
  const [projectCode, setProjectCode] = useState('')
  const [creatorId, setCreatorId] = useState('')
  const [reviewerId, setReviewerId] = useState('')
  const [partnerId, setPartnerId] = useState('')
  const [clientContactIds, setClientContactIds] = useState<string[]>([])

  // Reset to a fresh prefill every time the drawer opens, rather than persisting stale
  // picks from a previous open (mirrors the reference drawer's reset-on-close behavior).
  useEffect(() => {
    if (!open) return
    setLegalEntityId(defaultEntityId)
    setJurisdiction(group.jurisdiction)
    setCaseType(VAT_CASE_TYPES[0] ?? '')
    setProjectCode('')
    setCreatorId('')
    setReviewerId('')
    setPartnerId('')
    setClientContactIds([])
  }, [open, defaultEntityId, group.jurisdiction])

  const legalEntity = orgEntities.find((e) => e.id === legalEntityId)
  const legalEntityName = legalEntity?.legalName ?? ''

  const vatRegistration = useMemo(() => {
    if (!legalEntityId) return ''
    const regs = registrationsForEntity(legalEntityId)
    const reg = regs.find((r) => r.country === jurisdiction) ?? regs[0]
    return reg?.vatNumber ?? ''
  }, [legalEntityId, jurisdiction])

  const entityUsers = useMemo(() => (legalEntityId ? usersForEntity(legalEntityId) : []), [legalEntityId])
  const internalUsers = entityUsers.filter((u) => u.userType === 'Internal')
  const externalUsers = entityUsers.filter((u) => u.userType === 'External')

  const creatorOptions = internalUsers.filter((u) => u.id !== reviewerId)
  const reviewerOptions = internalUsers.filter((u) => u.id !== creatorId)

  const toggleClientContact = (id: string) =>
    setClientContactIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const canCreate = !!legalEntityId && !!jurisdiction && !!caseType && !!creatorId && !!reviewerId

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
          <SheetTitle className="font-display text-lg font-semibold">Create a group VAT case</SheetTitle>
          <SheetDescription>
            Creates the consolidated VAT case for {group.name}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Legal entity</Label>
            <Select value={legalEntityId} onValueChange={setLegalEntityId}>
              <SelectTrigger data-testid="create-vat-case-legal-entity">
                <SelectValue placeholder="Select a legal entity" />
              </SelectTrigger>
              <SelectContent>
                {orgEntities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.legalName}
                  </SelectItem>
                ))}
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
                  <SelectValue placeholder="Select a case type" />
                </SelectTrigger>
                <SelectContent>
                  {VAT_CASE_TYPES.map((t) => (
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
            <Select value={creatorId} onValueChange={setCreatorId}>
              <SelectTrigger data-testid="create-vat-case-creator">
                <SelectValue placeholder="Select a creator" />
              </SelectTrigger>
              <SelectContent>
                {creatorOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} <span className="text-neutral-400">— {u.email}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Reviewer</Label>
            <Select value={reviewerId} onValueChange={setReviewerId}>
              <SelectTrigger data-testid="create-vat-case-reviewer">
                <SelectValue placeholder="Select a reviewer" />
              </SelectTrigger>
              <SelectContent>
                {reviewerOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} <span className="text-neutral-400">— {u.email}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">
              Partner <span className="font-normal text-neutral-400">(optional)</span>
            </Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger data-testid="create-vat-case-partner">
                <SelectValue placeholder="Select a partner" />
              </SelectTrigger>
              <SelectContent>
                {internalUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} <span className="text-neutral-400">— {u.email}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">
              Client contacts <span className="font-normal text-neutral-400">(optional)</span>
            </Label>
            <div className="flex max-h-[160px] flex-col divide-y divide-neutral-100 overflow-auto rounded-lg border border-neutral-200">
              {externalUsers.length === 0 ? (
                <p className="px-3 py-3 text-[13px] text-neutral-500">No client contacts for this entity.</p>
              ) : (
                externalUsers.map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-neutral-50">
                    <Checkbox
                      checked={clientContactIds.includes(u.id)}
                      onCheckedChange={() => toggleClientContact(u.id)}
                    />
                    <span className="flex flex-col">
                      <span className="text-[14px] leading-5 text-neutral-900">{u.name}</span>
                      <span className="text-[12px] leading-4 text-neutral-500">{u.email}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {caseNamePreview && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <span className="text-[12px] text-neutral-500">Case name</span>
              <p className="flex items-center gap-2 text-[14px] font-medium text-neutral-900">
                {legalEntityName}
                <Badge tone="blue" size="sm">
                  {caseNamePreview}
                </Badge>
              </p>
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
            Create case
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
