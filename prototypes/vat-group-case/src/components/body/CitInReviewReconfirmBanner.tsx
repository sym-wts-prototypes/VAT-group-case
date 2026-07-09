import { Alert } from '@wts/ui'

interface CitInReviewReconfirmBannerProps {
  className?: string
}

/** CIT In Review + Approved: prompt creator to reconfirm tasks (Figma info banner). */
export function CitInReviewReconfirmBanner({
  className,
}: CitInReviewReconfirmBannerProps) {
  return (
    <Alert variant="info" className={className}>
      Before sending for client approval, confirm each task is complete again and
      clean up final documents of any internal comments.
    </Alert>
  )
}
