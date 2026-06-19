import {
  PACKAGE_REVIEW_OUTCOMES,
  isPackageReviewApprover,
  packageReviewOutcomeLabel,
  type PackageBannerWorkflowPhase,
  type PackageReviewOutcome,
} from '@/config/packageBanners'
import { cn } from '@/lib/cn'
import type { Phase, Role } from '@/types'

interface ReviewOutcomeRadiosProps {
  phase: Phase
  role: Role
  value: PackageReviewOutcome
  onChange: (value: PackageReviewOutcome) => void
  className?: string
}

export function ReviewOutcomeRadios({
  phase,
  role,
  value,
  onChange,
  className,
}: ReviewOutcomeRadiosProps) {
  if (phase !== 'inReview' && phase !== 'clientApproval') return null

  const workflowPhase = phase as PackageBannerWorkflowPhase
  const isApprover = isPackageReviewApprover(phase, role)
  const groupLabel = isApprover ? 'Review decision' : 'Package status'

  return (
    <fieldset
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3',
        className,
      )}
    >
      <legend className="px-1 text-sm font-medium text-foreground">
        {groupLabel}
      </legend>
      <p className="text-xs text-muted-foreground">
        {isApprover
          ? 'Sets the data-package banner for this role and phase.'
          : 'Preview banner state after reviewer or client action.'}
      </p>
      <div className="flex flex-col gap-2">
        {PACKAGE_REVIEW_OUTCOMES.map((outcome) => (
          <label
            key={outcome}
            className="flex cursor-pointer items-start gap-3"
          >
            <input
              type="radio"
              name="packageReviewOutcome"
              className="mt-0.5 size-4 shrink-0 accent-primary"
              checked={value === outcome}
              onChange={() => onChange(outcome)}
            />
            <span className="text-sm text-foreground">
              {packageReviewOutcomeLabel(workflowPhase, role, outcome)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
