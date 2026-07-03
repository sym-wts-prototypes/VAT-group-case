import { useOrgStore } from '@/store/useOrgStore'
import {
  Organization,
  INITIAL_ORGANIZATIONS,
} from '@/components/organizations-data'
import { OrganizationsPage } from '@/components/organizations-page'
import { OrgWorkspace } from '@/components/org-workspace'

export function PlaygroundMain() {
  const role = useOrgStore((state) => state.role)
  const selectedOrgId = useOrgStore((state) => state.selectedOrgId)
  const setSelectedOrgId = useOrgStore((state) => state.setSelectedOrgId)

  const selectedOrg: Organization | null = selectedOrgId
    ? INITIAL_ORGANIZATIONS.find((o) => o.id === selectedOrgId) ?? null
    : null

  const onOpenOrg = (o: Organization) => setSelectedOrgId(o.id)
  const onBack = () => setSelectedOrgId(null)

  // V7 — every role uses the same workspace: all tabs and content are visible to everyone,
  // capability-gated actions decide who can WRITE what. Super Admin also sees the platform
  // organisations list; other roles land straight into their organisation (single org shown).
  const canManageOrgs = role === 'Super Admin'
  return selectedOrg ? (
    <OrgWorkspace key={role} org={selectedOrg} onBack={onBack} actingRole={role} />
  ) : (
    <OrganizationsPage onOpenOrg={onOpenOrg} canManage={canManageOrgs} />
  )
}
