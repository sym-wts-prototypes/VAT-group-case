import { DraftRequirementsToolbar } from '@/components/body/DraftRequirementsToolbar'
import { RequirementListAccordion } from '@/components/body/RequirementListAccordion'
import { cn } from '@/lib/cn'
import type { Role } from '@/types'

interface DraftRequirementsSectionProps {
  role: Role
  className?: string
}

/** Draft CIT/HR body — section header + accordion on white (Figma 8712:52171). */
export function DraftRequirementsSection({
  role,
  className,
}: DraftRequirementsSectionProps) {
  return (
    <div className={cn('flex flex-col bg-background pt-6', className)}>
      <DraftRequirementsToolbar role={role} />
      <RequirementListAccordion variant="draft" className="px-6 pb-6" />
    </div>
  )
}
