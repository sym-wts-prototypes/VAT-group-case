import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  File,
  FileStack,
  MessageSquareText,
  Upload,
  X,
} from 'lucide-react'

import { Badge } from '@wts/ui'
import { Button } from '@wts/ui'
import { Separator } from '@wts/ui'
import { CitInReviewReconfirmBanner } from '@/components/body/CitInReviewReconfirmBanner'
import { PackageBanner } from '@/components/body/PackageBanner'
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
  canCreatorChangeTaskStatus,
  caseTasksForProcess,
  effectiveCaseWorkflowPhase,
  isNeedChangesWorkflowReset,
  showCitInReviewReconfirmBanner,
  showTaskUploadButton,
  taskStatusesForDemo,
  WTS_CASE_DEMO_SUBMISSION_DOCUMENTS,
  type TaskStatus,
} from '@/lib/caseTasks'
import { AssessmentClosureSection } from '@/components/body/AssessmentClosureSection'
import { CaseSummarySection } from '@/components/body/CaseSummarySection'
import { CasePhaseStepper } from '@/components/body/CasePhaseStepper'
import { DraftRequirementsSection } from '@/components/body/DraftRequirementsSection'
import { VatDraftEmptyState } from '@/components/body/VatDraftEmptyState'
import { WtsRequirementCategories } from '@/components/body/WtsRequirementCategories'
import {
  CLIENT_BUCKET_CARDS,
  getRequirementCategory,
} from '@/config/requirements'
import { SAMPLE_HR_REQUEST_IDS } from '@/config/sampleData'
import { showDraftRequirementsToolbar } from '@/lib/draftRequirementsToolbar'
import { cn } from '@wts/ui'
import type { AssessmentsState } from '@/store/useDemoStore'
import type {
  PackageBannerState,
  PackageReviewOutcome,
} from '@/config/packageBanners'
import { resolvePackageBanner } from '@/lib/packageBanners'
import type { HeaderType, Phase, Platform, Process, Role } from '@/types'

interface BodyPlaceholderProps {
  process: Process
  headerType: HeaderType
  platform: Platform
  phase: Phase
  role: Role
  tasksDoneChecked?: boolean
  approvedChecked?: boolean
  tasksReconfirmedDone?: boolean
  protocolConfirmationChecked?: boolean
  assessmentsState?: AssessmentsState
  packageBannerState?: PackageBannerState
  packageReviewOutcome?: PackageReviewOutcome
  onOpenRequirementList?: () => void
  onOpenRequirementBucket?: (categoryId: string) => void
  selectedRequirementCategoryId?: string
  className?: string
}

const CASE_WRAPPER_CASES = [
  {
    title: 'Audit Request 1',
    subtitle: `Wage Tax Audit · 2024-2025 · ${SAMPLE_HR_REQUEST_IDS[0]}`,
  },
  {
    title: 'Audit Request 2',
    subtitle: `Wage Tax Audit · 2024-2025 - Q2 · ${SAMPLE_HR_REQUEST_IDS[1]}`,
  },
  {
    title: 'Audit Request 3',
    subtitle: `Wage Tax Audit · 2024-2025 - Q3 · ${SAMPLE_HR_REQUEST_IDS[2]}`,
  },
]

