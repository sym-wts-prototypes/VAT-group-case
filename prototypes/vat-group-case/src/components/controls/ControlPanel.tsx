import { DUMMY_GROUP_CASES } from '@/components/case-management-data'
import { PARENT_CASE_PHASES, PHASE_LABELS, workflowPhasesForControls } from '@/config/phases'
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
import type { CaseKind, CaseVariant, CorrectionViewSide, GroupCaseView } from '@/store/useDemoStore'
import type { HeaderType, Phase, Process, Role } from '@/types'

import { useState, type ReactNode } from 'react'
import { Briefcase, Building, Minus, Plus, ShieldCheck, User } from 'lucide-react'
import { Button, CheckboxField, cn } from '@wts/ui'
import { useOrgStore } from '@/store/useOrgStore'
import type { Role as OrgRole } from '@/components/role-switcher'
import { REQUIREMENT_CATEGORIES } from '@/config/requirements'
import { useRequirementsStore } from '@/store/useRequirementsStore'
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

// Same 4 lenses/icons/copy as prototypes/organisations' own ControlPanel.tsx — replicated here
// (not imported cross-prototype, these are separate Vite apps) so the Organisations entry point
// this prototype already has (organisations-entry.tsx) gets a real, changeable acting role
// instead of a hardcoded "Super Admin".
const ORG_ROLES: { value: OrgRole; icon: ReactNode; description: string }[] = [
  { value: 'Super Admin', icon: <ShieldCheck className="h-4 w-4" />, description: 'Platform — creates organisations and links admins. Full CRUD in the prototype.' },
  { value: 'Organisation Admin', icon: <Building className="h-4 w-4" />, description: 'Creates legal entities, manages users at organisation and entity level.' },
  { value: 'Engagement Admin', icon: <Briefcase className="h-4 w-4" />, description: 'Creates engagements, adds engagement users, connects engagements to entities.' },
  { value: 'Contributor', icon: <User className="h-4 w-4" />, description: 'Works only on cases they are attached to. No structural changes.' },
]

const ALL_HEADER_TYPES: HeaderType[] = [
  'caseWrapper',
  'case',
  'requirementList',
  'requirementBucket',
]

// Case Type → Group Case View is a two-step hierarchy (see useDemoStore's caseKind/
// groupCaseView): Single Case behaves exactly as the Playground always has; Group Case
// restricts Process to VAT and reveals a second choice between the (static, first-version)
// Parent Case page and the normal per-entity Child Case dispatch.
const CASE_KIND_OPTIONS: { value: CaseKind; label: string }[] = [
  { value: 'single', label: 'Single Case' },
  { value: 'group', label: 'Group Case' },
]
const GROUP_CASE_VIEW_OPTIONS: { value: GroupCaseView; label: string }[] = [
  { value: 'parent', label: 'Parent Case' },
  { value: 'child', label: 'Child Case' },
]
const CHILD_CASE_VARIANT_OPTIONS: { value: 'withApproval' | 'withoutApproval'; label: string }[] = [
  { value: 'withoutApproval', label: 'No Client Approval (3 steps)' },
  { value: 'withApproval', label: 'With Client Approval (4 steps)' },
]

