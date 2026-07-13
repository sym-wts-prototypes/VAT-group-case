import type { PackageReviewOutcome } from '@/config/packageBanners'
import type { AssessmentsState } from '@/store/useDemoStore'
import type { Phase, Process, Role } from '@/types'

export type TaskStatus = 'notStarted' | 'inProgress' | 'done'

const PAST_PREPARATION_PHASES: Phase[] = [
  'inReview',
  'clientApproval',
  'submitted',
]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  notStarted: 'Not started',
  inProgress: 'In progress',
  done: 'Done',
}

export const TASK_STATUS_TONE: Record<
  TaskStatus,
  'gray' | 'blue' | 'green'
> = {
  notStarted: 'gray',
  inProgress: 'blue',
  done: 'green',
}

export interface DemoTask {
  id: string
  title: string
  /** Optional tasks render below an "Optional tasks" separator. */
  optional?: boolean
}

export const WTS_CASE_DEMO_TASKS: DemoTask[] = [
  { id: 'task-1', title: 'Task 1' },
  { id: 'task-2', title: 'Task 2' },
  { id: 'task-3', title: 'Task 3' },
]

/** CIT preparation tasks (Figma 2249:118590). */
export const CIT_CASE_DEMO_TASKS: DemoTask[] = [
  { id: 'cit-tax-balance-sheet', title: 'Tax Balance Sheet' },
  { id: 'cit-non-tax-deductibles', title: 'Non Tax Deductibles' },
  { id: 'cit-datev-ebilanz', title: 'Datev Ebilanz' },
  { id: 'cit-datev-forms', title: 'Datev Forms' },
  { id: 'cit-datev-calculations', title: 'Datev Calculations' },
  { id: 'cit-cover-letter', title: 'Cover Letter', optional: true },
]

export const WTS_CASE_DEMO_SUBMISSION_DOCUMENTS: DemoTask[] = [
  { id: 'sub-doc-3', title: 'Submission receipt' },
  { id: 'sub-doc-additional', title: 'Additional documents (optional)' },
]

/** Group Case Child Case preparation tasks — replaces the generic Task 1/2/3 placeholders for
 * that flow only (see parent-vat-group-case-page.tsx's dispatch into PlaygroundMain). */
export const VAT_GROUP_CHILD_CASE_TASKS: DemoTask[] = [
  { id: 'draft-return', title: 'Draft Return' },
  { id: 'supporting-documents', title: 'Supporting Documents', optional: true },
  { id: 'payment-instructions', title: 'Payment Instructions', optional: true },
]

/** Group Case Child Case's own initial statuses — Draft Return already under way, the two
 * optional tasks not started, rather than the generic cycling mixedTaskStatuses() produces. */
export const VAT_GROUP_CHILD_CASE_INITIAL_STATUSES: Record<string, TaskStatus> = {
  'draft-return': 'inProgress',
  'supporting-documents': 'notStarted',
  'payment-instructions': 'notStarted',
}

/** Preparation tasks for a process (CIT has its own dedicated list). */
export function caseTasksForProcess(process?: Process): DemoTask[] {
  return process === 'cit' ? CIT_CASE_DEMO_TASKS : WTS_CASE_DEMO_TASKS
}

/** Mixed statuses for the In Preparation gate demo (cycles to keep some open). */
export function mixedTaskStatuses(
  tasks: DemoTask[],
): Record<string, TaskStatus> {
  const cycle: TaskStatus[] = ['notStarted', 'inProgress', 'done']
  return Object.fromEntries(
    tasks.map((task, index) => [task.id, cycle[index % cycle.length]]),
  )
}

export function allTasksDone(
  tasks: DemoTask[] = WTS_CASE_DEMO_TASKS,
): Record<string, TaskStatus> {
  return Object.fromEntries(tasks.map((t) => [t.id, 'done' as TaskStatus]))
}

export function allTasksInProgress(
  tasks: DemoTask[] = WTS_CASE_DEMO_TASKS,
): Record<string, TaskStatus> {
  return Object.fromEntries(
    tasks.map((t) => [t.id, 'inProgress' as TaskStatus]),
  )
}

