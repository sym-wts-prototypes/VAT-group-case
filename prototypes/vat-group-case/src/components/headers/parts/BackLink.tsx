import { ArrowLeft } from 'lucide-react'

import { cn } from '@wts/ui'

interface BackLinkProps {
  label: string
  href?: string
  className?: string
}

export function BackLink({ label, href = '#', className }: BackLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-lg text-sm font-medium text-[hsl(var(--link))] hover:underline',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </a>
  )
}