// Feature 3 of the "playground navigation" ticket — chosen last, after every other context
// selector, since it's an overlay on top of whichever case is already selected (Single Case,
// Group Case Parent Case, or Group Case Child Case) rather than a new branch of its own.
const CASE_VARIANT_OPTIONS: { value: CaseVariant; label: string }[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'correction', label: 'Correction' },
]
// Feature 4 — only shown once Correction is selected above: which side of the correction
// relationship the case screens render (see useDemoStore's CorrectionViewSide).
const CORRECTION_VIEW_SIDE_OPTIONS: { value: CorrectionViewSide; label: string }[] = [
  { value: 'correctionCase', label: 'Correction Case' },
  { value: 'originalCase', label: 'Original Case' },
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
    showOrganisations,
    caseKind,
    groupCaseView,
    caseVariant,
    correctionViewSide,
    childCaseRequiresClientApproval,
    reopenedChildCaseIds,
    setCaseVariant,
    setCorrectionViewSide,
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
    setCaseKind,
    setGroupCaseView,
    setChildCaseRequiresClientApproval,
  } = useDemoStore()
  const orgRole = useOrgStore((state) => state.role)
  const setOrgRole = useOrgStore((state) => state.setRole)
  const orgRoleDescription = ORG_ROLES.find((r) => r.value === orgRole)?.description

  // Client-only demo control — lets the Playground simulate a Creator/Reviewer adding or
  // removing a requirement while viewing as Client, so the Requirement Bucket progress bar's
  // percentage visibly moves without actually switching roles.
  const [simulateCategoryId, setSimulateCategoryId] = useState(REQUIREMENT_CATEGORIES[0].id)
  const addSimulatedRequirement = useRequirementsStore((s) => s.addSimulatedRequirement)
  const removeSimulatedRequirement = useRequirementsStore((s) => s.removeSimulatedRequirement)

  const isGroupCase = caseKind === 'group'
  const isParentCaseView = isGroupCase && groupCaseView === 'parent'
  const isChildCaseView = isGroupCase && groupCaseView === 'child'
  const isViewingOriginalWithinCorrection = caseVariant === 'correction' && correctionViewSide === 'originalCase'

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
      {/* Case Management vs Organisations is now the app shell sidebar's job (its
          "Case Management"/"Organisations" nav items already toggle showCaseManagement/
          showOrganisations — see PlaygroundView.tsx) — no need for a duplicate switch here. */}
      {showOrganisations ? (
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-semibold text-foreground">Organisation role</h2>
          <div className="flex flex-col gap-1.5">
            {ORG_ROLES.map((r) => {
              const active = orgRole === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setOrgRole(r.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] leading-[18px] transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted',
                  )}
                >
                  <span className={active ? 'text-primary-foreground' : 'text-muted-foreground'}>{r.icon}</span>
                  <span className="font-medium">{r.value}</span>
                </button>
              )
            })}
          </div>
          {orgRoleDescription && (
            <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{orgRoleDescription}</p>
          )}
        </div>
      ) : (
      <>
      <div>
        <h2 className="text-sm font-semibold text-foreground">Process flow</h2>
        <p className="mt-1 text-xs text-muted-foreground">Role sets WTS vs Client.</p>
      </div>

      <OptionPills
        label="Case Type"
        value={caseKind}
        onChange={setCaseKind}
        options={CASE_KIND_OPTIONS}
      />

      {isGroupCase && (
        <OptionPills
          label="Group Case View"
          value={groupCaseView}
          onChange={setGroupCaseView}
          options={GROUP_CASE_VIEW_OPTIONS}
        />
      )}

      {/* Feature 2 of the "button states & child-case comments" ticket — most Child Cases on
          the Parent page are the no-Client-Approval (3-step) kind; this lets the Playground
          manually preview the other (4-step, with-Client-Approval) variant too, independent of
          which specific row was clicked. Switching away from "With Client Approval" while
          already on that step resets the Phase (see setChildCaseRequiresClientApproval) so the
          Phase radios below never get stuck on a step the new variant doesn't have. */}
      {isChildCaseView && (
        <OptionPills
          label="Child Case Variant"
          value={childCaseRequiresClientApproval ? 'withApproval' : 'withoutApproval'}
          onChange={(v) => setChildCaseRequiresClientApproval(v === 'withApproval')}
          options={CHILD_CASE_VARIANT_OPTIONS}
        />
      )}

      <ProcessTabs
        label="Process"
        value={process}
        onChange={setProcess}
        options={ALL_PROCESSES.map((p) => ({
          value: p,
          label: PROCESS_LABELS[p],
          disabled: isGroupCase && p !== 'vat',
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

      {/* Feature 3 of the "review-flow update batch" ticket: the Parent Case page ignores
          headerType entirely (PlaygroundMain dispatches to it before this control could matter),
          so showing the selector there is pure noise — Case is the permanent, only page.
          Child Case is different: Requirement List renders real, distinct content there (same
          WtsRequirementCategories/RequirementListAccordion the plain Single Case uses), so the
          selector is reintroduced there too — Case Wrapper stays naturally disabled via
          isHeaderTypeAllowedInControls below (Group Case is always VAT, non-HR), same as it
          already is on CIT/VAT Single Case. */}
      {!isParentCaseView && (
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
      )}

      <PhaseRadios
        label="Phase"
        value={phase}
        onChange={setPhase}
        options={(isParentCaseView ? PARENT_CASE_PHASES : workflowPhasesForControls(process)).map((p) => ({
          value: p,
          // Group Case Child Case flow: "Submission" reads "Ready for Consolidation" here too,
          // matching the stepper's own final-step relabel (see PlaygroundMain's finalStepLabel).
          label: isChildCaseView && p === 'submitted' ? 'Ready for Consolidation' : PHASE_LABELS[p as Phase],
          disabled:
            (!isParentCaseView && isPhaseDisabledInControls(p, role)) ||
            (isChildCaseView && !childCaseRequiresClientApproval && p === 'clientApproval') ||
            // Feature 4 — State B ("the case the correction was created from") only ever shows
            // anything at Submission (its banner); every other phase would just look like a
            // plain, un-corrected case, so only Submission stays selectable there. State A has
            // no such restriction — a correction case progresses through every phase normally.
            (isViewingOriginalWithinCorrection && p !== 'submitted'),
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

      {(showTasksDoneControl || (isParentCaseView && phase === 'inPreparation')) && (
        <CheckboxField
          label={isParentCaseView ? 'Ready for Consolidation' : 'Tasks Done'}
          description={
            isParentCaseView
              ? 'Marks every Child Case ready and enables Send to Consolidation.'
              : 'Marks all tasks complete and enables Send for review.'
          }
          // Feature 9 of the "review-flow update batch" ticket — a real state switcher: reflects
          // TRUE aggregate readiness (unchecked whenever any Child Case was individually reopened
          // via a Reviewer/Client Needs Changes decision, even if `tasksDoneChecked` itself was
          // never un-set), not just the raw checkbox value. Checking it clears the reopened set
          // (see setTasksDoneChecked) and brings every Child Case back to Ready for Consolidation.
          checked={tasksDoneChecked && reopenedChildCaseIds.length === 0}
          onCheckedChange={setTasksDoneChecked}
        />
      )}

      {isParentCaseView &&
        packageReviewOutcome === 'needChanges' &&
        reopenedChildCaseIds.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
            <span className="text-[13px] font-medium text-amber-950">
              Reopened Child Cases
            </span>
            <p className="text-xs text-amber-900/80">
              Sent back to In Preparation by the last Needs Changes decision; the
              rest kept their prior state.
            </p>
            <ul className="mt-1 flex flex-col gap-1">
              {reopenedChildCaseIds.map((id) => {
                const child = DUMMY_GROUP_CASES[0].children.find((c) => c.id === id)
                return (
                  <li key={id} className="text-xs text-amber-950">
                    {child?.client ?? id}
                  </li>
                )
              })}
            </ul>
          </div>
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

      {/* Features 3/4 of the "playground navigation" ticket — last, after every other selector:
          set the usual context (Case Type → Group Case View → phase/role/etc.) first, then pick
          Regular or Correction to view that variant of whichever case is currently selected.
          Applies to Single Case, Group Case Parent Case, and Group Case Child Case alike. */}
      <OptionPills
        label="Case Variant"
        value={caseVariant}
        onChange={setCaseVariant}
        options={CASE_VARIANT_OPTIONS}
      />

      {caseVariant === 'correction' && (
        <OptionPills
          label="Viewing"
          value={correctionViewSide}
          onChange={setCorrectionViewSide}
          options={CORRECTION_VIEW_SIDE_OPTIONS}
        />
      )}

      {role === 'client' && headerType === 'requirementBucket' && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <span className="text-[13px] font-medium text-foreground">
            Simulate requirement adding or removing
          </span>
          <p className="text-xs text-muted-foreground">
            Stands in for a Creator/Reviewer changing the requirement list — watch the
            Requirement Bucket progress bar move.
          </p>
          <OptionPills
            label="Category"
            value={simulateCategoryId}
            onChange={setSimulateCategoryId}
            options={REQUIREMENT_CATEGORIES.map((cat) => ({ value: cat.id, label: cat.title }))}
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full gap-2"
              onClick={() => addSimulatedRequirement(simulateCategoryId)}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add requirement
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full gap-2"
              onClick={() => removeSimulatedRequirement(simulateCategoryId)}
            >
              <Minus className="h-4 w-4" aria-hidden />
              Remove requirement
            </Button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}

export { HEADER_LABELS, ROLE_LABELS }
