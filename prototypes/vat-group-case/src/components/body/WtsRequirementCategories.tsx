import { RequirementListAccordion } from '@/components/body/RequirementListAccordion'
import type { Process, Role } from '@/types'

interface WtsRequirementCategoriesProps {
  role: Role
  /** CIT AI file-matcher simulation ticket — gates the matched-files/confidence UI to CIT only;
   *  VAT/HR see the same categories with only their plain preset attachments + All files. */
  process: Process
  className?: string
}

/** WTS requirement list after draft — Figma 1928:72569. */
export function WtsRequirementCategories({
  role,
  process,
  className,
}: WtsRequirementCategoriesProps) {
  return (
    <RequirementListAccordion
      variant="postDraft"
      role={role}
      process={process}
      className={className}
    />
  )
}
