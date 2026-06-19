import { RequirementListAccordion } from '@/components/body/RequirementListAccordion'
import type { Role } from '@/types'

interface WtsRequirementCategoriesProps {
  role: Role
  className?: string
}

/** WTS requirement list after draft — Figma 1928:72569. */
export function WtsRequirementCategories({
  role,
  className,
}: WtsRequirementCategoriesProps) {
  return (
    <RequirementListAccordion
      variant="postDraft"
      role={role}
      className={className}
    />
  )
}