export function BodyPlaceholder({
  process,
  headerType,
  platform,
  phase,
  role,
  tasksDoneChecked = false,
  approvedChecked = false,
  tasksReconfirmedDone = false,
  protocolConfirmationChecked = false,
  assessmentsState = 'mixed',
  packageBannerState = 'sent',
  packageReviewOutcome = 'default',
  onOpenRequirementList,
  onOpenRequirementBucket,
  selectedRequirementCategoryId,
  className,
}: BodyPlaceholderProps) {
  const isWtsCase = headerType === 'case' && platform === 'wts'
  const showDraftToolbar = showDraftRequirementsToolbar(
    process,
    platform,
    phase,
    role,
  )

  function renderWtsCaseContent() {
    if (phase === 'summary') {
      return <CaseSummarySection role={role} />
    }
    if (phase === 'assessmentClosure') {
      return (
        <AssessmentClosureSection
          role={role}
          assessmentsState={assessmentsState}
        />
      )
    }
    if (phase === 'draft') {
      if (process === 'vat') {
        return (
          <VatDraftEmptyState
            onOpenRequirements={
              onOpenRequirementList ?? (() => undefined)
            }
          />
        )
      }
      if (showDraftToolbar) {
        return <DraftRequirementsSection role={role} />
      }
    }
    return (
      <CaseWtsTasksBody
        process={process}
        role={role}
        phase={phase}
        tasksDoneChecked={tasksDoneChecked}
        approvedChecked={approvedChecked}
        tasksReconfirmedDone={tasksReconfirmedDone}
        protocolConfirmationChecked={protocolConfirmationChecked}
        packageBannerState={packageBannerState}
        packageReviewOutcome={packageReviewOutcome}
        headerType={headerType}
        platform={platform}
      />
    )
  }

  const usesDraftList =
    showDraftToolbar &&
    (headerType === 'requirementList' ||
      (headerType === 'case' && phase === 'draft'))

  const stepperPhase =
    isWtsCase && !usesDraftList
      ? effectiveCaseWorkflowPhase(
          phase,
          headerType,
          platform,
          packageReviewOutcome,
        )
      : phase

  const usesWtsRequirementList =
    headerType === 'requirementList' &&
    platform === 'wts' &&
    role !== 'client'
  const usesClientRequirementBuckets =
    headerType === 'case' && platform === 'client'

  const isAssessmentClosure = headerType === 'case' && phase === 'assessmentClosure'

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        usesDraftList ||
          usesWtsRequirementList ||
          isWtsCase ||
          usesClientRequirementBuckets
          ? 'bg-background p-0'
          : 'bg-muted/30',
        !usesDraftList &&
          !usesWtsRequirementList &&
          (isWtsCase ? 'p-0' : 'p-6'),
        isAssessmentClosure && 'min-h-0 flex-1',
        className,
      )}
    >
      {headerType === 'caseWrapper' && <CaseWrapperBody />}

      {isWtsCase && (
        <div
          className={cn(
            usesDraftList ? '' : 'flex flex-col gap-6',
            isAssessmentClosure && 'min-h-0 flex-1',
          )}
        >
          {!usesDraftList && phase !== 'summary' && (
            <CasePhaseStepper currentPhase={stepperPhase} process={process} />
          )}
          <div
            className={cn(
              usesDraftList ? '' : 'px-6 pb-6',
              phase === 'summary' && 'pt-6',
              isAssessmentClosure && 'flex min-h-0 flex-1 flex-col',
            )}
          >
            {renderWtsCaseContent()}
          </div>
        </div>
      )}

      {headerType === 'case' &&
        platform === 'client' &&
        (phase === 'summary' ? (
          <CaseSummarySection role={role} />
        ) : phase === 'assessmentClosure' ? (
          <AssessmentClosureSection
            role={role}
            assessmentsState={assessmentsState}
          />
        ) : (
          <ClientBucketCardsBody
            process={process}
            role={role}
            phase={phase}
            packageBannerState={packageBannerState}
            onOpenBucket={onOpenRequirementBucket}
          />
        ))}

      {headerType === 'requirementList' &&
        platform === 'wts' &&
        role !== 'client' &&
        (showDraftToolbar ? (
          <DraftRequirementsSection role={role} />
        ) : (
          <WtsRequirementCategories role={role} className="px-6 pt-6 pb-6" />
        ))}

      {headerType === 'requirementBucket' && (
        <BucketOpenedBody
          categoryId={selectedRequirementCategoryId}
          phase={phase}
        />
      )}
    </div>
  )
}

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'text-xs font-medium uppercase tracking-wide text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  )
}

