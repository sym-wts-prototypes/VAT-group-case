/**
 * Organisations prototype demo store with two-way URL hash sync.
 *
 * Hash grammar (every distinct screen / dialog / state is addressable so the gallery
 * Flow canvas can render it in an iframe):
 *
 *   #{role}                                  → organisations list (role lens)
 *   #{role}/{org}                            → workspace, default tab (Legal Entities)
 *   #{role}/{org}/{tab}                      → workspace tab
 *                                              tab ∈ entities | engagements | users |
 *                                                    groups | activity | org-details
 *   #{role}/{org}/engagement                 → engagement detail (first engagement)
 *   #{role}/dialog/{key}                     → org list with a dialog open (e.g. create-org)
 *   #{role}/{org}/{tab}/dialog/{key}         → workspace tab with a dialog open
 *   #{role}/{org}/engagement/dialog/{key}    → engagement detail with a dialog open
 *
 *   role slugs: super-admin | org-admin | engagement-admin | contributor
 */

import { useEffect } from 'react'
import { create } from 'zustand'

import type { Role } from '@/components/role-switcher'
import type { DataMode } from '@/components/demo-data'

interface OrgState {
  role: Role
  dataMode: DataMode
  selectedOrgId: string | null
  /** Active workspace tab (null → the component's default, Legal Entities). */
  tab: string | null
  /** Whether the engagement detail page is open (overlays the tabs). */
  engagement: boolean
  /** Key of an open dialog/modal, or null. Consumed on mount by the relevant view. */
  dialog: string | null
  setRole: (role: Role) => void
  setDataMode: (mode: DataMode) => void
  setSelectedOrgId: (id: string | null) => void
  setTab: (tab: string | null) => void
  setEngagement: (open: boolean) => void
  setDialog: (dialog: string | null) => void
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

const TABS = new Set([
  'entities',
  'engagements',
  'users',
  'groups',
  'activity',
  'org-details',
])

function parseHash(hash: string): Partial<OrgState> | null {
  const clean = hash.replace(/^#/, '').trim()
  if (!clean) return null

  const segments = clean.split('/').filter(Boolean)
  const role = SLUG_TO_ROLE[segments[0]]
  if (!role) return null

  let rest = segments.slice(1)

  // A trailing `dialog/{key}` may appear at any level — pull it off first.
  let dialog: string | null = null
  const di = rest.indexOf('dialog')
  if (di !== -1) {
    dialog = rest[di + 1] ?? null
    rest = rest.slice(0, di)
  }

  const org = rest[0] ?? null
  const sub = rest[1] ?? null

  let tab: string | null = null
  let engagement = false
  if (sub === 'engagement') engagement = true
  else if (sub && TABS.has(sub)) tab = sub

  return { role, selectedOrgId: org, tab, engagement, dialog }
}

function toHash(s: {
  role: Role
  selectedOrgId: string | null
  tab: string | null
  engagement: boolean
  dialog: string | null
}): string {
  const slug = ROLE_TO_SLUG[s.role]
  let h = `#${slug}`
  if (s.selectedOrgId) {
    h += `/${s.selectedOrgId}`
    if (s.engagement) h += `/engagement`
    else if (s.tab) h += `/${s.tab}`
  }
  if (s.dialog) h += `/dialog/${s.dialog}`
  return h
}

export const useOrgStore = create<OrgState>((set) => ({
  role: 'Super Admin',
  dataMode: 'mixed',
  selectedOrgId: null,
  tab: null,
  engagement: false,
  dialog: null,
  // Switching role/dataset returns to a clean organisation list.
  setRole: (role) =>
    set({ role, selectedOrgId: null, tab: null, engagement: false, dialog: null }),
  setDataMode: (dataMode) =>
    set({ dataMode, selectedOrgId: null, tab: null, engagement: false, dialog: null }),
  setSelectedOrgId: (selectedOrgId) =>
    set({ selectedOrgId, tab: null, engagement: false, dialog: null }),
  setTab: (tab) => set({ tab }),
  setEngagement: (engagement) => set({ engagement }),
  setDialog: (dialog) => set({ dialog }),
}))

/** Hook: two-way sync between store and window.location.hash. */
export function useOrgHashSync() {
  useEffect(() => {
    const apply = () => {
      const parsed = parseHash(window.location.hash)
      if (parsed) useOrgStore.setState(parsed)
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
