import { useState } from 'react'
import { ArrowUpLeft, ArrowUpRight } from 'lucide-react'

import { Alert, Button } from '@wts/ui'

import type { AssignedPeopleData } from '@/components/assigned-people'
import { CloseCaseDialog } from '@/components/body/CloseCaseDialog'
import { CommentsDrawer } from '@/components/body/CommentsDrawer'
import { SendPackageDialog, type SendPackageDetails } from '@/components/body/SendPackageDialog'
import { BodyPlaceholder } from '@/components/body/BodyPlaceholder'
import { CaseManagementPage } from '@/components/case-management-page'
import { CORRECTION_PARENT_CASE, DUMMY_GROUP_CASES } from '@/components/case-management-data'
import { CreateCaseDrawer } from '@/components/create-case-drawer'
import { OrganisationsEntryPage } from '@/components/organisations-entry'
import { GROUPS, LEGAL_ENTITIES, vatRegistrationForJurisdiction } from '@/components/org-details-data'
import { INITIAL_ORGANIZATIONS } from '@/components/organizations-data'
import { ParentVatGroupCasePage } from '@/components/parent-vat-group-case-page'
import type { EditCaseRolesContext } from '@/components/single-case-form'
import { CHILD_CASE_DEMO_ASSIGNEES, REPRESENTATIVE_ASSIGNEES } from '@/components/vat-group-case-assignees'
import { HeaderRenderer } from '@/components/headers/HeaderRenderer'
import { SAMPLE_CASE, SAMPLE_CASE_TITLE } from '@/config/sampleData'
import { getRequirementCategory } from '@/config/requirements'
import { bucketStatusFromMarkAsDone } from '@/lib/bucketStatus'
import {
  isAssessmentClosureGateActive,
  isCaseApprovalGateActive,
  isCaseTasksGateActive,
  isCitInReviewReconfirmGateActive,
  isNeedChangesCreatorCase,
  isSubmissionProtocolGateActive,
  NEED_CHANGES_CREATOR_HEADER_ACTIONS,
  VAT_GROUP_CHILD_CASE_INITIAL_STATUSES,
  VAT_GROUP_CHILD_CASE_TASKS,
} from '@/lib/caseTasks'
import {
  isPackageBannerPhase,
  packageBannerStateFromOutcome,
} from '@/config/packageBanners'
import { resolveHeader } from '@/lib/resolveHeader'
import { useDemoStore } from '@/store/useDemoStore'
import { useRequirementsStore } from '@/store/useRequirementsStore'
import type { BucketStatus } from '@/types'

// Feature 4 of the "playground navigation" ticket — Single Case has no persistent named
// dataset to suffix like the Group Case correction data does, so State A's " / Correction 1"
// title suffix and the correction link/banner's case names read the header's own resolved
// title text instead.
function titleToPlainString(title: { parts?: string[]; plain?: string } | undefined): string {
  return title?.parts?.join(' · ') ?? title?.plain ?? 'this case'
}

