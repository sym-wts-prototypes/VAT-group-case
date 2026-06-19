import { PHASE_LABELS, workflowPhasesForControls } from '@/config/phases'
import { PROCESS_LABELS } from '@/config/sampleData'
import {
  assessmentStateControlHint,
  assessmentStateOptionsForRole,
  isAssessmentClosureGateActive,
  isCaseApprovalGateActive,
  isCaseTasksGateActive,
  isSubmissionProtocolGateActive,
  showCitInReviewReconfirmDoneControl,
} from '@/lib/caseTasks'
import { showPackageReviewControls } from '@/lib/packageBanners'
import {
  isHeaderTypeAllowedInControls,
  isPhaseDisabledInControls,
} from '@/lib/controlHeaderTypes'
import { useDemoStore } from '@/store/useDemoStore'
import type { HeaderType, Phase, Process, Role } from '@/types'

import { OptionPills } from './OptionPills'
import { PhaseRadios } from './PhaseRadios'
import { ProcessTabs } from './ProcessTabs'
import { ReviewOutcomeRadios } from './ReviewOutcomeRadios'

const HEADER_LABELS: Record<HeaderType, string> = {
  caseWrapper: 'Case Wrapper',
  case: 'Case',
  requirementList: 'Requirement List',
  requirementBucket: 'Requirement Bucket',
}

const ROLE_LABELS: Record<Role, string> = {
  creator: 'Creator',
  reviewer: 'Reviewer',
  partner: 'Partner',
  client: 'Client',
}

const ALL_PROCESSES: Process[] = ['cit', 'hr', 'vat']
const ALL_ROLES: Role[] = ['creator', 'reviewer', 'partner', 'client']

const ALL_HEADER_TYPES: HeaderType[] = [
  'caseWrapper',
  'case',
  'requirementList',
  'requirementBucket',
]

export function ControlPanel() {
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
    setProcess,
    setRole,
    setHeaderType,
    setPhase,
    setTasksDoneChecked,
    setApprovedChecked,
    setTasksReconfirmedDone,
    setAssessmentsState,
    setProtocolConfirmationChecked,
    setPackageReviewOutcome,
  } = useDemoStore()

  const showTasksDoneControl = isCaseTasksGateActive(
    headerType,
    platform,
    phase,
    packageReviewOutcome,
  )
  const showApprovedControl = isCaseApprovalGateActive(
    headerType,
    platform,
    phase,
    role,
  )
  const showTasksReconfirmedControl = showCitInReviewReconfirmDoneControl(
    process,
    headerType,
    platform,
    phase,
    role,
  )
  const showReviewOutcomeControl = showPackageReviewControls(
    headerType,
    platform,
    phase,
  )
  const showAssessmentsDoneControl = isAssessmentClosureGateActive(
    process,
    headerType,
    platform,
    phase,
  )
  const assessmentStateOptions = assessmentStateOptionsForRole(role)
  const showProtocolConfirmationControl =
    role === 'creator' &&
    isSubmissionProtocolGateActive(process, headerType, platform, phase)
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-4 shadow-header-sm">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Controls</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Role sets WTS vs Client. Client sees buckets on the case; opening a
          bucket shows the requirement bucket header (items omitted here).
        </p>
      </div>

      <ProcessTabs
        label="Process"
        value={process}
        onChange={setProcess}
        options={ALL_PROCESSES.map((p) => ({
          value: p,
          label: PROCESS_LABELS[p],
        }))}
      />

      <OptionPills
        label="Role"
        value={role}
        onChange={setRole}
        options={ALL_ROLES.map((r) => ({
          value: r,
          label: ROLE_LABELS[r],
        }))}
      />

      <OptionPills
        label="Page"
        value={headerType}
        onChange={setHeaderType}
        options={ALL_HEADER_TYPES.map((h) => ({
          value: h,
          label: HEADER_LABELS[h],
          disabled: !isHeaderTypeAllowedInControls(h, process, role, phase),
        }))}
      />

      <PhaseRadios
        label="Phase"
        value={phase}
        onChange={setPhase}
        options={workflowPhasesForControls(process).map((p) => ({
          value: p,
          label: PHASE_LABELS[p as Phase],
          disabled: isPhaseDisabledInControls(p, role),
        }))}
      />

      {showReviewOutcomeControl && (
        <ReviewOutcomeRadios
          phase={phase}
          role={role}
          value={packageReviewOutcome}
          onChange={setPackageReviewOutcome}
        />
      )}

      {showTasksDoneControl && (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
            checked={tasksDoneChecked}
            onChange={(e) => setTasksDoneChecked(e.target.checked)}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              Tasks Done
            </span>
            <span className="text-xs text-muted-foreground">
              Marks all tasks complete and enables Send for review.
            </span>
          </span>
        </label>
      )}

      {showProtocolConfirmationControl && (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
            checked={protocolConfirmationChecked}
            onChange={(e) => setProtocolConfirmationChecked(e.target.checked)}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              Submission receipt
            </span>
            <span className="text-xs text-muted-foreground">
              Confirms the submission receipt was received and enables Tax
              assessment.
            </span>
          </span>
        </label>
      )}

      {showAssessmentsDoneControl && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <OptionPills
            label="Assessments"
            value={assessmentsState}
            onChange={setAssessmentsState}
            options={assessmentStateOptions}
          />
          <span className="text-xs text-muted-foreground">
            {assessmentStateControlHint(role)}
          </span>
        </div>
      )}

      {showTasksReconfirmedControl && packageReviewOutcome === 'approved' && (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
            checked={tasksReconfirmedDone}
            onChange={(e) => setTasksReconfirmedDone(e.target.checked)}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">Done</span>
            <span className="text-xs text-muted-foreground">
              Tasks reconfirmed after approval; enables Send for approval.
            </span>
          </span>
        </label>
      )}

      {showApprovedControl && !showReviewOutcomeControl && (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
            checked={approvedChecked}
            onChange={(e) => setApprovedChecked(e.target.checked)}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              Approved
            </span>
            <span className="text-xs text-muted-foreground">
              Enables the primary action for this phase.
            </span>
          </span>
        </label>
      )}
    </div>
  )
}

export { HEADER_LABELS, ROLE_LABELS }
