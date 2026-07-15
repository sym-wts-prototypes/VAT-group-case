import {
  CircleCheckBig,
  Download,
  FilePen,
  FileText,
  History,
  Hourglass,
} from 'lucide-react'

import { Badge } from '@wts/ui'
import { Button } from '@wts/ui'
import type { PackageBannerDescriptor } from '@/config/packageBanners'
import { cn } from '@wts/ui'

const VARIANT_STYLES = {
  purple: 'border-l-purple-600',
  amber: 'border-l-amber-600',
  green: 'border-l-green-600',
  blue: 'border-l-sky-600',
} as const

const ICON_MAP = {
  fileText: FileText,
  filePen: FilePen,
  circleCheck: CircleCheckBig,
  hourglass: Hourglass,
} as const

interface PackageBannerProps {
  descriptor: PackageBannerDescriptor
  packageFileName: string
  hideVersionHistory?: boolean
  className?: string
}

/** Figma 15403:3973 — data package generated from case tasks. */
export function PackageBanner({
  descriptor,
  packageFileName,
  hideVersionHistory = false,
  className,
}: PackageBannerProps) {
  const Icon = ICON_MAP[descriptor.icon]
  const hasComments = Boolean(descriptor.comments)
  const tall = hasComments

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border-l-[6px] border-solid bg-muted shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]',
        VARIANT_STYLES[descriptor.variant],
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-start sm:gap-4',
          tall && 'pb-0',
        )}
      >
        <Icon
          className="h-14 w-14 shrink-0 text-foreground"
          strokeWidth={1.25}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xl font-medium leading-7 text-[#161616]">
                {descriptor.title}
              </p>
              <p className="text-sm leading-5 text-[#161616]">
                {descriptor.description}
              </p>
            </div>
            {descriptor.meta && (
              <Badge variant="soft" tone="default" className="shrink-0 self-start">
                {descriptor.meta}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {hasComments && descriptor.comments && (
        <div className="border-t border-[#e0e0e0] px-4 py-4">
          <p className="text-sm font-medium text-foreground">
            {descriptor.comments.label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground opacity-90">
            {descriptor.comments.body}
          </p>
        </div>
      )}

      {descriptor.showFooter && (
        <div
          className={cn(
            'flex flex-col gap-3 border-t border-[#e0e0e0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between',
            hasComments && 'mt-0',
          )}
        >
          <p className="truncate text-sm text-[#525252]">{packageFileName}</p>
          <div className="flex shrink-0 flex-wrap items-center gap-6">
            {descriptor.showVersionHistory && !hideVersionHistory && (
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 text-sm font-medium text-sky-800 hover:underline"
              >
                <History className="h-4 w-4" aria-hidden />
                Version history
              </button>
            )}
            <Button variant="outline" size="lg" className="h-10 gap-2 px-8">
              <Download className="h-4 w-4" aria-hidden />
              Download package
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
