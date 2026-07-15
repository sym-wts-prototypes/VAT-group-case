import { useState } from 'react'

import { CloseCaseDialog } from '@/components/body/CloseCaseDialog'
import { BodyPlaceholder } from '@/components/body/BodyPlaceholder'
import { CaseManagementPage } from '@/components/case-management-page'
import { GROUPS, LEGAL_ENTITIES } from '@/components/org-details-data'
import { INITIAL_ORGANIZATIONS } from '@/components/organizations-data'
import { ParentVatGroupCasePage } from '@/components/parent-vat-group-case-page'
import { HeaderRenderer } from '@/components/headers/HeaderRenderer'
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
import type { BucketStatus } from '@/types'

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
    caseKind,
    groupCaseView,
    childCaseRequiresClientApproval,
    setHeaderType,
    setBucketMarkAsDoneChecked,
    setSelectedRequirementCategoryId,
    setPhase,
  } = useDemoStore()
  const [closeCaseOpen, setCloseCaseOpen] = useState(false)

  if (showCaseManagement) {
    return <CaseManagementPage organisations={INITIAL_ORGANIZATIONS} groups={GROUPS} entities={LEGAL_ENTITIES} />
  }

  // Group + Child is just the normal case dispatch below (process is already locked to vat by
  // the Playground controls) — only Group + Parent needs a dedicated page.
  if (caseKind === 'group' && groupCaseView === 'parent') {
    return <ParentVatGroupCasePage />
  }
  const isChildCaseView = caseKind === 'group' && groupCaseView === 'child'
  const skipClientApproval = isChildCaseView && !childCaseRequiresClientApproval

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
  // Same Due Date pill, same position (bottom right of the header) — just relabeled for the
  // Group Case's Child Case context, matching the Parent Case header's own "Group Case
  // Deadline" pill (see parent-vat-group-case-page.tsx).
  const withDueDateLabel =
    withNeedChanges && isChildCaseView
      ? { ...withNeedChanges, dueDateLabel: 'Group Case Deadline' }
      : withNeedChanges
  // Group Case Child Case flow: neither Consolidation nor a "Send to Consolidation"/"Submit to
  // tax authorities" step exists on a Child Case (those are Parent-Case-only) — so the
  // Creator's two case-progressing actions get child-specific labels instead. In Preparation's
  // "Send for review" becomes "Submit for review" (same button, same gate, same label whether
  // reached directly or via the needChanges reset, which also uses this exact label — see
  // NEED_CHANGES_CREATOR_HEADER_ACTIONS).
  const withChildCreatorSubmitLabel =
    withDueDateLabel && isChildCaseView && withDueDateLabel.actions.primary?.label === 'Send for review'
      ? {
          ...withDueDateLabel,
          actions: {
            ...withDueDateLabel.actions,
            primary: { ...withDueDateLabel.actions.primary, label: 'Submit for review' },
          },
        }
      : withDueDateLabel
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
  const descriptor =
    descriptorWithConsolidationLabel && childClientApprovalState === 'approved'
      ? { ...descriptorWithConsolidationLabel, actions: {} }
      : descriptorWithConsolidationLabel && childClientApprovalState === 'needChanges'
        ? {
            ...descriptorWithConsolidationLabel,
            actions: {
              primary: { label: 'Submit changes', icon: 'Check' as const, iconSide: 'right' as const, variant: 'default' as const },
            },
          }
        : descriptorWithConsolidationLabel

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
    if (
      isChildCaseView &&
      role === 'creator' &&
      phase === 'inReview' &&
      label === 'Send to approval' &&
      !primaryDisabled
    ) {
      setPhase('clientApproval')
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
      />

      <BodyPlaceholder
        process={process}
        headerType={headerType}
        platform={platform}
        phase={phase}
        role={role}
        tasksDoneChecked={tasksGateActive ? tasksDoneChecked : false}
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
        selectedRequirementCategoryId={selectedRequirementCategoryId}
        onOpenRequirementList={() => setHeaderType('requirementList')}
        onOpenRequirementBucket={(categoryId) => {
          setSelectedRequirementCategoryId(categoryId)
          setHeaderType('requirementBucket')
        }}
      />

      {descriptor.note && (
        <div className="border-t border-dashed border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-800">
          <span className="font-semibold">Design note:</span> {descriptor.note}
        </div>
      )}

      <CloseCaseDialog
        open={closeCaseOpen}
        onClose={() => setCloseCaseOpen(false)}
        onConfirm={() => setPhase('summary')}
      />
    </div>
  )
}
