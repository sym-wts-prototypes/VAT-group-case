import { Info } from 'lucide-react'

import { cn } from '@/lib/cn'

interface CitInReviewReconfirmBannerProps {
  className?: string
}

/** CIT In Review + Approved: prompt creator to reconfirm tasks (Figma info banner). */
export function CitInReviewReconfirmBanner({
  className,
}: CitInReviewReconfirmBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3',
        className,
      )}
    >
      <Info
        className="mt-0.5 h-4 w-4 shrink-0 text-sky-800"
        aria-hidden
      />
      <p className="text-sm leading-5 text-sky-950">
        Before sending for client approval, confirm each task is complete again
        and clean up final documents of any internal comments.
      </p>
    </div>
  )
}
