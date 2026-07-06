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

import { CheckboxField, Switch } from '@wts/ui'
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
    showCaseManagement,
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
    setShowCaseManagement,
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
        <CheckboxField
          label="Tasks Done"
          description="Marks all tasks complete and enables Send for review."
          checked={tasksDoneChecked}
          onCheckedChange={setTasksDoneChecked}
        />
      )}

      {showProtocolConfirmationControl && (
        <CheckboxField
          label="Submission receipt"
          description="Confirms the submission receipt was received and enables Tax assessment."
          checked={protocolConfirmationChecked}
          onCheckedChange={setProtocolConfirmationChecked}
        />
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
        <CheckboxField
          label="Done"
          description="Tasks reconfirmed after approval; enables Send for approval."
          checked={tasksReconfirmedDone}
          onCheckedChange={setTasksReconfirmedDone}
        />
      )}

      {showApprovedControl && !showReviewOutcomeControl && (
        <CheckboxField
          label="Approved"
          description="Enables the primary action for this phase."
          checked={approvedChecked}
          onCheckedChange={setApprovedChecked}
        />
      )}

      <div className="flex flex-col gap-1.5 border-t border-border pt-4">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          View
        </span>
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
          <span className="text-[13px] font-medium text-foreground">Case Management page</span>
          <Switch checked={showCaseManagement} onCheckedChange={setShowCaseManagement} />
        </label>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
          Swaps in the full case list, independent of the CIT Assessment &amp; Closure demo above.
        </p>
      </div>
    </div>
  )
}

export { HEADER_LABELS, ROLE_LABELS }
