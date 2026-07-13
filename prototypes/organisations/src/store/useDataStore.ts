/**
 * Session-persisted data store for the Organisations prototype.
 *
 * The prototype's mutable world (organisations + per-org legal entities, engagements,
 * users, VAT registrations, groups and activity log) is seeded from the static demo
 * modules but then edited in the UI. To make those edits survive role switches and
 * page refreshes, we keep the working dataset here and persist it to `sessionStorage`
 * (per browser tab — closing the tab is the "reset").
 *
 * One snapshot is cached per dataset preset (`empty` / `mixed` / `full`) so each preset
 * remembers its own edits for the session.
 *
 * OrgWorkspace still owns its per-org React state; it seeds from the active snapshot and
 * mirrors changes back here via `replaceOrgSlice`, so the individual mutation handlers
 * stay untouched.
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { Organization, OrgStatus } from '@/components/organizations-data'
import type {
  ActivityLogEntry,
  Engagement,
  Group,
  LegalEntity,
  OrgUser,
  VatRegistration,
} from '@/components/org-details-data'
import { DataMode, DemoDataset, getDataset } from '@/components/demo-data'

/** The exact per-org rows OrgWorkspace holds; mirrored back on every change. */
export interface OrgSlice {
  org: Organization
  legalEntities: LegalEntity[]
  engagements: Engagement[]
  users: OrgUser[]
  vatRegistrations: VatRegistration[]
  groups: Group[]
  activityLog: ActivityLogEntry[]
}

interface DataState {
  datasets: Partial<Record<DataMode, DemoDataset>>
  /** Seed a preset's snapshot from the static demo data if not already present. */
  ensureSeeded: (mode: DataMode) => void
  createOrg: (mode: DataMode, org: Organization) => void
  updateOrg: (mode: DataMode, id: string, patch: Partial<Organization>) => void
  setOrgStatus: (mode: DataMode, id: string, status: OrgStatus) => void
  /** Overwrite one organisation's rows across every array (used by OrgWorkspace's mirror). */
  replaceOrgSlice: (mode: DataMode, orgId: string, slice: OrgSlice) => void
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      datasets: {},

      ensureSeeded: (mode) => {
        if (get().datasets[mode]) return
        set((state) => ({ datasets: { ...state.datasets, [mode]: getDataset(mode) } }))
      },

      createOrg: (mode, org) =>
        set((state) => {
          const base = state.datasets[mode] ?? getDataset(mode)
          return {
            datasets: {
              ...state.datasets,
              [mode]: { ...base, organizations: [org, ...base.organizations] },
            },
          }
        }),

      updateOrg: (mode, id, patch) =>
        set((state) => {
          const base = state.datasets[mode] ?? getDataset(mode)
          return {
            datasets: {
              ...state.datasets,
              [mode]: {
                ...base,
                organizations: base.organizations.map((o) => (o.id === id ? { ...o, ...patch } : o)),
              },
            },
          }
        }),

      setOrgStatus: (mode, id, status) =>
        set((state) => {
          const base = state.datasets[mode] ?? getDataset(mode)
          return {
            datasets: {
              ...state.datasets,
              [mode]: {
                ...base,
                organizations: base.organizations.map((o) => (o.id === id ? { ...o, status } : o)),
              },
            },
          }
        }),

      replaceOrgSlice: (mode, orgId, slice) =>
        set((state) => {
          const base = state.datasets[mode] ?? getDataset(mode)

          // Users and VAT rows have no orgId — they belong to the org via their entities.
          // Consider both the previous and next entity sets so rows for entities that were
          // added or removed in this org are re-scoped correctly.
          const prevEntityIds = base.legalEntities
            .filter((e) => e.orgId === orgId)
            .map((e) => e.id)
          const affected = new Set<string>([...prevEntityIds, ...slice.legalEntities.map((e) => e.id)])

          // Whether a user is "owned" by this org's workspace (mirrors OrgWorkspace's seed
          // filter): non-Super-Admin users that are all-entities or touch an affected entity.
          const ownedByOrg = (u: OrgUser) =>
            u.role !== 'Super Admin' && (!!u.allEntities || u.entityIds.some((id) => affected.has(id)))

          const merged: DemoDataset = {
            organizations: base.organizations.map((o) => (o.id === orgId ? { ...o, ...slice.org } : o)),
            legalEntities: [
              ...base.legalEntities.filter((e) => e.orgId !== orgId),
              ...slice.legalEntities,
            ],
            engagements: [...base.engagements.filter((e) => e.orgId !== orgId), ...slice.engagements],
            groups: [...base.groups.filter((g) => g.orgId !== orgId), ...slice.groups],
            activityLog: [...base.activityLog.filter((a) => a.orgId !== orgId), ...slice.activityLog],
            users: [...base.users.filter((u) => !ownedByOrg(u)), ...slice.users],
            vatRegistrations: [
              ...base.vatRegistrations.filter((v) => !affected.has(v.entityId)),
              ...slice.vatRegistrations,
            ],
          }
          return { datasets: { ...state.datasets, [mode]: merged } }
        }),
    }),
    {
      name: 'wts-org-data',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ datasets: state.datasets }),
    },
  ),
)
