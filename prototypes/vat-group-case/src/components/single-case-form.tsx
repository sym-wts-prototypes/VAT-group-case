import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  cn,
  DatePicker,
  DateRangePicker,
  type DateRangePickerProps,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SheetFooter,
} from '@wts/ui'

// `@wts/ui` doesn't re-export react-day-picker's `DateRange` type, and this prototype has no
// direct dependency on that package (only `@wts/ui` does) — derive the type from
// `DateRangePickerProps` instead of adding a new dependency for a single type import.
type DateRange = NonNullable<DateRangePickerProps['value']>

import type { CaseListItem } from './case-management-data'
import {
  COUNTRIES,
  countryCodeFor,
  LegalEntity,
  SERVICE_CATALOGUE,
} from './org-details-data'
import { SingleCaseSchedulerModal } from './single-case-scheduler-modal'
import { SelectableUser, UserSelect } from './user-select'

// Single Case drawer only (see the "Single Case Creation Drawer: Case Types, Country Lock,
// VAT Registration" ticket) — none of this touches the Group Case drawer/VAT Scheduler, which
// keep their own separate `CASE_TYPE_OPTIONS`/flow untouched.
const CUSTOM_VAT_FILING_CASE_TYPE = 'Custom VAT filing'
// Cross-border EU case types (see org-details-data.ts's VAT_CASE_TYPE_GROUPS) — the only case
// types that restrict "Country (of VAT registration)" to EU countries only.
const CROSS_BORDER_EU_CASE_TYPES = ['EC Sales (ECSL)', 'Intrastat arrival', 'Intrastat dispatch']
const EU_VAT_COUNTRIES = ['Austria', 'Germany', 'Spain', 'France', 'Hungary', 'Italy', 'Netherlands', 'Poland']
const NON_EU_VAT_COUNTRIES = ['United Kingdom', 'United States']

// Replicates reference/WTS20Platform/src/components/case-management/create-case-drawer.tsx's
// single-case flow (the CreateCaseContent branch, not EditCaseAssignmentsContent) — same field
// set, ordering, and CIT/HR/VAT branching, adapted to this prototype's plain-useState form
// pattern (no react-hook-form/zod here, matching every other form in this codebase) and to a
// Legal Entity-first flow instead of the reference's client/company picker.
const FREQUENCY_OPTIONS = ['Monthly', 'Quarterly', 'Yearly'] as const
const PROJECT_CODE_MAX_LENGTH = 40

// Same placeholder directory used by the group-case form — a real user directory doesn't
// exist in this prototype yet.
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
const DEFAULT_CREATOR_IDS = ['maria-fischer']
const DEFAULT_REVIEWER_IDS = ['jordan-miller']

export interface SingleCaseFormContentProps {
  /** Mirrors the parent Sheet's `open` — drives the reset-on-open effect below. */
  open: boolean
  onClose: () => void
  entities: LegalEntity[]
  /** Called with the newly generated cases once the scheduler submits — Case Management owns
   * persisting/displaying them, this form just hands over what it produced. */
  onCasesGenerated?: (items: CaseListItem[]) => void
}

