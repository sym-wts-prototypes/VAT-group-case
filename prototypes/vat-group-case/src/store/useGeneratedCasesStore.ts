import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { CaseListItem } from '@/components/case-management-data'

// Locally-persisted cases created via the Create Case drawer's schedulers — this prototype has
// no backend, so newly generated cases are kept in localStorage (via zustand's persist
// middleware, the same store pattern already used for useDemoStore) so they survive a refresh
// and appear in Case Management immediately, ahead of the static dummy dataset.
interface GeneratedCasesState {
  cases: CaseListItem[]
  addCases: (items: CaseListItem[]) => void
}

export const useGeneratedCasesStore = create<GeneratedCasesState>()(
  persist(
    (set) => ({
      cases: [],
      addCases: (items) => set((state) => ({ cases: [...items, ...state.cases] })),
    }),
    { name: 'wts-case-management:generated-cases' },
  ),
)
