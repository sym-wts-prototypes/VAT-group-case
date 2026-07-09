import { CaseHeader } from './CaseHeader'
import type { HeaderDescriptor } from '@/types'

interface CaseWrapperHeaderProps {
  descriptor: HeaderDescriptor
  compact?: boolean
  primaryDisabled?: boolean
  onPrimaryClick?: (label: string) => void
}

/** HR Case Wrapper — same layout as Case header (Figma-aligned with HR case). */
export function CaseWrapperHeader({
  descriptor,
  compact,
  primaryDisabled,
  onPrimaryClick,
}: CaseWrapperHeaderProps) {
  return (
    <CaseHeader
      descriptor={descriptor}
      compact={compact}
      primaryDisabled={primaryDisabled}
      onPrimaryClick={onPrimaryClick}
    />
  )
}
