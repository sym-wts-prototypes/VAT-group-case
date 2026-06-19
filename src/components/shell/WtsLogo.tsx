import { cn } from '@/lib/cn'

/** Figma WTS-ShadCn 15127:29201 — original WTS mark + platform wordmark. */
export function WtsLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-8 items-center gap-[7px]', className)}>
      <img
        src="/assets/wts-logo.svg"
        alt="WTS"
        width={51}
        height={32}
        className="h-8 w-[51px] shrink-0"
      />
      <span className="text-lg font-semibold leading-7 text-foreground">
        platform
      </span>
    </div>
  )
}
