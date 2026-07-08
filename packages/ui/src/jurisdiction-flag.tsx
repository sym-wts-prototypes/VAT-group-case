import AT from 'country-flag-icons/react/3x2/AT'
import BE from 'country-flag-icons/react/3x2/BE'
import CH from 'country-flag-icons/react/3x2/CH'
import DE from 'country-flag-icons/react/3x2/DE'
import ES from 'country-flag-icons/react/3x2/ES'
import FR from 'country-flag-icons/react/3x2/FR'
import HU from 'country-flag-icons/react/3x2/HU'
import IT from 'country-flag-icons/react/3x2/IT'
import NL from 'country-flag-icons/react/3x2/NL'
import PL from 'country-flag-icons/react/3x2/PL'

import { cn } from './cn'

// Static map of the jurisdiction codes the platform's prototypes support — an `import * as
// Flags` barrel would pull in all ~270 flags (~680KB) since the dynamic lookup can't be
// tree-shaken. Unsupported codes fall back to plain text below.
const FLAGS = {
  AT,
  BE,
  CH,
  DE,
  ES,
  FR,
  HU,
  IT,
  NL,
  PL,
} as const

export interface JurisdictionFlagProps {
  code: string
  className?: string
}

export function JurisdictionFlag({ code, className }: JurisdictionFlagProps) {
  const upperCode = code.toUpperCase()
  const Flag = FLAGS[upperCode as keyof typeof FLAGS]

  if (!Flag) {
    return <span className={cn('font-medium text-foreground text-sm', className)}>{code}</span>
  }

  return (
    <div className="flex items-center gap-2">
      <Flag className={cn('h-4 w-6 rounded-sm', className)} title={upperCode} />
      <span className="font-medium text-foreground text-sm">{upperCode}</span>
    </div>
  )
}