/** Header + page body rendered inside the WTS app shell (Figma page content). */
export function PlaygroundMain() {
  const {
    process,
    platform,
    role,
    headerType,
    phase,
    tasksDoneChecked,
    approvedChecked,
    tasksReconfirmedDone,
    assessmentsState,
    protocolConfirmationChecked,
    packageReviewOutcome,
    bucketMarkAsDoneChecked,
    selectedRequirementCategoryId,
    showCaseManagement,
    showOrganisations,
    caseKind,
    groupCaseView,
    caseVariant,
    correctionViewSide,
    setCaseVariant,
    setCorrectionViewSide,
    setGroupCaseView,
    childCaseRequiresClientApproval,
    openChildCaseId,
    childCaseComments,
    setHeaderType,
    setBucketMarkAsDoneChecked,
    setSelectedRequirementCategoryId,
    setPhase,
  } = useDemoStore()
  const [closeCaseOpen, setCloseCaseOpen] = useState(false)
  // Captured once, at close time, by CloseCaseDialog — no UI anywhere lets these be added,
  // edited, or removed afterwards (see the "Split closing comment" ticket, Segment 5).
  const [internalClosingComment, setInternalClosingComment] = useState('')
  const [clientClosingComment, setClientClosingComment] = useState('')
  // Plain (non-group) single-case flow's own "Send for approval" confirm dialog — same
  // component and same creator-comment-for-the-client behaviour as the Group Case's own
  // SendPackageDialog usage (parent-vat-group-case-page.tsx), just a separate instance since
  // this is a different component tree.
  const [sendApprovalOpen, setSendApprovalOpen] = useState(false)
  const [creatorClientComment, setCreatorClientComment] = useState<string | null>(null)
  // Shared by every "Comments" trigger the Client sees (bucket header, bucket cards, opened
  // category) — same CommentsDrawer the Requirements List (WTS) uses, backed by the same
  // useRequirementsStore comment thread (see RequirementListAccordion.tsx), so reading a
  // category's new comment from either side clears it for both.
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false)
  const [activeClientCommentsCategoryId, setActiveClientCommentsCategoryId] = useState<string | null>(null)
  const openClientComments = (categoryId: string) => {
    setActiveClientCommentsCategoryId(categoryId)
    setCommentsDrawerOpen(true)
  }
  const clientCategoryComments = useRequirementsStore((s) => s.categoryComments)
  const seenClientCategoryIds = useRequirementsStore((s) => s.seenCategoryIds)
  const sendComment = useRequirementsStore((s) => s.sendComment)
  const markCategorySeen = useRequirementsStore((s) => s.markCategorySeen)
  const hasUnseenClientComment = (categoryId: string) =>
    !seenClientCategoryIds[categoryId] && (clientCategoryComments[categoryId]?.some((c) => c.isNew) ?? false)
  // "Edit case" side drawer (CreateCaseDrawer's editContext) opened from the header's own
  // AssignedPeople "Edit" action — same drawer the Parent Case's child-cases list already uses
  // (parent-vat-group-case-page.tsx), reached here for whichever case is currently open (a
  // Child Case, with its parent named, or a plain Single Case, with no parent reference).
  // `undefined` override = show whatever the un-edited demo data already displays.
  const [assigneesDrawerOpen, setAssigneesDrawerOpen] = useState(false)
  const [childAssignedPeopleOverride, setChildAssignedPeopleOverride] = useState<AssignedPeopleData | undefined>(undefined)
  const [singleCaseAssignedPeopleOverride, setSingleCaseAssignedPeopleOverride] = useState<AssignedPeopleData | undefined>(undefined)

  if (showCaseManagement) {
    return <CaseManagementPage organisations={INITIAL_ORGANIZATIONS} groups={GROUPS} entities={LEGAL_ENTITIES} />
  }

  if (showOrganisations) {
    return <OrganisationsEntryPage />
  }

  // Group + Child is just the normal case dispatch below (process is already locked to vat by
  // the Playground controls) — only Group + Parent needs a dedicated page.
  if (caseKind === 'group' && groupCaseView === 'parent') {
    return <ParentVatGroupCasePage />
  }
  const isChildCaseView = caseKind === 'group' && groupCaseView === 'child'
  const skipClientApproval = isChildCaseView && !childCaseRequiresClientApproval
  // Feature 3/4 of the "playground navigation" ticket — Single Case and Group Case Child Case
  // share the same Regular/Correction + correction-side state matrix the Group Case Parent Case
  // already uses (see parent-vat-group-case-page.tsx's activeCase/isViewingCorrectionCase/
  // isViewingOriginalWithinCorrection). State A ("the correction case") shows a link back to the
  // original, no Submission banner; State B ("the case the correction was created from") shows
  // the banner forward to the correction only at Submission, no link; Regular shows neither.
  const isCorrectionMode = caseVariant === 'correction'
  const isViewingCorrectionCase = isCorrectionMode && correctionViewSide === 'correctionCase'
  const isViewingOriginalWithinCorrection = isCorrectionMode && correctionViewSide === 'originalCase'
  // "Correction toggle & wiring" ticket, Segment 1 — resolves whichever specific Child Case is
  // open (see case-management-page.tsx's openChildCaseFromManagement) to its correction/original
  // pair, regardless of which of the two ids was actually stored — every correction child has
  // `correctionOfCaseId` set back to its original counterpart, so either id normalizes to the
  // same pair. Lets the second (correction-side) switcher flip between the two without needing
  // to touch `openChildCaseId` itself.
  const childCorrectionAnchorId = openChildCaseId ?? DUMMY_GROUP_CASES[0].children[0].id
  const anchorAsCorrectionChild = CORRECTION_PARENT_CASE.children.find((c) => c.id === childCorrectionAnchorId)
  const originalChildForCorrection =
    isChildCaseView && isCorrectionMode
      ? DUMMY_GROUP_CASES[0].children.find((c) => c.id === childCorrectionAnchorId) ??
        DUMMY_GROUP_CASES[0].children.find((c) => c.id === anchorAsCorrectionChild?.correctionOfCaseId)
      : undefined
  const correctionChildForOriginal =
    originalChildForCorrection
      ? anchorAsCorrectionChild ??
        CORRECTION_PARENT_CASE.children.find((c) => c.correctionOfCaseId === originalChildForCorrection.id)
      : undefined
  const openCorrectionChild = isViewingCorrectionCase ? correctionChildForOriginal : undefined
  // Feature 6 of the "button states & child-case comments" ticket — this specific Child Case's
  // own reopen comment (see needs-changes-reopen-modal.tsx / parent-vat-group-case-page.tsx),
  // looked up by whichever Child Case was last opened. Undefined outside the Child Case view so
  // BodyPlaceholder's dummy-comment fallback stays untouched everywhere else.
  const childCommentOverride = isChildCaseView
    ? childCaseComments[openChildCaseId ?? ''] ?? null
    : undefined

  const ctx = { process, platform, role, headerType, phase }
  const resolved = resolveHeader(ctx)
  const packageBannerState =
    isPackageBannerPhase(phase) && phase !== 'submitted'
      ? packageBannerStateFromOutcome(phase, role, packageReviewOutcome)
      : phase === 'submitted'
        ? ('submitted' as const)
        : undefined

  const bucketCategory = getRequirementCategory(selectedRequirementCategoryId)
  const baseDescriptor =
    resolved && headerType === 'requirementBucket' && bucketCategory
      ? { ...resolved, title: { plain: bucketCategory.title } }
      : resolved

  const needChangesCreator = isNeedChangesCreatorCase(
    headerType,
    platform,
    phase,
    role,
    packageReviewOutcome,
  )
  const withNeedChanges =
    baseDescriptor && needChangesCreator
      ? { ...baseDescriptor, actions: NEED_CHANGES_CREATOR_HEADER_ACTIONS }
      : baseDescriptor
  // Feature 4 — Single Case's correction-case names (State A/B link + banner text) and, for a
  // Child Case, its resolved original/correction pair (see originalChildForCorrection/
  // correctionChildForOriginal above). Undefined when a Child Case's pair couldn't resolve
  // (shouldn't happen — childCorrectionAnchorId always falls back to a real child).
  const isSingleCaseView = !isChildCaseView
  const correctionCaseNames = isChildCaseView
    ? originalChildForCorrection && correctionChildForOriginal
      ? { original: originalChildForCorrection.caseName, correction: correctionChildForOriginal.caseName }
      : undefined
    : { original: titleToPlainString(withNeedChanges?.title), correction: `${titleToPlainString(withNeedChanges?.title)} / Correction 1` }
  // Feature 4 — State A ("the correction case") gets its case name suffixed, same convention
  // as the Group Case correction data (case-management-data.ts's buildCorrectionCase's
  // " / Correction N"). State B and Regular never touch the title.
  const withCaseVariantTitle =
    withNeedChanges && isSingleCaseView && isViewingCorrectionCase
      ? {
          ...withNeedChanges,
          title: {
            ...withNeedChanges.title,
            parts: withNeedChanges.title.parts
              ? [
                  ...withNeedChanges.title.parts.slice(0, -1),
                  `${withNeedChanges.title.parts[withNeedChanges.title.parts.length - 1]} / Correction 1`,
                ]
              : withNeedChanges.title.parts,
            plain: withNeedChanges.title.plain ? `${withNeedChanges.title.plain} / Correction 1` : withNeedChanges.title.plain,
          },
        }
      : withNeedChanges
  // Same Next Deadline chip, same position (bottom right of the header) — just relabeled for
  // the Group Case's Child Case context, matching the Parent Case header's own "Group Case
  // Deadline" chip (see parent-vat-group-case-page.tsx).
  const withDueDateLabel =
    withCaseVariantTitle && isChildCaseView
      ? { ...withCaseVariantTitle, dueDateLabel: 'Group Case Deadline' }
      : withCaseVariantTitle
  // Group Case Child Case flow: a non-interactive "Part of {parent-case-name}" indicator on the
  // header, distinguishing it from a regular Single Case — same parent-case resolution
  // (regular vs. correction) parent-vat-group-case-page.tsx already uses for `activeCase`, keyed
  // off State A specifically (isViewingCorrectionCase) since State B still names the original
  // parent, not the correction one.
  const parentGroupCase = isViewingCorrectionCase ? CORRECTION_PARENT_CASE : DUMMY_GROUP_CASES[0]
  // A stand-in for "the Child Case currently open" — this generic view isn't bound to one
  // specific child record, so it picks a non-representative member (see the assignees comment
  // below) to name in the "Edit case" drawer opened from the header.
  const demoChildCase = parentGroupCase.children.find((c) => c.client !== parentGroupCase.representativeEntity) ?? parentGroupCase.children[0]
  const withParentCaseName =
    withDueDateLabel && isChildCaseView
      ? { ...withDueDateLabel, parentCaseName: parentGroupCase.caseName }
      : withDueDateLabel
  // Group Case Child Case flow: a representative example of a non-representative-entity Child
  // Case's real, org-sourced assignees (see vat-group-case-assignees.ts) instead of the generic
  // cross-process demo people — plus this component's own Creator/Reviewer-can-edit rule. The
  // header's own "Edit" action (inside the AssignedPeople popover) opens the same "Edit case"
  // drawer the Parent Case's child-cases list uses; `childAssignedPeopleOverride` is what a
  // simulated save writes back to, so the header's own people-count stays in sync.
  const withChildAssignedPeople =
    withParentCaseName && isChildCaseView
      ? {
          ...withParentCaseName,
          assignedPeople: childAssignedPeopleOverride ?? CHILD_CASE_DEMO_ASSIGNEES,
          assignedPeopleEditable: role === 'creator' || role === 'reviewer',
          onEditAssignedPeople: () => setAssigneesDrawerOpen(true),
        }
      : withParentCaseName
  // Single Case flow (mutually exclusive with the Child Case chain above) — the header's
  // AssignedPeople "Edit" action was previously wired to nothing (no onEditAssignedPeople in the
  // static header config); it now opens the same drawer, case-name only, since a Single Case has
  // no parent case to name. Defaults to the same real, org-sourced people as the Child Case demo
  // (not the generic cross-process SAMPLE_PEOPLE the static config falls back to) — the drawer's
  // Creator/Reviewer/Partner/Client pickers resolve people by matching email against a specific
  // org's real users (see single-case-form.tsx's idsFor/usersForOrg), and SAMPLE_PEOPLE's names
  // don't exist in any org's user list, which would leave the pickers empty and Save disabled.
  const withSingleCaseAssignedPeople =
    withChildAssignedPeople && !isChildCaseView
      ? {
          ...withChildAssignedPeople,
          assignedPeople: singleCaseAssignedPeopleOverride ?? REPRESENTATIVE_ASSIGNEES,
          onEditAssignedPeople: () => setAssigneesDrawerOpen(true),
        }
      : withChildAssignedPeople
  // Group Case Child Case flow: neither Consolidation nor a "Send to Consolidation"/"Submit to
  // tax authorities" step exists on a Child Case (those are Parent-Case-only) — so the
  // Creator's two case-progressing actions get child-specific labels instead. In Preparation's
  // "Send for review" becomes "Submit for review" (same button, same gate, same label whether
  // reached directly or via the needChanges reset, which also uses this exact label — see
  // NEED_CHANGES_CREATOR_HEADER_ACTIONS).
  const withChildCreatorSubmitLabel =
    withSingleCaseAssignedPeople && isChildCaseView && withSingleCaseAssignedPeople.actions.primary?.label === 'Send for review'
      ? {
          ...withSingleCaseAssignedPeople,
          actions: {
            ...withSingleCaseAssignedPeople.actions,
            primary: { ...withSingleCaseAssignedPeople.actions.primary, label: 'Submit for review' },
          },
        }
      : withSingleCaseAssignedPeople
  // In Review's default label ("Send for approval") depends on whether this Child Case's
  // workflow includes Client Approval at all: relabelled to "Send to approval" when it does
  // (same next step, Client Approval, just worded for the child-case context) or straight to
  // "Submit for consolidation" when it doesn't — skipping Client Approval entirely and landing
  // on the terminal Ready for Consolidation step instead (see the "Child-Case Default Opening &
  // Step-Dependent Behaviour" ticket). Skipped during the needChanges reset, same as above.
  const withChildInReviewLabel =
    withChildCreatorSubmitLabel &&
    isChildCaseView &&
    phase === 'inReview' &&
    role === 'creator' &&
    !needChangesCreator &&
    withChildCreatorSubmitLabel.actions.primary
      ? {
          ...withChildCreatorSubmitLabel,
          actions: {
            ...withChildCreatorSubmitLabel.actions,
            primary: {
              ...withChildCreatorSubmitLabel.actions.primary,
              label: skipClientApproval ? 'Submit for consolidation' : 'Send to approval',
            },
          },
        }
      : withChildCreatorSubmitLabel
  // Client Approval's "Submit to tax authorities" becomes "Submit for consolidation" — the
  // child-case parallel to the Parent Case's own final action, since a child's own filing feeds
  // into the Parent Case's Consolidation step rather than going to the tax authority directly.
  // Skipped during the needChanges reset (excluded via the label check above already handling
  // that case with its own label).
  const descriptorWithConsolidationLabel =
    withChildInReviewLabel &&
    isChildCaseView &&
    phase === 'clientApproval' &&
    role === 'creator' &&
    !needChangesCreator &&
    withChildInReviewLabel.actions.primary
      ? {
          ...withChildInReviewLabel,
          actions: {
            ...withChildInReviewLabel.actions,
            primary: { ...withChildInReviewLabel.actions.primary, label: 'Submit for consolidation' },
          },
        }
      : withChildInReviewLabel

  // Group Case Child Case flow, Client role at Client Approval: the button follows the package
  // review outcome exactly like the Parent Case's own Client Approval button does — "Submit
  // review" while awaiting a decision (the resolveHeader default, left untouched here), a
  // disabled "Submit changes" once the client has requested changes, and no button at all once
  // already approved.
  const childClientApprovalState =
    isChildCaseView && phase === 'clientApproval' && role === 'client'
      ? packageBannerStateFromOutcome('clientApproval', 'client', packageReviewOutcome)
      : undefined
  // Feature 1 of the "requirements header enrichment" ticket — Requirement List/Bucket headers
  // repurpose `title` for the page/category name (see baseDescriptor above and their own static
  // config), so the underlying case's own identity is attached separately, resolved by forcing
  // headerType to 'case' for the same process/platform/role/phase rather than duplicating that
  // static config here. Applies to every role, including Client (requirementBucket).
  const withCaseIdentity =
    descriptorWithConsolidationLabel && (headerType === 'requirementList' || headerType === 'requirementBucket')
      ? {
          ...descriptorWithConsolidationLabel,
          caseIdentity: {
            title: resolveHeader({ ...ctx, headerType: 'case' })?.title ?? { plain: 'Case' },
            parentCaseName: isChildCaseView ? parentGroupCase.caseName : undefined,
          },
        }
      : descriptorWithConsolidationLabel
  const descriptor =
    withCaseIdentity && childClientApprovalState === 'approved'
      ? { ...withCaseIdentity, actions: {} }
      : withCaseIdentity && childClientApprovalState === 'needChanges'
        ? {
            ...withCaseIdentity,
            actions: {
              primary: { label: 'Submit changes', icon: 'Check' as const, iconSide: 'right' as const, variant: 'default' as const },
            },
          }
        : withCaseIdentity

  const tasksGateActive = isCaseTasksGateActive(
    headerType,
    platform,
    phase,
    packageReviewOutcome,
  )
  const approvalGateActive =
    !needChangesCreator &&
    isCaseApprovalGateActive(headerType, platform, phase, role)
  const hasPrimary = needChangesCreator
    ? true
    : Boolean(resolved?.actions.primary || resolved?.actions.nextStep)
  const citReconfirmGateActive =
    !needChangesCreator &&
    isCitInReviewReconfirmGateActive(
      process,
      headerType,
      platform,
      phase,
      role,
      approvedChecked,
    )
  const assessmentGateActive = isAssessmentClosureGateActive(
    process,
    headerType,
    platform,
    phase,
  )
  const submissionGateActive = isSubmissionProtocolGateActive(
    process,
    headerType,
    platform,
    phase,
  )
  const primaryDisabled =
    (tasksGateActive && hasPrimary && !tasksDoneChecked) ||
    (approvalGateActive && hasPrimary && !approvedChecked) ||
    (citReconfirmGateActive &&
      hasPrimary &&
      approvedChecked &&
      !tasksReconfirmedDone) ||
    (assessmentGateActive && hasPrimary && assessmentsState !== 'done') ||
    (submissionGateActive && hasPrimary && !protocolConfirmationChecked) ||
    childClientApprovalState === 'needChanges'

  const handleSaveChildAssignedPeople = (people: AssignedPeopleData) => setChildAssignedPeopleOverride(people)
  const handleSaveSingleCaseAssignedPeople = (people: AssignedPeopleData) => setSingleCaseAssignedPeopleOverride(people)

  const handlePrimaryClick = (label: string) => {
    if (
      label === 'Close case' &&
      phase === 'assessmentClosure' &&
      role === 'creator' &&
      !primaryDisabled
    ) {
      setCloseCaseOpen(true)
    }
    // Child Case Creator: the same case-progressing actions the Parent Case page itself
    // navigates on click for (see parent-vat-group-case-page.tsx) — In Preparation moves on to
    // In Review once every task is done; In Review then branches by whether Client Approval
    // applies to this Child Case — "Send to approval" moves on to Client Approval, "Submit for
    // consolidation" skips straight to the terminal Ready for Consolidation step; Client
    // Approval's own final action (when it applies) reaches that same terminal step too.
    if (
      isChildCaseView &&
      role === 'creator' &&
      phase === 'inPreparation' &&
      label === 'Submit for review' &&
      !primaryDisabled
    ) {
      setPhase('inReview')
    }
    // Creator, In Review: "Send for approval" (plain case) / "Send to approval" (Group Case
    // Child Case) is already a real, enabled button once the Playground's "Approved" checkbox
    // is ticked (see approvedChecked/isCaseApprovalGateActive above) — opens the same confirm
    // dialog + creator-comment behaviour either way, same as the Group Case Parent page.
    if (
      role === 'creator' &&
      phase === 'inReview' &&
      (label === 'Send for approval' || label === 'Send to approval') &&
      !primaryDisabled
    ) {
      setSendApprovalOpen(true)
    }
    if (
      isChildCaseView &&
      role === 'creator' &&
      (phase === 'inReview' || phase === 'clientApproval') &&
      label === 'Submit for consolidation' &&
      !primaryDisabled
    ) {
      setPhase('submitted')
    }
  }

  const isClientBucket =
    role === 'client' && headerType === 'requirementBucket'
  const effectiveBucketMarkAsDoneChecked =
    isClientBucket && phase !== 'draft' && phase !== 'inPreparation'
      ? true
      : isClientBucket && phase === 'inPreparation'
        ? false
        : bucketMarkAsDoneChecked
  const bucketStatus: BucketStatus | undefined = isClientBucket
    ? phase === 'draft'
      ? 'notStarted'
      : bucketStatusFromMarkAsDone(effectiveBucketMarkAsDoneChecked)
    : undefined

  if (!descriptor) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/30 p-8 text-sm text-muted-foreground">
        Invalid combination — this header is not reachable for the current
        process / role / platform.
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <HeaderRenderer
        descriptor={descriptor}
        ctx={ctx}
        primaryDisabled={primaryDisabled}
        onPrimaryClick={handlePrimaryClick}
        bucketStatus={bucketStatus}
        bucketMarkAsDoneChecked={
          isClientBucket ? effectiveBucketMarkAsDoneChecked : false
        }
        onBucketMarkAsDoneChange={
          isClientBucket && phase === 'inPreparation'
            ? setBucketMarkAsDoneChecked
            : () => undefined
        }
        onBucketBack={() => setHeaderType('case')}
        onBucketCommentsClick={() => openClientComments(selectedRequirementCategoryId)}
      />

      {/* Feature 3/4 of the "playground navigation" ticket — Single Case and Group Case Child
          Case share the Group Case Parent Case's exact correction state matrix (see
          parent-vat-group-case-page.tsx): State A ("the correction case") shows the link below,
          never the banner; State B ("the case the correction was created from") shows the
          banner only at Submission, never the link; Regular shows neither. */}
      {isViewingCorrectionCase && correctionCaseNames && (
        <div className="flex flex-col gap-2 border-b border-border bg-primary-foreground px-6 py-3">
          {/* The generic Child Case header above is a static Playground demo title (see
              resolveHeader.ts), never bound to any specific child's real data, so this is the
              only place a correction Child Case's own name shows at all — already carrying
              " / Correction 1" straight from case-management-data.ts's buildCorrectionCase. */}
          {isChildCaseView && openCorrectionChild && (
            <span className="text-sm font-medium text-foreground">{openCorrectionChild.caseName}</span>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              // Second (correction-side) switcher, State A → State B — setCorrectionViewSide
              // itself lands State B on Submission, the only phase its banner shows on.
              onClick={() => setCorrectionViewSide('originalCase')}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowUpLeft className="size-4" />
              {/* Reference design labels this "Parent case:" for a plain Single Case — a Child
                  Case keeps "Correction case:" instead, since "Parent case" already means the
                  Group's own Parent Case in that context. */}
              {isSingleCaseView ? 'Parent case:' : 'Correction case:'}{' '}
              <span className="font-medium text-foreground underline">{correctionCaseNames.original}</span>
            </button>
            {/* Feature 5/6 (pre-existing) — the same "Parent correction case" pointer the Parent
                Case page shows, reused here so a correction Child Case can jump straight back to
                the plain (regular) Parent Case too. Orthogonal to the State A/B switch above. */}
            {isChildCaseView && (
              <button
                type="button"
                onClick={() => {
                  setGroupCaseView('parent')
                  setCaseVariant('regular')
                  setPhase('submitted')
                }}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowUpLeft className="size-4" />
                Parent correction case:{' '}
                <span className="font-medium text-foreground underline">{DUMMY_GROUP_CASES[0].caseName}</span>
              </button>
            )}
          </div>
        </div>
      )}

      <BodyPlaceholder
        process={process}
        headerType={headerType}
        platform={platform}
        phase={phase}
        role={role}
        tasksDoneChecked={tasksGateActive ? tasksDoneChecked : false}
        internalClosingComment={internalClosingComment}
        clientClosingComment={clientClosingComment}
        approvedChecked={approvedChecked}
        tasksReconfirmedDone={tasksReconfirmedDone}
        protocolConfirmationChecked={protocolConfirmationChecked}
        assessmentsState={assessmentsState}
        packageBannerState={packageBannerState ?? 'sent'}
        packageReviewOutcome={packageReviewOutcome}
        skipClientApproval={skipClientApproval}
        finalStepLabel={isChildCaseView ? 'Ready for Consolidation' : undefined}
        hideSubmissionReceipt={isChildCaseView}
        submittedBannerOverride={
          isChildCaseView
            ? {
                title: 'Submitted for Consolidation',
                description: 'This child case has been submitted. The consolidation process will follow.',
              }
            : undefined
        }
        taskListOverride={isChildCaseView ? VAT_GROUP_CHILD_CASE_TASKS : undefined}
        initialTaskStatusesOverride={isChildCaseView ? VAT_GROUP_CHILD_CASE_INITIAL_STATUSES : undefined}
        sectionHeadingOverride={
          isChildCaseView
            ? {
                title: 'Preparation tasks',
                description: 'Upload the finalised task documents that will form the data package.',
              }
            : undefined
        }
        childCommentOverride={childCommentOverride}
        creatorClientComment={creatorClientComment}
        // Feature 4 — State B's Submission banner: shares its section with BodyPlaceholder's own
        // "submitted" PackageBanner (no border/margin of its own — see correctionBanner on
        // BodyPlaceholder), instead of a standalone box before the case stepper like State A's
        // link.
        correctionBanner={
          isViewingOriginalWithinCorrection && phase === 'submitted' && correctionCaseNames ? (
            <Alert
              variant="info"
              title="A correction has been opened for this case."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Second (correction-side) switcher, State B → State A.
                    setCorrectionViewSide('correctionCase')
                    setPhase('inPreparation')
                  }}
                >
                  {correctionCaseNames.correction}
                  <ArrowUpRight className="size-4" />
                </Button>
              }
            />
          ) : undefined
        }
        selectedRequirementCategoryId={selectedRequirementCategoryId}
        onOpenRequirementList={() => setHeaderType('requirementList')}
        onOpenRequirementBucket={(categoryId) => {
          setSelectedRequirementCategoryId(categoryId)
          setHeaderType('requirementBucket')
        }}
        onOpenComments={openClientComments}
      />

      {descriptor.note && (
        <div className="border-t border-dashed border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-800">
          <span className="font-semibold">Design note:</span> {descriptor.note}
        </div>
      )}

      <CloseCaseDialog
        open={closeCaseOpen}
        onClose={() => setCloseCaseOpen(false)}
        onConfirm={(comments) => {
          setInternalClosingComment(comments.internalComment)
          setClientClosingComment(comments.clientComment)
          setPhase('summary')
        }}
      />

      <SendPackageDialog
        open={sendApprovalOpen}
        title={isChildCaseView ? 'Send to approval' : 'Send for approval'}
        description="This sends the package to the client for approval."
        confirmLabel={isChildCaseView ? 'Send to approval' : 'Send for approval'}
        showDeadline={process !== 'cit'}
        onClose={() => setSendApprovalOpen(false)}
        onConfirm={(details: SendPackageDetails) => {
          setPhase('clientApproval')
          setCreatorClientComment(details.comment.trim() || null)
          setSendApprovalOpen(false)
        }}
      />

      <CommentsDrawer
        open={commentsDrawerOpen}
        onOpenChange={setCommentsDrawerOpen}
        title={activeClientCommentsCategoryId ? getRequirementCategory(activeClientCommentsCategoryId)?.title : undefined}
        comments={activeClientCommentsCategoryId ? clientCategoryComments[activeClientCommentsCategoryId] : undefined}
        hasUnseen={Boolean(activeClientCommentsCategoryId) && hasUnseenClientComment(activeClientCommentsCategoryId ?? '')}
        onRead={() => activeClientCommentsCategoryId && markCategorySeen(activeClientCommentsCategoryId)}
        onSend={(text) => activeClientCommentsCategoryId && sendComment(activeClientCommentsCategoryId, 'You', text)}
      />

      {/* "Edit case" drawer opened from the header's own AssignedPeople "Edit" action — same
          drawer/component the Parent Case's child-cases list uses (see CreateCaseDrawer's
          editContext, parent-vat-group-case-page.tsx). entities/organisations/groups are
          intentionally empty; edit mode never needs the real collections. */}
      <CreateCaseDrawer
        open={assigneesDrawerOpen}
        onOpenChange={setAssigneesDrawerOpen}
        entities={[]}
        organisations={[]}
        groups={[]}
        editContext={
          isChildCaseView
            ? ({
                kind: 'child',
                caseName: demoChildCase.caseName,
                parentCaseName: parentGroupCase.caseName,
                legalEntityId: demoChildCase.client,
                legalEntityName: demoChildCase.client,
                groupId: parentGroupCase.id,
                groupName: parentGroupCase.vatGroupName,
                jurisdiction: demoChildCase.jurisdiction,
                vatRegCountry: demoChildCase.jurisdiction,
                vatRegistrationNumber: vatRegistrationForJurisdiction(demoChildCase.jurisdiction),
                orgId: 'europipe',
                assignees: childAssignedPeopleOverride ?? CHILD_CASE_DEMO_ASSIGNEES,
                onSave: handleSaveChildAssignedPeople,
              } satisfies EditCaseRolesContext)
            : ({
                kind: 'single',
                caseName: `${SAMPLE_CASE.company} - ${SAMPLE_CASE_TITLE[process][2]}`,
                legalEntityId: SAMPLE_CASE.company,
                legalEntityName: SAMPLE_CASE.company,
                groupId: '',
                groupName: '',
                jurisdiction: 'Germany',
                vatRegCountry: 'Germany',
                vatRegistrationNumber: SAMPLE_CASE.vatCode,
                orgId: 'europipe',
                assignees: singleCaseAssignedPeopleOverride ?? REPRESENTATIVE_ASSIGNEES,
                onSave: handleSaveSingleCaseAssignedPeople,
              } satisfies EditCaseRolesContext)
        }
      />
    </div>
  )
}
