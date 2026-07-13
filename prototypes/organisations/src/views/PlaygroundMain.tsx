import { useEffect, useMemo } from 'react'

import { useOrgStore } from '@/store/useOrgStore'
import { useDataStore } from '@/store/useDataStore'
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
  const initialTab = useOrgStore((state) => state.tab)
  const initialEngagement = useOrgStore((state) => state.engagement)
  const dialog = useOrgStore((state) => state.dialog)

  // The working dataset lives in the session-persisted store so edits survive role
  // switches and refresh. Each preset caches its own snapshot; seed it on first use.
  const ensureSeeded = useDataStore((state) => state.ensureSeeded)
  const storedDataset = useDataStore((state) => state.datasets[dataMode])
  const createOrgAction = useDataStore((state) => state.createOrg)
  const updateOrgAction = useDataStore((state) => state.updateOrg)
  const setOrgStatusAction = useDataStore((state) => state.setOrgStatus)

  useEffect(() => {
    ensureSeeded(dataMode)
  }, [dataMode, ensureSeeded])

  // Fall back to a fresh seed for the first render before the store hydrates/seeds.
  const dataset = useMemo(() => storedDataset ?? getDataset(dataMode), [storedDataset, dataMode])
  const orgs = dataset.organizations

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
    createOrgAction(dataMode, newOrg)
  }

  const onUpdateOrg = (id: string, data: OrgFormData) => {
    updateOrgAction(dataMode, id, {
      name: data.name,
      description: data.description,
      status: data.status,
      logoUrl: data.logoUrl,
      lastModified: today(),
      lastModifiedBy: 'Super Admin',
    })
  }

  const onSetOrgStatus = (id: string, status: OrgStatus) => {
    setOrgStatusAction(dataMode, id, status)
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
      // Role is deliberately NOT in the key: switching lens must not remount/wipe the
      // workspace. Switching dataset preset does remount so it re-seeds cleanly.
      key={`${dataMode}-${selectedOrg.id}`}
      org={selectedOrg}
      onBack={onBack}
      actingRole={role}
      data={workspaceData}
      initialTab={initialTab}
      initialEngagement={initialEngagement}
      initialDialog={dialog}
    />
  ) : (
    <OrganizationsPage
      orgs={orgs}
      onOpenOrg={onOpenOrg}
      canManage={canManageOrgs}
      onCreateOrg={onCreateOrg}
      onUpdateOrg={onUpdateOrg}
      onSetOrgStatus={onSetOrgStatus}
      initialDialog={dialog}
    />
  )
}