/** Need changes — case returns to In Preparation for task work. */
export function isNeedChangesWorkflowReset(
  headerType: string,
  platform: string,
  phase: Phase,
  packageReviewOutcome: PackageReviewOutcome,
): boolean {
  return (
    headerType === 'case' &&
    platform === 'wts' &&
    (phase === 'inReview' || phase === 'clientApproval') &&
    packageReviewOutcome === 'needChanges'
  )
}

/** Creator + Need changes — header matches In Preparation (Send for review). */
export function isNeedChangesCreatorCase(
  headerType: string,
  platform: string,
  phase: Phase,
  role: Role,
  packageReviewOutcome: PackageReviewOutcome,
): boolean {
  return (
    role === 'creator' &&
    isNeedChangesWorkflowReset(headerType, platform, phase, packageReviewOutcome)
  )
}

export const NEED_CHANGES_CREATOR_HEADER_ACTIONS = {
  primary: {
    label: 'Send for review',
    icon: 'ArrowRight' as const,
    iconSide: 'right' as const,
    variant: 'default' as const,
  },
  secondary: [
    { label: 'Requirements', icon: 'ListChecks' as const, variant: 'outline' as const },
  ],
}

export function effectiveCaseWorkflowPhase(
  phase: Phase,
  headerType: string,
  platform: string,
  packageReviewOutcome: PackageReviewOutcome,
): Phase {
  if (isNeedChangesWorkflowReset(headerType, platform, phase, packageReviewOutcome)) {
    return 'inPreparation'
  }
  return phase
}

export interface TaskStatusDemoOptions {
  process?: Process
  approvedChecked?: boolean
  tasksReconfirmedDone?: boolean
  headerType?: string
  platform?: string
  packageReviewOutcome?: PackageReviewOutcome
  /** Overrides caseTasksForProcess(process) — Group Case Child Cases use their own task list
   * (see VAT_GROUP_CHILD_CASE_TASKS) instead of the generic per-process one. */
  tasks?: DemoTask[]
  /** Overrides the default cycling mixedTaskStatuses() for the "nothing driven by the demo
   * controls yet" state — Group Case Child Cases start from a specific, non-cycling mix
   * (see VAT_GROUP_CHILD_CASE_INITIAL_STATUSES) instead. */
  initialStatuses?: Record<string, TaskStatus>
}

/** CIT In Review + Approved: creator must reconfirm tasks before client approval. */
export function isCitInReviewTaskReconfirmation(
  process: Process,
  phase: Phase,
  approvedChecked: boolean,
): boolean {
  return process === 'cit' && phase === 'inReview' && approvedChecked
}

export function showCitInReviewReconfirmBanner(
  process: Process,
  phase: Phase,
  approvedChecked: boolean,
): boolean {
  return isCitInReviewTaskReconfirmation(process, phase, approvedChecked)
}

export function showCitInReviewReconfirmDoneControl(
  process: Process,
  headerType: string,
  platform: string,
  phase: Phase,
  role: Role,
): boolean {
  return (
    process === 'cit' &&
    headerType === 'case' &&
    platform === 'wts' &&
    phase === 'inReview' &&
    role === 'creator'
  )
}

/** Creator may edit task status in In Preparation, or during CIT reconfirm flow. */
export function canCreatorChangeTaskStatus(
  process: Process,
  role: Role,
  phase: Phase,
  approvedChecked: boolean,
  tasksReconfirmedDone: boolean,
  options: {
    headerType?: string
    platform?: string
    packageReviewOutcome?: PackageReviewOutcome
  } = {},
): boolean {
  if (role !== 'creator') return false
  const { headerType, platform, packageReviewOutcome = 'default' } = options
  if (
    headerType &&
    platform &&
    isNeedChangesWorkflowReset(headerType, platform, phase, packageReviewOutcome)
  ) {
    return true
  }
  if (phase === 'inPreparation') return true
  return (
    isCitInReviewTaskReconfirmation(process, phase, approvedChecked) &&
    !tasksReconfirmedDone
  )
}

export function isCitInReviewReconfirmGateActive(
  process: Process,
  headerType: string,
  platform: string,
  phase: Phase,
  role: Role,
  approvedChecked: boolean,
): boolean {
  return (
    showCitInReviewReconfirmDoneControl(
      process,
      headerType,
      platform,
      phase,
      role,
    ) && approvedChecked
  )
}

