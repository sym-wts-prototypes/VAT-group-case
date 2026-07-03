import { useMemo, useState } from 'react'
import { Plus, Building2 } from 'lucide-react'
import { Button, EmptyState as UiEmptyState } from '@wts/ui'

import {
  Organization,
  OrgStatus,
} from './organizations-data'
import { OrganizationCard } from './organization-card'
import { OrganizationPanel, PanelMode } from './organization-panel'
import { DisableDialog } from './disable-dialog'

export interface OrgFormData {
  name: string
  description: string
  status: OrgStatus
  logoUrl?: string
}

export function OrganizationsPage({
  orgs,
  onOpenOrg,
  canManage = true,
  visibleOrgIds,
  onCreateOrg,
  onUpdateOrg,
  onSetOrgStatus,
}: {
  orgs: Organization[]
  onOpenOrg: (o: Organization) => void
  canManage?: boolean
  visibleOrgIds?: string[]
  // Mutations are owned by the parent so newly created / edited orgs stay openable.
  onCreateOrg: (data: OrgFormData) => void
  onUpdateOrg: (id: string, data: OrgFormData) => void
  onSetOrgStatus: (id: string, status: OrgStatus) => void
}) {
  const [panel, setPanel] = useState<{ mode: PanelMode; org: Organization | null } | null>(null)
  const [disableTarget, setDisableTarget] = useState<Organization | null>(null)

  const sorted = useMemo(() => {
    const visible = visibleOrgIds ? orgs.filter((o) => visibleOrgIds.includes(o.id)) : orgs
    return [...visible].sort((a, b) => a.name.localeCompare(b.name))
  }, [orgs, visibleOrgIds])

  function handleSubmit(data: OrgFormData) {
    if (panel?.mode === 'create') {
      onCreateOrg(data)
    } else if (panel?.mode === 'edit' && panel.org) {
      onUpdateOrg(panel.org.id, data)
    }
    setPanel(null)
  }

  return (
    <div>
      <div className="flex border-b border-border bg-muted/40 p-6">
        <div className="flex w-full flex-wrap items-start justify-between gap-8">
          <div className="flex min-w-[260px] grow flex-col gap-1.5">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Organizations
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage organizations, legal entities, engagements, and user access across the platform.
            </p>
          </div>
          {canManage && (
            <Button
              type="button"
              onClick={() => setPanel({ mode: 'create', org: null })}
              className="shrink-0"
            >
              <Plus className="size-4" />
              Create Organization
            </Button>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState onCreate={canManage ? () => setPanel({ mode: 'create', org: null }) : undefined} />
      ) : (
        <div
          className="grid gap-4 p-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
        >
          {sorted.map((org) => (
            <OrganizationCard
              key={org.id}
              org={org}
              showActions={canManage}
              onView={(o) => onOpenOrg(o)}
              onEdit={(o) => setPanel({ mode: 'edit', org: o })}
              onDisable={(o) => setDisableTarget(o)}
              onEnable={(o) => onSetOrgStatus(o.id, 'Active')}
            />
          ))}
        </div>
      )}

      {panel && (
        <OrganizationPanel
          mode={panel.mode}
          org={panel.org}
          onClose={() => setPanel(null)}
          onSubmit={handleSubmit}
        />
      )}

      {disableTarget && (
        <DisableDialog
          org={disableTarget}
          onCancel={() => setDisableTarget(null)}
          onConfirm={() => {
            onSetOrgStatus(disableTarget.id, 'Disabled')
            setDisableTarget(null)
          }}
        />
      )}
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="px-6 py-16">
      <UiEmptyState
        icon={<Building2 className="size-6 text-muted-foreground" />}
        title="No organizations yet"
        description={
          onCreate
            ? 'No organizations have been created yet. Create your first organization to get started.'
            : 'You have not been assigned to any organizations yet.'
        }
        action={
          onCreate ? (
            <Button type="button" onClick={onCreate}>
              <Plus className="size-4" />
              Create Organization
            </Button>
          ) : undefined
        }
      />
    </div>
  )
}
