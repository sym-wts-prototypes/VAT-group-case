/**
 * Organisations prototype demo store with two-way URL hash sync.
 *
 * Hash format: `#{roleSlug}` or `#{roleSlug}/{orgId}`
 *   e.g. `#super-admin`, `#org-admin/org-merck`, `#contributor/org-porsche`
 */

import { useEffect } from 'react'
import { create } from 'zustand'

import type { Role } from '@/components/role-switcher'
import type { DataMode } from '@/components/demo-data'

interface OrgState {
  role: Role
  dataMode: DataMode
  selectedOrgId: string | null
  setRole: (role: Role) => void
  setDataMode: (mode: DataMode) => void
  setSelectedOrgId: (id: string | null) => void
}

const ROLE_TO_SLUG: Record<Role, string> = {
  'Super Admin': 'super-admin',
  'Organisation Admin': 'org-admin',
  'Engagement Admin': 'engagement-admin',
  Contributor: 'contributor',
}
const SLUG_TO_ROLE = Object.fromEntries(
  Object.entries(ROLE_TO_SLUG).map(([role, slug]) => [slug, role as Role]),
) as Record<string, Role>

function parseHash(hash: string): Partial<OrgState> {
  const clean = hash.replace(/^#/, '').trim()
  if (!clean) return {}
  const [roleSlug, orgId] = clean.split('/')
  const role = SLUG_TO_ROLE[roleSlug]
  if (!role) return {}
  return {
    role,
    selectedOrgId: orgId || null,
  }
}

function toHash({ role, selectedOrgId }: { role: Role; selectedOrgId: string | null }) {
  const slug = ROLE_TO_SLUG[role]
  return selectedOrgId ? `#${slug}/${selectedOrgId}` : `#${slug}`
}

export const useOrgStore = create<OrgState>((set) => ({
  role: 'Super Admin',
  dataMode: 'mixed',
  selectedOrgId: null,
  setRole: (role) => set({ role, selectedOrgId: null }),
  // Switching dataset returns to the organisation list so the new seed is visible.
  setDataMode: (dataMode) => set({ dataMode, selectedOrgId: null }),
  setSelectedOrgId: (selectedOrgId) => set({ selectedOrgId }),
}))

/** Hook: two-way sync between store and window.location.hash. */
export function useOrgHashSync() {
  useEffect(() => {
    const apply = () => {
      const parsed = parseHash(window.location.hash)
      if (Object.keys(parsed).length > 0) {
        useOrgStore.setState(parsed)
      }
    }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  useEffect(() => {
    return useOrgStore.subscribe((state) => {
      const next = toHash(state)
      if (window.location.hash !== next) {
        window.history.replaceState(null, '', next)
      }
    })
  }, [])
}