export function SingleCaseFormContent({ open, onClose, entities, onCasesGenerated }: SingleCaseFormContentProps) {
  const [legalEntityId, setLegalEntityId] = useState<string | undefined>(undefined)
  const [serviceLineKey, setServiceLineKey] = useState<string | undefined>(undefined)
  const [caseType, setCaseType] = useState<string | undefined>(undefined)
  const [frequency, setFrequency] = useState<(typeof FREQUENCY_OPTIONS)[number] | undefined>(undefined)
  const [jurisdiction, setJurisdiction] = useState<string | undefined>(undefined)
  const [fiscalYear, setFiscalYear] = useState<DateRange | undefined>(undefined)
  const [internalDeadline, setInternalDeadline] = useState<Date | undefined>(undefined)
  const [statutoryDeadline, setStatutoryDeadline] = useState<Date | undefined>(undefined)
  const [projectCode, setProjectCode] = useState('')
  const [creatorIds, setCreatorIds] = useState<string[]>(DEFAULT_CREATOR_IDS)
  const [reviewerIds, setReviewerIds] = useState<string[]>(DEFAULT_REVIEWER_IDS)
  const [partnerIds, setPartnerIds] = useState<string[]>([])
  const [clientIds, setClientIds] = useState<string[]>([])
  const [schedulerOpen, setSchedulerOpen] = useState(false)
  // VAT only — the country this filing's VAT registration is for (distinct from Jurisdiction,
  // which is the Legal Entity's own home country, locked below). Drives the auto-generated,
  // locked VAT Registration number.
  const [vatRegCountry, setVatRegCountry] = useState<string | undefined>(undefined)
  const [vatRegistrationNumber, setVatRegistrationNumber] = useState('')
  // VAT "Custom / Other" → Custom VAT filing only — the user-entered name that becomes this
  // case's case type everywhere downstream (case name preview, Case Management table).
  const [customCaseTypeName, setCustomCaseTypeName] = useState('')

  // Reset to a fresh, empty form every time the drawer opens — mirrors the group-case form's
  // reset-on-open behavior so switching the Case Type toggle back to Single Case never shows
  // a stale previous entry.
  useEffect(() => {
    if (!open) return
    setLegalEntityId(undefined)
    setServiceLineKey(undefined)
    setCaseType(undefined)
    setFrequency(undefined)
    setJurisdiction(undefined)
    setFiscalYear(undefined)
    setInternalDeadline(undefined)
    setStatutoryDeadline(undefined)
    setProjectCode('')
    setCreatorIds(DEFAULT_CREATOR_IDS)
    setReviewerIds(DEFAULT_REVIEWER_IDS)
    setPartnerIds([])
    setClientIds([])
    setSchedulerOpen(false)
    setVatRegCountry(undefined)
    setVatRegistrationNumber('')
    setCustomCaseTypeName('')
  }, [open])

  const isHrOrVat = serviceLineKey === 'HR Tax' || serviceLineKey === 'VAT'
  const isCit = serviceLineKey === 'CIT'
  const isVat = serviceLineKey === 'VAT'
  const isCustomVatFiling = isVat && caseType === CUSTOM_VAT_FILING_CASE_TYPE

  const selectedServiceLine = useMemo(
    () => SERVICE_CATALOGUE.find((s) => s.key === serviceLineKey),
    [serviceLineKey],
  )
  const caseTypeOptions = selectedServiceLine?.caseTypes ?? []
  // VAT only — grouped case types (grayish section headers + items, see Segment 1's screenshot).
  // CIT/HR Tax have no groups, so they fall through to the flat `caseTypeOptions` list as before.
  const caseTypeGroups = selectedServiceLine?.caseTypeGroups

  // Segment 2 — once a Legal Entity is picked, its real country (from the Organisations data,
  // i.e. LEGAL_ENTITIES) locks in as the Jurisdiction — no more free-picking. Falls back to
  // Germany on the rare entity with no country on file (there always is one today, but the
  // ticket calls for a safety fallback). Applies to every service line, not just VAT — the
  // Jurisdiction field means the same thing everywhere in this drawer.
  useEffect(() => {
    if (!legalEntityId) {
      setJurisdiction(undefined)
      return
    }
    const entity = entities.find((e) => e.id === legalEntityId)
    setJurisdiction(entity?.jurisdiction ?? entity?.country ?? 'Germany')
  }, [legalEntityId, entities])

  // Segment 3 — the country list depends on the selected case type: Cross-border EU case types
  // (EC Sales, Intrastat) only make sense for an EU registration; every other VAT case type
  // (including Custom VAT filing) can also register in the UK or US. Sorted alphabetically by
  // country name throughout.
  const vatRegCountryOptions = useMemo(() => {
    if (!isVat || !caseType) return []
    const isCrossBorderEu = CROSS_BORDER_EU_CASE_TYPES.includes(caseType)
    const list = isCrossBorderEu ? EU_VAT_COUNTRIES : [...EU_VAT_COUNTRIES, ...NON_EU_VAT_COUNTRIES]
    return [...list].sort((a, b) => a.localeCompare(b))
  }, [isVat, caseType])

  // The available country list changes with the case type — clear a selection that's no longer
  // offered (e.g. switching from a non-cross-border case type, which includes UK/US, to a
  // Cross-border EU one) rather than silently keeping an invalid value.
  useEffect(() => {
    if (vatRegCountry && !vatRegCountryOptions.includes(vatRegCountry)) {
      setVatRegCountry(undefined)
    }
  }, [vatRegCountry, vatRegCountryOptions])

  // Segment 4 — VAT Registration auto-fills from the chosen Country (of VAT registration): its
  // 2-letter code + 11 random digits. Locked (no manual edits); only regenerates when the
  // country selection itself changes, not on every render.
  useEffect(() => {
    if (!vatRegCountry) {
      setVatRegistrationNumber('')
      return
    }
    const code = countryCodeFor(vatRegCountry)
    const digits = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('')
    setVatRegistrationNumber(`${code}${digits}`)
  }, [vatRegCountry])

  // Clears a stale custom name if the user switches away from Custom VAT filing.
  useEffect(() => {
    if (!isCustomVatFiling) setCustomCaseTypeName('')
  }, [isCustomVatFiling])

  // What actually becomes this case's "case type" everywhere downstream (case name preview,
  // Case Management table) — the entered custom name for Custom VAT filing, the picked case
  // type for everything else.
  const effectiveCaseType =
    isCustomVatFiling && customCaseTypeName.trim() ? customCaseTypeName.trim() : caseType

  const deadlineOrderInvalid =
    !!internalDeadline && !!statutoryDeadline && internalDeadline.getTime() > statutoryDeadline.getTime()

  const creatorOptions = DUMMY_USERS.filter((u) => !reviewerIds.includes(u.id))
  const reviewerOptions = DUMMY_USERS.filter((u) => !creatorIds.includes(u.id))
  const reviewerOverlapsCreator = creatorIds.length > 0 && creatorIds.some((id) => reviewerIds.includes(id))

  const canCreate =
    !!legalEntityId &&
    !!serviceLineKey &&
    !!caseType &&
    !!jurisdiction &&
    creatorIds.length > 0 &&
    reviewerIds.length > 0 &&
    !reviewerOverlapsCreator &&
    clientIds.length > 0 &&
    (!isCit ||
      (!!frequency &&
        !!fiscalYear?.from &&
        !!fiscalYear?.to &&
        !!internalDeadline &&
        !!statutoryDeadline &&
        !deadlineOrderInvalid &&
        projectCode.trim().length > 0)) &&
    (!isVat || (!!vatRegCountry && (!isCustomVatFiling || customCaseTypeName.trim().length > 0)))

  const caseNamePreview = useMemo(() => {
    if (!serviceLineKey || !effectiveCaseType) return null
    if (isCit) {
      if (!fiscalYear?.from || !fiscalYear?.to) return null
      const startYear = fiscalYear.from.getFullYear()
      const endYear = fiscalYear.to.getFullYear()
      return `${serviceLineKey} – ${effectiveCaseType} – FY ${startYear}–${endYear}`
    }
    return `${serviceLineKey} | ${effectiveCaseType}`
  }, [serviceLineKey, effectiveCaseType, isCit, fiscalYear])

  const legalEntityName = entities.find((e) => e.id === legalEntityId)?.legalName ?? ''
  const creatorNames = creatorIds.map((id) => DUMMY_USERS.find((u) => u.id === id)?.name).filter((n): n is string => !!n)
  const reviewerNames = reviewerIds.map((id) => DUMMY_USERS.find((u) => u.id === id)?.name).filter((n): n is string => !!n)
  const partnerNames = partnerIds.map((id) => DUMMY_USERS.find((u) => u.id === id)?.name).filter((n): n is string => !!n)
  const clientNames = clientIds.map((id) => DUMMY_USERS.find((u) => u.id === id)?.name).filter((n): n is string => !!n)

  // A single, non-group VAT case gets the same VAT Scheduler flow the Group Case form uses
  // (period-by-period case generation) — CIT/HR cases have no scheduler yet, so they just
  // close the drawer directly, same as before this feature existed.
  const handleSubmit = () => {
    if (!canCreate) return
    if (isVat) {
      setSchedulerOpen(true)
    } else {
      onClose()
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Legal entity</Label>
          <Select value={legalEntityId} onValueChange={setLegalEntityId}>
            <SelectTrigger data-testid="create-single-case-legal-entity">
              <SelectValue placeholder="Select legal entity" />
            </SelectTrigger>
            <SelectContent>
              {entities.map((e) => (
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
            <Select
              value={serviceLineKey}
              onValueChange={(val) => {
                setServiceLineKey(val)
                setCaseType(undefined)
                setFrequency(undefined)
                setFiscalYear(undefined)
                setInternalDeadline(undefined)
                setStatutoryDeadline(undefined)
              }}
            >
              <SelectTrigger data-testid="create-single-case-service-line">
                <SelectValue placeholder="Select service line" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CATALOGUE.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Case type</Label>
            <Select value={caseType} onValueChange={setCaseType} disabled={!serviceLineKey}>
              <SelectTrigger data-testid="create-single-case-type">
                <SelectValue placeholder="Select case type" />
              </SelectTrigger>
              <SelectContent>
                {/* VAT only — grayish section headers grouping the case types (Segment 1 of the
                    "Single Case Creation Drawer" ticket); CIT/HR Tax have no groups on
                    `SERVICE_CATALOGUE`, so they keep the original flat list untouched. */}
                {caseTypeGroups
                  ? caseTypeGroups.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel className="text-muted-foreground text-xs font-medium">
                          {group.label}
                        </SelectLabel>
                        {group.caseTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))
                  : caseTypeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progressive reveal: the rest of the form only appears once Case Type has a valid
            selection — keeps the initial form to just Legal Entity/Service Line/Case Type. */}
        {!!caseType && (
          <>
          {/* Segment 5 — Custom VAT filing only: names the case type the rest of the form (and
              eventually the Case Management table) shows in its place. */}
          {isCustomVatFiling && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Custom case type name</Label>
              <Input
                value={customCaseTypeName}
                onChange={(e) => setCustomCaseTypeName(e.target.value)}
                placeholder="e.g. Local sales reporting, ad-hoc VAT filing..."
                data-testid="create-single-case-custom-type-name"
              />
              <p className="text-muted-foreground text-xs">
                The name is used as the case type for the scheduled case.
              </p>
            </div>
          )}

          {serviceLineKey ? (
            isHrOrVat ? (
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Jurisdiction</Label>
                {/* Segment 2 — locked to the Legal Entity's own country (see the useEffect
                    above); no longer a free pick once an entity is selected. */}
                <Select value={jurisdiction} onValueChange={setJurisdiction} disabled>
                  <SelectTrigger data-testid="create-single-case-jurisdiction">
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
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Frequency</Label>
                    <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                      <SelectTrigger data-testid="create-single-case-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Jurisdiction</Label>
                    {/* Segment 2 — same lock as the HR/VAT Jurisdiction field above. */}
                    <Select value={jurisdiction} onValueChange={setJurisdiction} disabled>
                      <SelectTrigger data-testid="create-single-case-jurisdiction">
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
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Fiscal year</Label>
                  <DateRangePicker
                    value={fiscalYear}
                    onChange={setFiscalYear}
                    placeholder="Select fiscal year period"
                    data-testid="create-single-case-fiscal-year"
                  />
                </div>
              </>
            )
          ) : null}

          {isCit && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Internal deadline</Label>
                <DatePicker
                  value={internalDeadline}
                  onChange={setInternalDeadline}
                  placeholder="Select date"
                  data-testid="create-single-case-internal-deadline"
                />
                {deadlineOrderInvalid && (
                  <p className="text-destructive text-xs">
                    Internal deadline must be on or before the statutory deadline.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Statutory deadline</Label>
                <DatePicker
                  value={statutoryDeadline}
                  onChange={setStatutoryDeadline}
                  placeholder="Select date"
                  data-testid="create-single-case-statutory-deadline"
                />
              </div>
            </>
          )}

          {/* Segment 3 — appears once Jurisdiction (Segment 2, locked from the Legal Entity) and
              Case Type are both filled. Country list depends on the case type: EU-only for
              Cross-border EU case types, EU + UK + US for everything else (including Custom VAT
              filing — see Segment 5). Name on the left, 2-letter code on the right. */}
          {isVat && !!jurisdiction && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Country (of VAT registration)</Label>
              <Select value={vatRegCountry} onValueChange={setVatRegCountry}>
                <SelectTrigger data-testid="create-single-case-vat-reg-country">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {vatRegCountryOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      <span className="flex w-full items-center justify-between gap-4">
                        <span>{c}</span>
                        <span className="text-muted-foreground">{countryCodeFor(c)}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Segment 4 — auto-fills from Country (of VAT registration): 2-letter code + 11
              random digits. Locked; only regenerates when that country selection changes. */}
          {isVat && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">VAT registration</Label>
              <Input
                value={vatRegistrationNumber}
                disabled
                readOnly
                data-testid="create-single-case-registration"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">
                Project code <span className="font-normal text-neutral-400">(optional)</span>
              </Label>
              <Input
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value.slice(0, PROJECT_CODE_MAX_LENGTH))}
                placeholder="Enter project code"
                maxLength={PROJECT_CODE_MAX_LENGTH}
                data-testid="create-single-case-project-code"
              />
            </div>
            <span
              className={cn(
                'text-right text-muted-foreground text-xs',
                projectCode.length >= PROJECT_CODE_MAX_LENGTH && 'text-destructive',
              )}
            >
              {projectCode.length}/{PROJECT_CODE_MAX_LENGTH}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Creator</Label>
            <UserSelect
              multiple
              users={creatorOptions}
              value={creatorIds}
              onChange={setCreatorIds}
              data-testid="create-single-case-creator"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Reviewer</Label>
            <UserSelect
              multiple
              users={reviewerOptions}
              value={reviewerIds}
              onChange={setReviewerIds}
              data-testid="create-single-case-reviewer"
            />
            {reviewerOverlapsCreator && (
              <p className="text-destructive text-xs">Reviewer must be different from the creator.</p>
            )}
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
              data-testid="create-single-case-partner"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Client</Label>
            <UserSelect
              multiple
              users={DUMMY_USERS}
              value={clientIds}
              onChange={setClientIds}
              data-testid="create-single-case-client"
            />
          </div>

          {caseNamePreview && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-[12px] text-neutral-500">Case name</p>
              <p className="text-[14px] font-semibold text-neutral-900">{caseNamePreview}</p>
            </div>
          )}
          </>
        )}
      </div>

      <SheetFooter className="gap-2 border-t px-6 py-4 sm:flex-col sm:space-x-0">
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!canCreate}
          onClick={handleSubmit}
          data-testid="create-single-case-submit"
        >
          {canCreate ? 'VAT Scheduler' : 'Create case'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={onClose}
          data-testid="create-single-case-cancel"
        >
          Cancel
        </Button>
      </SheetFooter>

      <SingleCaseSchedulerModal
        open={schedulerOpen}
        onOpenChange={setSchedulerOpen}
        onCreated={onClose}
        onCasesGenerated={onCasesGenerated}
        legalEntityName={legalEntityName}
        jurisdiction={jurisdiction ?? ''}
        vatRegistration={vatRegistrationNumber}
        projectCode={projectCode}
        caseTypeLabel={effectiveCaseType ?? ''}
        creatorNames={creatorNames}
        reviewerNames={reviewerNames}
        partnerNames={partnerNames}
        clientNames={clientNames}
      />
    </>
  )
}
