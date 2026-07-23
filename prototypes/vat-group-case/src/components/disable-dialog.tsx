import { ConfirmDialog } from '@wts/ui'

import { Organization } from './organizations-data'

export function DisableDialog({
  org,
  onCancel,
  onConfirm,
}: {
  org: Organization
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <ConfirmDialog
      overlayClassName="bg-background/40 backdrop-blur-sm"
      open
      onOpenChange={(open) => !open && onCancel()}
      onConfirm={onConfirm}
      title="Disable organization?"
      description={
        <>
          Disabling{' '}
          <span className="font-semibold text-foreground">{org.name}</span> removes it from active
          operational use while preserving all historical data, legal entities, engagements, and
          users. It can be re-enabled later.
        </>
      }
      confirmLabel="Disable organization"
    />
  )
}
