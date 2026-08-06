import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
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

import type { AssignedPeopleData } from './assigned-people'
import type { CaseListItem } from './case-management-data'
import {
  activeMembers,
  COUNTRIES,
  countryCodeFor,
  Group,
  LegalEntity,
  registrationsForEntity,
  representativeOf,
  SERVICE_CATALOGUE,
  usersForOrg,
} from './org-details-data'
import { Organization } from './organizations-data'
import { SingleCaseSchedulerModal } from './single-case-scheduler-modal'
import { SelectableUser, UserSelect } from './user-select'
import { vatGroupsRepresentedBy } from './vat-group-representatives'
import { VatSchedulerModal } from './vat-scheduler-modal'

// Single Case drawer only (see the "Single Case Creation Drawer: Case Types, Country Lock,
// VAT Registration" ticket) — none of this touches the Group Case drawer/VAT Scheduler, which
// keep their own separate `CASE_TYPE_OPTIONS`/flow untouched.
const CUSTOM_VAT_FILING_CASE_TYPE = 'Custom VAT filing'
// Selecting this case type switches the drawer's submit flow from the normal single-case
// scheduler over to the existing two-step group-case modal (VatSchedulerModal) — see Segment 5
// of the "VAT Group Case" ticket.
const VAT_GROUP_CASE_TYPE = 'VAT Group Case'
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

// "Edit roles" ticket — reuses this exact drawer/form (not a separate one) to edit an ALREADY-
// EXISTING VAT Group Case's Parent or Child Case assignees, locking every other field to
// whatever it was when the group case was originally created. `caseName` is the one thing that
// differs between editing the Parent Case and editing one of its Child Cases (see the Case name
// preview below) — everything else (legal entity, group, jurisdiction, VAT registration) is the
// same for both, since both stem from the same original group-creation form state.
export interface EditCaseRolesContext {
  kind: 'parent' | 'child'
  caseName: string
  /** `kind: 'child'` only — the Parent Case this Child Case belongs to, named right under the
   * Case name preview so it's unmistakable which group case the roles being edited feed into. */
  parentCaseName?: string
  legalEntityId: string
  legalEntityName: string
  groupId: string
  groupName: string
  jurisdiction: string
  vatRegCountry: string
  vatRegistrationNumber: string
  /** Scopes the Creator/Reviewer/Partner/Client pickers, same rule as at creation time. */
  orgId: string
  /** Prepopulates the pickers — the Parent Case's own assignees, or this specific Child Case's
   * own (not the Parent's), depending on `kind`. */
  assignees: AssignedPeopleData
  onSave: (people: AssignedPeopleData) => void
}

export interface SingleCaseFormContentProps {
  /** Mirrors the parent Sheet's `open` — drives the reset-on-open effect below. */
  open: boolean
  onClose: () => void
  entities: LegalEntity[]
  organisations: Organization[]
  groups: Group[]
  /** Called with the newly generated cases once the scheduler submits — Case Management owns
   * persisting/displaying them, this form just hands over what it produced. */
  onCasesGenerated?: (items: CaseListItem[]) => void
  /** When set, this drawer opens in "edit roles" mode instead of the normal creation flow — see
   * EditCaseRolesContext. */
  editContext?: EditCaseRolesContext
}