function CaseWtsTasksBody({
  process,
  role,
  phase,
  headerType,
  platform,
  tasksDoneChecked,
  approvedChecked,
  tasksReconfirmedDone,
  protocolConfirmationChecked,
  packageBannerState,
  packageReviewOutcome,
}: {
  process: Process
  role: Role
  phase: Phase
  headerType: HeaderType
  platform: Platform
  tasksDoneChecked: boolean
  approvedChecked: boolean
  tasksReconfirmedDone: boolean
  protocolConfirmationChecked: boolean
  packageBannerState: PackageBannerState
  packageReviewOutcome: PackageReviewOutcome
}) {
  const statuses = taskStatusesForDemo(phase, tasksDoneChecked, {
    process,
    approvedChecked,
    tasksReconfirmedDone,
    headerType,
    platform,
    packageReviewOutcome,
  })
  const showUpload = showTaskUploadButton(process, role)
  const needChangesReset = isNeedChangesWorkflowReset(
    headerType,
    platform,
    phase,
    packageReviewOutcome,
  )
  const showReconfirmBanner =
    role === 'creator' &&
    !needChangesReset &&
    showCitInReviewReconfirmBanner(process, phase, approvedChecked)
  const showStatusDropdown = canCreatorChangeTaskStatus(
    process,
    role,
    phase,
    approvedChecked,
    tasksReconfirmedDone,
    { headerType, platform, packageReviewOutcome },
  )
  const packageBanner = resolvePackageBanner(
    process,
    phase,
    role,
    packageBannerState,
  )
  const isSubmissionPhase = phase === 'submitted'
  const listItems = isSubmissionPhase
    ? WTS_CASE_DEMO_SUBMISSION_DOCUMENTS
    : caseTasksForProcess(process)
  const requiredItems = listItems.filter((item) => !item.optional)
  const optionalItems = listItems.filter((item) => item.optional)
  const sectionLabel = isSubmissionPhase ? 'Submission confirmation' : 'Tasks'

  const renderTaskRow = (item: { id: string; title: string }) => {
    const files =
      isSubmissionPhase &&
      item.id === 'sub-doc-3' &&
      protocolConfirmationChecked
        ? ['Submission receipt.pdf']
        : []
    return (
      <TaskRow
        key={item.id}
        title={item.title}
        status={statuses[item.id] ?? 'notStarted'}
        showUpload={showUpload}
        showStatus={!isSubmissionPhase}
        showStatusDropdown={showStatusDropdown}
        files={files}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {showReconfirmBanner && <CitInReviewReconfirmBanner />}
      {packageBanner && (
        <PackageBanner
          descriptor={packageBanner.descriptor}
          packageFileName={packageBanner.packageFileName}
        />
      )}
      <SectionLabel
        className={isSubmissionPhase && packageBanner ? 'mt-3' : undefined}
      >
        {sectionLabel}
      </SectionLabel>
      <div className="flex flex-col gap-2">
        {requiredItems.map(renderTaskRow)}
        {optionalItems.length > 0 && (
          <div className="flex items-center gap-3 pb-1 pt-3">
            <span className="text-sm font-medium text-foreground">
              Optional tasks
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        )}
        {optionalItems.map(renderTaskRow)}
      </div>
    </div>
  )
}

function TaskRow({
  title,
  status,
  showUpload,
  showStatus,
  showStatusDropdown,
  files = [],
}: {
  title: string
  status: TaskStatus
  showUpload: boolean
  showStatus: boolean
  showStatusDropdown: boolean
  files?: string[]
}) {
  const tone = TASK_STATUS_TONE[status]
  const label = TASK_STATUS_LABELS[status]
  const fileCount = files.length

  return (
    <div className="rounded-lg border border-border bg-background shadow-header-sm">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
          {title}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {showStatus && (
            <Badge tone={tone}>
              {label}
              {showStatusDropdown && (
                <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
              )}
            </Badge>
          )}
          <Badge tone="gray">
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </Badge>
          {showUpload && (
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          )}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label={showStatus ? 'Expand task' : 'Expand document'}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
      {fileCount > 0 && (
        <div className="flex flex-col gap-2 px-4 pb-3.5">
          {files.map((file) => (
            <div
              key={file}
              className="flex items-center rounded-md bg-muted"
            >
              <p className="min-w-0 flex-1 truncate px-4 py-3 text-sm text-foreground">
                {file}
              </p>
              <div className="px-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 shrink-0 gap-2 px-3"
                  aria-label={`Download ${file}`}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Client case level — bucket cards mirror WTS categories. */
function ClientBucketCardsBody({
  process,
  role,
  phase,
  packageBannerState,
  onOpenBucket,
}: {
  process: Process
  role: Role
  phase: Phase
  packageBannerState: PackageBannerState
  onOpenBucket?: (categoryId: string) => void
}) {
  const canOpenBucket = phase !== 'draft'
  const packageBanner = resolvePackageBanner(
    process,
    phase,
    role,
    packageBannerState,
  )

  return (
    <div className="flex flex-col gap-6">
      {packageBanner && (
        <PackageBanner
          descriptor={packageBanner.descriptor}
          packageFileName={packageBanner.packageFileName}
          hideVersionHistory
        />
      )}
      <div className="flex flex-col gap-3">
        <SectionLabel>Requirement buckets</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CLIENT_BUCKET_CARDS.map((bucket) => (
            <BucketCard
              key={bucket.categoryId}
              {...bucket}
              onOpen={
                canOpenBucket
                  ? () => onOpenBucket?.(bucket.categoryId)
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Opened bucket — same items as the matching WTS category accordion. */
function BucketOpenedBody({
  categoryId,
  phase,
}: {
  categoryId?: string
  phase: Phase
}) {
  const category =
    (categoryId && getRequirementCategory(categoryId)) ??
    getRequirementCategory('category-1')
  const requiredCategory = getRequirementCategory('category-1')

  if (!category || !requiredCategory) {
    return null
  }

  const requiredItems = requiredCategory.items.slice(0, 3)
  const bucketState: 'draft' | 'inPreparation' | 'postPreparation' =
    phase === 'draft'
      ? 'draft'
      : phase === 'inPreparation'
        ? 'inPreparation'
        : 'postPreparation'
  const isDisabledDraft = bucketState === 'draft'
  const hasFiles = bucketState === 'postPreparation'
  const requirementsChecked = bucketState === 'postPreparation'

  const demoFiles = [
    { name: 'File name 1.xlsx', meta: '3.7MB' },
    { name: 'File name 2.xlsx', meta: '3.7 MB · 25%' },
    { name: 'File name 3.xlsx', meta: '3.7MB' },
    { name: 'File name 4.xlsx', meta: '3.7MB' },
    { name: 'File name 5.xlsx', meta: '3.7MB' },
    { name: 'File name 6.xlsx', meta: '3.7MB' },
  ]

  return (
    <div
      className={cn(
        'flex flex-col gap-6 px-6 py-6',
        isDisabledDraft && 'pointer-events-none opacity-50',
      )}
    >
      <section className="flex flex-col gap-6">
        <h3 className="text-[20px] font-semibold leading-7 text-foreground">
          Upload Documents
        </h3>

        <div className="rounded-lg border border-dashed border-border px-6 py-8 text-center">
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3">
            <Upload className="h-6 w-6 text-foreground" />
            <div>
              <p className="text-base font-medium leading-none text-foreground">
                Drag & Drop or Choose file to upload
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Max file size is 5 MB. Supported file types are csv, xls, xlsx.
              </p>
            </div>
          </div>
        </div>

        {hasFiles && (
          <div className="border-t border-border pt-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {demoFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex min-h-[60px] items-center justify-between rounded-lg bg-muted px-4 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <File className="h-8 w-8 text-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{file.meta}</p>
                    </div>
                  </div>
                  <X className="h-4 w-4 text-foreground" />
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <FileStack className="h-8 w-8 text-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    +23 files
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expand to view all files.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 gap-2"
              >
                See all files
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-6">
        <div>
          <h3 className="text-[20px] font-semibold leading-7 text-foreground">
            Required documents
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Check each item once uploaded.
          </p>
        </div>
        <div className="flex flex-col">
          {requiredItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'flex min-h-24 items-center border-b border-border bg-background',
                index === 0 && 'border-t border-border',
              )}
            >
              <div className="flex shrink-0 items-center px-3 py-2">
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-sm border',
                    requirementsChecked
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-primary bg-background text-transparent',
                  )}
                >
                  <Check className="h-3 w-3" />
                </span>
              </div>
              <div className="min-w-0 flex-1 px-2 py-3">
                <p className="text-sm font-medium leading-5 text-foreground">
                  {item.id} / {item.title}
                </p>
                <p className="text-sm leading-5 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function BucketCard({
  title,
  items,
  files,
  status,
  onOpen,
}: {
  title: string
  items: number
  files: number
  status: 'Done' | 'In Progress' | 'Not started'
  onOpen?: () => void
}) {
  const tone =
    status === 'Done' ? 'green' : status === 'In Progress' ? 'sky' : 'gray'

  const CardWrapper = onOpen ? 'button' : 'div'

  return (
    <CardWrapper
      type={onOpen ? 'button' : undefined}
      onClick={onOpen}
      className={cn(
        'relative flex flex-col rounded-lg border border-border bg-background p-4 text-left shadow-header-sm',
        onOpen && 'cursor-pointer transition-colors hover:bg-muted/30',
      )}
    >
      <div className="mb-6 flex items-start justify-between">
        <Badge tone={tone}>
          {status}
        </Badge>
        <MessageSquareText
          className="h-5 w-5 text-muted-foreground"
          aria-hidden
        />
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <p className="text-base font-semibold leading-none text-foreground">
            {title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{items} items</p>
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <Separator />
          <p className="text-sm text-muted-foreground">
            {files} {files === 1 ? 'file' : 'files'} uploaded
          </p>
        </div>
      </div>
    </CardWrapper>
  )
}

function CaseWrapperBody() {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Cases in this wrapper</SectionLabel>
      <div className="flex flex-col gap-2">
        {CASE_WRAPPER_CASES.map((row) => (
          <div
            key={row.title}
            className="rounded-lg border border-border bg-background px-4 py-3"
          >
            <span className="text-sm font-medium text-foreground">
              {row.title}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {row.subtitle}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
