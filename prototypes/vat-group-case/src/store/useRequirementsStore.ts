/**
 * Shared, reactive completion state for the Requirements List (WTS) and Requirement Bucket
 * (Client) views — both render the same underlying REQUIREMENT_CATEGORIES data through two
 * different components, so per-item "done" state and any simulated additions have to live here
 * rather than in either view's own local state, or checking an item as a client wouldn't move
 * the WTS side's progress bar (and vice versa).
 */

import { create } from 'zustand'

import {
  REQUIREMENT_CATEGORIES,
  type MatchedFile,
  type RequirementCategory,
  type RequirementComment,
  type RequirementItem,
  type SimulatedFile,
} from '@/config/requirements'

interface RequirementsState {
  /** Per-item done/open override, keyed by RequirementItem.id. Absent = fall back to the
   *  item's own static `checkState` default from requirements.ts. */
  checkedOverrides: Record<string, boolean>
  /** Items appended by the "simulate adding a requirement" action, keyed by category id. */
  addedItems: Record<string, RequirementItem[]>
  /** How many of a category's original (static) trailing items are hidden by "simulate
   *  removing a requirement" — only used once there's nothing simulated left to un-add. */
  removedCount: Record<string, number>
  toggleItem: (itemId: string, defaultDone: boolean) => void
  addSimulatedRequirement: (categoryId: string) => void
  /** Symmetric with add: undoes the most recently simulated addition first; once none remain,
   *  hides the category's own last original item instead. No-op once nothing is left to remove. */
  removeSimulatedRequirement: (categoryId: string) => void
  /** Requirements comment notifications ticket — lives here (not in either view's own local
   *  state) so the WTS Requirements List and the Client's Requirement Bucket cards share one
   *  comment thread per category: reading a new comment from either side clears it for both,
   *  same reasoning as `checkedOverrides` above. In-memory only, per the "temporary for the
   *  session" ask — a typed comment doesn't survive a reload. */
  categoryComments: Record<string, RequirementComment[]>
  /** Categories whose unseen comment has been shown at least once (see CommentsDrawer's
   *  onRead) — clears that category's red "new" badge in both views. */
  seenCategoryIds: Record<string, true>
  sendComment: (categoryId: string, author: string, text: string) => void
  markCategorySeen: (categoryId: string) => void
  /** CIT AI file-matcher simulation ticket — incremented on every run/re-run. `0` means "never
   *  run" (flips the header button to "Re-run AI matching" once past 0); the count itself (not
   *  just a boolean) is what lets the accordion notice a *re*-run and auto-expand again, since a
   *  plain boolean would already be `true` and wouldn't change on a second run. */
  aiMatchRunCount: number
  /** Which of each category's `aiMatchAssignments` files currently sit on which item, keyed by
   *  RequirementItem.id. A file only ever appears here or in that category's unmatched pool
   *  (derived — see `useUnmatchedFiles`), never both, so the two views can't disagree. */
  matchedFilesByItem: Record<string, MatchedFile[]>
  /** Runs (or re-runs) the simulated matcher: (re)applies every category's static
   *  `aiMatchAssignments` in one shot, discarding any previous "Clear matching" so a re-run
   *  always starts from the same deterministic demo result. */
  runAiFileMatching: () => void
  /** "Clear matching" ticket — un-sorts one item's matched files back into its category's
   *  unmatched pool (they simply stop appearing in `matchedFilesByItem`). */
  clearItemMatching: (itemId: string) => void
}

let simulatedItemCount = 0

