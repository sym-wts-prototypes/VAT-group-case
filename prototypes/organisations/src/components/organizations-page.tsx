import { useMemo, useState } from 'react'
import { Plus, Building2 } from 'lucide-react'
import { Button } from '@wts/ui'

import {
  Organization,
  OrgStatus,
  INITIAL_ORGANIZATIONS,
} from './organizations-data'
import { OrganizationCard } from './organization-card'
import { OrganizationPanel, PanelMode } from './organization-panel'
import { DisableDialog } from './disable-dialog'

const today = () => new Date().toISOString().slice(0, 10)

export function OrganizationsPage({
  onOpenOrg,
  canManage = true,
  visibleOrgIds,
}: {
  onOpenOrg: (o: Organization) => void
  canManage?: boolean
  visibleOrgIds?: string[]
}) {
  const [orgs, setOrgs] = useState<Organization[]>(INITIAL_ORGANIZATIONS)
  const [panel, setPanel] = useState<{ mode: PanelMode; org: Organization | null } | null>(null)
  const [disableTarget, setDisableTarget] = useState<Organization | null>(null)

  const sorted = useMemo(() => {
    const visible = visibleOrgIds ? orgs.filter((o) => visibleOrgIds.includes(o.id)) : orgs
    return [...visible].sort((a, b) => a.name.localeCompare(b.name))
  }, [orgs, visibleOrgIds])

  function setStatus(id: string, status: OrgStatus) {
    setOrgs((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status, lastModified: today(), lastModifiedBy: 'Super Admin' } : o,
      ),
    )
  }

  function handleSubmit(data: { name: string; description: string; status: OrgStatus; logoUrl?: string }) {
    if (panel?.mode === 'create') {
      const initials = data.name.trim().slice(0, 2).toUpperCase()
      setOrgs((prev) => [
        {
          id: `org-${Date.now()}`,
          name: data.name,
          initials,
          logoUrl: data.logoUrl,
          tags: [],
          legalEntities: 0,
          activeEngagements: 0,
          status: data.status,
          description: data.description,
          createdDate: today(),
          lastModified: today(),
          lastModifiedBy: 'Super Admin',
        },
        ...prev,
      ])
    } else if (panel?.mode === 'edit' && panel.org) {
      const id = panel.org.id
      setOrgs((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, name: data.name, description: data.description, status: data.status, logoUrl: data.logoUrl, lastModified: today(), lastModifiedBy: 'Super Admin' }
            : o,
        ),
      )
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
              onEnable={(o) => setStatus(o.id, 'Active')}
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
            setStatus(disableTarget.id, 'Disabled')
            setDisableTarget(null)
          }}
        />
      )}
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <div className="flex size-20 items-center justify-center rounded-full border border-border bg-muted/40">
        <Building2 className="size-8 text-muted-foreground" />
      </div>
      <div className="flex max-w-[420px] flex-col gap-1.5">
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          No organizations yet
        </h2>
        <p className="text-sm text-muted-foreground">
          {onCreate
            ? 'No organizations have been created yet. Create your first organization to get started.'
            : 'You have not been assigned to any organizations yet.'}
        </p>
      </div>
      {onCreate && (
        <Button type="button" onClick={onCreate}>
          <Plus className="size-4" />
          Create Organization
        </Button>
      )}
    </div>
  )
}
