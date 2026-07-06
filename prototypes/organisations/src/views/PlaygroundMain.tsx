import { useEffect, useMemo, useState } from 'react'

import { useOrgStore } from '@/store/useOrgStore'
import { Organization, OrgStatus } from '@/components/organizations-data'
import { getDataset, OrgWorkspaceData } from '@/components/demo-data'
import { OrganizationsPage, OrgFormData } from '@/components/organizations-page'
import { OrgWorkspace } from '@/components/org-workspace'

const today = () => new Date().toISOString().slice(0, 10)

export function PlaygroundMain() {
  const role = useOrgStore((state) => state.role)
  const dataMode = useOrgStore((state) => state.dataMode)
  const selectedOrgId = useOrgStore((state) => state.selectedOrgId)
  const setSelectedOrgId = useOrgStore((state) => state.setSelectedOrgId)

  const dataset = useMemo(() => getDataset(dataMode), [dataMode])

  // The org list lives here (not inside OrganizationsPage) so that newly-created
  // orgs are resolvable when opened, and so switching dataset reseeds the list.
  const [orgs, setOrgs] = useState<Organization[]>(dataset.organizations)
  useEffect(() => {
    setOrgs(dataset.organizations)
  }, [dataset])

  const selectedOrg: Organization | null = selectedOrgId
    ? orgs.find((o) => o.id === selectedOrgId) ?? null
    : null

  const onOpenOrg = (o: Organization) => setSelectedOrgId(o.id)
  const onBack = () => setSelectedOrgId(null)

  const onCreateOrg = (data: OrgFormData) => {
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: data.name,
      initials: data.name.trim().slice(0, 2).toUpperCase(),
      logoUrl: data.logoUrl,
      tags: [],
      legalEntities: 0,
      activeEngagements: 0,
      status: data.status,
      description: data.description,
      createdDate: today(),
      lastModified: today(),
      lastModifiedBy: 'Super Admin',
    }
    setOrgs((prev) => [newOrg, ...prev])
  }

  const onUpdateOrg = (id: string, data: OrgFormData) => {
    setOrgs((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, name: data.name, description: data.description, status: data.status, logoUrl: data.logoUrl, lastModified: today(), lastModifiedBy: 'Super Admin' }
          : o,
      ),
    )
  }

  const onSetOrgStatus = (id: string, status: OrgStatus) => {
    setOrgs((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status, lastModified: today(), lastModifiedBy: 'Super Admin' } : o,
      ),
    )
  }

  // V7 — every role uses the same workspace: all tabs and content are visible to everyone,
  // capability-gated actions decide who can WRITE what. Super Admin also sees the platform
  // organisations list; other roles land straight into their organisation (single org shown).
  const canManageOrgs = role === 'Super Admin'

  const workspaceData: OrgWorkspaceData = {
    legalEntities: dataset.legalEntities,
    engagements: dataset.engagements,
    users: dataset.users,
    vatRegistrations: dataset.vatRegistrations,
    groups: dataset.groups,
    activityLog: dataset.activityLog,
  }

  return selectedOrg ? (
    <OrgWorkspace
      key={`${role}-${dataMode}-${selectedOrg.id}`}
      org={selectedOrg}
      onBack={onBack}
      actingRole={role}
      data={workspaceData}
    />
  ) : (
    <OrganizationsPage
      orgs={orgs}
      onOpenOrg={onOpenOrg}
      canManage={canManageOrgs}
      onCreateOrg={onCreateOrg}
      onUpdateOrg={onUpdateOrg}
      onSetOrgStatus={onSetOrgStatus}
    />
  )
}