export function taskStatusesForDemo(
  phase: Phase,
  tasksDoneChecked: boolean,
  options: TaskStatusDemoOptions = {},
): Record<string, TaskStatus> {
  const {
    process,
    approvedChecked = false,
    tasksReconfirmedDone = false,
    headerType,
    platform,
    packageReviewOutcome = 'default',
    tasks: tasksOverride,
    initialStatuses,
  } = options

  const tasks = tasksOverride ?? caseTasksForProcess(process)

  if (
    headerType &&
    platform &&
    phase &&
    isNeedChangesWorkflowReset(headerType, platform, phase, packageReviewOutcome)
  ) {
    return allTasksInProgress(tasks)
  }

  if (
    process === 'cit' &&
    phase === 'inReview' &&
    approvedChecked &&
    !tasksReconfirmedDone
  ) {
    return allTasksInProgress(tasks)
  }

  if (PAST_PREPARATION_PHASES.includes(phase) || tasksDoneChecked) {
    return allTasksDone(tasks)
  }
  return initialStatuses ?? mixedTaskStatuses(tasks)
}

export function isCaseTasksGateActive(
  headerType: string,
  platform: string,
  phase: string,
  packageReviewOutcome: PackageReviewOutcome = 'default',
): boolean {
  return (
    headerType === 'case' &&
    platform === 'wts' &&
    (phase === 'inPreparation' ||
      isNeedChangesWorkflowReset(
        headerType,
        platform,
        phase as Phase,
        packageReviewOutcome,
      ))
  )
}

/** CIT Submission: the Tax assessment CTA is gated on protocol confirmation. */
export function isSubmissionProtocolGateActive(
  process: Process,
  headerType: string,
  platform: string,
  phase: string,
): boolean {
  return (
    process === 'cit' &&
    headerType === 'case' &&
    platform === 'wts' &&
    phase === 'submitted'
  )
}

/** CIT Assessment & Closure: Close case is gated until all assessments are done. */
export function isAssessmentClosureGateActive(
  process: Process,
  headerType: string,
  platform: string,
  phase: string,
): boolean {
  return (
    process === 'cit' &&
    headerType === 'case' &&
    (platform === 'wts' || platform === 'client') &&
    phase === 'assessmentClosure'
  )
}

const ASSESSMENT_STATE_OPTIONS: {
  value: AssessmentsState
  label: string
}[] = [
  { value: 'empty', label: 'No Items' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'done', label: 'Done' },
]

/** Demo control options per role — clients see Mixed but cannot select it. */
export function assessmentStateOptionsForRole(role: Role) {
  return ASSESSMENT_STATE_OPTIONS.map((option) => ({
    ...option,
    disabled: role === 'client' && option.value === 'mixed',
  }))
}

/** When switching roles, drop states the new role cannot preview (e.g. Mixed for client). */
export function reconcileAssessmentStateForRole(
  state: AssessmentsState,
  role: Role,
): AssessmentsState {
  const selectable = assessmentStateOptionsForRole(role)
    .filter((option) => !option.disabled)
    .map((option) => option.value)
  if (selectable.includes(state)) return state
  if (role === 'client' && state === 'mixed') return 'arrived'
  return selectable[0] ?? 'mixed'
}

export function assessmentStateControlHint(role: Role): string {
  if (role === 'client') {
    return 'No Items: empty state · Arrived: assessments pending · Done: all resolved. Mixed is not available for the client view.'
  }
  return 'No Items: empty state · Arrived: all awaiting review · Mixed: varied states · Done: all resolved (enables Close case).'
}

/** In Review / Client Approval: primary CTA gated on Approved control. */
export function isCaseApprovalGateActive(
  headerType: string,
  platform: string,
  phase: string,
  role?: Role,
): boolean {
  if (
    headerType !== 'case' ||
    platform !== 'wts' ||
    (phase !== 'inReview' && phase !== 'clientApproval')
  ) {
    return false
  }
  // Reviewer submits review in In Review without the Approved demo control.
  if (role === 'reviewer' && phase === 'inReview') {
    return false
  }
  return true
}

/** Partner cannot upload on case tasks (all processes). HR/VAT: Reviewer also cannot. */
export function showTaskUploadButton(process: Process, role: Role): boolean {
  if (role === 'partner') return false
  if (role === 'reviewer' && process !== 'cit') return false
  return role === 'creator'
}
