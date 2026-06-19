import { useState } from 'react'

import { CloseCaseDialog } from '@/components/body/CloseCaseDialog'
import { BodyPlaceholder } from '@/components/body/BodyPlaceholder'
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
    setHeaderType,
    setBucketMarkAsDoneChecked,
    setSelectedRequirementCategoryId,
    setPhase,
  } = useDemoStore()
  const [closeCaseOpen, setCloseCaseOpen] = useState(false)
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
  const descriptor =
    baseDescriptor && needChangesCreator
      ? { ...baseDescriptor, actions: NEED_CHANGES_CREATOR_HEADER_ACTIONS }
      : baseDescriptor

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
    (submissionGateActive && hasPrimary && !protocolConfirmationChecked)

  const handlePrimaryClick = (label: string) => {
    if (
      label === 'Close case' &&
      phase === 'assessmentClosure' &&
      role === 'creator' &&
      !primaryDisabled
    ) {
      setCloseCaseOpen(true)
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