export const useRequirementsStore = create<RequirementsState>((set) => ({
  checkedOverrides: {},
  addedItems: {},
  removedCount: {},
  categoryComments: Object.fromEntries(REQUIREMENT_CATEGORIES.map((c) => [c.id, c.comments ?? []])),
  seenCategoryIds: {},
  toggleItem: (itemId, defaultDone) =>
    set((state) => {
      const current = state.checkedOverrides[itemId] ?? defaultDone
      return { checkedOverrides: { ...state.checkedOverrides, [itemId]: !current } }
    }),
  addSimulatedRequirement: (categoryId) => {
    simulatedItemCount += 1
    const n = simulatedItemCount
    set((state) => ({
      addedItems: {
        ...state.addedItems,
        [categoryId]: [
          ...(state.addedItems[categoryId] ?? []),
          {
            id: `IDsim${n}`,
            title: `New requirement ${n}`,
            description: 'Added just now — not yet complete.',
            checkState: 'open',
          },
        ],
      },
    }))
  },
  removeSimulatedRequirement: (categoryId) =>
    set((state) => {
      const added = state.addedItems[categoryId] ?? []
      if (added.length > 0) {
        return { addedItems: { ...state.addedItems, [categoryId]: added.slice(0, -1) } }
      }
      const base = REQUIREMENT_CATEGORIES.find((c) => c.id === categoryId)
      const hidden = state.removedCount[categoryId] ?? 0
      if (!base || hidden >= base.items.length) return {}
      return { removedCount: { ...state.removedCount, [categoryId]: hidden + 1 } }
    }),
  sendComment: (categoryId, author, text) =>
    set((state) => ({
      categoryComments: {
        ...state.categoryComments,
        [categoryId]: [
          ...(state.categoryComments[categoryId] ?? []),
          { id: `local-${categoryId}-${(state.categoryComments[categoryId] ?? []).length}`, author, timestamp: 'Just now', text, isOwn: true },
        ],
      },
    })),
  markCategorySeen: (categoryId) =>
    set((state) => ({ seenCategoryIds: { ...state.seenCategoryIds, [categoryId]: true } })),
  aiMatchRunCount: 0,
  matchedFilesByItem: {},
  runAiFileMatching: () =>
    set((state) => {
      const matchedFilesByItem: Record<string, MatchedFile[]> = {}
      for (const category of REQUIREMENT_CATEGORIES) {
        for (const [itemId, files] of Object.entries(category.aiMatchAssignments ?? {})) {
          matchedFilesByItem[itemId] = files
        }
      }
      return { aiMatchRunCount: state.aiMatchRunCount + 1, matchedFilesByItem }
    }),
  clearItemMatching: (itemId) =>
    set((state) => {
      if (!(itemId in state.matchedFilesByItem)) return {}
      const next = { ...state.matchedFilesByItem }
      delete next[itemId]
      return { matchedFilesByItem: next }
    }),
}))

/** Requirements comment notifications ticket — a category's comment thread + whether it still
 *  has an unseen new one, reactive and shared between the WTS Requirements List and the
 *  Client's Requirement Bucket cards (see `categoryComments`/`seenCategoryIds` above). */
export function useCommentsForCategory(categoryId: string): {
  comments: RequirementComment[]
  hasUnseen: boolean
} {
  const comments = useRequirementsStore((s) => s.categoryComments[categoryId] ?? [])
  const seen = useRequirementsStore((s) => Boolean(s.seenCategoryIds[categoryId]))
  return { comments, hasUnseen: !seen && comments.some((c) => c.isNew) }
}

/** The single source both the WTS and Client views render from — base demo data plus any
 *  simulated additions/removals, with each item's effective checkState resolved against
 *  overrides. */
export function useRequirementCategories(): RequirementCategory[] {
  const checkedOverrides = useRequirementsStore((s) => s.checkedOverrides)
  const addedItems = useRequirementsStore((s) => s.addedItems)
  const removedCount = useRequirementsStore((s) => s.removedCount)
  const matchedFilesByItem = useRequirementsStore((s) => s.matchedFilesByItem)

  return REQUIREMENT_CATEGORIES.map((category) => {
    const hidden = removedCount[category.id] ?? 0
    const baseItems =
      hidden > 0 ? category.items.slice(0, Math.max(0, category.items.length - hidden)) : category.items
    const items = [...baseItems, ...(addedItems[category.id] ?? [])].map((item) => {
      const override = checkedOverrides[item.id]
      const matchedFiles = matchedFilesByItem[item.id]
      return {
        ...item,
        ...(override !== undefined ? { checkState: override ? ('done' as const) : ('open' as const) } : null),
        matchedFiles,
      }
    })
    return { ...category, items }
  })
}

/** CIT AI file-matcher simulation ticket — has "Start AI file matching" been run at least once
 *  (drives the header button's "Start" vs "Re-run" label, and the accordion's pending-vs-result
 *  copy). Use `useAiMatchRunCount` instead when a *re*-run needs to trigger something too. */
export function useAiMatchRun(): boolean {
  return useRequirementsStore((s) => s.aiMatchRunCount > 0)
}

/** CIT AI file-matcher simulation ticket — the raw run counter, for effects that need to fire on
 *  every run *and* every re-run (a plain boolean wouldn't change on the second run onward). */
export function useAiMatchRunCount(): number {
  return useRequirementsStore((s) => s.aiMatchRunCount)
}

/** CIT AI file-matcher simulation ticket — a category's own files that are not currently sorted
 *  onto any of its requirement items: `aiMatchPool` minus whatever's attached to one of the
 *  (already store-merged) `category.items`, so "Clear matching" moving a file back here is
 *  automatic rather than a second place to update. Plain function, not a hook — the accordion
 *  calls this once per category inside a `.map`, where a hook would break the rules of hooks. */
export function unmatchedFilesForCategory(category: RequirementCategory): SimulatedFile[] {
  if (!category.aiMatchPool) return []
  const matchedNames = new Set(category.items.flatMap((item) => (item.matchedFiles ?? []).map((f) => f.name)))
  return category.aiMatchPool.filter((f) => !matchedNames.has(f.name))
}

export function requirementTotals(categories: RequirementCategory[]): {
  done: number
  total: number
} {
  const items = categories.flatMap((c) => c.items)
  return { done: items.filter((i) => i.checkState === 'done').length, total: items.length }
}
