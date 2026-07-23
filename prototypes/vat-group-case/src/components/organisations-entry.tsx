import { useMemo } from 'react'

import { getDataset } from '@/components/demo-data'
import { INITIAL_ORGANIZATIONS } from '@/components/organizations-data'
import { OrgWorkspace } from '@/components/org-workspace'
import { useDemoStore } from '@/store/useDemoStore'

/** Feature 4 of the "upload modal & data-package visuals" ticket — the sidebar's Organisations
 * item now opens this instead of navigating out to the separate Organisations prototype. Lands
 * straight on a single organisation's Groups tab (skipping the org list) since that's the only
 * entry point this ticket's other features need; every other Organisations tab still works
 * because OrgWorkspace itself is an unmodified copy of that prototype's own component. */
export function OrganisationsEntryPage() {
  const setShowOrganisations = useDemoStore((state) => state.setShowOrganisations)

  const dataset = useMemo(() => getDataset('mixed'), [])
  const org = INITIAL_ORGANIZATIONS.find((o) => o.id === 'europipe') ?? INITIAL_ORGANIZATIONS[0]

  return (
    <OrgWorkspace
      key={org.id}
      org={org}
      onBack={() => setShowOrganisations(false)}
      actingRole="Super Admin"
      data={dataset}
      initialTab="groups"
    />
  )
}