export function SingleCaseFormContent({
  open,
  onClose,
  entities,
  organisations,
  groups,
  onCasesGenerated,
  editContext,
}: SingleCaseFormContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  // "Edit roles" ticket — a brief highlight flash on the Creator/Reviewer/Partner/Client block
  // right after the auto-scroll below lands there, so it's unmistakable which part of the
  // (mostly locked) form just became the point of attention.
  const [highlightAssignees, setHighlightAssignees] = useState(false)
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
  // VAT Group Case only — which VAT group (of the ones the selected legal entity represents)
  // this case is being created for. Mandatory: the rest of the form stays hidden until set.
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined)
  const [groupSchedulerOpen, setGroupSchedulerOpen] = useState(false)
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
  // a stale previous entry. Skipped entirely in "edit roles" mode (see the seed effect below,
  // which populates the form instead of clearing it).
  useEffect(() => {
    if (!open || editContext) return
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
    setSelectedGroupId(undefined)
    setGroupSchedulerOpen(false)
  }, [open, editContext])

  // "Edit roles" ticket — prepopulates every field exactly as it was when this VAT Group Case
  // was originally created (locked below, see each field's `disabled`), and seeds the
  // Creator/Reviewer/Partner/Client pickers from this specific case's own assignees (the Parent
  // Case's, or a particular Child Case's — see EditCaseRolesContext). Runs instead of the reset
  // effect above, not in addition to it.
  useEffect(() => {
    if (!open || !editContext) return
    setServiceLineKey('VAT')
    setCaseType(VAT_GROUP_CASE_TYPE)
    setLegalEntityId(editContext.legalEntityId)
    setSelectedGroupId(editContext.groupId)
    setJurisdiction(editContext.jurisdiction)
    setVatRegCountry(editContext.vatRegCountry)
    setVatRegistrationNumber(editContext.vatRegistrationNumber)
    const pool = usersForOrg(editContext.orgId)
    const idsFor = (people?: { name: string; email: string }[]) =>
      (people ?? []).map((p) => pool.find((u) => u.email === p.email)?.id).filter((id): id is string => !!id)
    setCreatorIds(idsFor(editContext.assignees.creator))
    setReviewerIds(idsFor(editContext.assignees.reviewer))
    setPartnerIds(idsFor(editContext.assignees.partner))
    setClientIds(idsFor(editContext.assignees.client))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editContext])

  // "Edit roles" ticket — lands straight on the Creator/Reviewer/Partner/Client fields at the
  // bottom (the only editable part) so the user can start assigning immediately, with no wall of
  // locked fields to scroll past first. Jumps instantly (no smooth animation) so the drawer is
  // already showing the bottom the moment it's visible, rather than opening at the top and
  // animating down. Also flashes a brief highlight on that block once it lands, so it's
  // unmistakable where to look.
  // The progressive-reveal section those fields live in is gated on `caseType`/`selectedGroupId`
  // (see below), which the seed effect above only *requests* — React doesn't commit that state
  // until the render after this effect runs, so a naive `[open, editContext]` dependency fires the
  // scroll a beat too early, while the section (and its height) still doesn't exist. Depending on
  // `caseType`/`selectedGroupId` too makes this effect re-fire once they've actually landed, so the
  // second pass measures the real, fully-rendered scrollHeight.
  useEffect(() => {
    if (!open || !editContext) return
    const scrollId = requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'auto' })
      setHighlightAssignees(true)
    })
    const hideId = setTimeout(() => setHighlightAssignees(false), 1200)
    return () => {
      cancelAnimationFrame(scrollId)
      clearTimeout(hideId)
    }
  }, [open, editContext, caseType, selectedGroupId])

  const isHrOrVat = serviceLineKey === 'HR Tax' || serviceLineKey === 'VAT'
  const isCit = serviceLineKey === 'CIT'
  const isVat = serviceLineKey === 'VAT'
  const isCustomVatFiling = isVat && caseType === CUSTOM_VAT_FILING_CASE_TYPE
  const isVatGroupCase = isVat && caseType === VAT_GROUP_CASE_TYPE

  // Segment 3 — VAT groups the selected legal entity is a REPRESENTATIVE of. Recomputed
  // whenever the entity (or the groups data) changes; empty for an entity that represents no
  // group, which is what disables the "Select group" dropdown below.
  const representedGroups = useMemo(
    () => (legalEntityId ? vatGroupsRepresentedBy(legalEntityId, groups) : []),
    [legalEntityId, groups],
  )
  const selectedGroup = representedGroups.find((g) => g.id === selectedGroupId)

  // Clears a stale group pick if the case type moves away from VAT Group Case, or if the
  // selected entity changes and no longer represents the previously-picked group. Skipped in
  // edit mode — a Child Case's own legal entity is never the group's representative, so this
  // would otherwise immediately clear the group the seed effect above just locked in.
  useEffect(() => {
    if (editContext) return
    if (!isVatGroupCase || !representedGroups.some((g) => g.id === selectedGroupId)) {
      setSelectedGroupId(undefined)
    }
  }, [isVatGroupCase, representedGroups, selectedGroupId, editContext])

  // Feature 4 — VAT Group Case doesn't get the Single Case flow's default Creator/Reviewer, and
  // its people pickers are scoped to the legal entity's own organisation (see peoplePool below),
  // not the generic directory — so a switch into this case type must start every role empty
  // rather than carrying over ids that pool may not even contain. Switching back out restores
  // the normal single-case defaults. Skipped in edit mode: `isVatGroupCase` flips true the
  // moment the seed effect sets `caseType`, which would otherwise wipe the assignees that same
  // effect just seeded.
  useEffect(() => {
    if (editContext) return
    if (isVatGroupCase) {
      setCreatorIds([])
      setReviewerIds([])
      setPartnerIds([])
      setClientIds([])
    } else {
      setCreatorIds(DEFAULT_CREATOR_IDS)
      setReviewerIds(DEFAULT_REVIEWER_IDS)
    }
  }, [isVatGroupCase, editContext])

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
  // Jurisdiction field means the same thing everywhere in this drawer. Skipped in edit mode —
  // `entities` isn't even populated there (see the edit-drawer's own call site), and the seed
  // effect above already set the correct locked Jurisdiction directly.
  useEffect(() => {
    if (editContext) return
    if (!legalEntityId) {
      setJurisdiction(undefined)
      return
    }
    const entity = entities.find((e) => e.id === legalEntityId)
    setJurisdiction(entity?.jurisdiction ?? entity?.country ?? 'Germany')
  }, [legalEntityId, entities, editContext])

  // Segment 3 — the country list depends on the selected case type: Cross-border EU case types
  // (EC Sales, Intrastat) only make sense for an EU registration; every other VAT case type
  // (including Custom VAT filing) can also register in the UK or US. Sorted alphabetically by
  // country name throughout. Edit mode short-circuits to a single-item list containing just the
  // case's own locked country — this field's Select is disabled either way, and the real
  // options list depends on the group's real member data, which the edit-drawer's call site
  // doesn't pass in (see EditCaseRolesContext — it doesn't need to).
  const vatRegCountryOptions = useMemo(() => {
    if (editContext) return [editContext.vatRegCountry]
    if (!isVat || !caseType) return []
    const isCrossBorderEu = CROSS_BORDER_EU_CASE_TYPES.includes(caseType)
    const list = isCrossBorderEu ? EU_VAT_COUNTRIES : [...EU_VAT_COUNTRIES, ...NON_EU_VAT_COUNTRIES]
    const sorted = [...list].sort((a, b) => a.localeCompare(b))
    // Feature 5/6 follow-up — VAT Group Case only: offering a country none of the group's
    // active members are actually registered in would leave step 2 of the VAT Scheduler with
    // zero legal entities to configure, so narrow the list to countries the group can serve.
    if (!isVatGroupCase) return sorted
    if (!selectedGroup) return []
    const registeredCountries = new Set(
      activeMembers(selectedGroup).flatMap((m) => registrationsForEntity(m.entityId).map((r) => r.country)),
    )
    return sorted.filter((c) => registeredCountries.has(c))
  }, [editContext, isVat, caseType, isVatGroupCase, selectedGroup])

  // The available country list changes with the case type — clear a selection that's no longer
  // offered (e.g. switching from a non-cross-border case type, which includes UK/US, to a
  // Cross-border EU one) rather than silently keeping an invalid value. Skipped in edit mode
  // (redundant there anyway — `vatRegCountryOptions` above always includes the locked value).
  useEffect(() => {
    if (editContext) return
    if (vatRegCountry && !vatRegCountryOptions.includes(vatRegCountry)) {
      setVatRegCountry(undefined)
    }
  }, [vatRegCountry, vatRegCountryOptions, editContext])

  // Segment 4 — VAT Registration auto-fills from the chosen Country (of VAT registration): its
  // 2-letter code + 11 random digits. Locked (no manual edits); only regenerates when the
  // country selection itself changes, not on every render. Skipped in edit mode — regenerating
  // would overwrite the case's own real, already-locked VAT registration number with a fresh
  // random one the moment the seed effect sets `vatRegCountry`.
  useEffect(() => {
    if (editContext) return
    if (!vatRegCountry) {
      setVatRegistrationNumber('')
      return
    }
    const code = countryCodeFor(vatRegCountry)
    const digits = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('')
    setVatRegistrationNumber(`${code}${digits}`)
  }, [vatRegCountry, editContext])

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

  const legalEntity = entities.find((e) => e.id === legalEntityId)

  // Feature 4 — VAT Group Case limits every role picker to the legal entity's own organisation
  // (not the generic 8-person directory every other case type still uses). Edit mode sources
  // the org directly from EditCaseRolesContext, since `entities`/`legalEntity` aren't populated
  // there (see the edit-drawer's own call site).
  const peoplePool: SelectableUser[] = useMemo(
    () =>
      editContext
        ? usersForOrg(editContext.orgId)
        : isVatGroupCase
          ? legalEntity
            ? usersForOrg(legalEntity.orgId)
            : []
          : DUMMY_USERS,
    [editContext, isVatGroupCase, legalEntity],
  )
  const creatorOptions = peoplePool.filter((u) => !reviewerIds.includes(u.id))
  const reviewerOptions = peoplePool.filter((u) => !creatorIds.includes(u.id))
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
    (!isVatGroupCase || !!selectedGroupId) &&
    (!isCit ||
      (!!frequency &&
        !!fiscalYear?.from &&
        !!fiscalYear?.to &&
        !!internalDeadline &&
        !!statutoryDeadline &&
        !deadlineOrderInvalid &&
        projectCode.trim().length > 0)) &&
    (!isVat || (!!vatRegCountry && (!isCustomVatFiling || customCaseTypeName.trim().length > 0)))

  // "Edit roles" ticket — same mandatory-role rule the (now-unused, kept for later)
  // CaseAssigneesModal enforced: Creator/Reviewer/Client each need >=1 person; Partner stays
  // optional. Everything else is already locked/valid, so it isn't re-checked here.
  const canSaveEdit = creatorIds.length > 0 && reviewerIds.length > 0 && clientIds.length > 0

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

  // Feature 3 ("edit roles" ticket) — the Case name preview shows this specific case's own name
  // in edit mode (the Parent Case's, or a particular Child Case's), not the generic
  // ServiceLine|CaseType preview the create flow computes above.
  const caseNameToShow = editContext ? editContext.caseName : caseNamePreview

  const legalEntityName = legalEntity?.legalName ?? ''
  const creatorNames = creatorIds.map((id) => peoplePool.find((u) => u.id === id)?.name).filter((n): n is string => !!n)
  const reviewerNames = reviewerIds.map((id) => peoplePool.find((u) => u.id === id)?.name).filter((n): n is string => !!n)
  const partnerNames = partnerIds.map((id) => peoplePool.find((u) => u.id === id)?.name).filter((n): n is string => !!n)
  const clientNames = clientIds.map((id) => peoplePool.find((u) => u.id === id)?.name).filter((n): n is string => !!n)

  // Segment 5 — data for the existing two-step group-case modal (VatSchedulerModal), computed
  // the same way group-case-form.tsx computes it for the same group: the higher-level
  // Organisation name (not the technical legal entity name), and every active member with the
  // representative flagged for the modal's badge.
  const organisationName = legalEntity
    ? organisations.find((o) => o.id === legalEntity.orgId)?.name ?? legalEntityName
    : ''
  // Feature 5/6 — step 2 of the VAT Scheduler only ever shows entities registered in the
  // selected Country (of VAT registration); an entity in the group with no registration there
  // simply doesn't get a case (or a role-assignment row) this period.
  const groupMembers = useMemo(() => {
    if (!selectedGroup) return []
    const representativeId = representativeOf(selectedGroup)?.entityId
    const members = vatRegCountry
      ? activeMembers(selectedGroup).filter((m) =>
          registrationsForEntity(m.entityId).some((r) => r.country === vatRegCountry),
        )
      : activeMembers(selectedGroup)
    return members.map((m) => ({
      id: m.entityId,
      name: entities.find((e) => e.id === m.entityId)?.legalName ?? m.entityId,
      isRepresentative: m.entityId === representativeId,
    }))
  }, [selectedGroup, entities, vatRegCountry])
  const clientName = clientNames.join(', ')

  // Feature 1 ("edit roles" ticket) — converts the picker ids back into the {name,email}-per-role
  // shape the header/list assignee displays use, the same conversion CaseAssigneesModal (now
  // unused, kept for later) did.
  const buildEditedAssignees = (): AssignedPeopleData => {
    const peopleFor = (ids: string[]) =>
      ids
        .map((id) => peoplePool.find((u) => u.id === id))
        .filter((u): u is SelectableUser => !!u)
        .map((u) => ({ name: u.name, email: u.email }))
    return {
      creator: peopleFor(creatorIds),
      reviewer: peopleFor(reviewerIds),
      partner: peopleFor(partnerIds),
      client: peopleFor(clientIds),
    }
  }

  // A single, non-group VAT case gets the same VAT Scheduler flow the Group Case form uses
  // (period-by-period case generation) — CIT/HR cases have no scheduler yet, so they just
  // close the drawer directly, same as before this feature existed. VAT Group Case instead
  // opens the existing two-step group-case modal (Segment 5) — the same modal the old "Group
  // case" toggle position used to open. "Edit roles" mode bypasses all of this entirely — there's
  // no new case to generate, just an assignee update on an existing one.
  const handleSubmit = () => {
    if (editContext) {
      if (!canSaveEdit) return
      editContext.onSave(buildEditedAssignees())
      onClose()
      return
    }
    if (!canCreate) return
    if (isVatGroupCase) {
      setGroupSchedulerOpen(true)
    } else if (isVat) {
      setSchedulerOpen(true)
    } else {
      onClose()
    }
  }

  return (
    <>
      <div ref={contentRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Legal entity</Label>
          <Select value={legalEntityId} onValueChange={setLegalEntityId} disabled={!!editContext}>
            <SelectTrigger data-testid="create-single-case-legal-entity">
              <SelectValue placeholder="Select legal entity" />
            </SelectTrigger>
            <SelectContent>
              {/* "Edit roles" ticket — a single locked option standing in for the real list,
                  which isn't even passed to this drawer in edit mode (see EditCaseRolesContext;
                  the field is disabled either way, so it never needs the rest). */}
              {editContext ? (
                <SelectItem value={editContext.legalEntityId}>{editContext.legalEntityName}</SelectItem>
              ) : (
                // Segment 6 — badges the entities that are a VAT group representative, so picking
                // one and then Case type → VAT Group Case leads to an enabled, populated
                // "Select group" dropdown below (the happy path).
                entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex w-full items-center justify-between gap-2">
                      <span>{e.legalName}</span>
                      {vatGroupsRepresentedBy(e.id, groups).length > 0 && (
                        <Badge variant="soft" tone="blue" size="sm">
                          Representative
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))
              )}
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
              disabled={!!editContext}
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
            <Select value={caseType} onValueChange={setCaseType} disabled={!!editContext || !serviceLineKey}>
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

        {/* Segment 3 — VAT Group Case only: appears as soon as the case type is picked, ahead
            of (and gating) the rest of the form. Disabled with the exact placeholder below when
            the selected legal entity represents no VAT group. */}
        {isVatGroupCase && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Select group</Label>
            <Select
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}
              disabled={!!editContext || representedGroups.length === 0}
            >
              <SelectTrigger data-testid="create-single-case-vat-group">
                <SelectValue
                  placeholder={
                    representedGroups.length === 0
                      ? 'Selected legal entity is not a representative in any group...'
                      : 'Select a group'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {editContext ? (
                  <SelectItem value={editContext.groupId}>{editContext.groupName}</SelectItem>
                ) : (
                  representedGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Progressive reveal: the rest of the form only appears once Case Type has a valid
            selection — keeps the initial form to just Legal Entity/Service Line/Case Type.
            Segment 4 — for VAT Group Case specifically, it stays hidden until a group is picked
            above (mandatory; the dropdown may also be disabled with no groups to pick). */}
        {!!caseType && (!isVatGroupCase || !!selectedGroupId) && (
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
              <Select value={vatRegCountry} onValueChange={setVatRegCountry} disabled={!!editContext}>
                <SelectTrigger data-testid="create-single-case-vat-reg-country">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {/* Name flush-left, 2-letter code flush-right — via SelectItem's `rightSlot`
                      (see packages/ui/src/select.tsx), same solution the reference project uses
                      for this exact row. A previous version positioned a child span `absolute`
                      to escape Radix SelectItem's `ItemText` wrapper, but an absolutely-positioned
                      child is removed from layout flow and contributes no height to its parent —
                      that collapsed every row to ~12px tall and spilled the actual (much taller)
                      text over neighbouring rows and the field below the list. */}
                  {vatRegCountryOptions.map((c) => (
                    <SelectItem key={c} value={c} rightSlot={countryCodeFor(c)}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Feature 5 — VAT Group Case only: this country doesn't just tag the case, it
                  filters which of the group's legal entities get included. */}
              {isVatGroupCase && (
                <p className="text-[12px] leading-4 text-neutral-400">
                  Only legal entities registered in this country will be included from the
                  selected group.
                </p>
              )}
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
                disabled={!!editContext}
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

          <div
            className={cn(
              '-mx-3 flex flex-col gap-4 rounded-lg border border-transparent p-3 transition-colors duration-700',
              highlightAssignees && 'border-amber-200 bg-amber-50',
            )}
          >
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Creator</Label>
              <UserSelect
                multiple
                users={creatorOptions}
                value={creatorIds}
                onChange={setCreatorIds}
                data-testid="create-single-case-creator"
              />
              {/* "Edit roles" ticket — same mandatory-role rule the (now-unused) CaseAssigneesModal
                  enforced: orange hint the moment a mandatory role has nobody assigned. */}
              {creatorIds.length === 0 && (
                <p className="text-amber-600 text-xs">Creator needs at least one assignee.</p>
              )}
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
              {reviewerIds.length === 0 && (
                <p className="text-amber-600 text-xs">Reviewer needs at least one assignee.</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">
                Partner <span className="font-normal text-neutral-400">(optional)</span>
              </Label>
              <UserSelect
                multiple
                users={peoplePool}
                value={partnerIds}
                onChange={setPartnerIds}
                data-testid="create-single-case-partner"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Client</Label>
              <UserSelect
                multiple
                users={peoplePool}
                value={clientIds}
                onChange={setClientIds}
                data-testid="create-single-case-client"
              />
              {clientIds.length === 0 && (
                <p className="text-amber-600 text-xs">Client needs at least one assignee.</p>
              )}
            </div>
          </div>

          {caseNameToShow && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-[12px] text-neutral-500">Case name</p>
              <p className="text-[14px] font-semibold text-neutral-900">{caseNameToShow}</p>
              {/* "Edit roles" ticket — a Child Case's roles feed into its Parent Case's
                  consolidated filing, so naming that parent right here removes any doubt about
                  which group case this assignment belongs to. */}
              {editContext?.kind === 'child' && editContext.parentCaseName && (
                <p className="mt-1.5 border-t border-neutral-200 pt-1.5 text-[12px] text-neutral-500">
                  Part of parent case:{' '}
                  <span className="font-medium text-neutral-700">{editContext.parentCaseName}</span>
                </p>
              )}
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
          disabled={editContext ? !canSaveEdit : !canCreate}
          onClick={handleSubmit}
          data-testid="create-single-case-submit"
        >
          {editContext ? 'Save' : canCreate ? 'VAT Scheduler' : 'Create case'}
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
        vatRegCountry={vatRegCountry}
        vatRegistration={vatRegistrationNumber}
        projectCode={projectCode}
        caseTypeLabel={effectiveCaseType ?? ''}
        creatorNames={creatorNames}
        reviewerNames={reviewerNames}
        partnerNames={partnerNames}
        clientNames={clientNames}
      />

      {/* Segment 5 — VAT Group Case reuses this exact modal as-is (same component the old
          "Group case" toggle position opened), fed the selected group's data instead of the
          normal single-case scheduler above. */}
      <VatSchedulerModal
        open={groupSchedulerOpen}
        onOpenChange={setGroupSchedulerOpen}
        onCreated={onClose}
        onCasesGenerated={onCasesGenerated}
        organisationName={organisationName}
        groupName={selectedGroup?.name ?? ''}
        jurisdiction={jurisdiction ?? ''}
        vatRegistration={vatRegistrationNumber}
        projectCode={projectCode}
        caseTypeLabel="Return"
        creatorNames={creatorNames}
        reviewerNames={reviewerNames}
        partnerNames={partnerNames}
        clientName={clientName}
        groupMembers={groupMembers}
        groupOrgId={selectedGroup?.orgId ?? ''}
      />
    </>
  )
}
